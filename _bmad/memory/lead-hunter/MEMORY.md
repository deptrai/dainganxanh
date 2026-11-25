# MEMORY — DaiNganXanh Lead Hunter (giống cây gió bầu)

## Sản phẩm & ICP
- **Giống cây gió bầu** — trồng trầm hương, gây rừng, tín chỉ carbon
- B2B: công ty lâm nghiệp, dự án carbon credit, hợp tác xã, nhà máy chế biến trầm cần nguồn gốc
- B2C: hộ gia đình có đất, muốn trồng 50–500 cây đầu tư
- **Buyer intent khác AnSang:** hỏi giá GIỐNG CÂY, kỹ thuật trồng, thời gian hình thành trầm — KHÔNG phải mua nụ/vòng/tinh dầu

## Pipeline (đã test OK 2026-11-16 — 6 leads TikTok thật đầu tiên)
Medirus MCP :3333 → Redis stream :6379 → filter (regex gió bầu + intent mua cây) → queue JSONL → persist Nowing DB (workspace 1, bảng "DaiNganXanh — Giống Gió Bầu 24/24", client_id `dainganxanh-leads-20261116`) → outreach digest

## Lệnh chạy
```bash
# 1 chu kỳ săn (xoay lane tiktok/youtube/gmaps):
python3 /Users/luisphan/Documents/GitHub/dainganxanh/automation/hunter_cycle_v2.py --max-videos 4

# Nạp DB (PHẢI env -u PYTHONPATH -u VIRTUAL_ENV — nếu không sẽ lỗi pydantic_core):
cd /Users/luisphan/Documents/GitHub/nowing/nowing_backend && \
  env -u PYTHONPATH -u VIRTUAL_ENV .venv/bin/python \
  /Users/luisphan/Documents/GitHub/dainganxanh/automation/persist_to_nowing.py

# Soạn digest outreach:
python3 /Users/luisphan/Documents/GitHub/dainganxanh/automation/outreach_digest.py
```

## Lessons từ AnSang (đã áp dụng)
- KHÔNG bịa lead; mọi lead có evidence_url
- Queue file PHẢI JSONL (1 JSON/dòng) — lỗi digest viết JSON array đã fix
- Persist env phải sạch khỏi hermes venv
- Proxy xoay Medirus tự lo anti-bot
- Kênh cần credential: FB cookie (groups trồng cây — nguồn vàng), YouTube API key, Zalo
- Nowing FE tại localhost:3200 để xem leads trong bảng

## Files trạng thái
- Queue: ~/.hermes/profiles/ansang/dainganxanh-leads-queue.jsonl (TODO: chuyển về profile daingan-ops khi bot chính thức vận hành)
- State: ~/.hermes/profiles/ansang/dainganxanh-leads-hunter-state.json
- Digest: ~/.hermes/profiles/ansang/dainganxanh-outreach-digest.md

## Session log
- 2026-11-16: skill được adapt từ AnSang lead-hunter sang ngách giống cây. Test TikTok lane: 6 leads thật (BaBaOmChuoi hỏi giá cây gió đen, Hoàng huy Phạm hỏi giống+cao bao nhiêu, Nguyên hí 47 hỏi bao lâu hình thành trầm...). Nạp DB OK, bảng mới id 6f45e070.
