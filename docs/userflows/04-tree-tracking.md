# 04 — Tree Tracking / My Garden (CRM User)
> Cập nhật: 2026-04-07

## Routes

`/crm/my-garden` → `/crm/my-garden/[orderId]` → `/crm/my-garden/[orderId]/harvest`

## Mô tả

User theo dõi vườn cây sau khi mua thành công. Dashboard hiển thị các đơn hàng với status `paid`, `assigned`, `completed`. Chi tiết mỗi đơn gồm metrics tăng trưởng, bản đồ GPS, camera farm, timeline 9 mốc, ảnh và báo cáo. Khi cây đủ 120 tháng, user chọn 1 trong 3 phương án thu hoạch.

## Flowchart (Mermaid)

```mermaid
flowchart TD
    Login([Đã đăng nhập]) --> Garden[Vườn của tôi\nRoute /crm/my-garden\nHiển thị orders: paid / assigned / completed]

    Garden --> Summary[Tổng quan:\nTổng cây - Tổng CO2 - Tổng chi phí]
    Garden --> PackageGrid[Lưới gói cây\nMỗi gói: mã đơn + số cây + trạng thái]

    PackageGrid --> PackageDetail[Chi tiết gói\nRoute /crm/my-garden/orderId]

    PackageDetail --> GrowthMetrics[Chỉ số tăng trưởng\nCO2 hấp thu + Tuổi tháng\nTiến độ đến thu hoạch 120 tháng]
    PackageDetail --> MapSection[Bản đồ GPS\nNếu đã gán lô cây]
    PackageDetail --> CameraSection[Farm Camera\nStream trực tiếp]
    PackageDetail --> TreeList[Danh sách cây\nMã cây từng cây]
    PackageDetail --> PhotoGallery[Thư viện ảnh\nẢnh từ lô cây]
    PackageDetail --> Timeline[Tree Timeline\nMốc thời gian trồng cây\nCập nhật hàng quý\n9 giai đoạn]
    PackageDetail --> Reports[Báo cáo quý\nDownload PDF]

    Timeline --> MonthCheck{Đủ 120 tháng?}
    MonthCheck -->|Chưa| Wait[Chờ cập nhật tiếp theo\nNhận email báo cáo quý]
    MonthCheck -->|Rồi| HarvestNotif[Nhận thông báo harvest_ready\nIn-app + Email]
    HarvestNotif --> Harvest[Thu hoạch\nRoute /crm/my-garden/orderId/harvest]

    Harvest --> HarvestChoice{Chọn phương án}
    HarvestChoice -->|Bán lại| SellBack[Bán lại cho Đại Ngàn Xanh\nPOST process-sellback EF\nGiá: giá_gốc × 1.10^số_năm\nNhập STK + chữ ký số\nTạo harvest_transactions\nstatus: pending_approval\ntree status: sold_back\nEmail xác nhận cho user]
    HarvestChoice -->|Giữ cây| KeepGrow[Tiếp tục chăm sóc\nKý hợp đồng gia hạn]
    HarvestChoice -->|Nhận sản phẩm| GetProduct[Nhận trầm hương\nTinh dầu / Gỗ thô]
```

### Harvest Ready Notification (Scheduled)

```mermaid
flowchart TD
    Cron([Scheduled Job\ncheck-harvest-ready EF]) --> QueryTrees[Query trees\nPROD: age >= 120 tháng\nDEV: age >= 3 phút]
    QueryTrees --> CheckNotif{Đã gửi thông báo\nharvest_ready?}
    CheckNotif -->|Rồi| Skip[Bỏ qua cây này\nIdempotent]
    CheckNotif -->|Chưa| InsertNotif[Insert notifications\ntype: harvest_ready\ndata: treeId, treeCode, ageMonths, co2]
    InsertNotif --> SendEmail[Gửi email cho user\nChủ đề: Cây sẵn sàng thu hoạch\n3 lựa chọn: bán lại / giữ / nhận SP]
    SendEmail --> LinkHarvest[Link đến\n/crm/my-garden/orderId/harvest]
```

## Ghi chú kỹ thuật

**Status hiển thị:** My Garden hiển thị các đơn có status `paid`, `assigned`, `completed`. Không hiển thị `pending` (chưa thanh toán) và không có status `verified`.

**Timeline 9 giai đoạn:** Các mốc tăng trưởng cập nhật hàng quý, hiển thị dạng timeline với popup chi tiết từng giai đoạn.

**Map section:** Chỉ hiển thị khi đơn đã được admin gán lô cây (có GPS coordinates).

**Sell-back pricing:** Giá bán lại = `originalPrice × (1.10)^years` — lãi kép 10%/năm.

**harvest_transactions:** Record tạo với status `pending_approval` khi user chọn bán lại. Admin duyệt và xử lý thanh toán trong 30 ngày làm việc.

**generate-certificate EF:** Edge Function tạo certificate PDF riêng (khác `generate-contract`). Dùng cho harvest certificate — chưa tích hợp vào main flow.

**Quarterly reports:** Admin upload ảnh quý → gửi email báo cáo cho user qua `send-quarterly-update`.
