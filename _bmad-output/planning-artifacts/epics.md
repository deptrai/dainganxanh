---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories"]
status: approved
inputDocuments:
  - docs/prd.md
  - docs/userflow.md
relatedDocuments:
  - _bmad-output/planning-artifacts/architecture.md
approvedDate: 2026-01-10
---

# Đại Ngàn Xanh - Epic Breakdown

## Overview

Tài liệu này cung cấp phân tích chi tiết Epics và Stories cho dự án Đại Ngàn Xanh, phân rã requirements từ PRD và User Flow thành các stories có thể implement được.

**📐 Architecture Reference:** Xem `architecture.md` để hiểu stack kỹ thuật (Next.js 16.1.1 + Supabase) và route structure (`/crm/*`).

## Requirements Inventory

### Functional Requirements

| ID | Mô tả | Priority | Epic |
|----|-------|----------|------|
| FR-01 | Landing Page with Video & Counter | P0 | Epic 1 |
| FR-02 | Package Selection | P0 | Epic 1 |
| FR-03 | Quantity Input | P0 | Epic 1 |
| FR-04 | Quick Registration (OTP) | P0 | Epic 1 |
| FR-04B | Returning User Login | P0 | Epic 1 |
| FR-05 | Payment Gateway Integration (Banking + USDT) | P0 | Epic 1 |
| FR-06 | Success Animation & Share Card | P0 | Epic 1 |
| FR-07 | Email Confirmation with Contract | P0 | Epic 1 |
| FR-08 | My Garden Dashboard | P0 | Epic 2 |
| FR-09 | Tree Detail View | P1 | Epic 2 |
| FR-10 | Quarterly Update System | P1 | Epic 2 |
| FR-11 | Timeline with Placeholder/Real Photos | P1 | Epic 2 |
| FR-12 | Year 5 Harvest Notification | P2 | Epic 2 |
| FR-12B | Harvest Option - Sell Back | P2 | Epic 2 |
| FR-12C | Harvest Option - Keep Growing | P2 | Epic 2 |
| FR-12D | Harvest Option - Receive Product | P2 | Epic 2 |
| FR-13 | Order Management Dashboard | P0 | Epic 3 |
| FR-14 | Tree Lot Assignment | P0 | Epic 3 |
| FR-15 | Contract Printing System | P1 | Epic 3 |
| FR-16 | Field Operations Checklist | P1 | Epic 3 |
| FR-17 | Photo Upload with GPS Tagging | P1 | Epic 3 |
| FR-18 | Tree Health Status Update | P1 | Epic 3 |
| FR-19 | Analytics & Reporting Dashboard | P1 | Epic 3 |
| FR-46 | Admin User Impersonation (Vào Tài Khoản User) | P1 | Epic 3 |
| FR-20 | Referral Link Generation | P2 | Epic 4 |
| FR-21 | Social Share Pre-populated Text | P1 | Epic 4 |

### Non-Functional Requirements

| ID | Mô tả | Category |
|----|-------|----------|
| NFR-01 | Landing page < 3s, Dashboard < 2s, 1000 concurrent users | Performance |
| NFR-02 | HTTPS, PCI DSS, OTP 5min expire, bcrypt, RBAC, rate limiting | Security |
| NFR-03 | Horizontal scaling, S3+CDN, auto-scaling 2-10 instances | Scalability |
| NFR-04 | 99.5% uptime, daily backup 30-day, webhook retry, 95% email < 5min | Reliability |
| NFR-05 | Mobile-responsive, Chrome/Safari/Edge, WCAG 2.1 AA, VI/EN | Usability |
| NFR-06 | GDPR-like privacy, Vietnam cyber law, e-signature legal | Compliance |
| NFR-07 | ELK logging, UptimeRobot, Sentry, GA4 + Mixpanel | Observability |

### Additional Requirements (từ User Flow)

- **Login Flow cho Returning Users**: User đã có tài khoản có thể đăng nhập nhanh để mua thêm cây (FR-04B)
- **3 Harvest Options rõ ràng**: Sell Back, Keep Growing, Receive Product (FR-12B/C/D)
- **Conversion Funnel Tracking**: Landing → Sign up > 15%, Purchase → Share > 30%
- **Instant Gratification**: Animation + Share Card ngay sau thanh toán
- **Quarterly Engagement**: Push notification + email với ảnh thực tế

### FR Coverage Map

| Epic | FRs Covered | Priority Mix |
|------|-------------|--------------|
| Epic 1: User Acquisition | FR-01 → FR-07, FR-04B | 8 P0 |
| Epic 2: Tree Tracking | FR-08 → FR-12D | 1 P0, 3 P1, 4 P2 |
| Epic 3: Admin Operations | FR-13 → FR-19, FR-46 | 2 P0, 6 P1 |
| Epic 4: Viral & Growth | FR-20, FR-21 | 1 P1, 1 P2 |

## Epic List

| # | Epic Name | Goal | Stories | Priority |
|---|-----------|------|---------|----------|
| 1 | User Acquisition & Onboarding | Hoàn thành funnel từ Landing → Payment → Confirmation | 8 | P0 - MVP Core |
| 2 | Tree Tracking & Dashboard | User theo dõi cây và nhận updates | 8 | P0/P1 - MVP Core |
| 3 | Admin Operations | Quản lý đơn hàng, trồng cây, báo cáo | 9 | P0/P1 - MVP Core |
| 4 | Viral & Growth Features | Tăng viral coefficient qua referral & share | 2 | P1/P2 - Growth |

