Đây là bộ ** User Flow Diagrams** dạng Mermaid cho dự án Đại Ngàn Xanh [code:file]. 

***

## 1️⃣ FIRST-TIME BUYER JOURNEY

```mermaid
flowchart TD
    Start([User đến Landing Page]) --> View[Xem Trailer Video<br/>Counter: X/1M cây]
    View --> Decision{Quan tâm?}
    Decision -->|Không| Exit1([Rời khỏi trang])
    Decision -->|Có| SelectPlan[Chọn gói cây]
    
    SelectPlan --> Plan2[Gói Cá nhân<br/>260k/cây]
    
    Plan2 --> Customize[Tùy chỉnh số lượng]
    
    Customize --> Input[Nhập thông tin:<br/>- Số lượng cây]
    Input --> Register{Đã có tài khoản?}
    
    Register -->|Không| Signup[Đăng ký nhanh<br/>Email/SĐT + OTP]
    Register -->|Có| Login[Đăng nhập<br/>Email/SĐT + OTP]
    
    Signup --> AutoWallet[Tự động tạo ví]
    Login --> RestoreSession[Khôi phục phiên<br/>Pre-fill thông tin]
    
    AutoWallet --> Payment[Thanh toán]
    RestoreSession --> Payment
    
    Payment --> PayMethod[Chọn phương thức:<br/>Banking/USDT]
    PayMethod --> Checkout[Xác nhận thanh toán]
    
    Checkout --> Success{Thành công?}
    Success -->|Không| Retry[Thử lại]
    Retry --> PayMethod
    Success -->|Có| Reward[🎉 Animation thành công<br/>Cây đang được gieo mầm theo số lượng từ bao nhiêu đến bao nhiêu]
    
    Reward --> ShareCard[Tự động tạo Share Card<br/>Ảnh + Tên + CO2]
    ShareCard --> Share{Chia sẻ?}
    Share -->|Có| Social[Chia sẻ lên<br/>Mạng xã hội]
    Share -->|Không| Email
    Social --> Email[Nhận email:<br/>- Hợp đồng PDF<br/>- Mã cây<br/>- Link theo dõi]
    
    Email --> Dashboard[Vào Dashboard<br/>Xem vườn của tôi]
    Dashboard --> End([Hoàn thành])
```

***

## 2️⃣ TREE TRACKING JOURNEY

```mermaid
flowchart TD
    Start([Login vào Dashboard]) --> MyGarden[Vườn của tôi]
    MyGarden --> ViewTrees[Xem danh sách cây]
    
    ViewTrees --> TreeCard[Mỗi cây hiển thị:<br/>- Ảnh<br/>- Trạng thái<br/>- Metric CO2<br/>- Ngày trồng]
    
    TreeCard --> Action{Hành động}
    Action --> Update[Xem cập nhật mới]
    Action --> PlantMore[Trồng thêm cây]
    Action --> Refer[Giới thiệu bạn bè]
    
    Update --> Timeline[Timeline:<br/>- Quý 1-3: Ảnh placeholder<br/>- Quý 4+: Ảnh thực tế<br/>- Năm 5: Thông báo thu hoạch]
    
    Timeline --> Notify{Có thông báo mới?}
    Notify -->|Có| Push[Push Notification<br/>Cây của bạn X tuổi]
    Notify -->|Không| Wait[Chờ update tiếp]
    
    Push --> ViewPhoto[Xem ảnh mới<br/>+ GPS location]
    ViewPhoto --> Report[Báo cáo quý:<br/>- Trạng thái sống<br/>- CO2 hấp thụ<br/>- Video từ nông dân]
    
    Report --> Year5{Đến năm 5?}
    Year5 -->|Chưa| Wait
    Year5 -->|Rồi| Harvest[Thông báo thu hoạch]
    
    Harvest --> HarvestOption{Chọn phương án}

    HarvestOption -->|Bán lại| SellBack[Bán lại cho Đại Ngàn Xanh<br/>Nhận giá cam kết]
    HarvestOption -->|Giữ cây| KeepTree[Tiếp tục chăm sóc<br/>Tăng giá trị dài hạn]
    HarvestOption -->|Nhận sản phẩm| GetProduct[Nhận trầm hương<br/>Tinh dầu/Gỗ thô]
    
    SellBack --> EContract[Ký hợp đồng điện tử]
    KeepTree --> ExtendContract[Ký hợp đồng gia hạn]
    GetProduct --> ShippingInfo[Nhập thông tin giao hàng]
    
    EContract --> Transfer[Nhận tiền vào Ví<br/>Trong 30 ngày]
    ExtendContract --> ContinueTrack[Tiếp tục theo dõi]
    ShippingInfo --> Fulfillment[Xử lý đơn sản phẩm]
    
    Transfer --> End([Hoàn thành])
    ContinueTrack --> End
    Fulfillment --> End
    
    PlantMore --> Start
    Refer --> ReferralLink[Tạo link giới thiệu<br/>*Phase 2: Affiliate Dashboard*]
```

