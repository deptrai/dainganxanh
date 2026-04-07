# 02 — Payment Processing
> Cập nhật: 2026-04-07

## Routes

`POST /api/webhooks/casso` → Supabase Edge Functions (`process-payment`, `generate-contract`)

## Mô tả

Có 2 luồng xử lý thanh toán: tự động qua Casso webhook và thủ công khi user tự báo đã chuyển tiền. Admin approve là 1 bước duy nhất, không có bước verify riêng.

## Flowchart (Mermaid)

### Luồng tự động — Casso Webhook

```mermaid
flowchart TD
    Transfer[Khách chuyển khoản\nNội dung: DHxxxxxx] --> Casso[Casso ghi nhận GD\nGửi webhook]
    Casso --> Webhook[POST /api/webhooks/casso\nHeader: x-casso-signature]

    Webhook --> VerifySig{HMAC-SHA512 hợp lệ?}
    VerifySig -->|Không| LogFail[Log: hmac_failed\nvào casso_transactions]
    LogFail --> Reject[Return 401]

    VerifySig -->|Có| ParseBody[Parse body\nLấy txId = id hoặc tid]
    ParseBody --> TestPing{txId tồn tại?}
    TestPing -->|Không có txId| AckPing[Return 200 — test ping]
    TestPing -->|Có| Dedup{casso_tid đã xử lý?}

    Dedup -->|Rồi| Return200Dup[Return 200 — duplicate]
    Dedup -->|Chưa| LogTx[Insert casso_transactions\nstatus: processing]

    LogTx --> CheckAmount{amount dương?}
    CheckAmount -->|Âm hoặc bằng 0| SkipOut[Update: no_match\nOutgoing ignored]
    SkipOut --> Return200

    CheckAmount -->|Dương| ParseCode[Regex tìm DHxxxxxx\ntrong description]
    ParseCode -->|Không tìm thấy| NoCode[Update: no_match\norderCode not found]
    NoCode --> Return200

    ParseCode -->|Tìm thấy| FindOrder[SELECT orders\ncode = DHxxxxxx AND status pending]
    FindOrder -->|Không có| NotFound[Update: order_not_found]
    NotFound --> Return200

    FindOrder -->|Tìm thấy| ValidateAmt{Chênh lệch amount\ndưới 1.000đ?}
    ValidateAmt -->|Lệch nhiều| Mismatch[Update: amount_mismatch]
    Mismatch --> Return200

    ValidateAmt -->|Khớp| InvokeFn[Invoke Edge Function\nprocess-payment\ntimeout: 55s]
    InvokeFn --> GenTrees[Insert trees vào DB\nUpdate order: completed]
    GenTrees --> GenContract[EF generate-contract timeout 50s\n→ POST /api/contracts/generate\nLibreOffice headless DOCX→PDF\ntimeout 45s SIGKILL]

    GenContract -->|Thành công| SendEmail[send-email\nXác nhận đơn + PDF đính kèm]
    SendEmail --> UpdateLog[Update casso_transactions\nstatus: processed]
    UpdateLog --> TelegramSuccess[notifyPaymentSuccess\nTelegram admin group]
    TelegramSuccess --> Return200[Return 200 OK]

    GenContract -->|Lỗi hoặc timeout| ContractFail[notifyContractFailure\nTelegram admin group\nAdmin xử lý thủ công]
    ContractFail --> ThrowErr[Throw error\nUpdate: function_error]
    ThrowErr --> Return200

    InvokeFn -->|Error| FnError[Update: function_error]
    FnError --> Return200
```

### Luồng thủ công — Manual Payment Claim

```mermaid
flowchart TD
    UserClaim[User bấm Đã chuyển tiền thành công] --> ClaimAPI[POST /api/orders/claim-manual-payment]
    ClaimAPI --> UpdateStatus[Update order status\npending → manual_payment_claimed]
    UpdateStatus --> AutoFillIdentity{User đã có id_number?}

    AutoFillIdentity -->|Có| CopyToOrder[Tự động copy identity\ntừ users sang order]
    CopyToOrder --> TelegramNotify
    AutoFillIdentity -->|Chưa| ShowForm[Hiển thị form nhập identity\nLưu vào users table 1 lần\nCopy sang order]
    ShowForm --> TelegramNotify

    TelegramNotify[Telegram: notifyManualPaymentClaim\nThông báo admin kiểm tra]
    TelegramNotify --> WaitingScreen[Màn hình chờ admin xác nhận\nPoll status mỗi 5 giây]

    WaitingScreen --> AdminApprove[Admin vào /crm/admin/orders\nBấm Duyệt thanh toán]
    AdminApprove --> CompleteOrder[approveAdminOrder\nChấp nhận: pending / paid / manual_payment_claimed\n→ completed\nTạo referral commission\nTrigger contract generation\nTelegram: notifyAdminApproval]
    CompleteOrder --> RedirectSuccess[User poll thấy completed\nRedirect /checkout/success]
```

## Ghi chú kỹ thuật

**HMAC verify:** Webhook dùng `CASSO_SECURE_TOKEN` để verify chữ ký `x-casso-signature` (HMAC-SHA512). Request không hợp lệ → log vào `casso_transactions` với status `hmac_failed` rồi return 401.

**Deduplication:** Mỗi `casso_tid` chỉ xử lý 1 lần. Nếu đã có trong DB → return 200 ngay, không xử lý lại.

**Timeout chain:** LibreOffice 45s SIGKILL < EF `generate-contract` 50s < EF `process-payment` 55s. Nếu contract generation timeout → Telegram alert admin, payment vẫn fail (admin xử lý và gửi lại hợp đồng thủ công).

**Admin approve — 1 bước duy nhất:** `approveAdminOrder` chấp nhận order có status `pending`, `paid`, hoặc `manual_payment_claimed` và chuyển thẳng sang `completed`. Không còn bước `verifyAdminOrder` riêng.

**Contract resend:** Admin có thể gửi lại hợp đồng từ `/crm/admin/print-queue` qua `resendContract()` trong `printQueue.ts`, tái sử dụng Edge Function `send-email`.

**casso_transactions status values:** `processing`, `processed`, `no_match`, `order_not_found`, `amount_mismatch`, `function_error`, `hmac_failed`.
