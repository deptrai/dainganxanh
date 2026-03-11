Bộ **User Flow Diagrams** dạng Mermaid cho dự án Đại Ngàn Xanh.
> Cập nhật lần cuối: 2026-03-07 — đồng bộ với code thực tế trong repo.

***

## 1️⃣ FIRST-TIME BUYER JOURNEY

**Routes thực tế:** `/` → `/pricing` → `/quantity` → `/register` | `/login` → `/checkout` → `/checkout/success`

```mermaid
flowchart TD
    Start([User đến Landing Page]) --> View[Xem Hero + Counter<br>138,592 / 1,000,000 cây đã bén rễ]
    View --> Decision{Nhấn CTA<br>'Trồng Ngay' hoặc<br>'Gieo Mầm Ngay'?}
    Decision -->|Không| Exit1([Rời khỏi trang])
    Decision -->|Có| Pricing[Chọn Gói Trồng Cây<br>/pricing<br>Gói Cá nhân 260k/cây]

    Pricing --> Quantity[Chọn Số Lượng Cây<br>/quantity<br>Nhập 1-1000 hoặc chọn nhanh<br>5 / 10 / 50 / 100]

    Quantity --> SessionCheck{Đã đăng nhập?<br>Check Supabase session}

    SessionCheck -->|Chưa| Register[Đăng ký nhanh<br>/register?quantity=N<br>Email/SĐT + OTP 6 số]
    SessionCheck -->|Rồi| Checkout

    Register --> VerifyOTP1[Xác thực OTP<br>Hiệu lực 5 phút]
    Register -.->|Đã có tài khoản?| Login[Đăng nhập<br>/login?quantity=N<br>Email/SĐT + OTP]
    Login --> VerifyOTP2[Xác thực OTP]
    Login -.->|Chưa có tài khoản?| Register

    VerifyOTP1 --> Checkout
    VerifyOTP2 --> Checkout

    Checkout[Thanh toán<br>/checkout?quantity=N<br>Chọn phương thức] --> PayMethod{Phương thức?}
    PayMethod -->|Banking| Banking[Chuyển khoản ngân hàng<br>QR Code + Nội dung CK<br>Mã đơn: DHxxxxxx]
    PayMethod -->|USDT| USDT[Đang phát triển<br>Chưa hỗ trợ]
    USDT --> PayMethod

    Banking --> Success[Thành công<br>/checkout/success]

    Success --> Animation[SuccessAnimation<br>Cây đang được gieo mầm]
    Animation --> OrderSummary[Chi tiết đơn hàng<br>Mã đơn + Số cây + CO2]
    OrderSummary --> ShareCard[Share Card Preview<br>Tên + Số cây + Mã đơn]
    ShareCard --> Share{Chia sẻ?}
    Share -->|Có| Social[ShareButton<br>Chia sẻ lên MXH]
    Share -->|Không| Nav
    Social --> Nav

    Nav{Tiếp theo?}
    Nav -->|Xem vườn| Garden[Vào Vườn Của Tôi<br>/crm/my-garden]
    Nav -->|Về trang chủ| Start
    Nav -->|Mua thêm| Quantity

    Garden --> End([Hoàn thành])
```

***

## 2️⃣ TREE TRACKING JOURNEY

**Routes thực tế:** `/crm/my-garden` → `/crm/my-garden/[orderId]` → `/crm/my-garden/[orderId]/harvest`