---

## Epic 1: User Acquisition & Onboarding

**Goal:** Biến visitor thành buyer - từ Landing Page đến thanh toán thành công với engagement cao (share, email confirmation)

**Success Metrics:**
- Conversion rate: Landing → Purchase ≥ 10%
- Page load time < 3 seconds
- Share rate after purchase > 30%

### Story 1.1: Landing Page với Hero Video & Counter

**As a** visitor,
**I want to** xem trailer video và counter động "X/1,000,000 cây",
**So that** tôi hiểu được sứ mệnh dự án và có động lực tham gia.

**Acceptance Criteria:**

**Given** tôi truy cập trang chủ
**When** trang được load
**Then** video hero autoplay (muted) với controls
**And** counter hiển thị "X/1,000,000 cây đã trồng" cập nhật real-time
**And** page load time < 3 giây
**And** CTA "Trồng cây ngay" nổi bật

**Story Points:** 5
**Dependencies:** CDN setup, video hosting
**FRs:** FR-01

---

### Story 1.2: Package Selection Screen

**As a** potential buyer,
**I want to** xem rõ ràng giá 1 gói cây 260,000đ,
**So that** tôi biết chính xác mình đang trả cho cái gì.

**Acceptance Criteria:**

**Given** tôi click CTA "Trồng cây ngay"
**When** màn hình package hiển thị
**Then** hiển thị "Gói Cá nhân: 260,000 VNĐ/cây"
**And** có breakdown: 40k giống + 194k chăm sóc + 26k quỹ
**And** button "Tùy chỉnh số lượng" enabled

**Story Points:** 3
**Dependencies:** None
**FRs:** FR-02

---

### Story 1.3: Quantity Input & Price Calculator

**As a** buyer,
**I want to** nhập số lượng cây muốn trồng,
**So that** tôi có thể mua nhiều cây cùng lúc.

**Acceptance Criteria:**

**Given** tôi ở màn hình tùy chỉnh
**When** tôi nhập số lượng từ 1-1000
**Then** tổng tiền tự động tính: quantity × 260,000
**And** hiển thị: "Tổng: [quantity] × 260,000 = [total] VNĐ"
**And** nếu nhập invalid (0, negative, >1000) → hiển thị error message

**Story Points:** 2
**Dependencies:** FR-02
**FRs:** FR-03

---

### Story 1.4: Quick Registration với OTP

**As a** new user,
**I want to** đăng ký nhanh bằng SĐT/Email + OTP,
**So that** tôi hoàn thành mua hàng mà không cần form phức tạp.

**Acceptance Criteria:**

**Given** tôi ở checkout screen và chưa có tài khoản
**When** tôi nhập SĐT/Email và click "Gửi OTP"
**Then** nhận OTP 6 chữ số trong 30 giây
**When** tôi nhập đúng OTP
**Then** tài khoản được tạo tự động
**And** blockchain wallet được generate cho tôi
**And** chuyển sang màn hình thanh toán

**Story Points:** 8
**Dependencies:** Twilio/Firebase, Blockchain wallet
**FRs:** FR-04

---

### Story 1.5: Returning User Login

**As a** returning user,
**I want to** đăng nhập nhanh để mua thêm cây,
**So that** tôi không cần tạo tài khoản mới.

**Acceptance Criteria:**

**Given** tôi ở checkout screen và đã có tài khoản
**When** tôi chọn "Đã có tài khoản"
**Then** hiển thị form login (Email/SĐT + OTP hoặc Password)
**When** tôi xác thực thành công
**Then** session được restore
**And** thông tin checkout được pre-fill
**And** có thể xem lịch sử mua hàng nếu cần

**Story Points:** 5
**Dependencies:** FR-04, Session management
**FRs:** FR-04B

---

### Story 1.6: Payment Gateway (Banking Only via Casso)

**As a** buyer,
**I want to** thanh toán qua chuyển khoản ngân hàng MB Bank,
**So that** đơn hàng được xác nhận tự động.

**Acceptance Criteria:**

**Given** tôi ở màn hình thanh toán
**When** trang hiển thị
**Then** hiển thị QR code VietQR với thông tin MB Bank
**And** nội dung CK: [order-code]
**When** hoàn thành chuyển khoản
**Then** Casso webhook xác nhận trong 5 phút
**And** order status = "Đã thanh toán"
**And** UI polling hiện trạng thái thành công

**Story Points:** 13
**Dependencies:** Casso API, MB Bank
**FRs:** FR-05, FR-38
**Note:** USDT/MoMo đã loại bỏ (refactored 2026-03-28)

---

### Story 1.7: Success Animation & Share Card

**As a** buyer vừa thanh toán xong,
**I want to** thấy confirmation ngay lập tức và share thành tựu,
**So that** tôi cảm thấy vui và có thể inspire bạn bè.

**Acceptance Criteria:**

**Given** thanh toán thành công
**When** success screen load
**Then** hiển thị animation "🎉 Cây đang được gieo mầm"
**And** auto-generate share card với: tên user, số cây, CO2 impact
**And** button "Chia sẻ" nổi bật
**When** click share
**Then** mở share dialog với text + image + ref link đã chuẩn bị sẵn

