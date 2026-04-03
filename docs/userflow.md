Bộ **User Flow Diagrams** dạng Mermaid cho dự án Đại Ngàn Xanh.

> Cập nhật lần cuối: 2026-04-03 — đồng bộ với code thực tế trong repo (withdrawal notifications, bank auto-fill, impersonation, admin approve paid orders).

## 1️⃣ FIRST-TIME BUYER JOURNEY

**Routes:** `/` → `/pricing` → `/quantity` → `/register` → `/checkout` → `/checkout/success`

```mermaid
flowchart TD
    Start([Vao Landing Page]) --> View[Xem Hero + Features + FAQ]
    View --> CTA{Nhan CTA Trong Ngay?}
    CTA -->|Khong| Exit([Roi khoi trang])
    CTA -->|Co| Pricing[Chon goi trong cay<br>Route /pricing - 260k/cay]

    Pricing --> Quantity[Chon so luong<br>Route /quantity<br>Nhap 1-1000 cay<br>Quick select: 5 / 10 / 50 / 100]

    Quantity --> AuthCheck{Da dang nhap?}
    AuthCheck -->|Roi| Checkout
    AuthCheck -->|Chua| Register[Dang ky nhanh<br>Route /register quantity N<br>Phone hoac Email]

    Register --> OTPStep1[Nhap phone hoac email<br>Co o nhap ma gioi thieu<br>neu chua co ref cookie]
    OTPStep1 --> SendOTP1[Supabase gui OTP<br>Hieu luc 5 phut]
    SendOTP1 --> VerifyOTP1[Nhap ma OTP 8 so]
    VerifyOTP1 --> SetCookie[Set cookie ref<br>Du tru hoac nhap moi<br>Default: DNG895075]
    SetCookie --> Checkout

    Register -.->|Da co tai khoan| Login[Dang nhap<br>Route /login<br>OTP flow tuong tu]
    Login --> Checkout

    Checkout[Thanh toan<br>Route /checkout quantity N] --> LoadCheck{Co pending order?}

    LoadCheck -->|Co| PayStep
    LoadCheck -->|Khong| CompletedCheck{Da co completed order?}
    CompletedCheck -->|Co| RedirectSuccess[Redirect<br>Route /checkout/success]
    CompletedCheck -->|Khong| CreateOrder[Tao pending order tu dong<br>POST /api/orders/pending<br>Format: DH + 6 ky tu<br>Luu referred_by tu ref cookie<br>Telegram: notifyNewOrder]
    CreateOrder --> PayStep

    PayStep[Chuyen khoan<br>Hien thi STK + QR Code<br>Noi dung: ma don DHxxxxxx<br>So tien: quantity x 260000] --> WaitOrCancel{Hanh dong?}
    WaitOrCancel -->|Huy don| CancelOrder[POST /api/orders/cancel<br>Xoa pending order]
    CancelOrder --> Quantity
    WaitOrCancel -->|Cho thanh toan| PollStatus[Poll GET /api/orders/status<br>Kiem tra status don hang]

    PollStatus -->|status = completed| RedirectSuccess
    PollStatus -->|Chua xong| PollStatus

    WaitOrCancel -->|Bam Da chuyen tien| ClaimPayment[POST /api/orders/claim-manual-payment<br>status: manual_payment_claimed<br>Telegram: notifyManualPaymentClaim]

    ClaimPayment --> IdentityCheck{User da co id_number<br>trong bang users?}
    IdentityCheck -->|Chua| IdentityForm[Form thong tin hop dong<br>Ho ten, CCCD, Ngay sinh<br>Dia chi, SĐT, Quoc tich<br>Noi cap, Ngay cap<br>POST /api/orders/identity<br>Luu vao users table 1 lan]
    IdentityCheck -->|Roi| AutoFill[Tu dong dien vao order<br>tu users profile]
    IdentityForm --> WaitAdmin
    AutoFill --> WaitAdmin

    WaitAdmin[Man hinh cho admin xac nhan<br>Route /checkout/waiting<br>Hien thi trang thai don hang<br>Poll status moi 5 giay<br>User co the mua them don khac]

    WaitAdmin -->|Admin approve| RedirectSuccess
    WaitAdmin -->|Mua them| Quantity

    RedirectSuccess --> SuccessPage[Trang thanh cong<br>Route /checkout/success<br>Animation + Ma don + CO2<br>Share Card Preview]

    SuccessPage --> NextStep{Tiep theo?}
    NextStep -->|Xem vuon| Garden[Route /crm/my-garden]
    NextStep -->|Ve trang chu| Start
    NextStep -->|Mua them| Quantity
```