***

## 5️⃣ ADMIN/OPERATIONS FLOW

```mermaid
flowchart TD
    Start([Login Admin Dashboard]) --> MainMenu{Chọn module}
    
    MainMenu --> OrderMgmt[Quản lý đơn hàng]
    MainMenu --> PlantOps[Vận hành trồng cây]

    MainMenu --> Analytics[Báo cáo & Phân tích]
    
    OrderMgmt --> NewOrders[Xem đơn hàng mới]
    NewOrders --> Verify[Xác minh thanh toán]
    Verify --> Assign[Gán vào lô cây]
    Assign --> PrintContract{In hợp đồng?}
    PrintContract -->|Có| Print[In + Gửi bưu điện]
    PrintContract -->|Không| Digital[Gửi email tự động]
    
    Print --> NotifyField[Thông báo đội trồng cây]
    Digital --> NotifyField
    
    PlantOps --> QuarterCheck[Checklist theo quý]
    QuarterCheck --> FieldVisit[Thăm vườn]
    FieldVisit --> TakePhoto[Chụp ảnh/Video<br/>+ GPS tag]
    TakePhoto --> Upload[Upload lên hệ thống]
    
    Upload --> TagUsers[Tag vào từng user]
    TagUsers --> UpdateStatus[Cập nhật trạng thái cây]
    
    UpdateStatus --> CheckHealth{Tình trạng}
    CheckHealth --> Healthy[Sống khỏe]
    CheckHealth --> Sick[Bệnh]
    CheckHealth --> Dead[Chết]
    
    Sick --> Treatment[Xử lý bệnh<br/>Bón thuốc]
    Dead --> Replant[Trồng lại cây mới]
    Replant --> NotifyUser[Thông báo user<br/>Lý do + Giải pháp]
    
    Healthy --> Quarterly
    Treatment --> Quarterly
    NotifyUser --> Quarterly[Gửi báo cáo quý]
    
    ContentMgmt --> Social[Đăng bài Social Media]
    ContentMgmt --> Email[Gửi Newsletter]
    ContentMgmt --> Blog[Viết blog/Case study]
    
    Social --> Schedule[Lên lịch đăng]
    Email --> Segment[Phân đoạn user]
    Blog --> SEO[Tối ưu SEO]
    
    Analytics --> Dashboard[Xem Dashboard tổng]
    Dashboard --> Metrics[Metrics chính:<br/>- Total trees planted<br/>- Active users<br/>- Revenue<br/>- Carbon offset<br/>- Affiliate performance]
    
    Metrics --> Export[Export báo cáo]
    Export --> Stakeholder[Gửi cho:<br/>- Board<br/>- Nhà đầu tư<br/>- Đối tác]
    
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

Bạn muốn tôi detail thêm phần nào hoặc vẽ thêm swimlane diagram (phân biệt Frontend/Backend/External Service) không? [code:file]

Sources
