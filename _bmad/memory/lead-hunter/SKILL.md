---
name: dainganxanh
description: Săn leads giống cây gió bầu (trồng rừng, carbon credit) qua Nowing/Medirus
---

# 🌱 DaiNganXanh — Lead Hunter (Giống cây gió bầu)

> 🎯 **Sản phẩm:** Giống cây gió bầu Aquilaria (trồng trầm hương)  
> **Ngách:** Trồng cây, gây rừng, dự án tín chỉ carbon  
> **Khách hàng:** Hộ trồng rừng, doanh nghiệp mua tín chỉ carbon, nhà đầu tư nông lâm nghiệp

## SỨ MỆNH

Biến DaiNganXanh thành nguồn cung giống cây gió bầu **uy tín, truy xuất nguồn gốc**, đáp ứng nhu cầu:
- 🌳 Hộ gia đình/doanh nghiệp trồng rừng trầm hương
- 💰 Dự án tín chỉ carbon (REDD+, afforestation)
- 🏭 Nhà máy chế biến trầm hương cần nguồn nguyên liệu

**Không bao giờ bịa lead** — chỉ ghi nhận người có nhu cầu thật (comment, đăng bài, tìm kiếm).

## PHƯƠNG PHÁP

### 1. Kênh săn (ưu tiên guest, không cần tài khoản)
- **Facebook Groups:** "Trồng cây gió bầu", "Trầm hương Việt Nam", "Nông lâm nghiệp bền vững" — comment hỏi giá giống
- **Google Maps:** Vùng trồng gió bầu (Khánh Hòa, Quảng Nam, Gia Lai, Tây Nguyên) — nhà vườn, hợp tác xã, công ty lâm nghiệp
- **YouTube:** Video "cách trồng trầm hương", "kỹ thuật cấy trầm" — comment hỏi mua giống
- **TikTok:** Tìm video về trồng cây, nông nghiệp — comment hỏi giống cây

### 2. Buyer intent (mua giống ≠ mua trầm thành phẩm)
- "mua giống gió bầu ở đâu", "giá cây giống trầm bao nhiêu", "giống trầm loại nào tốt"
- "trồng gió bầu có lời không", "tín chỉ carbon trồng cây", "dự án rừng trầm hương"
- **Khác với AnSang:** ở đây khách hỏi **giống cây**, không phải nụ trầm/vòng tay

### 3. Lead scoring
- **B2B cao:** Công ty lâm nghiệp, dự án carbon credit, hợp tác xã trồng rừng
- **B2C trung:** Hộ gia đình có đất muốn trồng thử 50-100 cây
- **Cần enrichment:** Số điện thoại, địa chỉ vườn (để giao giống)

## HẠ TẦNG

### Pipeline hiện tại
```
Medirus MCP (:3333) → Redis stream :6379 → Filter (TRAM/PLANT intent) →
Queue → Persist Nowing DB → Digest outreach
```

### Quan trọng
- `persist_to_nowing.py` — chạy trong venv nowing_backend, env -u PYTHONPATH -u VIRTUAL_ENV
- `hunter_cycle_v2.py` — mỗi 3 phút: TikTok → YouTube → GMaps (xoay keyword/city)
- **Proxy xoay:** Medirus tự động rotate (PROXY_URLS trong .env) — TikTok anti-bot không lo
- `db_session` — Nowing Postgres `localhost:5434/nowing`, table `leads`, dedupe HMAC

## PLAYBOOK TRẦM GIỐNG

### Từ khóa săn (khác trầm thành phẩm)
```python
KEYWORDS = [
    "giống cây gió bầu", "mua giống trầm hương", "cây giống trầm",
    "trồng cây gió bầu", "kỹ thuật trồng trầm", "dự án trồng rừng trầm",
    "hợp tác xã trầm hương", "trang trại trầm", "gió bầu giống"
]
GMAPS = [
    ("công ty lâm nghiệp", "Khánh Hòa"), ("hợp tác xã trồng rừng", "Quảng Nam"),
    ("nhà vườn trầm hương", "Gia Lai"), ("trạm giống cây lâm nghiệp", "Đắk Lắk"),
    ("công ty tín chỉ carbon", "Hà Nội"), ("công ty lâm nghiệp", "TP.HCM"),
    ("hợp tác xã nông lâm", "Bình Định"), ("dự án trồng rừng", "Phú Yên")
]
```

### Regex buyer intent (giống cây)
```python
INTENT = re.compile(r"(giống|cây con|mua cây|trồng|hỏi giá|bao nhiêu tiền|cách trồng|kỹ thuật|tín chỉ|carbon|dự án rừng)", re.I)
SELLER = re.compile(r"(bên em chuyên|bán trầm|vòng tay|nhang trầm|nụ trầm)", re.I)  # lọc seller bán trầm thành phẩm
```

### Kênh B2B vàng
- **Masothue:** Công ty lâm nghiệp, hợp tác xã — có SĐT, địa chỉ, người đại diện
- **Chợ Tốt:** Người bán giống cây — có SĐT (giải mã RSA như case study)
- **GMaps:** Nhà vườn, trạm giống — SĐT khi scrape `scrapePlaceDetailPage:true`

## CREDENTIALS CẦN (để mở kênh vàng)
- **Facebook cookie** (c_user + xs): Comment trong group trồng cây — nguồn B2C lớn nhất
- **YouTube API key:** Comment video kỹ thuật trồng — intent rõ
- **Zalo:** Nhắn lead B2B (chủ vựa, kỹ sư lâm nghiệp) — chuyển đổi cao hơn email

## CÁCH DÙNG
1. `python3 scripts/init-sanctum.py /path/to/dainganxanh` → tạo `_bmad/memory/dainganxanh/`
2. Chạy `hunter_cycle.py` mỗi chu kỳ (script tự xoay keyword, city)
3. `persist_to_nowing.py` đổ leads vào DB workspace
4. `outreach_digest.py` soạn tin nhắn mẫu (người thật gửi từ tài khoản thật)
