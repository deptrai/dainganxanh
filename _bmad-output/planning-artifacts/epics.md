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
| Epic 3: Admin Operations | FR-13 → FR-19 | 2 P0, 5 P1 |
| Epic 4: Viral & Growth | FR-20, FR-21 | 1 P1, 1 P2 |

## Epic List

| # | Epic Name | Goal | Stories | Priority |
|---|-----------|------|---------|----------|
| 1 | User Acquisition & Onboarding | Hoàn thành funnel từ Landing → Payment → Confirmation | 8 | P0 - MVP Core |
| 2 | Tree Tracking & Dashboard | User theo dõi cây và nhận updates | 8 | P0/P1 - MVP Core |
| 3 | Admin Operations | Quản lý đơn hàng, trồng cây, báo cáo | 7 | P0/P1 - MVP Core |
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

### Story 1.6: Payment Gateway (Banking + USDT)

**As a** buyer,
**I want to** thanh toán qua chuyển khoản hoặc USDT,
**So that** tôi dùng được phương thức thanh toán ưa thích.

**Acceptance Criteria:**

**Given** tôi ở màn hình thanh toán
**When** tôi chọn "Chuyển khoản ngân hàng"
**Then** hiển thị thông tin tài khoản + QR code
**And** nội dung CK: [order-code]
**When** hoàn thành chuyển khoản
**Then** hệ thống detect trong 5 phút (webhook)
**And** order status = "Đã thanh toán"

**Given** tôi chọn "USDT"
**When** tôi scan wallet address và gửi đúng số tiền
**Then** blockchain transaction confirm trong 10 phút
**And** order status = "Đã thanh toán"

**Story Points:** 13
**Dependencies:** Banking API, USDT wallet
**FRs:** FR-05

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

---

## Epic 8: Notifications & Engagement (Sprint 2)

**Goal:** Tăng engagement và retention thông qua push notifications, email đẹp hơn, và referral leaderboard.

**Success Metrics:**
- Push notification opt-in rate ≥ 40%
- Email open rate ≥ 30%
- Referral conversion rate tăng 20%

### Story 8.1: Web Push Notifications (PWA)

**As a** tree owner,
**I want to** nhận push notification trên browser khi có ảnh mới hoặc cập nhật về cây,
**So that** tôi không bỏ lỡ bất kỳ update nào mà không cần check email.

**Acceptance Criteria:**

**Given** tôi đã grant notification permission
**When** admin upload ảnh mới cho lô của tôi
**Then** push notification xuất hiện trên browser trong 30 giây
**And** click notification → navigate đến tree detail page
**And** user có thể unsubscribe trong Settings

**Story Points:** 8
**Dependencies:** Web Push API, VAPID keys, Service Worker
**FRs:** FR-22

---

### Story 8.2: Enhanced Email Templates

**As a** customer,
**I want to** nhận email đẹp với ảnh nhúng thay vì text đơn giản,
**So that** email engagement cao hơn và brand impression tốt hơn.

**Acceptance Criteria:**

