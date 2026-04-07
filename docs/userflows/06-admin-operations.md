# 06 — Admin Operations
> Cập nhật: 2026-04-07

## Routes

`/crm/admin/*` — yêu cầu role `admin` hoặc `super_admin`

## Mô tả

Admin CRM quản lý toàn bộ vận hành: đơn hàng, users, rút tiền, cây, Casso, referrals, blog. Duyệt đơn là 1 bước duy nhất. Admin có thể impersonate user để hỗ trợ trực tiếp. Super_admin có thể thay đổi role của mọi user (admin không thể thay đổi role super_admin).

## Flowchart (Mermaid)

```mermaid
flowchart TD
    AdminLogin([Admin đăng nhập OTP]) --> RoleCheck{Kiểm tra role\ntrong admin layout}
    RoleCheck -->|role: user| Blocked[Redirect /crm/dashboard]
    RoleCheck -->|admin hoặc super_admin| AdminHub{Chọn module}

    AdminHub --> Orders[Quản lý đơn hàng\nRoute /crm/admin/orders]
    AdminHub --> Users[Quản lý users\nRoute /crm/admin/users]
    AdminHub --> Withdrawals[Quản lý rút tiền\nRoute /crm/admin/withdrawals]
    AdminHub --> PlantOps[Vận hành trồng cây]
    AdminHub --> Casso[Lịch sử thanh toán\nRoute /crm/admin/casso]
    AdminHub --> Referrals[Quản lý referrals\nRoute /crm/admin/referrals]
    AdminHub --> Blog[Quản lý Blog\nRoute /crm/admin/blog]
    AdminHub --> Analytics[Báo cáo\nRoute /crm/admin/analytics]

    Orders --> FilterOrders[Lọc theo status / ngày / user]
    FilterOrders --> ApproveOrder[Duyệt thanh toán — 1 bước duy nhất\nBấm Duyệt thanh toán trên OrderTable\napproveAdminOrder → completed\nChấp nhận: pending / paid / manual_payment_claimed]
    ApproveOrder --> CreateReferral[Tạo referral commission 10%]
    CreateReferral --> TriggerContract[Trigger contract generation]
    TriggerContract --> TelegramApproval[Telegram: notifyAdminApproval]
    TelegramApproval --> AssignLot[Gán lô cây\nRoute /crm/admin/lots]
    AssignLot --> PrintCheck{In hợp đồng?}
    PrintCheck -->|Có| PrintQueue[Print Queue\nRoute /crm/admin/print-queue\nResend contract từ đây]
    PrintCheck -->|Không| AutoEmail[send-tree-assignment-email\n+ notifyTreeAssigned Telegram]

    Users --> SearchUser[Tìm kiếm theo email / tên / phone]
    SearchUser --> EditRole[Thay đổi role\nuser / admin\nsuper_admin chỉ super_admin mới sửa được]
    SearchUser --> Impersonate[Admin impersonate user\nHỗ trợ trực tiếp\ngetImpersonationContext]
    SearchUser --> ViewProfile[Xem profile + lịch sử đơn hàng]

    PlantOps --> Checklist[Field Checklist\nRoute /crm/admin/checklist]
    Checklist --> UploadPhotos[Upload ảnh cây\nRoute /crm/admin/photos/upload]
    UploadPhotos --> UpdateTrees[Cập nhật trạng thái cây\nRoute /crm/admin/trees]
    UpdateTrees --> HealthCheck{Tình trạng cây?}
    HealthCheck --> Healthy[Sống khỏe\nGửi báo cáo quý]
    HealthCheck --> Sick[Bệnh — xử lý]
    HealthCheck --> Dead[Chết — trồng lại + thông báo]

    Casso --> ViewTx[Xem casso_transactions]
    ViewTx --> TxCheck{Status?}
    TxCheck --> Processed[processed — OK]
    TxCheck --> NoMatch[no_match — kiểm tra thủ công]
    TxCheck --> FnError[function_error — reprocess]

    Referrals --> AssignRef[Gán mã giới thiệu thủ công\ncho user chưa có]
    AssignRef --> TelegramRef[notifyReferralAssigned\nTelegram admin]

    Blog --> CreatePost[Tạo bài viết mới\nRoute /crm/admin/blog/new]
    Blog --> EditPost[Sửa bài\nRoute /crm/admin/blog/id/edit]
    CreatePost --> PublishPost[Xuất bản / Lưu nháp / Hẹn giờ]
```

## Ghi chú kỹ thuật

**Role check:** Admin layout kiểm tra role. User thường bị redirect về `/crm/dashboard`. Route `/crm/admin/*` chỉ accessible với `admin` hoặc `super_admin`.

**Admin approve — 1 bước duy nhất:** Không còn bước verify riêng. `approveAdminOrder` chấp nhận `pending | paid | manual_payment_claimed` → `completed` trong 1 action duy nhất.

**Role protection:** `super_admin` role không thể bị thay đổi bởi `admin`. Chỉ `super_admin` mới có thể sửa role `super_admin` — được bảo vệ bởi RLS policy.

**Impersonation:** Admin impersonate user qua `getImpersonationContext()` và `getEffectiveUser()`. Cho phép admin thực hiện các action thay user (xem vườn, rút tiền hộ). Hỗ trợ trực tiếp không cần password.

**RLS bypass:** Admin actions dùng `createServiceRoleClient()` để bypass RLS. User actions dùng session client.

**Print Queue:** Admin quản lý và resend hợp đồng từ `/crm/admin/print-queue`. `resendContract()` trong `printQueue.ts` tái sử dụng Edge Function `send-email`.

**Scheduled jobs liên quan:**
- `cleanup-pending-orders` — hourly, xóa pending orders quá 24h
- `checklist-reminder` — quarterly, nhắc đội field
- `send-quarterly-update` — quarterly, gửi báo cáo cho users
- `profile-backfill` — hourly, tạo profiles cho auth users bị thiếu (pg_cron)