## 2️⃣ PAYMENT PROCESSING (Backend Webhook)

**Services:** Casso Bank → Webhook → Edge Function → Supabase → Email + Telegram

```mermaid
flowchart TD
    Transfer[Khach chuyen khoan<br>Noi dung: DHxxxxxx] --> Casso[Casso ghi nhan GD<br>Gui webhook]
    Casso --> Webhook[POST /api/webhooks/casso<br>Header: x-casso-signature]

    Webhook --> VerifySig{HMAC-SHA512 hop le?}
    VerifySig -->|Khong| LogFail[Log: hmac_failed<br>vao casso_transactions]
    LogFail --> Reject[Return 401]
    VerifySig -->|Co| ParseBody[Parse body<br>Lay txId = id hoac tid]

    ParseBody --> TestPing{txId ton tai?}
    TestPing -->|Khong co txId| AckPing[Return 200 test ping]
    TestPing -->|Co| Dedup{casso_tid da xu ly?}

    Dedup -->|Roi| Return200Dup[Return 200 duplicate]
    Dedup -->|Chua| LogTx[Insert casso_transactions<br>status: processing]

    LogTx --> CheckAmount{amount duong?}
    CheckAmount -->|Am hoac bang 0| SkipOut[Update: no_match<br>Outgoing ignored]
    SkipOut --> Return200

    CheckAmount -->|Duong| ParseCode[Regex tim DHxxxxxx<br>trong description]
    ParseCode -->|Khong tim thay| NoCode[Update: no_match<br>orderCode not found]
    NoCode --> Return200

    ParseCode -->|Tim thay| FindOrder[SELECT orders<br>code = DHxxxxxx AND status pending]
    FindOrder -->|Khong co| NotFound[Update: order_not_found]
    NotFound --> Return200

    FindOrder -->|Tim thay| ValidateAmt{Chenh lech amount<br>duoi 1000d?}
    ValidateAmt -->|Lech nhieu| Mismatch[Update: amount_mismatch]
    Mismatch --> Return200

    ValidateAmt -->|Khop| InvokeFn[Invoke Edge Function<br>process-payment<br>timeout: 55s]
    InvokeFn --> GenTrees[Insert trees vao DB<br>Update order: completed]
    GenTrees --> GenContract[EF generate-contract timeout 50s<br>→ POST /api/contracts/generate<br>LibreOffice headless DOCX to PDF<br>timeout 45s SIGKILL]

    GenContract -->|Thanh cong| SendEmail[send-email<br>Xac nhan don + PDF dinh kem]
    SendEmail --> UpdateLog[Update casso_transactions<br>status: processed]
    UpdateLog --> TelegramSuccess[notifyPaymentSuccess<br>Telegram admin group]
    TelegramSuccess --> Return200[Return 200 OK]

    GenContract -->|Loi hoac timeout| ContractFail[notifyContractFailure<br>Telegram admin group<br>Admin xu ly thu cong]
    ContractFail --> ThrowErr[Throw error<br>Payment fail - Update: function_error]
    ThrowErr --> Return200

    InvokeFn -->|Error| FnError[Update: function_error]
    FnError --> Return200
```

### Manual Payment Claim (User tu bao da chuyen tien)

