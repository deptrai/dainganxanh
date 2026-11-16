#!/usr/bin/env python3
"""AnSang Lead Hunter v2 — đa nền tảng, xoay vòng keyword + city.

Mỗi chu kỳ (3 phút) chạy 1 lane xoay vòng: tiktok → youtube → gmaps → lặp.
- TikTok: search keyword xoay vòng → stream → comments intent.
- YouTube: search query xoay vòng → video mới → comments intent.
- Google Maps B2B: search quán trà/spa/nhà thuốc theo city → scrapePlaceDetailPage lấy SĐT.
Mọi lead mới → queue JSONL (dedupe_key). persist_to_nowing.py chạy sau trong cron.
"""
import json, re, subprocess, os, time, hashlib, sys

MAX_ITEMS = 4
if "--max-videos" in sys.argv:
    try:
        MAX_ITEMS = int(sys.argv[sys.argv.index("--max-videos") + 1])
    except (ValueError, IndexError):
        pass

HOME = os.path.expanduser("~/.hermes/profiles/ansang")
STATE = f"{HOME}/dainganxanh-leads-hunter-state.json"
OUT = f"{HOME}/dainganxanh-leads-queue.jsonl"
MCP = "/tmp/leadgen-tramhuong/mcp.sh"

KEYWORDS = [
    "giống cây gió bầu", "mua giống trầm hương", "cây giống trầm",
    "trồng cây gió bầu", "kỹ thuật trồng trầm", "dự án trồng rừng trầm",
    "hợp tác xã trầm hương", "trang trại trầm", "gió bầu giống",
    "trồng rừng nguyên sinh", "phát triển lâm nghiệp", "carbon credit vietnam",
    "tín chỉ carbon việt nam", "công ty lâm nghiệp", "nhà vườn trầm",
    "trồng cây dó bầu", "kỹ thuật cấy trầm", "hướng dẫn trồng gió bầu",
    "mua cây giống gió bầu", "giá giống trầm hương"
]
YT_QUERIES = [
    "cách trồng cây gió bầu", "kỹ thuật trồng trầm hương",
    "dự án trồng rừng trầm", "tín chỉ carbon trồng cây",
    "hướng dẫn cấy trầm", "trầm hương nông nghiệp",
    "công ty lâm nghiệp việt nam", "trồng cây gió bầu giống"
]
GMAPS_QUERIES = [
    ("công ty lâm nghiệp", "Khánh Hòa"), ("hợp tác xã trồng rừng", "Quảng Nam"),
    ("nhà vườn trầm hương", "Gia Lai"), ("trạm giống cây lâm nghiệp", "Đắk Lắk"),
    ("công ty tín chỉ carbon", "Hà Nội"), ("công ty lâm nghiệp", "TP.HCM"),
    ("hợp tác xã nông lâm", "Bình Định"), ("dự án trồng rừng", "Phú Yên"),
    ("công ty cổ phần lâm nghiệp", "Đà Nẵng"), ("vựa giống cây trồng", "Cần Thơ"),
    ("công ty môi trường carbon", "Hải Phòng"), ("hợp tác xã gió bầu", "Quảng Bình")
]
LANES = ["tiktok", "youtube", "gmaps"]

TRAM = re.compile(r"gió bầu|trầm|tram|agarwood|dó bầu|Aquilaria|oud|沉香|gió|dó|trồng rừng|tín chỉ|carbon", re.I)
INTENT = re.compile(
    r"(giá|bao nhiêu|bao nhiu|ở đâu|đâu bán|mua|ship|inbox|đặt hàng|thật|giả|"
    r"phân biệt|cách dùng|sđt|zalo|liên hệ|sỉ|giá sỉ)", re.I,
)
SELLER = re.compile(
    r"(cảm ơn (bạn|anh|chị|em) đã mua|bên em có|bên shop|giá \d+k|phân khúc|"
    r"freeship toàn quốc|mua hàng tại|inbox em để|đặt hàng ngay|link bio|shopee|"
    r"cam kết|chính hãng|uy tín|giao hàng|bảo hành)",
    re.I,
)
B2B_CAT = re.compile(r"(spa|quán trà|trà đạo|nhà thuốc|đông y|đồ thờ|cúng|"
                     r"coffee|cà phê|resort|khách sạn|thiền|massage|thẩm mỹ|trầm)", re.I)

