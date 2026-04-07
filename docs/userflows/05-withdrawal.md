# 05 — Withdrawal Flow
> Cập nhật: 2026-04-07

## Routes

User: `/crm/referrals` — Admin: `/crm/admin/withdrawals`

## Mô tả

User rút hoa hồng khi số dư đủ 200.000đ. Form tự động điền thông tin ngân hàng từ lần rút trước. Admin duyệt hoặc từ chối; cả 2 action đều kích hoạt 3 kênh thông báo đồng thời: Telegram, Email, In-app.

## Flowchart (Mermaid)

```mermaid
flowchart TD
    UserRef[User vào /crm/referrals] --> BalanceCalc[Tính số dư khả dụng\n= Hoa hồng earned\n- Approved withdrawn\n- Pending withdrawn]

    BalanceCalc --> BalanceCheck{Số dư >= 200k?}
    BalanceCheck -->|Chưa| Disabled[Nút rút tiền bị tắt\nHiển thị số dư thiếu]
    BalanceCheck -->|Đủ| WithdrawBtn[Bấm nút Rút tiền]

    WithdrawBtn --> WithdrawForm[Form rút tiền\nChọn ngân hàng — 10 NH Việt Nam\nNhập số tài khoản\nNhập tên chủ TK\nNhập số tiền rút\nAuto-fill từ lần rút trước\ngetSavedBankInfo]

    WithdrawForm --> Validate{Hợp lệ?\nTên khớp hệ thống?\nSố tiền đủ?}
    Validate -->|Không| ShowError[Hiển thị lỗi cụ thể\nTên phải khớp profile\nnormalize tiếng Việt]
    Validate -->|Có| Submit[requestWithdrawal\nServer Action\ngetEffectiveUser — hỗ trợ impersonation]

    Submit --> CreateRecord[Tạo withdrawal record\nstatus: pending\nTrừ vào số dư ngay]
    CreateRecord --> NotifyAdmin[Telegram: notifyWithdrawalRequest\nEmail: gửi cho tất cả admin]
    NotifyAdmin --> UserNotified[User: yêu cầu đã gửi\nXử lý trong 1–3 ngày]

    NotifyAdmin --> AdminReview[Admin vào /crm/admin/withdrawals\nXem danh sách pending]
    AdminReview --> ReviewDetail[Xem chi tiết:\nTên user + STK + Ngân hàng\nSố tiền + Ngày tạo]
    ReviewDetail --> AdminDecision{Quyết định?}

    AdminDecision -->|Duyệt| UploadProof[Upload ảnh chuyển khoản\nServer Action approveWithdrawal FormData\nserviceRoleClient upload to Storage\nbucket: withdrawals — max 5MB\nJPEG / PNG / WebP / GIF]
    UploadProof --> ApproveAction[approveWithdrawal\nservice role update\nstatus: pending → approved\nLưu proof_image_url]
    ApproveAction --> NotifyApproved[Telegram: notifyWithdrawalApproved\nEmail: send-withdrawal-email type: request_approved\nIn-app: withdrawal_approved\nInsert vào bảng notifications]

    AdminDecision -->|Từ chối| EnterReason[Nhập lý do từ chối]
    EnterReason --> RejectAction[rejectWithdrawal\nservice role update\nstatus: pending → rejected\nLưu rejection_reason]
    RejectAction --> NotifyRejected[Telegram: notifyWithdrawalRejected\nEmail: send-withdrawal-email type: request_rejected\nIn-app: withdrawal_rejected\nInsert vào bảng notifications]
```

## Ghi chú kỹ thuật

**Balance calculation:** Số dư = hoa hồng earned - approved withdrawn - pending withdrawn. Trừ cả pending để tránh user tạo nhiều yêu cầu vượt số dư.

**Bank auto-fill:** `getSavedBankInfo()` lấy thông tin ngân hàng (tên NH, STK, tên chủ TK) từ lần rút tiền trước đó — giảm nhập liệu lặp lại.

**10 ngân hàng Việt Nam hỗ trợ:** Dropdown chọn ngân hàng trong form.

**Name matching:** Tên chủ TK phải khớp với tên trong `users` profile. Hệ thống normalize tiếng Việt trước khi so sánh (bỏ dấu, lowercase).

**Upload proof:** Server action `approveWithdrawal(formData: FormData)` dùng `serviceRoleClient` để upload ảnh chuyển khoản lên Supabase Storage bucket `withdrawals` (public) rồi approve trong cùng một request — thay thế upload client-side cũ.

**Impersonation support:** `requestWithdrawal` dùng `getEffectiveUser()` thay vì `supabase.auth.getUser()` để admin có thể tạo yêu cầu rút tiền thay user khi đang impersonate.

**Withdrawals page:** FK `withdrawals_user_id_public_users_fkey` → `public.users`. Page dùng `force-dynamic` để tránh Server Component caching.

**3 kênh thông báo đồng thời:** Khi admin duyệt hoặc từ chối, hệ thống gửi Telegram + Email + In-app notification cùng lúc.