**Story Points:** 8
**Dependencies:** Canvas API, Web Share API
**FRs:** FR-06

---

### Story 1.8: Email Confirmation với Contract PDF

**As a** buyer,
**I want to** nhận email với hợp đồng PDF và mã cây,
**So that** tôi có tài liệu chính thức.

**Acceptance Criteria:**

**Given** thanh toán confirmed
**When** hệ thống xử lý đơn hàng
**Then** email gửi trong 5 phút đến email đã đăng ký
**And** email chứa: PDF contract (signed digitally), tree code TREE-2026-XXXXX, link dashboard
**And** email mobile-responsive

**Story Points:** 5
**Dependencies:** SendGrid, PDF generation
**FRs:** FR-07

---

## Epic 2: Tree Tracking & Dashboard

**Goal:** User theo dõi cây của mình, nhận updates định kỳ, và có options rõ ràng khi đến năm thu hoạch.

**Success Metrics:**
- User retention: 60% quay lại sau 1 năm
- Dashboard load time < 2 giây
- Quarterly engagement rate > 80%

### Story 2.1: My Garden Dashboard (Package-Based)

**As a** tree owner,
**I want to** xem tất cả packages (lô cây) của mình trong một dashboard,
**So that** tôi dễ dàng theo dõi tiến trình.

**Acceptance Criteria:**

**Given** tôi đã đăng nhập
**When** navigate đến /dashboard
**Then** hiển thị grid tất cả packages (orders) của tôi
**And** mỗi package card có: ảnh (placeholder nếu < 9 tháng), quantity badge, status, ngày trồng, CO2 total
**And** có thể sort theo date hoặc status

**Story Points:** 5
**Dependencies:** Authentication
**FRs:** FR-08

---

### Story 2.2: Package Detail View với GPS

**As a** tree owner,
**I want to** click vào package để xem chi tiết lô cây,
**So that** tôi biết vị trí và lịch sử phát triển của cả lô.

**Acceptance Criteria:**

**Given** tôi ở dashboard
**When** click vào package card
**Then** hiển thị detail page với: timeline milestones, ảnh mới nhất của lô, GPS location của lot, growth metrics (CO2 total, age)
**And** section "Quarterly Reports" với download links

**Story Points:** 8
**Dependencies:** Google Maps API
**FRs:** FR-09

---

### Story 2.3: Quarterly Update Notifications

**As a** tree owner,
**I want to** nhận thông báo khi có ảnh mới,
**So that** tôi luôn engaged với cây của mình.

**Acceptance Criteria:**

**Given** admin upload ảnh cho lô cây của tôi
**When** ảnh được tag đến cây của tôi
**Then** nhận push notification "Cây của bạn có ảnh mới!"
**And** nhận email với embedded photos
**When** click notification
**Then** land on tree detail page với ảnh mới

**Story Points:** 8
**Dependencies:** FCM, Admin upload
**FRs:** FR-10

---

### Story 2.4: Timeline với Placeholder/Real Photos

**As a** tree owner với cây còn nhỏ,
**I want to** xem visual timeline ngay cả khi chưa có ảnh thực,
**So that** tôi hiểu process và kiên nhẫn chờ đợi.

**Acceptance Criteria:**

**Given** cây < 9 tháng tuổi
**When** xem tree detail
**Then** timeline hiển thị: Month 0-3 placeholder "Đang ươm giống", Month 4 "Chuẩn bị trồng"
**Given** cây ≥ 9 tháng
**Then** timeline hiển thị actual photos từ field

**Story Points:** 3
**Dependencies:** Photo system
**FRs:** FR-11

---

### Story 2.5: Year 5 Harvest Notification

**As a** long-term tree owner,
**I want to** được thông báo khi cây sẵn sàng thu hoạch,
**So that** tôi có thể quyết định bước tiếp theo.

**Acceptance Criteria:**

**Given** cây 60 tháng tuổi
**When** monthly cron job chạy
**Then** nhận email "Cây của bạn sẵn sàng thu hoạch"
**And** email chứa link đến harvest options page

**Story Points:** 3
**Dependencies:** Cron job
**FRs:** FR-12

---

### Story 2.6: Harvest Option - Sell Back

**As a** tree owner đến năm 5,
**I want to** bán lại cây cho công ty,
**So that** tôi nhận được giá cam kết.

**Acceptance Criteria:**

**Given** tôi ở harvest options page
**When** chọn "Bán lại cho Đại Ngàn Xanh"
**Then** hiển thị buyback price theo hợp đồng ban đầu
**And** show e-contract với điều khoản mua lại
**When** tôi sign contract
**Then** transfer funds vào ví trong 30 ngày
**And** tree status = "Đã thu hoạch"

**Story Points:** 8
**Dependencies:** E-signature, Wallet
**FRs:** FR-12B

---

### Story 2.7: Harvest Option - Keep Growing

**As a** tree owner đến năm 5,
**I want to** giữ cây tiếp tục chăm sóc,
**So that** tăng giá trị dài hạn.

**Acceptance Criteria:**

