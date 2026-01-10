# Đại Ngàn Xanh - Wireframes

This document contains text-based wireframes for the core application flows, derived from `epics.md`.

## 1. User Acquisition Flow

### 1.1 Package Selection & Quantity
**Screen:** `Package Selection`
**Goal:** Allow users to select the tree package and define quantity.

```
+---------------------------------------------------------------+
|  [< Back]               TRỒNG CÂY NGAY              [Close X] |
+---------------------------------------------------------------+
|                                                               |
|  **CHỌN GÓI TRỒNG CÂY**                                       |
|                                                               |
|  +---------------------------------------------------------+  |
|  |  [ICON] Gói Cá Nhân: Cây Dó Đen 5 Năm Tuổi              |  |
|  |                                                         |  |
|  |  **260,000 VNĐ / cây**                                  |  |
|  |                                                         |  |
|  |  > 40,000đ: Cây giống chất lượng cao                    |  |
|  |  > 194,000đ: Phí chăm sóc 5 năm (nhân công, phân bón)   |  |
|  |  > 26,000đ: Quỹ phát triển cộng đồng                    |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  **SỐ LƯỢNG:**                                                |
|  [  -  ] [  5  ] [  +  ]  (Input field editable)              |
|                                                               |
|  **TẠM TÍNH:**                                                |
|  5 x 260,000đ = **1,300,000 VNĐ**                             |
|                                                               |
|  [================ TIẾP TỤC THANH TOÁN ================]      |
|                                                               |
+---------------------------------------------------------------+
```

### 1.2 Quick Registration / Login
**Screen:** `Authentication`
**Goal:** Frictionless entry for new and returning users.

```
+---------------------------------------------------------------+
|  [< Back]               XÁC THỰC                              |
+---------------------------------------------------------------+
|                                                               |
|  **THÔNG TIN CỦA BẠN**                                        |
|  Để chúng tôi gửi hợp đồng và cập nhật quá trình trồng cây.   |
|                                                               |
|  +---------------------------------------------------------+  |
|  |  Nhập Email hoặc Số điện thoại                          |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  [========= GỬI MÃ OTP =========]                             |
|                                                               |
|  *Đã có tài khoản? Đăng nhập ngay*                            |
|                                                               |
+---------------------------------------------------------------+
| (State: OTP Sent)                                             |
|  **NHẬP MÃ XÁC THỰC**                                         |
|  Mã đã được gửi đến 098****123                                |
|                                                               |
|  [ _ ] [ _ ] [ _ ] - [ _ ] [ _ ] [ _ ]                        |
|  (Gửi lại sau 30s)                                            |
|                                                               |
|  [========= XÁC NHẬN =========]                               |
+---------------------------------------------------------------+
```

### 1.3 Payment Gateway
**Screen:** `Payment`
**Goal:** Secure payment via Banking or Crypto.

```
+---------------------------------------------------------------+
|  [< Back]               THANH TOÁN                            |
+---------------------------------------------------------------+
|  Tổng thanh toán: **1,300,000 VNĐ**                           |
|  Nội dung: **MUA 5 CAY DO DEN**                               |
|                                                               |
|  **PHƯƠNG THỨC THANH TOÁN**                                   |
|  [  BANKING (QR)  ]   [  USDT (CRYPTO)  ]                     |
|                                                               |
|  +---------------------------------------------------------+  |
|  |  [ QR CODE IMAGE ]                                      |  |
|  |                                                         |  |
|  |  Ngân hàng: **MB Bank**                                 |  |
|  |  Số TK: **1234 5678 9999**                              |  |
|  |  Chủ TK: **DAI NGAN XANH JSC**                          |  |
|  |  Nội dung CK: **DH102938**                              |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  [ICON] Lưu ý: Hệ thống sẽ tự động xác nhận sau 1-5 phút.     |
|                                                               |
|  [========= TÔI ĐÃ CHUYỂN KHOẢN =========]                    |
|                                                               |
+---------------------------------------------------------------+
```

### 1.4 Success & Share
**Screen:** `Success`
**Goal:** Instant gratification and viral sharing.

```
+---------------------------------------------------------------+
|                                                               |
|           [ ANIMATION: HẠT MẦM NẢY LỘC / PHÁO HOA ]           |
|                                                               |
|          **CHÚC MỪNG BẠN ĐÃ GIEO MẦM!**                       |
|          Đơn hàng #DH102938 đã được xác nhận.                 |
|                                                               |
|  +---------------------------------------------------------+  |
|  | [SHARE CARD PREVIEW]                                    |  |
|  |                                                         |  |
|  |  NGUYỄN VĂN A                                           |  |
|  |  Vừa Trồng: **5 Cây Dó Đen**                            |  |
|  |  Tại: **Kon Tum, Việt Nam**                             |  |
|  |  Giảm Thải: **150kg CO2**                               |  |
|  |                                                         |  |
|  |            [LOGO ĐẠI NGÀN XANH]                         |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  [========= CHIA SẺ NGAY (Nhận Badge) =========]              |
|                                                               |
|  [ Về Dashboard ]                  [ Mua Thêm ]               |
|                                                               |
+---------------------------------------------------------------+
```