```mermaid
flowchart TD
    UserClaim[User bam Da chuyen tien thanh cong] --> ClaimAPI[POST /api/orders/claim-manual-payment]
    ClaimAPI --> UpdateStatus[Update order status<br>pending to manual_payment_claimed]
    UpdateStatus --> AutoFillIdentity{User da co id_number?}

    AutoFillIdentity -->|Co| CopyToOrder[Tu dong copy identity<br>tu users sang order]
    CopyToOrder --> TelegramNotify
    AutoFillIdentity -->|Chua| ShowForm[Hien form nhap identity<br>Luu vao users table 1 lan<br>Copy sang order]
    ShowForm --> TelegramNotify

    TelegramNotify[Telegram: notifyManualPaymentClaim<br>Thong bao admin kiem tra]

    TelegramNotify --> WaitingScreen[Man hinh cho admin xac nhan<br>Poll status moi 5 giay]

    WaitingScreen --> AdminApprove[Admin vao /crm/admin/orders<br>Bam Approve<br>Chap nhan status paid hoac manual_payment_claimed]
    AdminApprove --> CompleteOrder[approveAdminOrder<br>status: completed<br>Tao referral commission<br>Trigger contract generation<br>Telegram: notifyAdminApproval]
    CompleteOrder --> RedirectSuccess[Redirect /checkout/success]
```

## 3️⃣ REFERRAL & VIRAL FLOW

**Routes:** `/crm/referrals` → `/?ref=CODE` → `/register`

```mermaid
flowchart TD
    Buyer[Buyer mua cay thanh cong] --> GoRef[Vao trang Referrals<br>Route /crm/referrals]

    GoRef --> ViewStats[Xem thong ke<br>Total clicks / Conversions<br>Hoa hong 10 phan tram<br>Ty le chuyen doi]
    GoRef --> GetLink[Lay referral link<br>dainganxanh.com.vn ref=CODE]
    GoRef --> GetQR[Lay QR Code<br>cung URL ref]
    GoRef --> ViewConversions[Xem lich su<br>Ma don + Ten KH + Hoa hong]

    GetLink --> Share[Chia se len MXH<br>Facebook / TikTok / WhatsApp / Telegram]
    GetQR --> Share

    Share --> FriendClick[Ban be click link]
    FriendClick --> Landing[Landing Page<br>Route /?ref=CODE]
    Landing --> SetCookie[ReferralTracker<br>Set cookie ref = CODE<br>30 ngay, giu cookie cu]
    SetCookie --> TrackClick[trackReferralClick<br>Ghi vao referral_clicks DB]

    TrackClick --> FriendBuys[Ban be mua hang<br>Flow 1: Buyer Journey]
    FriendBuys --> RegisterWithRef[Register<br>ref cookie tu dong dien vao form]
    RegisterWithRef --> Purchase[Thanh toan thanh cong<br>order.referred_by luu referrer ID]
    Purchase --> Commission[Hoa hong 10 phan tram<br>tinh tu orders.total_amount]

    Commission --> WithdrawCheck{So du du 200k?}
    WithdrawCheck -->|Du| RequestWithdraw[Gui yeu cau rut tien<br>Nhap STK ngan hang<br>Ten phai khop he thong]
    RequestWithdraw --> Pending[Tao withdrawal record<br>status: pending<br>Telegram: notifyWithdrawalRequest<br>Email: gui cho admin]
    WithdrawCheck -->|Chua du| WaitMore[Cho them hoa hong]
```

## 4️⃣ TREE TRACKING JOURNEY (User CRM)

**Routes:** `/crm/my-garden` → `/crm/my-garden/[orderId]` → `/crm/my-garden/[orderId]/harvest`