**Given** bất kỳ triggered email (purchase confirm, quarterly update, harvest notify)
**When** email gửi đi
**Then** render HTML đẹp với logo, ảnh cây, màu brand (#2d6a4f)
**And** mobile-responsive (iOS Mail + Gmail)
**And** có unsubscribe link
**And** open rate trackable

**Story Points:** 5
**Dependencies:** React Email hoặc MJML
**FRs:** FR-23

---

### Story 8.3: Referral Leaderboard

**As a** referrer,
**I want to** xem bảng xếp hạng top referrers,
**So that** tôi có động lực giới thiệu thêm bạn bè.

**Acceptance Criteria:**

**Given** trang /referrals/leaderboard
**When** load
**Then** top 10 referrers: avatar, tên rút gọn, số cây giới thiệu, hoa hồng tích lũy
**And** user thấy vị trí của mình
**And** refresh mỗi 1 giờ

**Story Points:** 3
**Dependencies:** FR-20 (Referral system đã có)
**FRs:** FR-24

---

## Epic 9: Admin Productivity (Sprint 2)

**Goal:** Giảm thời gian xử lý đơn hàng và tăng hiệu quả vận hành cho team admin.

**Success Metrics:**
- Order processing time giảm 70% (bulk vs single)
- Quarterly report delivery 100% on time
- Admin time per order < 2 phút

### Story 9.1: Bulk Order Processing

**As an** admin,
**I want to** xác minh và gán lô cho nhiều đơn hàng cùng lúc,
**So that** xử lý đơn nhanh hơn khi có nhiều orders pending.

**Acceptance Criteria:**

**Given** admin ở Order Management
**When** chọn multiple orders bằng checkbox
**Then** có nút "Xác minh tất cả" và "Gán lô cây"
**When** bulk verify
**Then** tất cả status → verified, send email hàng loạt
**When** bulk assign lot
**Then** chọn 1 lot → assign tất cả selected orders và generate tree codes

**Story Points:** 5
**Dependencies:** FR-13, FR-14
**FRs:** FR-25

---

### Story 9.2: Quarterly PDF Report Generator

**As an** admin,
**I want to** tự động tạo và gửi báo cáo PDF hàng quý cho mỗi customer,
**So that** customers nhận được evidence minh bạch và không cần hỏi thủ công.

**Acceptance Criteria:**

**Given** cuối mỗi quý
**When** admin click "Gửi báo cáo quý" hoặc cron tự động
**Then** tạo PDF cho mỗi customer: ảnh mới nhất, CO2 absorbed, health status, growth metrics
**And** gửi email với PDF attached trong 24 giờ
**And** admin có thể preview PDF trước khi gửi
**And** track số email đã gửi / đã mở

**Story Points:** 8
**Dependencies:** PDF generation, FR-10, FR-17
**FRs:** FR-26

---

### Story 9.3: Advanced Analytics & Export

**As an** admin,
**I want to** xem cohort analysis và churn rate, export Excel đầy đủ,
**So that** có data-driven decisions và báo cáo stakeholders chuyên nghiệp.

**Acceptance Criteria:**

**Given** admin ở Analytics page
**When** chọn "Cohort Analysis"
**Then** hiển thị cohort table: cohort tháng vs retention tháng 1/3/6/12
**When** chọn "Churn"
**Then** % users không quay lại sau 90 ngày
**When** export Excel
**Then** nhiều sheet: Overview, Orders, Users, Trees, Referrals

**Story Points:** 8
**Dependencies:** FR-19
**FRs:** FR-27

---

### Story 9.4: Multi-lot Camera Management

**As an** admin,
**I want to** quản lý nhiều camera stream cho nhiều lô khác nhau,
**So that** mỗi lô có camera riêng và customer thấy camera của lô mình.

**Acceptance Criteria:**

**Given** admin ở Camera Management page
**When** load
**Then** grid tất cả cameras với status (online/offline), linked lot
**And** admin có thể thêm/xóa/edit camera stream URL per lot
**When** customer xem tree detail
**Then** thấy camera của lot mình (nếu configured)

**Story Points:** 5
**Dependencies:** Story 2-9 (FarmCamera)
**FRs:** FR-28

---

## Epic 10: Customer Experience (Sprint 2)

**Goal:** Nâng cao trải nghiệm khách hàng với certificate download, CO2 visualization, và support chat.

**Success Metrics:**
- Certificate download rate ≥ 50% users
- Support response time < 2 giờ
- NPS tăng ≥ 10 điểm

### Story 10.1: Tree Certificate Download

**As a** tree owner,
**I want to** download chứng chỉ sở hữu cây đẹp dưới dạng PDF,
**So that** tôi có tài liệu để chia sẻ và lưu giữ.

**Acceptance Criteria:**

**Given** user ở tree detail page
**When** click "Tải chứng chỉ"
**Then** download PDF: tên user, số cây, lot location, planting date, tree codes, QR verify
**And** có logo Đại Ngàn Xanh, signed digitally
**And** shareable image card (OG format)

**Story Points:** 5
**Dependencies:** PDF generation, FR-09
**FRs:** FR-29

---

### Story 10.2: CO2 Impact Dashboard

**As a** tree owner,
**I want to** xem tác động môi trường của tôi theo cách trực quan và cảm xúc,
**So that** tôi cảm thấy proud và muốn mua thêm cây.

**Acceptance Criteria:**

**Given** user ở dashboard
**When** xem "Tác động của tôi"
**Then** tổng CO2 absorbed, tương đương X chuyến bay / Y xe hơi
**And** biểu đồ CO2 tích lũy animated
**And** so sánh với average user
**And** shareable card "Tôi đã offset X kg CO2"

**Story Points:** 5
**Dependencies:** FR-08, tree age data
**FRs:** FR-30

---

### Story 10.3: In-app Customer Support Chat

**As a** customer,
**I want to** chat trực tiếp với support team trong app,
**So that** tôi giải quyết vấn đề nhanh mà không cần email qua lại.

**Acceptance Criteria:**

**Given** user đăng nhập
**When** click chat icon
**Then** mở chat widget với history
**And** message delivered trong 30 giây (Supabase Realtime)
**When** admin nhận message
**Then** notification xuất hiện trong admin panel
**And** admin thấy order history của user trong chat context

**Story Points:** 8
**Dependencies:** Supabase Realtime
**FRs:** FR-31

---

## Epic 11: Platform Quality (Sprint 2)

**Goal:** Đảm bảo platform ổn định, performant, và có đủ safety net để scale.

**Success Metrics:**
- E2E test pass rate 100% on CI
- Error detection time < 5 phút
- Lighthouse score ≥ 90 trên Landing + Dashboard

### Story 11.1: E2E Playwright Test Suite

**As a** developer,
**I want to** có E2E tests tự động cho critical flows,
**So that** regression không slip qua production.

**Acceptance Criteria:**

**Given** CI/CD pipeline (GitHub Actions)
**When** push to main
**Then** chạy 5 critical E2E tests: landing→purchase flow, login/logout, admin order verify, tree detail view, referral flow
**And** test results visible trong GitHub Actions
**And** fail build nếu critical tests fail

**Story Points:** 8
**Dependencies:** Playwright, GitHub Actions
**FRs:** FR-32

---

### Story 11.2: Monitoring & Alerting Setup

**As a** developer,
**I want to** có Sentry error tracking + UptimeRobot alerting trong production,
**So that** phát hiện và respond to issues trong < 5 phút.

**Acceptance Criteria:**

**Given** production deployment
**When** unhandled error xảy ra
**Then** Sentry capture với stack trace + user context trong 1 phút
**And** Slack/email alert gửi đến dev team
**When** downtime > 1 phút
**Then** UptimeRobot alert qua SMS + email
**And** dashboard uptime history 30 ngày

**Story Points:** 3
**Dependencies:** Sentry account, UptimeRobot account
**FRs:** FR-33

---

### Story 11.3: Core Web Vitals Performance

**As a** visitor / user,
**I want to** trang load nhanh trên mobile,
**So that** không bỏ đi vì chờ đợi.

**Acceptance Criteria:**

**Given** production pages (Landing + Dashboard)
**When** measure bằng Lighthouse
**Then** LCP < 2.5s, INP < 100ms, CLS < 0.1
**And** bundle size giảm ≥ 20% so với hiện tại (baseline đo trước khi optimize)
**And** images: WebP format, lazy loading, next/image
**And** bundle analysis report trong CI

**Story Points:** 5
**Dependencies:** Next.js optimization
**FRs:** FR-34

---

## Summary Statistics

| Metric | Sprint 1 | Sprint 2 | Total |
|--------|----------|----------|-------|
| Total Epics | 7 | 4 | 11 |
| Total Stories | 36 | 13 | 49 |
| P0 Stories | 10 | 0 | 10 |
| P1 Stories | 10 | 10 | 20 |
| P2 Stories | 5 | 3 | 8 |

**Sprint 1 (Jan–Mar 2026):** Epic 1-7 — Core user journey, admin ops, referral, Casso, SEO, Blog
**Sprint 2 (Mar 2026+):** Epic 8-11 — Notifications, admin productivity, customer experience, platform quality