def load_state():
    try:
        s = json.load(open(STATE))
    except Exception:
        s = {}
    s.setdefault("last_stream_id", "0-0")
    s.setdefault("video_done", [])
    s.setdefault("kw_idx", 0)
    s.setdefault("seen_keys", [])
    s.setdefault("drafted_keys", [])
    s.setdefault("total_found", 0)
    s.setdefault("lane_idx", 0)
    s.setdefault("yt_idx", 0)
    s.setdefault("gm_idx", 0)
    s.setdefault("yt_video_done", [])
    if s["last_stream_id"] == "0-0":
        s["last_stream_id"] = stream_last_id()
    return s

def save_state(s):
    json.dump(s, open(STATE, "w"), ensure_ascii=False, indent=1)

def mcp(tool, args, timeout=200):
    out = f"/tmp/ansang-mcp-{os.getpid()}.json"
    try:
        subprocess.run(["bash", MCP, tool, json.dumps(args, ensure_ascii=False), out],
                       capture_output=True, text=True, timeout=timeout)
        data = json.load(open(out))
        os.remove(out)
        txt = data.get("result", {}).get("content", [{}])[0].get("text", "")
        return json.loads(txt) if txt.strip().startswith(("{", "[")) else {}
    except Exception:
        return {}

def stream_tail(after_id, count=3000):
    try:
        r = subprocess.run(["redis-cli", "XRANGE", "stream:social:raw_posts",
                            f"({after_id}", "+", "COUNT", str(count)],
                           capture_output=True, text=True, timeout=30)
        out, cur_id, key, cur = [], None, None, {}
        for line in r.stdout.splitlines():
            line = line.strip()
            if re.fullmatch(r"\d+-\d+", line):
                if cur_id: out.append((cur_id, cur))
                cur_id, key, cur = line, None, {}
            elif line:
                if key is None: key = line
                else: cur[key] = line; key = None
        if cur_id: out.append((cur_id, cur))
        return out
    except Exception:
        return []

def stream_last_id():
    try:
        r = subprocess.run(["redis-cli", "XINFO", "STREAM", "stream:social:raw_posts"],
                           capture_output=True, text=True, timeout=15)
        lines = [l.strip() for l in r.stdout.splitlines() if l.strip()]
        for i, l in enumerate(lines):
            if l == "last-generated-id" and i + 1 < len(lines):
                return lines[i + 1]
    except Exception:
        pass
    return "0-0"

def stream_read_new(state):
    entries, cursor = [], state.get("last_stream_id", "0-0")
    for _ in range(20):
        batch = stream_tail(cursor)
        if not batch: break
        entries.extend(batch)
        cursor = batch[-1][0]
        if len(batch) < 3000: break
    if entries:
        state["last_stream_id"] = entries[-1][0]
    return entries

def add_lead(state, lead):
    key = lead.get("dedupe_key") or hashlib.md5(
        (lead.get("source","") + lead.get("evidence","") +
         (lead.get("comment") or lead.get("handle") or "")).encode()).hexdigest()
    if key in state["seen_keys"]:
        return False
    state["seen_keys"] = (state["seen_keys"] + [key])[-5000:]
    lead["dedupe_key"] = key
    lead["status"] = "NEW"
    with open(OUT, "a") as f:
        f.write(json.dumps(lead, ensure_ascii=False) + "\n")
    state["total_found"] += 1
    return True

def lane_tiktok(state):
    kw = KEYWORDS[state["kw_idx"] % len(KEYWORDS)]
    state["kw_idx"] += 1
    mcp("medirus_scrape", {"platform": "tiktok", "action": "search",
                           "args": {"query": kw}}, timeout=120)
    time.sleep(3)
    entries = stream_read_new(state)
    videos = {}
    for _, f in entries:
        if f.get("platform") != "tiktok": continue
        data = f.get("data", "")
        if data.startswith("{"):
            try:
                rec = json.loads(data)
                if rec.get("postUrl") and TRAM.search(rec.get("content","") or ""):
                    videos[rec["postUrl"]] = {"replies": rec.get("repliesCount",0) or 0}
            except Exception: pass
    unseen = [(u,v) for u,v in videos.items() if u not in state["video_done"]]
    unseen.sort(key=lambda x: -x[1]["replies"])
    n = 0
    for url, _ in unseen[:MAX_ITEMS]:
        state["video_done"] = (state["video_done"] + [url])[-300:]
        mcp("medirus_scrape", {"platform": "tiktok", "action": "get_post_comments",
                               "args": {"url": url}}, timeout=200)
        time.sleep(3)
        for _, f in stream_read_new(state):
            data = f.get("data","")
            if not data.startswith("{"): continue
            try: rec = json.loads(data)
            except Exception: continue
            if f.get("platform") != "tiktok" or not rec.get("content"): continue
            txt = rec["content"]
            if TRAM.search(txt) and INTENT.search(txt) and not SELLER.search(txt):
                handle = rec.get("authorName") or rec.get("authorId") or "?"
                if add_lead(state, {"source":"tiktok-b2c","handle":str(handle)[:55],
                    "comment":txt[:300],"evidence":url,"query":kw,
                    "ts":int(time.time())}):
                    n += 1
    return n, kw