**Given** tôi ở harvest options page
**When** chọn "Giữ cây tiếp tục chăm sóc"
**Then** hiển thị extended care contract (phí hàng năm)
**And** projected value increase timeline
**When** confirm
**Then** extend contract + update status
**And** continue quarterly updates

**Story Points:** 5
**Dependencies:** Extended contract
**FRs:** FR-12C

---

### Story 2.8: Harvest Option - Receive Product

**As a** tree owner đến năm 5,
**I want to** nhận sản phẩm trầm hương từ cây,
**So that** tôi có sản phẩm thực từ investment.

**Acceptance Criteria:**

**Given** tôi ở harvest options page
**When** chọn "Nhận sản phẩm trầm hương"
**Then** hiển thị available options (tinh dầu, gỗ thô, etc.)
**And** form nhập thông tin giao hàng
**When** confirm order
**Then** tạo product fulfillment ticket
**And** gửi tracking info when shipped

**Story Points:** 8
**Dependencies:** Fulfillment, Shipping
**FRs:** FR-12D

---

### Story 2.9: Farm Camera Live Stream _(2026-03-28)_

**As a** tree owner,
**I want to** xem live camera stream từ vườn trồng cây,
**So that** tôi thấy cây của mình đang được chăm sóc.

**Acceptance Criteria:**

**Given** tôi ở trang chi tiết package
**When** camera stream available
**Then** hiển thị iframe live video (go2rtc MSE mode)
**And** indicator xanh "Live"
**When** stream offline
**Then** hiển thị trạng thái "Offline"
**And** auto-check status mỗi 30 giây

**Story Points:** 5
**Status:** implemented (2026-03-28)
**Component:** `src/components/crm/FarmCamera.tsx`
**API:** `src/app/api/camera/status/route.ts`
**Dependencies:** go2rtc server at `stream.dainganxanh.com.vn`
**FRs:** FR-34

---

## Epic 3: Admin Operations

**Goal:** Team operations có tools đầy đủ để quản lý đơn hàng, trồng cây, và báo cáo cho stakeholders.

**Success Metrics:**
- Order processing time < 1 giờ
- Tree tracking accuracy > 99%
- Quarterly report delivery 100%

### Story 3.1: Order Management Dashboard

**As an** admin,
**I want to** xác minh đơn hàng mới nhanh chóng,
**So that** tôi có thể tiến hành gán cây.

**Acceptance Criteria:**

**Given** tôi đăng nhập với quyền admin
**When** mở Order Management
**Then** hiển thị list đơn hàng filter "Pending Verification"
**And** mỗi order có: ID, User, Quantity, Payment Method, Timestamp
**When** click "Xác minh"
**Then** status = "Verified"
**And** toast confirmation

**Story Points:** 5
**Dependencies:** Admin auth, RBAC
**FRs:** FR-13

---

### Story 3.2: Tree Lot Assignment

**As an** admin,
**I want to** gán verified orders vào lô cây cụ thể,
**So that** chúng tôi track được vị trí thực.

**Acceptance Criteria:**

**Given** có verified orders
**When** click "Gán lô cây"
**Then** hiển thị list available lots với: tên lô, capacity X/Y
**When** select lot và confirm
**Then** generate tree codes TREE-2026-XXXXX
**And** assign to lot
**And** status = "Assigned"
**And** email notification cho user

**Story Points:** 8
**Dependencies:** Lot management
**FRs:** FR-14

---

### Story 3.3: Contract Printing System

**As an** admin,
**I want to** in hoặc gửi hợp đồng điện tử,
**So that** user có tài liệu pháp lý.

**Acceptance Criteria:**

**Given** assigned order
**When** chọn print/digital
**Then** generate PDF contract với user info
**If** print → mark for postal service
**If** digital → auto-send via email

**Story Points:** 5
**Dependencies:** PDF template, postal
**FRs:** FR-15

---

### Story 3.4: Field Operations Checklist

**As an** admin,
**I want to** theo dõi checklist trồng cây theo quý,
**So that** đảm bảo quy trình được thực hiện đúng.

**Acceptance Criteria:**

**Given** quarterly period
**When** mở checklist
**Then** hiển thị tasks: visit garden, take photos, update status
**And** mark complete/incomplete
**And** auto-reminder 7 ngày trước due date

**Story Points:** 5
**Dependencies:** Task management
**FRs:** FR-16

---

### Story 3.5: Photo Upload với GPS Tagging

**As a** field operator,
**I want to** upload ảnh từ phone trực tiếp,
**So that** tree owners nhận updates real-time.

**Acceptance Criteria:**

**Given** tôi ở field với mobile device
**When** mở Admin và click "Upload Photo"
**Then** select multiple photos từ camera roll
**When** upload
**Then** extract GPS từ EXIF
**And** auto-tag đến trees trong lô
**And** compress < 2MB
**And** notify users

**Story Points:** 13
**Dependencies:** Mobile responsive, EXIF
**FRs:** FR-17

---

### Story 3.6: Tree Health Status Update

**As a** field operator,
**I want to** mark cây là healthy/sick/dead,
**So that** có action phù hợp.

**Acceptance Criteria:**

**Given** reviewing tree lot
**When** update status = "Bệnh"
**Then** log treatment details
**When** status = "Chết"
**Then** auto-create task "Trồng cây thay thế"
**And** notify user với explanation
**When** status = "Khỏe"
**Then** no additional action