```mermaid
flowchart TD
    Login([Da dang nhap]) --> Garden[Vuon cua toi<br>Route /crm/my-garden<br>Orders: paid/verified/assigned/completed]

    Garden --> Summary[Tong quan:<br>Tong cay - Tong CO2 - Tong chi phi]
    Garden --> PackageGrid[Luoi goi cay<br>Moi goi: ma don + so cay + trang thai]

    PackageGrid --> PackageDetail[Chi tiet goi<br>Route /crm/my-garden/orderId]

    PackageDetail --> GrowthMetrics[Chi so tang truong<br>CO2 hap thu + Tuoi thang<br>Tien do den thu hoach 60 thang]
    PackageDetail --> MapSection[Ban do GPS<br>Neu da gan lo cay]
    PackageDetail --> CameraSection[Farm Camera<br>Stream truc tiep]
    PackageDetail --> TreeList[Danh sach cay<br>Ma cay tung cay]
    PackageDetail --> PhotoGallery[Thu vien anh<br>Anh tu lo cay]
    PackageDetail --> Timeline[Tree Timeline<br>Moc thoi gian trong cay<br>Cap nhat hang quy]
    PackageDetail --> Reports[Bao cao quy<br>Download PDF]

    Timeline --> MonthCheck{Du 60 thang?}
    MonthCheck -->|Chua| Wait[Cho cap nhat tiep theo<br>Nhan email bao cao quy]
    MonthCheck -->|Roi| Harvest[Thu hoach<br>Route /crm/my-garden/orderId/harvest]

    Harvest --> HarvestChoice{Chon phuong an}
    HarvestChoice -->|Ban lai| SellBack[Ban lai cho Dai Ngan Xanh<br>Nhan gia cam ket]
    HarvestChoice -->|Giu cay| KeepGrow[Tiep tuc cham soc<br>Ky hop dong gia han]
    HarvestChoice -->|Nhan san pham| GetProduct[Nhan tram huong<br>Tinh dau / Go tho]
```

## 5️⃣ WITHDRAWAL FLOW

**Routes:** `/crm/referrals` → admin `/crm/admin/withdrawals`

```mermaid
flowchart TD
    UserRef[User vao /crm/referrals] --> BalanceCalc[Tinh so du kha dung<br>= Hoa hong earned<br>- approved withdrawn<br>- pending withdrawn]

    BalanceCalc --> BalanceCheck{So du >= 200k?}
    BalanceCheck -->|Chua| Disabled[Nut rut tien bi tat<br>Hien thi so du thieu]
    BalanceCheck -->|Du| WithdrawBtn[Bam nut Rut tien]

    WithdrawBtn --> WithdrawForm[Form rut tien<br>Chon ngan hang<br>Nhap STK so<br>Nhap ten chu TK<br>Nhap so tien rut<br>Auto-fill tu lan rut truoc<br>getSavedBankInfo]

    WithdrawForm --> Validate{Hop le?<br>Ten khop he thong?<br>So tien du?}
    Validate -->|Khong| ShowError[Hien loi cu the]
    Validate -->|Co| Submit[requestWithdrawal<br>Server Action<br>getEffectiveUser - ho tro impersonation]

    Submit --> CreateRecord[Tao withdrawal record<br>status: pending<br>Tru vao so du ngay]
    CreateRecord --> NotifyAdmin[Telegram: notifyWithdrawalRequest<br>Email: gui cho tat ca admin]
    NotifyAdmin --> UserNotified[User: yeu cau da gui<br>Xu ly trong 1-3 ngay]

    NotifyAdmin --> AdminReview[Admin vao /crm/admin/withdrawals<br>Xem danh sach pending]
    AdminReview --> ReviewDetail[Xem chi tiet:<br>Ten user + STK + Ngan hang<br>So tien + Ngay tao]
    ReviewDetail --> AdminDecision{Quyet dinh?}

    AdminDecision -->|Duyet| UploadProof[Upload anh chuyen khoan<br>Server Action approveWithdrawal FormData<br>serviceRoleClient upload to Storage]
    UploadProof --> ApproveAction[approveWithdrawal<br>service role update<br>status: pending to approved<br>Luu proof_image_url]
    ApproveAction --> NotifyApproved[Telegram: notifyWithdrawalApproved<br>Email: send-withdrawal-email<br>type: request_approved<br>In-app: withdrawal_approved<br>vao notifications table]

    AdminDecision -->|Tu choi| EnterReason[Nhap ly do tu choi]
    EnterReason --> RejectAction[rejectWithdrawal<br>service role update<br>status: pending to rejected<br>Luu rejection_reason]
    RejectAction --> NotifyRejected[Telegram: notifyWithdrawalRejected<br>Email: send-withdrawal-email<br>type: request_rejected<br>In-app: withdrawal_rejected<br>vao notifications table]
```

## 6️⃣ ADMIN OPERATIONS FLOW

**Routes:** `/crm/admin/*` — yeu cau role admin hoac super_admin