---

## 2. Tree Tracking Flow (Dashboard)

### 2.1 My Garden Dashboard
**Screen:** `/dashboard`
**Goal:** Overview of user's contribution and status of trees.

```
+---------------------------------------------------------------+
|  **ĐẠI NGÀN XANH**                  [Avatar] [Notifications]  |
+---------------------------------------------------------------+
|  **KHU VƯỜN CỦA TÔI**                                         |
|                                                               |
|  [ STAT CARD 1: 5 Cây ]  [ STAT CARD 2: 300 Ngày ]            |
|  [ STAT CARD 3: 150kg CO2 ] [ STAT CARD 4: Rank Bạc ]         |
|                                                               |
|  **DANH SÁCH CÂY**                  [Filter: All/Healthy/...] |
|                                                               |
|  +---------------------+  +---------------------+             |
|  | [IMG: Tree/Seedling]|  | [IMG: Tree/Seedling]|             |
|  | **Cây #1001**       |  | **Cây #1002**       |             |
|  | Status: 🌱 Đang ươm |  | Status: 🌿 Đã trồng |             |
|  | Ngày: 10/01/2026    |  | Ngày: 10/01/2026    |             |
|  | [ Xem Chi Tiết ]    |  | [ Xem Chi Tiết ]    |             |
|  +---------------------+  +---------------------+             |
|                                                               |
|  +---------------------+  +---------------------+             |
|  | [IMG: Placehoder]   |  | [IMG: Placeholder]  |             |
|  | ...                 |  | ...                 |             |
|  +---------------------+  +---------------------+             |
|                                                               |
+---------------------------------------------------------------+
```

### 2.2 Tree Detail View
**Screen:** `/dashboard/tree/[id]`
**Goal:** Detailed tracking of a specific tree.

```
+---------------------------------------------------------------+
|  [< Dashboard]      **CÂY DÓ ĐEN #1001**            [Share]   |
+---------------------------------------------------------------+
|  Status: 🌿 **Đang phát triển tốt**                           |
|  Lô: A-12 | Tọa độ: 14.3, 108.2 | Tuổi: 3 tháng               |
|                                                               |
|  [ TIMELINE ]  [ BẢN ĐỒ ]  [ HÌNH ẢNH ]  [ BÁO CÁO ]          |
|                                                               |
|  **HÀNH TRÌNH PHÁT TRIỂN**                                    |
|                                                               |
|  (Current)                                                    |
|  O **Tháng 3: Cây ra lá non**                                 |
|  |  15/04/2026 - CSKH cập nhật                                |
|  |  [IMG: Ảnh thực tế lá cây]                                 |
|  |                                                            |
|  |                                                            |
|  O **Tháng 1: Xuống giống**                                   |
|  |  15/01/2026 - CSKH cập nhật                                |
|  |  [IMG: Ảnh trồng cây]                                      |
|  |                                                            |
|  O **Ngày đặt: Đã xác nhận**                                  |
|     10/01/2026                                                |
|                                                               |
+---------------------------------------------------------------+
```

---

## 3. Harvest Flow (Year 5)

### 3.1 Harvest Options
**Screen:** `/harvest/options`
**Goal:** Present decision paths for mature trees.

```
+---------------------------------------------------------------+
|  **THU HOẠCH**                                                |
+---------------------------------------------------------------+
|  Chúc mừng! Cây #1001 của bạn đã đến tuổi thu hoạch (5 năm).  |
|  Vui lòng chọn 1 trong 3 phương án dưới đây:                  |
|                                                               |
|  +---------------------------------------------------------+  |
|  |  OPTION 1: BÁN LẠI (Recommended)                        |  |
|  |  Bán lại cây cho Đại Ngàn Xanh theo cam kết.            |  |
|  |  **Giá mua lại: 1,500,000 VNĐ**                         |  |
|  |  [ Chọn Phương Án Này ] -> Ký HĐ & Nhận Tiền            |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  +---------------------------------------------------------+  |
|  |  OPTION 2: TIẾP TỤC CHĂM SÓC                            |  |
|  |  Gia hạn hợp đồng thêm 2 năm để tạo Trầm hương.         |  |
|  |  **Phí gia hạn: 500,000 VNĐ/năm**                       |  |
|  |  [ Chọn Phương Án Này ] -> Thanh Toán                   |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  +---------------------------------------------------------+  |
|  |  OPTION 3: NHẬN SẢN PHẨM                                |  |
|  |  Quy đổi cây thành các sản phẩm trầm hương.             |  |
|  |  - Tinh dầu (10ml)                                      |  |
|  |  - Vòng tay trầm hương                                  |  |
|  |  [ Chọn Phương Án Này ] -> Nhập Địa Chỉ                 |  |
|  +---------------------------------------------------------+  |
|                                                               |
+---------------------------------------------------------------+
```

### 2.3 Quarterly Report View
**Screen:** `/dashboard/tree/[id]/report/[quarter]`
**Goal:** Transparent progress update from the field.

