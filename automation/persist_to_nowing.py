#!/usr/bin/env python3
"""AnSang — nạp leads từ queue JSONL vào DB Nowing (workspace 1, bảng leads).

Chạy trong nowing_backend venv. Idempotent: dedupe theo client_id + source_url
+ contact_name — lead đã nạp sẽ bị HMAC dedup của LeadBatchService loại.
"""
import asyncio, json, os, sys, uuid

sys.path.insert(0, "/Users/luisphan/Documents/GitHub/nowing/nowing_backend")
os.chdir("/Users/luisphan/Documents/GitHub/nowing/nowing_backend")

from sqlalchemy import select, text  # noqa: E402
from app.db import async_session_maker  # noqa: E402
from app.models.workspaces import WorkspaceTable  # noqa: E402
from app.services.lead_batch_service import LeadBatchService  # noqa: E402

WORKSPACE_ID = 1
CLIENT_ID = "dainganxanh-leads-20261116"
TABLE_NAME = "DaiNganXanh — Giống Gió Bầu 24/24"
QUEUE = os.path.expanduser("~/.hermes/profiles/ansang/dainganxanh-leads-queue.jsonl")
STATE = os.path.expanduser("~/.hermes/profiles/ansang/dainganxanh-leads-hunter-state.json")


def build_lead_dicts(leads: list[dict], table_id: str) -> list[dict]:
    out = []
    for l in leads:
        md = {k: l[k] for k in ("comment", "handle", "query", "ts") if l.get(k)}
        out.append({
            "client_id": CLIENT_ID,
            "table_id": table_id,
            "source": l.get("source", "gmaps-b2b"),
            "source_url": l.get("evidence"),
            "company_name": (l.get("handle") or l.get("name") or "Unknown")[:55],
            "contact_name": (l.get("handle") or l.get("name") or "")[:55] or None,
            "title": None,
            "location": None,
            "phone": None,
            "intent_score": 0.8 if l.get("comment") else (0.9 if "giống" in str(l.get("comment","")).lower() or "cây" in str(l.get("comment","")).lower() else 0.6),
            "fit_score": 0.75,
            "needs_enrichment": True,
            "metadata": md,
        })
    return out


async def main() -> None:
    if not os.path.exists(QUEUE):
        print("[persist] no queue file")
        return
    leads = [json.loads(l) for l in open(QUEUE) if l.strip()]
    if not leads:
        print("[persist] queue empty")
        return

    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    persisted_keys = set(state.get("persisted_keys", []))
    todo = [l for l in leads if l["dedupe_key"] not in persisted_keys]
    if not todo:
        print("[persist] all leads already in DB")
        return

    async with async_session_maker() as session:
        row = await session.execute(
            select(WorkspaceTable).where(
                WorkspaceTable.workspace_id == WORKSPACE_ID,
                WorkspaceTable.name == TABLE_NAME,
            )
        )
        table = row.scalar_one_or_none()
        if table is None:
            table = WorkspaceTable(
                id=uuid.uuid4(), workspace_id=WORKSPACE_ID, name=TABLE_NAME, icon="table",
            )
            session.add(table)
            await session.commit()
            print(f"[persist] created table {table.id}")
        else:
            print(f"[persist] reusing table {table.id}")

        lead_dicts = build_lead_dicts(todo, str(table.id))
        svc = LeadBatchService()
        summary = await svc.ingest_batch(session, WORKSPACE_ID, lead_dicts)
        await session.commit()

        cnt = await session.execute(
            text("SELECT count(*) FROM leads WHERE workspace_id=:w AND client_id=:c"),
            {"w": WORKSPACE_ID, "c": CLIENT_ID},
        )
        total = cnt.scalar()
        print(f"[persist] nạp_mới={len(todo)} ingest={json.dumps(summary, default=str)[:200]} tong_trong_DB={total}")

    for l in todo:
        persisted_keys.add(l["dedupe_key"])
    state["persisted_keys"] = list(persisted_keys)[-5000:]
    json.dump(state, open(STATE, "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    asyncio.run(main())
