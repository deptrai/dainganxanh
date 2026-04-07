# User Flow Documentation — Đại Ngàn Xanh
> Cập nhật: 2026-04-07

Tài liệu này mô tả toàn bộ luồng người dùng và hệ thống backend của dự án Đại Ngàn Xanh. Mỗi file tập trung vào một luồng cụ thể với Mermaid flowchart và ghi chú kỹ thuật.

## Danh sách luồng

| # | File | Mô tả | Routes chính |
|---|------|--------|--------------|
| 01 | [01-buyer-journey.md](./01-buyer-journey.md) | Hành trình mua cây lần đầu | `/` → `/pricing` → `/quantity` → `/register` → `/checkout` → `/checkout/success` |
| 02 | [02-payment-processing.md](./02-payment-processing.md) | Xử lý thanh toán webhook + manual | Casso webhook → Edge Function → DB |
| 03 | [03-referral-growth.md](./03-referral-growth.md) | Hệ thống referral và viral | `/crm/referrals` → `/?ref=CODE` → `/register` |
| 04 | [04-tree-tracking.md](./04-tree-tracking.md) | Theo dõi vườn cây (CRM user) | `/crm/my-garden` → order detail → harvest |
| 05 | [05-withdrawal.md](./05-withdrawal.md) | Rút tiền hoa hồng | `/crm/referrals` → `/crm/admin/withdrawals` |
| 06 | [06-admin-operations.md](./06-admin-operations.md) | Vận hành Admin CRM | `/crm/admin/*` |
| 07 | [07-auth.md](./07-auth.md) | Xác thực Email OTP | `/register` → `/login` → `/auth/callback` |
| 08 | [08-notifications.md](./08-notifications.md) | Bản đồ notification toàn hệ thống | Telegram + Email + In-app |

## Tổng quan kiến trúc

```
Frontend (Next.js App Router)
    ├── (marketing)/  — Landing, pricing, register, login, checkout
    └── crm/          — CRM cho user và admin (protected by middleware)

Backend
    ├── /api/*        — Next.js API Routes
    └── Supabase Edge Functions — payment, contract, harvest, notifications

Integrations
    ├── Casso         — Webhook phát hiện chuyển khoản
    ├── Telegram      — Thông báo admin
    └── Resend/SMTP   — Email user và admin
```

## Trạng thái đơn hàng

```
pending → paid → completed
pending → manual_payment_claimed → completed
```

- `pending`: Đơn vừa tạo, chờ thanh toán
- `paid`: Casso xác nhận nhưng chưa xử lý xong (hiếm gặp)
- `manual_payment_claimed`: User tự báo đã chuyển tiền, chờ admin duyệt
- `completed`: Đơn hoàn tất, cây đã được tạo

> Không có trạng thái `verified` trong hệ thống.