```mermaid
flowchart TD
    AdminLogin([Admin dang nhap OTP]) --> RoleCheck{Kiem tra role<br>trong admin layout}
    RoleCheck -->|role: user| Blocked[Redirect /crm/dashboard]
    RoleCheck -->|admin hoac super_admin| AdminHub{Chon module}

    AdminHub --> Orders[Quan ly don hang<br>Route /crm/admin/orders]
    AdminHub --> Users[Quan ly users<br>Route /crm/admin/users]
    AdminHub --> Withdrawals[Quan ly rut tien<br>Route /crm/admin/withdrawals]
    AdminHub --> PlantOps[Van hanh trong cay]
    AdminHub --> Casso[Lich su thanh toan<br>Route /crm/admin/casso]
    AdminHub --> Referrals[Quan ly referrals<br>Route /crm/admin/referrals]
    AdminHub --> Blog[Quan ly Blog<br>Route /crm/admin/blog]
    AdminHub --> Analytics[Bao cao<br>Route /crm/admin/analytics]

    Orders --> VerifyOrder[Xac minh don hang<br>Doi chieu bank transfer]
    VerifyOrder --> AssignLot[Gan lo cay<br>Route /crm/admin/lots]
    AssignLot --> PrintContract{In hop dong?}
    PrintContract -->|Co| PrintQueue[Print Queue<br>Route /crm/admin/print-queue]
    PrintContract -->|Khong| AutoEmail[send-tree-assignment-email<br>+ notifyTreeAssigned Telegram]

    Users --> SearchUser[Tim kiem theo email / ten / phone]
    SearchUser --> EditRole[Thay doi role<br>user / admin / super_admin]
    SearchUser --> Impersonate[Admin impersonate user<br>Ho tro truc tiep]

    PlantOps --> Checklist[Field Checklist<br>Route /crm/admin/checklist]
    Checklist --> UploadPhotos[Upload anh cay<br>Route /crm/admin/photos/upload]
    UploadPhotos --> UpdateTrees[Cap nhat trang thai cay<br>Route /crm/admin/trees]
    UpdateTrees --> HealthCheck{Tinh trang cay?}
    HealthCheck --> Healthy[Song khoe<br>Gui bao cao quy]
    HealthCheck --> Sick[Benh - xu ly]
    HealthCheck --> Dead[Chet - trong lai + thong bao]

    Casso --> ViewTx[Xem casso_transactions]
    ViewTx --> TxCheck{Status?}
    TxCheck --> Processed[processed - OK]
    TxCheck --> NoMatch[no_match - kiem tra thu cong]
    TxCheck --> FnError[function_error - reprocess]

    Referrals --> AssignRef[Gan ma gioi thieu thu cong<br>cho user chua co]
    AssignRef --> TelegramRef[notifyReferralAssigned<br>Telegram admin]

    Blog --> CreatePost[Tao bai viet moi<br>Route /crm/admin/blog/new]
    Blog --> EditPost[Sua bai<br>Route /crm/admin/blog/id/edit]
    CreatePost --> PublishPost[Xuat ban / Luu nhap / Hen gio]
```

## 7️⃣ AUTH FLOW

**Routes:** `/register` → `/login` → `/auth/callback`

```mermaid
flowchart TD
    Unauth([User chua dang nhap]) --> Middleware[Next.js Middleware<br>Bao ve /crm/ routes]
    Middleware -->|Chua auth| Redirect[Redirect /login<br>Luu redirect path]
    Middleware -->|Da auth| Allow[Cho phep truy cap]

    Redirect --> LoginPage[Trang dang nhap<br>Route /login]
    LoginPage --> InputMethod[Nhap email hoac phone]
    InputMethod --> SendOTP[Supabase gui OTP<br>Hieu luc 5 phut]
    SendOTP --> EnterCode[Nhap ma OTP 8 so]
    EnterCode --> OTPValid{OTP hop le?}
    OTPValid -->|Khong| Retry[Nhap lai hoac gui lai<br>Dem nguoc 60s]
    OTPValid -->|Co| SetSession[Supabase setSession<br>Set auth cookie]
    SetSession --> CheckRole{Role cua user?}
    CheckRole -->|user| UserHome[Redirect /crm/my-garden<br>hoac redirect param]
    CheckRole -->|admin hoac super_admin| AdminHome[Redirect /crm/admin]

    Allow --> RequestedPage[Hien thi trang yeu cau]

    AuthCallback[Route /auth/callback<br>Magic link handler] --> ExtractToken[Lay token tu URL hash<br>access_token + refresh_token]
    ExtractToken --> SessionOK{Session hop le?}
    SessionOK -->|Co| RedirectHome[Redirect trang chu]
    SessionOK -->|Khong| LoginError[Redirect /login<br>error: auth_failed]
```