def lane_youtube(state):
    q = YT_QUERIES[state["yt_idx"] % len(YT_QUERIES)]
    state["yt_idx"] += 1
    mcp("medirus_scrape", {"platform": "youtube", "action": "search",
                           "args": {"query": q, "limit": 15}}, timeout=120)
    time.sleep(3)
    entries = stream_read_new(state)
    videos = {}
    for _, f in entries:
        if f.get("platform") != "youtube": continue
        data = f.get("data","")
        if data.startswith("{"):
            try:
                rec = json.loads(data)
                vid = rec.get("videoId") or rec.get("externalId") or ""
                title = rec.get("title") or rec.get("content","") or ""
                if vid and TRAM.search(title):
                    videos[vid] = title[:100]
            except Exception: pass
    unseen = [(v,t) for v,t in videos.items() if v not in state["yt_video_done"]]
    n = 0
    for vid, title in unseen[:MAX_ITEMS]:
        state["yt_video_done"] = (state["yt_video_done"] + [vid])[-300:]
        mcp("medirus_scrape", {"platform": "youtube", "action": "get_video_comments",
                               "args": {"video_id": vid, "limit": 30}}, timeout=200)
        time.sleep(3)
        for _, f in stream_read_new(state):
            data = f.get("data","")
            if not data.startswith("{"): continue
            try: rec = json.loads(data)
            except Exception: continue
            if f.get("platform") != "youtube" or not rec.get("content"): continue
            txt = rec["content"]
            if TRAM.search(txt) and INTENT.search(txt) and not SELLER.search(txt):
                handle = rec.get("authorName") or rec.get("authorId") or "?"
                if add_lead(state, {"source":"youtube-b2c","handle":str(handle)[:55],
                    "comment":txt[:300],"evidence":f"https://youtube.com/watch?v={vid}",
                    "query":q,"ts":int(time.time())}):
                    n += 1
    return n, q

def lane_gmaps(state):
    q, city = GMAPS_QUERIES[state["gm_idx"] % len(GMAPS_QUERIES)]
    state["gm_idx"] += 1
    full_q = q if city in q else f"{q} {city}"
    mcp("medirus_scrape", {"platform": "google_maps", "action": "search_places",
                           "args": {"query": full_q, "limit": 20,
                                    "scrapePlaceDetailPage": True}}, timeout=180)
    time.sleep(3)
    entries = stream_read_new(state)
    n = 0
    for _, f in entries:
        if f.get("platform") != "google_maps": continue
        data = f.get("data","")
        if not data.startswith("{"): continue
        try: rec = json.loads(data)
        except Exception: continue
        name = rec.get("name") or rec.get("title") or ""
        cat = rec.get("categoryName") or rec.get("category") or ""
        md = rec.get("metadata") or {}
        addr = rec.get("address") or md.get("address") or ""
        phone = md.get("phone") or rec.get("phone") or ""
        rating = rec.get("rating") or md.get("totalScore")
        website = md.get("website") or ""
        if not name: continue
        if not (B2B_CAT.search(cat) or B2B_CAT.search(name) or TRAM.search(name)): continue
        if not phone and not rating: continue
        if add_lead(state, {"source":"gmaps-b2b","handle":name[:55],
            "comment":f"{cat} | rating={rating} | {addr[:150]}",
            "evidence":rec.get("postUrl") or rec.get("source_url") or "",
            "phone":phone,"address":addr[:200],"rating":rating,
            "website":website,
            "query":full_q,"ts":int(time.time()),"segment":"b2b-shop"}):
            n += 1
    return n, full_q

def main():
    state = load_state()
    lane = LANES[state["lane_idx"] % len(LANES)]
    state["lane_idx"] += 1
    t0 = time.time()
    try:
        if lane == "tiktok":   n, tag = lane_tiktok(state)
        elif lane == "youtube": n, tag = lane_youtube(state)
        else:                   n, tag = lane_gmaps(state)
        state["last_lane"] = lane; state["last_tag"] = tag
        save_state(state)
        print(f"[hunter] lane={lane} q='{tag}' moi={n} tong={state['total_found']} "
              f"({time.time()-t0:.0f}s)")
    except Exception as e:
        save_state(state)
        print(f"[hunter] lane={lane} ERROR {e} tong={state['total_found']}")

if __name__ == "__main__":
    main()