**Story Points:** 5
**Dependencies:** Notification, Tasks
**FRs:** FR-18

---

### Story 3.7: Analytics & Reporting Dashboard

**As an** admin,
**I want to** xem project metrics tổng,
**So that** báo cáo cho stakeholders.

**Acceptance Criteria:**

**Given** ở Analytics page
**When** load
**Then** KPI cards: Total trees, Active users, Revenue, Carbon offset
**And** charts: Tree planting over time, Conversion funnel
**And** export PDF/Excel

**Story Points:** 13
**Dependencies:** Analytics backend
**FRs:** FR-19

---

### Story 3.8: Admin User Management _(2026-03-28)_

**As an** admin,
**I want to** xem và quản lý tất cả user accounts,
**So that** tôi có thể phân quyền, theo dõi hoạt động, và gán mã giới thiệu cho user.

**Acceptance Criteria:**

**Given** admin truy cập `/crm/admin/users`
**When** trang load
**Then** hiển thị danh sách tất cả user với email, tên, SĐT, mã giới thiệu, số đơn hàng, ngày tạo, role
**And** search theo email/tên/SĐT
**And** filter theo role (user/admin/super_admin)
**When** admin đổi role qua dropdown → confirm modal
**Then** cập nhật role trong database
**When** admin click "🤝 Gán mã" → nhập mã giới thiệu
**Then** gán mã và tính hoa hồng hồi tố cho đơn cũ

**Story Points:** 8
**Status:** implemented (2026-03-28)
**Dependencies:** RBAC, Supabase service role
**FRs:** FR-13 (extended)

---

### Story 3.9: Admin User Impersonation (Vào Tài Khoản User) _(2026-03-29)_

**As an** admin,
**I want to** xem tài khoản của bất kỳ user nào từ góc nhìn của họ,
**So that** tôi có thể hỗ trợ kỹ thuật và kiểm tra trải nghiệm user mà không cần user mô tả.

**Acceptance Criteria:**

**Given** admin ở `/crm/admin/users`
**When** click "👁️ Vào tài khoản" của user X
**Then** set cookie `admin_impersonate` (httpOnly, 8h) và redirect đến `/crm/my-garden`
**And** banner vàng hiện: "Đang xem tài khoản: **[tên user]**"

**Given** admin đang impersonating
**When** truy cập `/crm/my-garden`, `/crm/my-garden/[orderId]`, `/crm/referrals`
**Then** hiển thị data của user đang được xem (không phải của admin)

**Given** admin click "Thoát ←"
**Then** xóa cookie và redirect về `/crm/admin/users`

**And** Admin không thể vào tài khoản của chính mình
**And** Server re-verify admin role mỗi request

**Story Points:** 5
**Status:** implemented (2026-03-29)
**Dependencies:** Story 3.8
**FRs:** FR-46

---

## Epic 4: Viral & Growth Features

**Goal:** Tăng viral coefficient thông qua referral và social share.

**Success Metrics:**
- Viral coefficient > 30%
- Share rate > 30%

### Story 4.1: Referral Link Generation

**As a** logged-in user,
**I want to** tạo link giới thiệu,
**So that** nhận hoa hồng khi bạn bè mua.

**Acceptance Criteria:**

**Given** đăng nhập
**When** click "Giới thiệu bạn bè"
**Then** generate unique ref code: dainganxanh.com.vn/ref/{code}
**And** hiển thị trong dashboard với QR code

**Story Points:** 5
**Dependencies:** Referral tracking
**FRs:** FR-20

---

### Story 4.2: Social Share Pre-populated

**As a** user on success screen,
**I want to** 1-click share với text/image sẵn,
**So that** share nhanh chóng và đẹp mắt.

**Acceptance Criteria:**

**Given** ở success screen
**When** click "Chia sẻ"
**Then** mở share dialog với:
- Text: "Tôi vừa trồng X cây cho Mẹ Thiên Nhiên 🌳"
- Image: Generated share card
- Link: Landing + ref code

**Story Points:** 3
**Dependencies:** Web Share API, OG tags
**FRs:** FR-21

---

### Story 4.3: Referral Commission Withdrawal

**As a** user with accumulated commission,
**I want to** rút hoa hồng về tài khoản ngân hàng,
**So that** tôi nhận được tiền thực tế từ việc giới thiệu.

**Acceptance Criteria:**

**Given** tôi có hoa hồng chưa rút
**When** tôi nhập thông tin ngân hàng và submit yêu cầu rút
**Then** tạo withdrawal request với trạng thái pending
**And** admin nhận thông báo để xử lý

**Technical Note:** Commission rate = 10% (`COMMISSION_RATE = 0.10` in `src/actions/referrals.ts`). Hardcoded, chưa có admin config.

**Story Points:** 8
**Dependencies:** Story 4.1
**FRs:** FR-22, FR-37
**Status:** implemented (2026-01-14, commission rate updated to 10% on 2026-03-28)

---

### Story 4.4: Admin Settings — Profile

**As a** user,
**I want to** cập nhật thông tin cá nhân (tên, SĐT, địa chỉ),
**So that** thông tin trên hợp đồng chính xác.

**Story Points:** 3
**Status:** implemented (2026-01-14)

---

### Story 4.5: Admin Settings — System