```mermaid
flowchart TD
    Start([Login vào Dashboard]) --> MyGarden[Vườn của tôi<br>/crm/my-garden]
    MyGarden --> ViewTrees[Xem danh sách cây<br>TreeGrid + TreeSortFilter]

    ViewTrees --> TreeCard[Mỗi cây hiển thị:<br>- Ảnh<br>- Trạng thái<br>- Metric CO2<br>- Ngày trồng]

    TreeCard --> Action{Hành động}
    Action --> Update[Xem cập nhật mới<br>/crm/my-garden/orderId]
    Action --> PlantMore[Trồng thêm cây<br>/crm/pricing]
    Action --> Refer[Giới thiệu bạn bè<br>/crm/referrals]

    Update --> Timeline[TreeTimeline:<br>- Quý 1-3: Ảnh placeholder<br>- Quý 4+: Ảnh thực tế<br>- Năm 5: Thông báo thu hoạch]
    Update --> PhotoGallery[PhotoGallery:<br>Ảnh từ vườn + GPS]
    Update --> GrowthMetrics[GrowthMetrics:<br>CO2 hấp thụ + Chiều cao]
    Update --> QuarterlyReports[QuarterlyReports:<br>Báo cáo quý download]

    Timeline --> Notify{Có thông báo mới?<br>NotificationBell}
    Notify -->|Có| Push[Push Notification<br>Cây của bạn X tuổi]
    Notify -->|Không| Wait[Chờ update tiếp]

    Push --> ViewPhoto[Xem ảnh mới<br>+ GPS location<br>LotMap component]
    ViewPhoto --> Report[Báo cáo quý:<br>- Trạng thái sống<br>- CO2 hấp thụ<br>- Video từ nông dân]

    Report --> Year5{Đến năm 5?<br>HarvestBadge hiển thị}
    Year5 -->|Chưa| Wait
    Year5 -->|Rồi| Harvest[Thông báo thu hoạch<br>/crm/my-garden/orderId/harvest]

    Harvest --> HarvestOption{Chọn phương án}

    HarvestOption -->|Bán lại| SellBack[Bán lại cho Đại Ngàn Xanh<br>Nhận giá cam kết]
    HarvestOption -->|Giữ cây| KeepTree[Tiếp tục chăm sóc<br>Tăng giá trị dài hạn]
    HarvestOption -->|Nhận sản phẩm| GetProduct[Nhận trầm hương<br>Tinh dầu/Gỗ thô]

    SellBack --> EContract[Ký hợp đồng điện tử]
    KeepTree --> ExtendContract[Ký hợp đồng gia hạn]
    GetProduct --> ShippingInfo[Nhập thông tin giao hàng]

    EContract --> Transfer[Nhận tiền vào Ví<br>Trong 30 ngày]
    ExtendContract --> ContinueTrack[Tiếp tục theo dõi]
    ShippingInfo --> Fulfillment[Xử lý đơn sản phẩm]

    Transfer --> End([Hoàn thành])
    ContinueTrack --> End
    Fulfillment --> End

    PlantMore --> Start
    Refer --> ReferralPage[Trang Referrals<br>/crm/referrals<br>ReferralLink + QR Code<br>ReferralStats thống kê]
```

***

## 3️⃣ REFERRAL & VIRAL FLOW

**Routes thực tế:** `/crm/referrals` | `/?ref=CODE`

```mermaid
flowchart LR
    Buyer[Buyer mua cây thành công] --> ShareCard[ShareCardPreview<br>Tên + Số cây + Mã đơn]
    ShareCard --> ShareBtn[ShareButton<br>Chia sẻ lên MXH]

    Buyer --> RefPage[Trang Referrals<br>/crm/referrals]
    RefPage --> RefLink[ReferralLink component<br>dainganxanh.com.vn/?ref=CODE]
    RefPage --> RefQR[ReferralQRCode<br>QR code để scan]
    RefPage --> RefStats[ReferralStats<br>Thống kê giới thiệu]

    ShareBtn --> NewVisitor[Bạn bè thấy trên MXH]
    RefLink --> NewVisitor
    RefQR --> NewVisitor

    NewVisitor --> Landing[Landing Page<br>/?ref=CODE<br>ReferralTracker set cookie 30 ngày]
    Landing --> BuyFlow[Buyer Journey<br>Flow 1 ở trên]
    BuyFlow --> NewBuyer[Buyer mới] --> ShareCard
```

***

## 4️⃣ CRM - MUA THÊM CÂY (Logged-in User)

**Routes thực tế:** `/crm/pricing` → `/crm/quantity` → `/crm/checkout`

```mermaid
flowchart TD
    Start([User đã đăng nhập<br>trong CRM]) --> CRMPricing[Chọn gói<br>/crm/pricing<br>PackageGrid + PackageCard]
    CRMPricing --> CRMQuantity[Chọn số lượng<br>/crm/quantity]
    CRMQuantity --> CRMCheckout[Thanh toán<br>/crm/checkout]
    CRMCheckout --> CRMSuccess[Thành công<br>/crm/checkout/success]
    CRMSuccess --> MyGarden[Vườn Của Tôi<br>/crm/my-garden]
```