## 8️⃣ NOTIFICATION MAP

```mermaid
flowchart LR
    EV1[1 - User tao pending order]
    EV2[2 - Casso xac nhan thanh toan]
    EV3[3 - Admin gan lo cay cho don]
    EV4[4 - User yeu cau rut tien]
    EV5[5 - Admin duyet rut tien]
    EV6[6 - Admin tu choi rut tien]
    EV7[7 - Admin gan ma gioi thieu]
    EV8[8 - Admin upload anh quy]

    EV1 --> T1([Telegram<br>notifyNewOrder<br>Don hang moi - cho thanh toan])

    EV2 --> T2([Telegram<br>notifyPaymentSuccess<br>Thanh toan thanh cong + ma cay])
    EV2 --> E1([Email to User<br>send-email<br>Xac nhan + ma cay + PDF hop dong])

    EV3 --> T3([Telegram<br>notifyTreeAssigned<br>Da gan lo cay cho don])
    EV3 --> E2([Email to User<br>send-tree-assignment-email<br>Thong tin lo cay + GPS + ma cay])

    EV4 --> T4([Telegram<br>notifyWithdrawalRequest<br>Yeu cau rut tien moi])
    EV4 --> E3([Email to Admin<br>send-withdrawal-email<br>type: request_created])

    EV5 --> T5([Telegram<br>notifyWithdrawalApproved<br>Admin da duyet rut tien])
    EV5 --> E4([Email to User<br>send-withdrawal-email<br>type: request_approved + anh CK])
    EV5 --> N1([In-app Notification<br>withdrawal_approved<br>NotificationBell cho user])

    EV6 --> T6([Telegram<br>notifyWithdrawalRejected<br>Admin tu choi rut tien])
    EV6 --> E5([Email to User<br>send-withdrawal-email<br>type: request_rejected + ly do])
    EV6 --> N2([In-app Notification<br>withdrawal_rejected<br>NotificationBell cho user])

    EV7 --> T7([Telegram<br>notifyReferralAssigned<br>Admin gan ma gioi thieu])

    EV8 --> E6([Email to User<br>send-quarterly-update<br>Bao cao quy: anh + so lieu])

    EV9[9 - Tao hop dong PDF that bai] --> T8([Telegram<br>notifyContractFailure<br>Admin xu ly thu cong + gui lai])

    EV10[10 - User bao da chuyen tien] --> T9([Telegram<br>notifyManualPaymentClaim<br>Admin kiem tra va duyet])

    EV11[11 - Admin approve don hang thu cong] --> T10([Telegram<br>notifyAdminApproval<br>Admin da duyet don hang])
```

**Tóm tắt:**

| Sự kiện | Telegram Admin | Email User | Email Admin | In-app User |
| --- | --- | --- | --- | --- |
| Tạo pending order | ✅ notifyNewOrder | — | — | — |
| Thanh toán thành công | ✅ notifyPaymentSuccess | ✅ send-email | — | — |
| Admin gán lô cây | ✅ notifyTreeAssigned | ✅ send-tree-assignment-email | — | — |
| User yêu cầu rút tiền | ✅ notifyWithdrawalRequest | — | ✅ send-withdrawal-email | — |
| Admin duyệt rút tiền | ✅ notifyWithdrawalApproved | ✅ send-withdrawal-email | — | ✅ withdrawal_approved |
| Admin từ chối rút tiền | ✅ notifyWithdrawalRejected | ✅ send-withdrawal-email | — | ✅ withdrawal_rejected |
| Admin gán mã giới thiệu | ✅ notifyReferralAssigned | — | — | — |
| Upload ảnh quý | — | ✅ send-quarterly-update | — | — |
| Tạo hợp đồng PDF thất bại | ✅ notifyContractFailure | — | — | — |
| User báo đã chuyển tiền | ✅ notifyManualPaymentClaim | — | — | — |
| Admin approve đơn hàng | ✅ notifyAdminApproval | — | — | — |