**As an** admin,
**I want to** cấu hình các thông số hệ thống (giá cây, tỷ lệ hoa hồng...),
**So that** không cần deploy lại khi thay đổi config.

**Story Points:** 5
**Status:** implemented (2026-01-14)

---

### Story 4.6: Referral Code Improvements _(2026-03-28)_

**As a** user,
**I want to** có mã giới thiệu dễ nhớ dựa trên tên tôi,
**So that** tôi có thể chia sẻ mã mà không cần nhớ dãy số ngẫu nhiên.

**Acceptance Criteria:**

**Given** user mới đăng ký
**When** account được tạo
**Then** referral code = tên không dấu viết liền (VD: "Nguyễn Văn A" → `nguyenvana`)
**And** nếu trùng → thêm số suffix (`nguyenvana2`)

**Given** user đăng ký không có referral link
**When** hoàn thành đăng ký
**Then** mã `DNG895075` được dùng làm referrer mặc định
**And** ô nhập mã giới thiệu hiển thị trên trang đăng ký (optional)

**Story Points:** 3
**Status:** implemented (2026-03-28)
**Migration:** `20260328_name_based_referral_code.sql`

---

## Epic 5: Payment Integration (Casso)

**Goal:** Tự động xác nhận thanh toán qua Casso webhook, giảm thời gian xử lý thủ công.

**Added:** 2026-01-14 → 2026-03-28

**Success Metrics:**
- Auto-verify ≥ 95% transactions trong 5 phút
- 0 duplicate orders

**Technical Notes (Updated 2026-03-28):**
- Webhook signature: HMAC-SHA512 với sorted JSON keys (Casso V2)
- Header: `x-casso-signature: t=<timestamp>,v1=<hmac>`
- Amount tolerance: ±1,000 VND
- Payment method: Banking only (USDT/MoMo removed)

### Story 5.1: Pre-create Pending Order tại Checkout

**As a** buyer,
**I want to** đơn hàng được tạo ngay khi tôi bắt đầu checkout,
**So that** hệ thống có thể match payment với đúng đơn hàng của tôi.

**Acceptance Criteria:**

**Given** tôi submit thông tin checkout
**When** click "Tôi đã chuyển khoản"
**Then** tạo order với status `pending` ngay lập tức
**And** order code được hiển thị làm nội dung chuyển khoản

**Story Points:** 5
**Status:** implemented

---

### Story 5.2: Casso Webhook — Auto Payment Verification

**As an** operator,
**I want to** thanh toán được xác nhận tự động qua Casso webhook,
**So that** không cần approve thủ công từng giao dịch.

**Acceptance Criteria:**

**Given** MB Bank nhận được chuyển khoản
**When** Casso gửi webhook POST đến `/api/webhooks/casso`
**Then** match transaction với order code
**And** gọi `process-payment` Edge Function để update order status
**And** gửi Telegram notification thanh toán thành công

**Security:** Verify `Secure-Token` header từ Casso

**Story Points:** 8
**Status:** implemented (partially — Casso config cần kiểm tra lại dashboard)

---

### Story 5.3: Casso Admin Transaction Log

**As an** admin,
**I want to** xem log tất cả giao dịch Casso nhận được,
**So that** debug khi payment không match tự động.

**Story Points:** 3
**Status:** implemented

---

### Story 5.4: Casso Transaction Sync (Manual) _(2026-03-28)_

**As an** admin,
**I want to** đồng bộ thủ công giao dịch Casso 24h gần nhất,
**So that** xử lý được các payment bị miss webhook.

**Acceptance Criteria:**

**Given** admin ở trang Casso admin
**When** click "Đồng bộ giao dịch"
**Then** fetch transactions từ Casso API (last 24h, paginated 100/page)
**And** auto-match với pending orders (order code regex + amount ±1,000đ)
**And** hiển thị kết quả: matched, no_match, amount_mismatch
**And** admin có thể retry thủ công cho giao dịch lỗi

**Story Points:** 5
**Status:** implemented (2026-03-28)
**File:** `src/actions/casso.ts`
**FRs:** FR-36

---

### Story 5.5: Order Cancellation _(2026-03-28)_

**As a** buyer,
**I want to** hủy đơn hàng pending trước khi thanh toán,
**So that** tôi có thể thay đổi số lượng hoặc hủy giao dịch.

**Acceptance Criteria:**

**Given** đơn hàng status = pending
**When** user click "Hủy đơn hàng" tại checkout
**Then** status chuyển sang cancelled
**And** QR code bị ẩn

**Story Points:** 2
**Status:** implemented (2026-03-28)
**Route:** `POST /api/orders/cancel`
**FRs:** FR-35

---

### Story 5.6: Casso HMAC V2 Signature Verification _(2026-03-28)_

**As a** system,
**I want to** verify webhook signature bằng HMAC-SHA512 với sorted keys,
**So that** chỉ nhận webhook hợp lệ từ Casso.

**Acceptance Criteria:**

**Given** Casso gửi webhook POST
**When** header `x-casso-signature` có format `t=<timestamp>,v1=<hmac>`
**Then** sort JSON payload keys alphabetically (recursive)
**And** tạo signing string: `{timestamp}.{sorted_json}`
**And** compute HMAC-SHA512 với `CASSO_SECURE_TOKEN`
**And** compare với `v1` value
**And** reject nếu không khớp (401)