```
+---------------------------------------------------------------+
|  [< Return]      **BÁO CÁO QUÝ 1/2026**            [Download] |
+---------------------------------------------------------------+
|  **TỔNG QUAN**                                                |
|  Cây #1001 - Lô A-12                                          |
|  Người chăm sóc: Anh Y-H'Mok (Mã NV: FS-09)                   |
|  Ngày kiểm tra: 15/04/2026                                    |
|                                                               |
|  **SINH TRƯỞNG**                                              |
|  [ STATUS: TỐT ]                                              |
|  - Chiều cao: 45cm (+10cm so với Quý trước)                   |
|  - Đường kính gốc: 1.2cm                                      |
|  - Tình trạng lá: Xanh tốt, không sâu bệnh                    |
|                                                               |
|  **HÌNH ẢNH & VIDEO THỰC TẾ**                                 |
|  +---------------------+  +---------------------+             |
|  | [VIDEO PLAY]        |  | [IMG: Góc chụp 1]   |             |
|  | Quay toàn cảnh lô   |  | Cận cảnh lá         |             |
|  +---------------------+  +---------------------+             |
|                                                               |
|  **DỮ LIỆU GIÁM SÁT**                                         |
|  [MAP PREVIEW]                                                |
|  GPS: 14.352, 108.211 (Sai số < 3m)                           |
|  CO2 Hấp thụ ước tính: 5.2 kg                                 |
|                                                               |
+---------------------------------------------------------------+
```

---

## 4. Admin & Operations Flow

### 4.1 Admin Dashboard
**Screen:** `/admin`
**Goal:** High-level operational oversight.

```
+---------------------------------------------------------------+
|  [MENU] **ADMIN DASHBOARD**                        [Admin User] |
+---------------------------------------------------------------+
|  **METRICS QUA NHANH**                                        |
|  [ Total Trees: 138,592 ] [ Active Users: 12,500 ]            |
|  [ Revenue: 5.2B ]        [ CO2 Offset: 450 Tons ]            |
|                                                               |
|  **ACTIONS CẦN XỬ LÝ**                                        |
|  - 25 Đơn hàng mới chờ duyệt                                  |
|  - 150 Báo cáo quý cần review                                 |
|  - 5 Cây báo bệnh cần chỉ đạo xử lý                           |
|                                                               |
|  **REVENUE CHART**                                            |
|  [................GRAPHS................]                     |
|                                                               |
+---------------------------------------------------------------+
```

### 4.2 Order Management
**Screen:** `/admin/orders`
**Goal:** Process new purchases and assign inventory.

```
+---------------------------------------------------------------+
|  **QUẢN LÝ ĐƠN HÀNG**            [Filter: New/Paid/Assigned]  |
+---------------------------------------------------------------+
|  DH#102939 | Nguyen Van B | 10 Cây | 2,600,000đ | [VERIFY]    |
|  DH#102938 | Nguyen Van A | 5 Cây  | 1,300,000đ | [ASSIGN]    |
|  ...                                                          |
|                                                               |
|  ---------------- (Modal: Assign Lot) ----------------        |
|  Đơn hàng: **DH#102938 - 5 Cây**                              |
|  Chọn Lô Trồng:                                               |
|  [ Dropdown: Lô A-12 (Còn trống 50 chỗ) ]                     |
|                                                               |
|  Gán vị trí cụ thể:                                           |
|  [✔] Auto-assign next available slots (A-12-01 to A-12-05)    |
|                                                               |
|  [ CANCEL ]              [ CONFIRM ASSIGNMENT ]               |
|  -----------------------------------------------------        |
+---------------------------------------------------------------+
```

### 4.3 Field Operations (Mobile View)
**Screen:** `/admin/field-ops`
**Goal:** Tool for farmers/staff to update tree status from the field.

```
+---------------------------------------------------------------+
|  [<] **FIELD REPORT**                                         |
+---------------------------------------------------------------+
|  Khu vực: **Lô A-12**                                         |
|  Nhiệm vụ: **Kiểm tra Quý 1/2026**                            |
|  Tiến độ: 5/50 cây                                            |
|                                                               |
|  **CẬP NHẬT CÂY #1006**                                       |
|  [ Scan QR Code trên thân cây ]                               |
|                                                               |
|  **HÌNH ẢNH / VIDEO**                                         |
|  [ (+) UPLOAD PHOTO ] (Auto-tag GPS)                          |
|  [ (+) UPLOAD VIDEO ]                                         |
|                                                               |
|  **TÌNH TRẠNG**                                               |
|  (O) Sống khỏe                                                |
|  ( ) Sâu bệnh -> [Nhập phương án xử lý]                       |
|  ( ) Chết -> [Yêu cầu trồng lại]                              |
|                                                               |
|  **CHỈ SỐ**                                                   |
|  Chiều cao (cm): [   ]                                        |
|  ĐK Gốc (cm):    [   ]                                        |
|                                                               |
|  [========= LƯU BÁO CÁO =========]                            |
+---------------------------------------------------------------+
```
