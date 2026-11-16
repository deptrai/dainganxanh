#!/usr/bin/env python3
"""DaiNganXanh — soạn tin nhắn outreach cho leads giống cây gió bầu."""
import json, os

QUEUE = os.path.expanduser("~/.hermes/profiles/ansang/dainganxanh-leads-queue.jsonl")
OUT = os.path.expanduser("~/.hermes/profiles/ansang/dainganxanh-outreach-digest.md")
STATE = os.path.expanduser("~/.hermes/profiles/ansang/dainganxanh-leads-hunter-state.json")

def load(path): return [json.loads(l) for l in open(path)] if os.path.exists(path) else []

state = json.load(open(STATE)) if os.path.exists(STATE) else {}
leads = load(QUEUE)
new = [l for l in leads if l.get("status") != "drafted"]

msgs = []
for l in new:
    handle = l.get("handle") or l.get("name") or "bạn"
    comment = (l.get("comment") or "")[:100]
    src = l.get("source", "")
    # B2B: GMaps/Masothue → giới thiệu giống + hợp tác | B2C: TikTok/YT → giống chất lượng, giá tốt
    if "gmaps" in src or "masothue" in src or "chotot" in src:
        tpl = (f"Chào {handle}, em thấy quý vị làm trong lĩnh vực lâm nghiệp/trồng rừng. "
               "Bên em chuyên cung cấp giống cây gió bầu (trầm hương) chất lượng, nguồn gốc rõ ràng từ vườn ươm. "
               "Có các gói cho hộ trồng nhỏ lẻ đến dự án lớn (kèm tư vấn kỹ thuật + hỗ trợ tín chỉ carbon nếu cần). "
               "Anh/chị cho em xin thông tin để em gửi bảng giá + danh mục giống ạ? 🌱")
    else:
        tpl = (f"Chào {handle}, em thấy bạn hỏi về giống cây trầm. "
               "Bên em chuyên giống gió bầu thuần chủng, đã qua kiểm nghiệm — cây con khỏe, tỉ lệ sống cao. "
               "Giá sỉ từ 100 cây trở lên, kèm hướng dẫn trồng + chăm sóc. "
               "Bạn cần bao nhiêu cây ạ? 🌱")
    msgs.append(f"### {handle} ({src})\n> {comment}...\n\n```\n{tpl}\n```\n\n---\n")
    l["status"] = "drafted"

with open(OUT, "a") as f:
    f.write("\n\n## Digest " + __import__('datetime').datetime.now().strftime("%Y-%m-%d %H:%M") + "\n\n" + "\n".join(msgs))

json.dump(state, open(STATE, "w"))
# Update status in-place: append to queue file only new entries (already appended by hunter)
# Just mark drafted status via state file instead of rewriting queue
state["drafted_keys"] = list(set(state.get("drafted_keys", [])) | {l["dedupe_key"] for l in new})
state["last_digest_at"] = __import__('datetime').datetime.now().isoformat()

print(f"[digest] {len(new)} leads drafted -> {OUT}")