**Story Points:** 3
**Status:** implemented (2026-03-28)
**FRs:** FR-23

---

## Epic 6: SEO

**Goal:** Tối ưu SEO để tăng organic traffic.

**Added:** 2026-03

### Story 6.1: SEO Core Setup

**As a** product owner,
**I want to** các trang có đầy đủ meta tags, sitemap, robots.txt,
**So that** Google index đúng các trang quan trọng.

**Story Points:** 5
**Status:** implemented

---

### Story 6.2: SEO Structured Data

**As a** product owner,
**I want to** thêm JSON-LD structured data cho các trang sản phẩm,
**So that** xuất hiện rich snippets trên Google Search.

**Story Points:** 3
**Status:** implemented

---

## Epic 7: Blog

**Goal:** Xây dựng blog để tăng organic SEO và giáo dục khách hàng về trầm hương.

**Added:** 2026-03

### Story 7.1: Blog — Supabase Schema + Public Pages

**As a** visitor,
**I want to** đọc bài viết về dự án và trầm hương tại `/blog`,
**So that** tôi hiểu hơn về sản phẩm trước khi mua.

**Routes (public, không cần đăng nhập):**
- `/blog` — danh sách bài viết (trong `(marketing)` layout)
- `/blog/[slug]` — chi tiết bài viết

**Story Points:** 8
**Status:** implemented

---

### Story 7.2: Blog — Admin CMS

**As an** admin,
**I want to** viết và publish bài blog từ `/crm/admin/blog`,
**So that** không cần kỹ thuật để cập nhật nội dung.

**Routes (admin-only):**
- `/crm/admin/blog` — danh sách + delete
- `/crm/admin/blog/new` — tạo bài mới
- `/crm/admin/blog/[id]/edit` — chỉnh sửa bài

**Story Points:** 5
**Status:** implemented

---

## Epic 8: Notifications & Alerts

**Goal:** Cung cấp thông báo real-time cho admin khi có hoạt động quan trọng.

**Added:** 2026-03-28

### Story 8.1: Telegram Group Notifications

**As an** admin,
**I want to** nhận Telegram notification khi có đơn mới, thanh toán thành công, hoặc admin gán mã giới thiệu,
**So that** tôi biết ngay không cần phải F5 dashboard.

**Acceptance Criteria:**

**Given** user submit đơn mua cây → notify đơn mới
**Given** Casso webhook xác nhận thanh toán → notify thành công
**Given** admin gán mã giới thiệu → notify với thông tin hồi tố

**And** nếu thiếu `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` → skip silently

**Story Points:** 3
**Status:** implemented (2026-03-28)
**File:** `src/lib/utils/telegram.ts`

---

## Epic 9: Admin Operations (Extended)

_Stories bổ sung vào Epic 3 sau MVP_

### Story 3.8: Admin User Management _(2026-03-28)_

**As an** admin,
**I want to** xem và quản lý tất cả user accounts tại `/crm/admin/users`,
**So that** phân quyền và gán mã giới thiệu cho user khi cần.

**Acceptance Criteria:**

**Given** admin truy cập `/crm/admin/users`
**When** trang load
**Then** hiển thị danh sách user với search, role filter, pagination 20/trang
**And** có thể thay đổi role (user/admin/super_admin) với confirm modal
**And** có thể gán mã giới thiệu + tính hoa hồng hồi tố cho đơn cũ

**Story Points:** 8
**Status:** implemented (2026-03-28)

---

## Epic 10: Auto Contract Generation

**Goal:** Tự động tạo hợp đồng PDF từ template DOCX với thông tin khách hàng, chữ ký công ty, và gửi email — thay thế PDF generation cơ bản hiện tại.

**Added:** 2026-03-28

**Success Metrics:**
- 100% đơn hàng thanh toán thành công có contract PDF trong 5 phút
- Contract đúng format hợp đồng mẫu công ty
- 0 lỗi thông tin khách hàng trên hợp đồng

**Background:**
- Hiện tại Story 1.8 dùng `pdf-lib` tạo PDF cơ bản trong Edge Function `generate-contract`
- Yêu cầu mới: dùng đúng hợp đồng mẫu DOCX của công ty (`HỢP ĐỒNG ĐẠI NGÀN XANH (MẪU).docx`)
- Hợp đồng cần thông tin pháp lý: CCCD, ngày sinh, địa chỉ, quốc tịch — hiện checkout không thu thập
- Cần overlay chữ ký + con dấu Bên B (Công ty CP TM DV Biocare)

### Story 10.1: Customer Identity Data Collection at Checkout

**As a** buyer,
**I want to** điền thông tin pháp lý (CCCD, ngày sinh, địa chỉ) tại bước checkout,
**So that** hợp đồng được tạo tự động với đầy đủ thông tin chính xác.

**Acceptance Criteria:**

**Given** tôi ở trang checkout sau khi chọn số lượng cây
**When** tôi điền form thông tin cá nhân
**Then** validate: Họ tên (required), Ngày sinh (date), Quốc tịch (default "Việt Nam"), Số CCCD (12 chữ số), Ngày cấp + Nơi cấp CCCD, Địa chỉ thường trú, SĐT
**And** chỉ hiển thị QR thanh toán sau khi form hợp lệ
**And** lưu thông tin vào orders table