## 📌 Ghi chú kỹ thuật

**Auth:** OTP only (email hoặc phone), không có password. Session dùng Supabase cookie.

**Payment:** Chuyển khoản ngân hàng thủ công, Casso webhook phát hiện và xử lý tự động. Nếu không auto-detect, user bấm "Đã chuyển tiền" → status `manual_payment_claimed` → admin approve thủ công.

**Admin approve order:** `approveAdminOrder` chấp nhận cả đơn hàng có status `paid` (ngoài `manual_payment_claimed`), cho phép admin duyệt đơn đã thanh toán qua Casso nhưng chưa tự động hoàn tất. Gửi Telegram `notifyAdminApproval` khi duyệt.

**Commission:** 10% của `orders.total_amount` khi order `status = completed`. Trừ cả `pending + approved` withdrawals khỏi balance để tránh over-commit.

**RLS:** Admin actions dùng `createServiceRoleClient()` để bypass RLS. User actions dùng session client.

**Referral default:** Nếu không có ref cookie → dùng `DEFAULT_REF = "DNG895075"`.

**Order code format:** `DH` + 6 ký tự alphanumeric ngẫu nhiên (ví dụ: `DH1U90XP`).

**Withdrawal proof upload:** Server action `approveWithdrawal(formData: FormData)` sử dụng `serviceRoleClient` để upload ảnh chuyển khoản lên Supabase Storage `withdrawals` bucket (public, JPEG/PNG/WebP/GIF, tối đa 5MB) và approve trong cùng một request. Thay thế cách upload client-side cũ qua `createBrowserClient()`.

**Withdrawal bank auto-fill:** `getSavedBankInfo()` tự động điền thông tin ngân hàng (tên ngân hàng, STK, tên chủ TK) từ lần rút tiền trước đó, giảm nhập liệu lặp lại cho user.

**Withdrawal notifications:** Khi admin duyệt/từ chối rút tiền, hệ thống gửi đồng thời 3 kênh: Telegram (`notifyWithdrawalApproved`/`notifyWithdrawalRejected`), Email (`send-withdrawal-email`), và In-app notification (insert vào bảng `notifications` → hiển thị trên `NotificationBell`).

**Withdrawal impersonation:** `requestWithdrawal` sử dụng `getEffectiveUser()` thay vì `supabase.auth.getUser()` để hỗ trợ admin impersonate user khi tạo yêu cầu rút tiền.

**Admin withdrawals page:** FK `withdrawals_user_id_public_users_fkey` → `public.users` (thay thế FK cũ trỏ tới `auth.users`). Page sử dụng `force-dynamic` để tránh Server Component caching.

**Impersonation:** Admin có thể impersonate user để hỗ trợ trực tiếp (xem qua `getImpersonationContext()` và `getEffectiveUser()`).

**Contract Generation:** DOCX template → LibreOffice headless DOCX→PDF (Alpine: `font-noto font-noto-extra`). Timeout chain: LibreOffice 45s SIGKILL < EF generate-contract 50s < EF process-payment 55s. Nếu thất bại → Telegram admin alert + payment fail (admin xử lý thủ công và gửi lại hợp đồng).

**Scheduled Jobs:**

- `cleanup-pending-orders` — hourly, xóa pending orders quá 24h
- `checklist-reminder` — quarterly, nhắc đội field
- `send-quarterly-update` — quarterly, gửi báo cáo cho users
- `profile-backfill` — hourly, tạo profiles cho auth users bị thiếu (pg_cron)

**Environment Variables:**

- `CASSO_SECURE_TOKEN` — verify Casso webhook HMAC-SHA512
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — admin notifications
- `RESEND_API_KEY` — email production (Mailpit khi `SMTP_HOST=inbucket`)
- `SUPABASE_SERVICE_ROLE_KEY` — bypass RLS
- `CONTRACT_API_SECRET` — bảo vệ contract generation endpoint (`/api/contracts/generate`)