***

## 5️⃣ ADMIN/OPERATIONS FLOW

**Routes thực tế:** `/crm/admin/*`

```mermaid
flowchart TD
    Start([Login Admin Dashboard<br>/crm/admin]) --> MainMenu{Chọn module}

    MainMenu --> OrderMgmt[Quản lý đơn hàng<br>/crm/admin/orders]
    MainMenu --> PlantOps[Vận hành trồng cây]
    MainMenu --> Analytics[Báo cáo & Phân tích<br>/crm/admin/analytics]

    OrderMgmt --> NewOrders[Xem đơn hàng mới<br>OrderTable + OrderFilters]
    NewOrders --> Verify[Xác minh thanh toán<br>VerifyOrderButton]
    Verify --> Assign[Gán vào lô cây<br>/crm/admin/lots<br>LotAssignmentModal]
    Assign --> PrintContract{In hợp đồng?<br>/crm/admin/print-queue}
    PrintContract -->|Có| Print[In + Gửi bưu điện<br>ContractActions]
    PrintContract -->|Không| Digital[Gửi email tự động]

    Print --> NotifyField[Thông báo đội trồng cây]
    Digital --> NotifyField

    PlantOps --> QuarterCheck[Checklist theo quý<br>/crm/admin/checklist<br>ChecklistItem + ChecklistProgress]
    QuarterCheck --> FieldVisit[Thăm vườn<br>QuarterSelector]
    FieldVisit --> TakePhoto[Chụp ảnh/Video<br>+ GPS tag]
    TakePhoto --> Upload[Upload lên hệ thống<br>/crm/admin/photos/upload<br>PhotoUploader + GPSPreview]

    Upload --> TagUsers[Tag vào từng user]
    TagUsers --> UpdateStatus[Cập nhật trạng thái cây<br>/crm/admin/trees<br>TreeHealthModal]

    UpdateStatus --> CheckHealth{Tình trạng<br>TreeHealthHistory}
    CheckHealth --> Healthy[Sống khỏe]
    CheckHealth --> Sick[Bệnh]
    CheckHealth --> Dead[Chết]

    Sick --> Treatment[Xử lý bệnh<br>Bón thuốc]
    Dead --> Replant[Trồng lại cây mới<br>ReplacementTaskList]
    Replant --> NotifyUser[Thông báo user<br>Lý do + Giải pháp]

    Healthy --> Quarterly
    Treatment --> Quarterly
    NotifyUser --> Quarterly[Gửi báo cáo quý<br>/crm/admin/reports]

    Analytics --> Dashboard[Xem Dashboard tổng]
    Dashboard --> Metrics[KPICard + Charts:<br>- Total trees planted<br>- Active users<br>- Revenue RevenueChart<br>- Carbon offset<br>- ConversionFunnel]

    Metrics --> Export[Export báo cáo<br>ExportButton PDF/Excel]
    Export --> Stakeholder[Gửi cho:<br>- Board<br>- Nhà đầu tư<br>- Đối tác]

    MainMenu --> Withdrawals[Quản lý rút tiền<br>/crm/admin/withdrawals<br>WithdrawalsList]
    MainMenu --> Settings[Cài đặt hệ thống<br>/crm/admin/settings]

    Stakeholder --> End([Hoàn thành])
```

***

## 📌 Lưu ý khi implement

**Conversion Funnel cần track:**
- Landing → Sign up: Tỷ lệ này nên >15%
- Sign up → Purchase: Nên >60% (vì đã quan tâm)
- Purchase → Share: Nên >30% (viral loop)

**Critical Touch Points:**
- **Instant gratification** sau thanh toán (Share Card + Animation)
- **Quarterly updates** với ảnh thực tế (giữ engagement)
- **Year 5 notification** với 3 options rõ ràng (tránh thất vọng)

**Tech Priority (MVP):**
1. Buyer Flow → Track Flow → Payment Flow (Core)
2. Affiliate Dashboard → Withdrawal (Growth engine)
3. Admin Operations (Cho team vận hành)
4. Corporate Flow (Phase 2, sau khi có case study từ B2C)