**Technical Notes:**
- DB migration: thêm columns `dob`, `nationality`, `id_number`, `id_issue_date`, `id_issue_place`, `address`, `phone` vào orders table
- Update `/api/orders/pending` POST để nhận thêm fields
- Form validation với Zod (đã có trong project)
- UX: thêm step giữa quantity selection và banking QR

**Story Points:** 5
**Dependencies:** None
**FRs:** FR-32

---

### Story 10.2: DOCX Template Preparation & Contract Generation Pipeline

**As a** system,
**I want to** tự động điền thông tin khách hàng vào hợp đồng mẫu DOCX và convert sang PDF,
**So that** hợp đồng có đúng format pháp lý của công ty.

**Acceptance Criteria:**

**Given** đơn hàng có đầy đủ thông tin khách hàng
**When** hệ thống trigger contract generation
**Then** fill template DOCX với placeholders: `{ho_ten}`, `{ngay_sinh}`, `{so_cccd}`, `{ngay_cap}`, `{noi_cap}`, `{dia_chi}`, `{dien_thoai}`, `{so_luong_cay}`, `{tong_gia_tri}`, `{so_hop_dong}`, `{ngay_ky}`
**And** convert DOCX → PDF thành công
**And** overlay ảnh chữ ký + con dấu Bên B lên trang cuối
**And** upload PDF lên Supabase Storage bucket `contracts/`
**And** lưu URL vào `orders.contract_url`

**Technical Notes:**
- Chuẩn bị template: thay dấu `. . . . .` bằng `{placeholder}` trong DOCX
- npm packages: `docx-templates` (fill template), `pdf-lib` (overlay signature)
- DOCX → PDF: ConvertAPI (250 free conversions/month) hoặc CloudConvert
- Ảnh chữ ký + con dấu: scan → PNG, lưu trong Supabase Storage
- API route: `/api/contracts/generate` hoặc Supabase Edge Function upgrade
- Thay thế logic PDF generation cơ bản hiện tại trong `generate-contract` Edge Function

**Story Points:** 8
**Dependencies:** Story 10.1 (customer data), DOCX template chuẩn bị sẵn
**FRs:** FR-33

---

### Story 10.3: Auto-send Signed Contract Email after Payment

**As a** buyer vừa thanh toán xong,
**I want to** nhận email kèm hợp đồng PDF đã ký trong 5 phút,
**So that** tôi có tài liệu pháp lý ngay sau khi thanh toán.

**Acceptance Criteria:**

**Given** Casso webhook xác nhận thanh toán thành công
**When** `process-payment` Edge Function chạy
**Then** trigger contract generation pipeline (Story 10.2)
**And** gửi email kèm PDF attachment qua Resend (reuse `send-email` Edge Function)
**And** email subject: "Hợp đồng dịch vụ nông lâm nghiệp - {order_code}"
**And** nếu generation fail → log error, gửi email thông báo không kèm contract, admin nhận Telegram alert

**Technical Notes:**
- Hook vào flow hiện tại: Casso webhook → `process-payment` → generate contract → send email
- Reuse `send-email` Edge Function (đã có attachment support)
- Fallback: nếu contract generation fail, payment vẫn thành công, contract gửi sau
- Admin có thể resend contract qua `resendContract()` (Story 3.3 đã có)
- Telegram notification cho admin khi contract generation fail

**Story Points:** 5
**Dependencies:** Story 10.2, Story 5.2 (Casso webhook), Story 1.8 (email flow)
**FRs:** FR-33

---

## Summary Statistics (Updated 2026-03-28)

| Metric | Value |
|--------|-------|
| Total Epics | 10 |
| Total Stories | 47 |
| Total Story Points | ~263 |
| P0 Stories | 13 |
| P1 Stories | 17 |
| P2 Stories | 17 |

**MVP Phase 1 (Month 1-3):** Epic 1 + Epic 2 (Stories 2.1-2.4) + Epic 3 (Stories 3.1-3.2, 3.5-3.7)
**Phase 2 (Month 4-6):** Epic 2 (Stories 2.5-2.8) + Epic 3 (Stories 3.3-3.4) + Epic 4
**Phase 3 (Month 7+):** Epic 5 (Casso) + Epic 6 (SEO) + Epic 7 (Blog) + Epic 8 (Telegram) + Epic 9 (Admin Extended)

### Epic Completion Status

| Epic | Stories | Status |
|------|---------|--------|
| Epic 1: User Acquisition | 8 | ✅ Complete |
| Epic 2: Tree Tracking | 9 | ✅ Complete (2.9 FarmCamera added 2026-03-28) |
| Epic 3: Admin Operations | 7 (+1) | ✅ Complete (3.8 added 2026-03-28) |
| Epic 4: Viral & Growth | 2 (+4) | ✅ Complete (4.3-4.6 added) |
| Epic 5: Casso Payment | 6 | ✅ Complete (5.4-5.6 added 2026-03-28) |
| Epic 6: SEO | 2 | ✅ Complete |
| Epic 7: Blog | 2 | ✅ Complete |
| Epic 8: Notifications | 1 | ✅ Complete |
| Epic 9: Admin Extended | 1 | ✅ Complete |
| Epic 10: Auto Contract | 3 | 🆕 New (2026-03-28) |
