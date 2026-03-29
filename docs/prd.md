# 🎯 PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Dự án: Đại Ngàn Xanh - Nền tảng Trồng Cây & Carbon Credit

**Version:** 2.0
**Date:** January 7, 2026 (Updated: March 26, 2026)
**Author:** Product Manager Agent (BMAD Method)
**Status:** Sprint 2 Active  

***

## 📋 EXECUTIVE SUMMARY

### Product Vision
Đại Ngàn Xanh là nền tảng kết nối người quan tâm môi trường với dự án trồng 1 triệu cây Dó Đen tại Việt Nam, sử dụng công nghệ để đảm bảo minh bạch và tạo giá trị bền vững thông qua trầm hương và tín chỉ carbon.[1][2]

### Business Objectives
- **Revenue Goal:** 260 tỷ VNĐ từ việc bán 1 triệu cây trong 5 năm
- **User Acquisition:** 100,000 users năm đầu (10% conversion rate)
- **Market Position:** Top 3 nền tảng trồng cây tại Việt Nam[3]
- **Social Impact:** Giảm 20,000 tấn CO2/năm, tạo việc làm cho 500+ nông dân

### Success Metrics[2][3]
- Conversion rate: Landing → Purchase ≥ 10%
- User retention: 60% users quay lại sau 1 năm
- Viral coefficient: 30% users share sau mua
- Tree survival rate: ≥ 90% sau 12 tháng
- NPS Score: ≥ 50

***

## 👥 TARGET USERS & PERSONAS

### Primary Personas[4][3]

**P1 - Người Yêu Thiên Nhiên (Nature Lover)**
- **Demographics:** 25-45 tuổi, thu nhập 15-50 triệu/tháng, thành thị
- **Goals:** Đóng góp cho môi trường, để lại di sản cho con cháu
- **Pain Points:** Không biết cách tham gia hiệu quả, lo lắng về minh bạch
- **Use Cases:** Mua 1-10 cây/năm, theo dõi định kỳ, share lên social

**P2 - Nhà Đầu Tư Xanh (Green Investor)**
- **Demographics:** 30-55 tuổi, thu nhập >50 triệu/tháng
- **Goals:** Đầu tư bền vững, thu lợi nhuận dài hạn
- **Pain Points:** Rủi ro nông nghiệp, tính thanh khoản thấp
- **Use Cases:** Mua 50-500 cây, theo dõi ROI, tham gia affiliate

**P3 - Admin/Operations Team**
- **Demographics:** Nhân viên công ty, kỹ sư nông nghiệp
- **Goals:** Quản lý đơn hàng, theo dõi tiến độ trồng cây, báo cáo
- **Pain Points:** Quá nhiều đơn hàng thủ công, khó cập nhật ảnh
- **Use Cases:** Xác minh đơn, upload ảnh, gửi báo cáo quý

***

## 🎯 FUNCTIONAL REQUIREMENTS (FRs)

### Epic 1: User Acquisition & Onboarding

**FR-01: Landing Page with Video & Counter**[5]
- **Priority:** P0 (Must-have)
- **Description:** Hiển thị trailer video + counter động "X/1,000,000 cây"
- **Acceptance Criteria:**
  - Given user arrives at homepage
  - When page loads
  - Then video autoplay (muted) + counter updates real-time
  - And page load time < 3 seconds
- **Dependencies:** CDN setup, video hosting

**FR-02: Package Selection**
- **Priority:** P0
- **Description:** User chọn gói "Cá nhân 260k/cây"
- **Acceptance Criteria:**
  - Given user clicks "Chọn gói cây"
  - When package screen displays
  - Then show 1 package option with clear pricing breakdown
  - And CTA "Customize" enabled
- **Dependencies:** None

**FR-03: Quantity Input**
- **Priority:** P0
- **Description:** User nhập số lượng cây muốn trồng
- **Acceptance Criteria:**
  - Given user is on customize screen
  - When user enters quantity (1-1000)
  - Then system calculates total = quantity × 260,000 VNĐ
  - And display breakdown: giống 40k + chăm sóc 194k + affiliate 26k
- **Dependencies:** Pricing logic backend

**FR-04: Quick Registration (OTP)**
- **Priority:** P0
- **Description:** Đăng ký nhanh qua Email/SĐT + OTP[6]
- **Acceptance Criteria:**
  - Given new user
  - When user enters email/phone + clicks "Đăng ký"
  - Then send OTP within 30 seconds
  - And verify OTP correctly → create account
  - And auto-create wallet address
- **Dependencies:** Twilio/Firebase for OTP, blockchain wallet generation

**FR-05: Payment Gateway Integration**
- **Priority:** P0
- **Description:** Thanh toán qua Banking hoặc USDT
- **Acceptance Criteria:**
  - Given user confirmed order
  - When user selects payment method (Banking / USDT)
  - Then redirect to payment gateway
  - And webhook confirms payment success
  - And update order status to "Paid"
- **Dependencies:** Banking API, USDT wallet integration

**FR-06: Success Animation & Share Card**[5]
- **Priority:** P0
- **Description:** Sau thanh toán thành công, hiển thị animation + auto-generate share card
- **Acceptance Criteria:**
  - Given payment successful
  - When user sees success screen
  - Then play "cây đang gieo mầm" animation
  - And generate share card with: user name, tree count, CO2 impact
  - And 1-click share to social media
- **Dependencies:** Canvas API for image generation, Web Share API

**FR-07: Email Confirmation with Contract**
- **Priority:** P0
- **Description:** Gửi email tự động với hợp đồng PDF + mã cây
- **Acceptance Criteria:**
  - Given payment confirmed
  - When system processes order
  - Then send email within 5 minutes
  - And email contains: PDF contract, tree code, dashboard link
- **Dependencies:** PDF generation library, email service (SendGrid/AWS SES)

***

### Epic 2: Tree Tracking & Dashboard

**FR-08: My Garden Dashboard**[7]
- **Priority:** P0
- **Description:** User login và xem danh sách cây của mình
- **Acceptance Criteria:**
  - Given logged-in user
  - When user navigates to dashboard
  - Then display all trees with: image, status, CO2 metric, planting date
  - And sortable by date/status
- **Dependencies:** Authentication system, database

**FR-09: Tree Detail View**
- **Priority:** P1
- **Description:** Click vào cây để xem chi tiết
- **Acceptance Criteria:**
  - Given user on dashboard
  - When user clicks tree card
  - Then show detail page with: timeline, photos, GPS location, quarterly reports
  - And display growth metrics (height, CO2 absorbed)
- **Dependencies:** GPS data, photo storage (S3)

**FR-10: Quarterly Update System**
- **Priority:** P1
- **Description:** Admin upload ảnh/video → Auto notify users
- **Acceptance Criteria:**
  - Given admin uploads new photos
  - When photos tagged to user trees
  - Then send push notification + email
  - And update tree status on dashboard
- **Dependencies:** Push notification service (FCM), admin CMS

**FR-11: Timeline with Placeholder/Real Photos**
- **Priority:** P1
- **Description:** Hiển thị timeline với ảnh placeholder (quý 1-3) và ảnh thực tế (quý 4+)
- **Acceptance Criteria:**
  - Given tree in timeline view
  - When tree age < 9 months
  - Then show placeholder image with "Đang ươm giống"
  - When tree age ≥ 9 months
  - Then show real photo from field
- **Dependencies:** Photo tagging system

**FR-12: Year 5 Harvest Notification**
- **Priority:** P2
- **Description:** Thông báo thu hoạch khi cây đến năm thứ 5
- **Acceptance Criteria:**
  - Given tree reaches 60 months old
  - When system checks monthly cron job
  - Then send email/SMS: "Cây của bạn sẵn sàng thu hoạch"
  - And redirect to harvest contract signing page
- **Dependencies:** Cron job scheduler, e-contract system

***

### Epic 3: Admin Operations

**FR-13: Order Management Dashboard**[2]
- **Priority:** P0
- **Description:** Admin xem và xác minh đơn hàng mới
- **Acceptance Criteria:**
  - Given admin logged in
  - When admin opens order management
  - Then display list of orders with: ID, user, quantity, payment status
  - And filter by: status (pending/confirmed/failed), date range
  - And ability to manually verify payment
- **Dependencies:** Admin role-based access control (RBAC)

**FR-14: Tree Lot Assignment**
- **Priority:** P0
- **Description:** Admin gán đơn hàng vào lô cây cụ thể
- **Acceptance Criteria:**
  - Given verified order
  - When admin clicks "Gán lô cây"
  - Then show available lots with capacity
  - And assign trees to lot + generate tree codes
  - And update order status to "Assigned"
- **Dependencies:** Lot management system

**FR-15: Contract Printing System**
- **Priority:** P1
- **Description:** In hợp đồng giấy hoặc gửi điện tử
- **Acceptance Criteria:**
  - Given assigned order
  - When admin chooses print/digital
  - Then generate PDF contract with user info
  - If print: mark for postal service
  - If digital: send via email automatically
- **Dependencies:** PDF template, postal integration

**FR-16: Field Operations Checklist**[2]
- **Priority:** P1
- **Description:** Admin theo dõi checklist trồng cây theo quý
- **Acceptance Criteria:**
  - Given quarterly period
  - When admin opens checklist
  - Then show tasks: visit garden, take photos, update status
  - And mark tasks complete/incomplete
  - And auto-reminder 7 days before due date
- **Dependencies:** Task management system

**FR-17: Photo Upload with GPS Tagging**
- **Priority:** P1
- **Description:** Admin upload ảnh/video từ vườn và tag GPS
- **Acceptance Criteria:**
  - Given admin at field
  - When admin uploads photo via mobile app
  - Then extract GPS from photo EXIF
  - And tag to relevant lot/trees
  - And compress image to <2MB
- **Dependencies:** Mobile app, EXIF parser, image compression

**FR-18: Tree Health Status Update**[2]
- **Priority:** P1
- **Description:** Admin cập nhật trạng thái cây (khỏe/bệnh/chết)
- **Acceptance Criteria:**
  - Given admin viewing tree lot
  - When admin updates status
  - Then if "Bệnh" → log treatment action
  - If "Chết" → auto-create replant task + notify user
  - If "Khỏe" → proceed to quarterly report
- **Dependencies:** Notification system

**FR-19: Analytics & Reporting Dashboard**
- **Priority:** P1
- **Description:** Admin xem metrics tổng và export báo cáo[3][2]
- **Acceptance Criteria:**
  - Given admin on analytics page
  - When page loads
  - Then display KPIs: total trees, active users, revenue, carbon offset, affiliate performance
  - And charts: growth over time, conversion funnel
  - And export to PDF/Excel
- **Dependencies:** Analytics backend (BigQuery/Mixpanel), export library

***

### Epic 4: Viral & Growth Features

**FR-20: Referral Link Generation**
- **Priority:** P2
- **Description:** User có thể tạo link giới thiệu để nhận hoa hồng
- **Acceptance Criteria:**
  - Given logged-in user
  - When user clicks "Giới thiệu bạn bè"
  - Then generate unique ref code: dainganxanh.com.vn/ref/{code}
  - And display in dashboard with QR code
- **Dependencies:** Referral tracking system

**FR-21: Social Share Pre-populated Text**
- **Priority:** P1
- **Description:** 1-click share với text/image đã được chuẩn bị sẵn[5]
- **Acceptance Criteria:**
  - Given user on success screen
  - When user clicks "Chia sẻ"
  - Then open share dialog with pre-filled:
    - Text: "Tôi vừa trồng X cây cho Mẹ Thiên Nhiên 🌳"
    - Image: Generated share card
    - Link: Landing page + ref code
- **Dependencies:** Web Share API, OG tags

***

### Epic 8: Notifications & Engagement (Sprint 2)

**FR-22: Web Push Notifications (PWA)**
- **Priority:** P1
- **Description:** Gửi push notification trực tiếp trên browser khi có quarterly update, tree news
- **Acceptance Criteria:**
  - Given user đã grant notification permission
  - When admin upload ảnh mới cho lô của user
  - Then push notification xuất hiện trên browser (desktop + mobile) trong 30 giây
  - And click notification → navigate đến tree detail page
  - And user có thể unsubscribe trong Settings
- **Dependencies:** Web Push API, VAPID keys, service worker

**FR-23: Enhanced Email Templates**
- **Priority:** P1
- **Description:** Nâng cấp tất cả email lên HTML template đẹp, có ảnh nhúng, responsive
- **Acceptance Criteria:**
  - Given bất kỳ triggered email nào (purchase confirm, quarterly update, harvest notify)
  - When email gửi đi
  - Then render HTML đẹp với logo, ảnh cây, màu brand (#2d6a4f)
  - And mobile-responsive (tested on iOS Mail + Gmail)
  - And có unsubscribe link (compliance)
  - And open rate trackable qua pixel/link tracking
- **Dependencies:** React Email hoặc MJML template engine

**FR-24: Referral Leaderboard**
- **Priority:** P2
- **Description:** Bảng xếp hạng top referrer public → tăng viral coefficient
- **Acceptance Criteria:**
  - Given trang /referrals/leaderboard
  - When load
  - Then hiển thị top 10 referrers: avatar, tên rút gọn, số cây giới thiệu được, hoa hồng tích lũy
  - And user thấy vị trí của mình trong bảng
  - And refresh mỗi 1 giờ
- **Dependencies:** FR-20 (Referral system)

***

### Epic 9: Admin Productivity (Sprint 2)

**FR-25: Bulk Order Processing**
- **Priority:** P1
- **Description:** Admin xác minh / gán lô cho nhiều đơn hàng cùng một lúc
- **Acceptance Criteria:**
  - Given admin ở Order Management
  - When chọn multiple orders bằng checkbox
  - Then có nút "Xác minh tất cả" và "Gán lô cây"
  - When bulk verify
  - Then tất cả status → verified, send email hàng loạt
  - When bulk assign lot
  - Then chọn 1 lot → assign tất cả selected orders
  - And generate tree codes cho tất cả
- **Dependencies:** FR-13, FR-14

**FR-26: Quarterly PDF Report Generator**
- **Priority:** P1
- **Description:** Tự động tạo và gửi báo cáo PDF hàng quý cho từng customer
- **Acceptance Criteria:**
  - Given cuối mỗi quý (Q1/Q2/Q3/Q4)
  - When admin click "Gửi báo cáo quý" hoặc cron tự động
  - Then tạo PDF cho mỗi customer gồm: ảnh mới nhất của lô, số liệu tăng trưởng, CO2 absorbed, health status
  - And gửi email với PDF attached trong 24 giờ
  - And admin có thể preview PDF trước khi gửi
  - And track số email đã gửi / đã mở
- **Dependencies:** PDF generation, FR-10, FR-17

**FR-27: Advanced Analytics & Export**
- **Priority:** P1
- **Description:** Mở rộng analytics: cohort analysis, churn rate, export Excel cải tiến
- **Acceptance Criteria:**
  - Given admin ở Analytics page
  - When chọn tab "Cohort Analysis"
  - Then hiển thị cohort table: user signup month vs retention by month 1/3/6/12
  - When chọn "Churn"
  - Then hiển thị % users không quay lại sau 90 ngày
  - When export
  - Then Excel có nhiều sheet: Overview, Orders, Users, Trees, Referrals
  - And PDF export có branding đẹp để gửi cho stakeholders
- **Dependencies:** FR-19

**FR-28: Multi-lot Camera Management**
- **Priority:** P2
- **Description:** Quản lý nhiều stream camera cho nhiều lô khác nhau
- **Acceptance Criteria:**
  - Given admin ở trang camera management
  - When load
  - Then hiển thị grid tất cả cameras với status (online/offline)
  - And mỗi camera linked đến 1 lot
  - When customer xem tree detail
  - Then thấy camera của lot mình (nếu có)
  - And admin có thể thêm/xóa camera stream URL
- **Dependencies:** Story 2-9 (FarmCamera component)

***

### Epic 10: Customer Experience (Sprint 2)

**FR-29: Tree Certificate Download**
- **Priority:** P1
- **Description:** Khách hàng download chứng chỉ sở hữu cây dưới dạng PDF đẹp
- **Acceptance Criteria:**
  - Given user ở tree detail page
  - When click "Tải chứng chỉ"
  - Then download PDF với: tên user, số cây, lot location, planting date, tree codes, QR code verify
  - And có logo Đại Ngàn Xanh, signed digitally
  - And shareable trên social (ảnh cover đẹp)
- **Dependencies:** PDF generation, FR-09

**FR-30: CO2 Impact Dashboard**
- **Priority:** P1
- **Description:** Visualize tác động môi trường của user theo cách trực quan và cảm xúc
- **Acceptance Criteria:**
  - Given user ở dashboard
  - When xem "Tác động của tôi" section
  - Then hiển thị: tổng CO2 absorbed (kg/tấn), tương đương X chuyến bay HAN-SGN, Y xe hơi chạy 1 năm
  - And biểu đồ CO2 tích lũy theo thời gian (animated)
  - And so sánh với average user
  - And shareable card "Tôi đã offset X kg CO2"
- **Dependencies:** FR-08, tree age data

**FR-31: In-app Customer Support Chat**
- **Priority:** P2
- **Description:** Chat trực tiếp với admin/support team ngay trong app
- **Acceptance Criteria:**
  - Given user đăng nhập
  - When click chat icon
  - Then mở chat widget với history
  - And message delivered trong 30 giây
  - And admin nhận notification khi có message mới
  - And support có thể xem order history của user trong chat context
- **Dependencies:** Realtime messaging (Supabase Realtime hoặc tích hợp thứ 3)

***

### Epic 11: Platform Quality (Sprint 2)

**FR-32: E2E Playwright Test Suite**
- **Priority:** P1
- **Description:** Tự động hóa critical user flows bằng Playwright để prevent regression
- **Acceptance Criteria:**
  - Given CI/CD pipeline
  - When push to main
  - Then chạy E2E tests tự động: landing → purchase flow, login/logout, admin order management
  - And test results visible trong GitHub Actions
  - And fail build nếu critical tests fail
  - And test coverage cho: 5 critical user journeys
- **Dependencies:** Playwright, GitHub Actions

**FR-33: Monitoring & Alerting Setup**
- **Priority:** P1
- **Description:** Thiết lập Sentry (error tracking) + UptimeRobot (uptime) + alerting
- **Acceptance Criteria:**
  - Given production deployment
  - When unhandled error xảy ra
  - Then Sentry capture với stack trace + user context trong 1 phút
  - And Slack/email alert gửi đến dev team
  - When downtime > 1 phút
  - Then UptimeRobot alert qua SMS + email
  - And dashboard hiển thị uptime history 30 ngày
  - And response time P95 tracking
- **Dependencies:** Sentry account, UptimeRobot account

**FR-34: Core Web Vitals Performance**
- **Priority:** P1
- **Description:** Tối ưu performance để đạt Core Web Vitals "Good" trên tất cả pages
- **Acceptance Criteria:**
  - Given production pages
  - When measure với Lighthouse / CrUX
  - Then LCP < 2.5s, FID/INP < 100ms, CLS < 0.1 trên Landing + Dashboard
  - And bundle size giảm ≥ 20% so với hiện tại
  - And image optimization: WebP format, lazy loading, proper sizing
  - And Next.js bundle analysis báo cáo trong CI
- **Dependencies:** Next.js optimization, image CDN

***

## ⚙️ NON-FUNCTIONAL REQUIREMENTS (NFRs)

**NFR-01: Performance**[4][3]
- Landing page load time < 3 seconds (P50)
- Dashboard load time < 2 seconds
- Payment processing < 30 seconds end-to-end
- Support 1000 concurrent users

**NFR-02: Security**[2]
- HTTPS only, SSL certificate
- PCI DSS compliant for payment
- OTP expires after 5 minutes
- Password hashing with bcrypt (cost factor 12)
- RBAC for admin access
- Rate limiting: 10 OTP requests/hour per IP

**NFR-03: Scalability**
- Database: Horizontal scaling with read replicas
- Image storage: S3 with CloudFront CDN
- Auto-scaling: 2-10 instances based on load
- Support 1M users over 5 years

**NFR-04: Reliability**[2]
- Uptime SLA: 99.5% (excluding maintenance)
- Database backup: Daily with 30-day retention
- Payment webhook retry: 3 attempts with exponential backoff
- Email delivery: 95% within 5 minutes

**NFR-05: Usability**[7][3]
- Mobile-responsive (Bootstrap/Tailwind)
- Support browsers: Chrome, Safari, Edge (last 2 versions)
- WCAG 2.1 Level AA accessibility
- Multi-language: Vietnamese (primary), English (secondary)

**NFR-06: Compliance**
- GDPR-like data privacy (user can export/delete data)
- Vietnam cybersecurity law compliant
- Hợp đồng có giá trị pháp lý (chữ ký điện tử)
- Carbon credit methodology aligned with Gold Standard/Verra (for future)

**NFR-07: Observability**[2]
- Logging: Centralized with ELK stack
- Monitoring: Uptime (UptimeRobot), APM (New Relic/Datadog)
- Error tracking: Sentry
- Analytics: Google Analytics 4 + Mixpanel

***

## 📦 MVP SCOPE

### ✅ IN SCOPE (Phase 1 - Month 1-3)

**Core User Journey:**
- [x] Landing page with video + counter
- [x] Package selection (1 package only)
- [x] Quantity input
- [x] Quick registration (OTP)
- [x] Payment (Banking + USDT)
- [x] Success screen + share card
- [x] Email confirmation with PDF contract
- [x] Dashboard: View my trees
- [x] Tree detail with timeline

**Admin Essentials:**
- [x] Order management
- [x] Tree lot assignment
- [x] Photo upload + GPS tagging
- [x] Status update (khỏe/bệnh/chết)
- [x] Basic analytics dashboard

**Growth:**
- [x] Social share
- [x] Email system

### ✅ IN SCOPE Sprint 2 (March 2026+)

**Notifications & Engagement:**
- [x] Web Push Notifications (PWA) — FR-22
- [x] Enhanced Email Templates — FR-23
- [x] Referral Leaderboard — FR-24

**Admin Productivity:**
- [x] Bulk Order Processing — FR-25
- [x] Quarterly PDF Report Generator — FR-26
- [x] Advanced Analytics & Export — FR-27
- [x] Multi-lot Camera Management — FR-28

**Customer Experience:**
- [x] Tree Certificate Download — FR-29
- [x] CO2 Impact Dashboard — FR-30
- [x] In-app Customer Support Chat — FR-31

**Platform Quality:**
- [x] E2E Playwright Test Suite — FR-32
- [x] Monitoring & Alerting — FR-33
- [x] Core Web Vitals Performance — FR-34

### ❌ OUT OF SCOPE (Phase 3+)

**Deferred Features:**
- [ ] Multiple pricing tiers (Gói Cộng đồng 49k, Gói Doanh nghiệp)
- [ ] NFT integration for tree certificates (blockchain)
- [ ] API for corporate integration
- [ ] AR tree planting
- [ ] Virtual 3D forest
- [ ] Gamification (badges, full leaderboard system)
- [ ] Mobile app (iOS/Android native)
- [ ] Offline event booking
- [ ] Carbon credit marketplace
- [ ] USDT / crypto payment

***

## 📐 TECHNICAL ARCHITECTURE (High-Level)

### Tech Stack[1][2]

**Frontend:**
- Framework: Next.js 14 (App Router, SSR for SEO)
- UI Library: Tailwind CSS + shadcn/ui
- State: React Context + Zustand
- Hosting: Vercel

**Backend:**
- Runtime: Node.js 20 + Express
- Database: PostgreSQL 16 (primary), Redis (cache)
- ORM: Prisma
- Hosting: Railway / AWS EC2

**Blockchain:**
- Chain: Polygon (low gas fees)
- Wallet: Ethers.js
- NFT Standard: ERC-721 (deferred to Phase 2)

**Storage:**
- Images/Videos: AWS S3 + CloudFront CDN
- Documents: S3 with pre-signed URLs

**Third-Party Services:**
- Payment: Banking API (custom), USDT (Web3)
- OTP: Twilio SMS / Firebase Auth
- Email: SendGrid
- Push Notifications: Firebase Cloud Messaging
- Analytics: Mixpanel + Google Analytics 4

### System Architecture Diagram
```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│   Next.js App    │  (Vercel)
│   - SSR Pages    │
│   - API Routes   │
└────────┬─────────┘
         │
         ↓
┌─────────────────────┐
│   Backend API       │  (Railway)
│   - Auth            │
│   - Order Mgmt      │
│   - Payment Webhook │
│   - Photo Upload    │
└──────┬──────────────┘
       │
       ├─────→ PostgreSQL (Primary DB)
       ├─────→ Redis (Session + Cache)
       ├─────→ S3 (File Storage)
       ├─────→ Twilio (OTP)
       ├─────→ SendGrid (Email)
       └─────→ Polygon (Wallet creation)
```

***

## 📊 USER STORIES (Detailed)

### Epic 1: User Acquisition

**US-01: View Landing Page**
- **As a** visitor
- **I want to** see an inspiring video and impact counter
- **So that** I understand the project mission and feel motivated to participate
- **Acceptance Criteria (Gherkin):**
  ```gherkin
  Given I am on the homepage
  When the page loads
  Then I should see a hero video playing automatically (muted)
  And I should see a counter showing "X/1,000,000 cây đã trồng"
  And the counter should update in real-time if new trees are planted
  And the page should load in under 3 seconds
  ```
- **Dependencies:** None
- **Story Points:** 5

**US-02: Select Tree Package**
- **As a** potential buyer
- **I want to** see clear pricing for 1 tree package
- **So that** I know exactly what I'm paying for
- **Acceptance Criteria:**
  ```gherkin
  Given I clicked "Trồng cây ngay" CTA
  When the package screen appears
  Then I should see "Gói Cá nhân: 260,000 VNĐ/cây"
  And I should see a breakdown: 40k giống + 194k chăm sóc + 26k quỹ
  And there should be a "Tùy chỉnh" button enabled
  ```
- **Dependencies:** None
- **Story Points:** 3

**US-03: Enter Quantity**
- **As a** buyer
- **I want to** input how many trees I want to plant
- **So that** I can buy multiple trees at once
- **Acceptance Criteria:**
  ```gherkin
  Given I am on the customize screen
  When I enter a quantity between 1 and 1000
  Then the total price should calculate automatically
  And display: "Tổng: [quantity] × 260,000 = [total] VNĐ"
  And if I enter invalid number (0, negative, >1000), show error message
  ```
- **Dependencies:** FR-03
- **Story Points:** 2

**US-04: Register with OTP**
- **As a** new user
- **I want to** quickly sign up with my phone number
- **So that** I can complete purchase without lengthy forms
- **Acceptance Criteria:**
  ```gherkin
  Given I entered quantity and clicked "Tiếp tục"
  When I enter my phone number and click "Gửi OTP"
  Then I should receive an SMS with 6-digit code within 30 seconds
  When I enter the correct OTP
  Then my account should be created automatically
  And a blockchain wallet should be generated for me
  And I should proceed to payment screen
  ```
- **Dependencies:** FR-04, Twilio integration
- **Story Points:** 8

**US-05: Complete Payment**
- **As a** buyer
- **I want to** pay via bank transfer or USDT
- **So that** I can use my preferred payment method
- **Acceptance Criteria:**
  ```gherkin
  Given I am on payment screen
  When I select "Chuyển khoản ngân hàng"
  Then I should see account details and QR code
  And I should see "Nội dung CK: [order-code]"
  When I complete bank transfer
  Then the system should detect payment within 5 minutes (webhook)
  And my order status should update to "Đã thanh toán"
  
  Given I select "USDT"
  When I scan wallet address
  And send correct amount
  Then the blockchain transaction should confirm within 10 minutes
  And order status updates to "Đã thanh toán"
  ```
- **Dependencies:** FR-05, Payment gateway setup
- **Story Points:** 13

**US-06: Receive Success Confirmation**
- **As a** buyer who just paid
- **I want to** see immediate confirmation and share my achievement
- **So that** I feel good and can inspire my friends
- **Acceptance Criteria:**
  ```gherkin
  Given payment is confirmed
  When success screen loads
  Then I should see an animation "🎉 Cây đang được gieo mầm"
  And a share card should be auto-generated with:
    - My name (or "Người gieo hạt")
    - Number of trees
    - "= X kg CO2 will be absorbed annually"
  And I should see "Chia sẻ" button
  When I click share button
  Then share dialog opens with pre-populated text and image
  ```
- **Dependencies:** FR-06, Canvas API, Web Share API
- **Story Points:** 8

**US-07: Receive Email Confirmation**
- **As a** buyer
- **I want to** receive an email with contract and tree code
- **So that** I have official documentation
- **Acceptance Criteria:**
  ```gherkin
  Given payment confirmed
  When system processes order
  Then I should receive email within 5 minutes to my registered email
  And email should contain:
    - PDF contract attachment (signed digitally)
    - My tree code(s): TREE-2026-XXXXX
    - Link to dashboard: dainganxanh.com.vn/dashboard
  And email should be mobile-responsive
  ```
- **Dependencies:** FR-07, SendGrid, PDF generation
- **Story Points:** 5

***

### Epic 2: Tree Tracking

**US-08: View My Trees**
- **As a** tree owner
- **I want to** see all my trees in one dashboard
- **So that** I can track their progress easily
- **Acceptance Criteria:**
  ```gherkin
  Given I am logged in
  When I navigate to /dashboard
  Then I should see a grid of all my trees
  And each tree card should show:
    - Tree photo (placeholder if < 9 months old)
    - Status: "Đang ươm" / "Đã trồng" / "Đang lớn"
    - Planting date
    - CO2 absorbed so far
  And I should be able to sort by date or status
  ```
- **Dependencies:** FR-08, Authentication
- **Story Points:** 5

**US-09: View Tree Details**
- **As a** tree owner
- **I want to** click on a tree to see detailed information
- **So that** I know its exact location and growth history
- **Acceptance Criteria:**
  ```gherkin
  Given I am on dashboard
  When I click on a tree card
  Then I should see detail page with:
    - Timeline of milestones (ươm → trồng → 1 year → 2 years...)
    - Latest photo with timestamp
    - GPS location on map
    - Growth metrics: height (estimate), CO2 absorbed
  And I should see "Quarterly Reports" section with download links
  ```
- **Dependencies:** FR-09, Google Maps API
- **Story Points:** 8

**US-10: Receive Quarterly Updates**
- **As a** tree owner
- **I want to** get notified when new photos are uploaded
- **So that** I stay engaged with my trees
- **Acceptance Criteria:**
  ```gherkin
  Given admin uploaded photos for my tree lot
  When photos are tagged to my trees
  Then I should receive push notification: "Cây của bạn có ảnh mới!"
  And I should receive email with embedded photos
  When I click notification
  Then I should land on tree detail page showing new photos
  ```
- **Dependencies:** FR-10, FCM, Admin photo upload
- **Story Points:** 8

**US-11: See Timeline with Placeholder Photos**
- **As a** tree owner with young trees
- **I want to** see a visual timeline even before real photos
- **So that** I understand the process and stay patient
- **Acceptance Criteria:**
  ```gherkin
  Given my tree is < 9 months old
  When I view tree detail
  Then timeline should show:
    - Month 0-3: Placeholder image "Đang ươm giống"
    - Month 4: Placeholder image "Chuẩn bị trồng xuống đất"
  Given my tree is ≥ 9 months old
  Then timeline should show actual photos from field
  ```
- **Dependencies:** FR-11
- **Story Points:** 3

**US-12: Get Year 5 Harvest Notification**
- **As a** long-term tree owner
- **I want to** be notified when my tree is ready to harvest
- **So that** I can decide on next steps (sell back, keep, or receive product)
- **Acceptance Criteria:**
  ```gherkin
  Given my tree is 60 months old
  When monthly cron job runs
  Then I should receive email: "Cây của bạn sẵn sàng thu hoạch"
  And email should contain link to e-contract signing page
  When I click link
  Then I should see harvest contract with terms
  And I should be able to e-sign and submit
  ```
- **Dependencies:** FR-12, E-signature system (deferred details)
- **Story Points:** 8

***

### Epic 3: Admin Operations

**US-13: Verify Orders**
- **As an** admin
- **I want to** quickly verify new orders
- **So that** I can proceed with tree assignment
- **Acceptance Criteria:**
  ```gherkin
  Given I logged in as admin
  When I open Order Management page
  Then I should see list of orders filtered by "Pending Verification"
  And each order should show: Order ID, User, Quantity, Payment Method, Timestamp
  When I click "Xác minh"
  Then order status changes to "Verified"
  And I receive confirmation toast message
  ```
- **Dependencies:** FR-13, Admin auth
- **Story Points:** 5

**US-14: Assign Trees to Lots**
- **As an** admin
- **I want to** assign verified orders to specific planting lots
- **So that** we can track physical location of trees
- **Acceptance Criteria:**
  ```gherkin
  Given I have verified orders
  When I click "Gán lô cây"
  Then I should see list of available lots with:
    - Lot name (e.g., "Đắk Nông - Lot A")
    - Capacity: X/Y trees planted
  When I select a lot and confirm
  Then system generates tree codes: TREE-2026-XXXXX
  And assigns to selected lot
  And order status updates to "Assigned"
  And user receives email notification
  ```
- **Dependencies:** FR-14
- **Story Points:** 8

**US-15: Upload Field Photos**
- **As a** field operator
- **I want to** upload photos from my phone directly
- **So that** tree owners get real-time updates
- **Acceptance Criteria:**
  ```gherkin
  Given I am at the field with mobile device
  When I open Admin app and click "Upload Photo"
  Then I can select multiple photos from camera roll
  When I upload photos
  Then system extracts GPS coordinates from EXIF
  And auto-tags photos to trees in that lot
  And compresses images to <2MB
  And notifies relevant users
  ```
- **Dependencies:** FR-17, Mobile app (can use web responsive for MVP)
- **Story Points:** 13

**US-16: Update Tree Health Status**
- **As a** field operator
- **I want to** mark trees as healthy, sick, or dead
- **So that** we can take appropriate action
- **Acceptance Criteria:**
  ```gherkin
  Given I am reviewing tree lot
  When I select a tree and update status to "Bệnh"
  Then I should log treatment details (e.g., "Bón phân đặc trị")
  When I mark tree as "Chết"
  Then system auto-creates task "Trồng cây thay thế"
  And sends notification to user explaining situation
  When I mark tree as "Khỏe"
  Then no additional action needed
  ```
- **Dependencies:** FR-18
- **Story Points:** 5

**US-17: View Analytics Dashboard**
- **As an** admin
- **I want to** see overall project metrics
- **So that** I can report to stakeholders
- **Acceptance Criteria:**
  ```gherkin
  Given I am on Analytics page
  When page loads
  Then I should see KPI cards:
    - Total trees planted: X/1,000,000
    - Active users: Y
    - Revenue this month: Z VNĐ
    - Carbon offset: A tons CO2
  And I should see charts:
    - Tree planting over time (line chart)
    - Conversion funnel (Landing → Purchase)
  And I should be able to export data to PDF or Excel
  ```
- **Dependencies:** FR-19, Analytics backend
- **Story Points:** 13

***

## 🚧 OPEN QUESTIONS & RISKS

### Open Questions[3][2]

**Q1: Payment Verification Timing**
- How long does bank transfer verification take? (Current assumption: 5 minutes via webhook)
- Risk: If manual verification needed, may delay order processing → Solution: Integrate real-time banking API

**Q2: Tree Death Rate**
- What is acceptable tree mortality rate? (Current assumption: <10%)
- Risk: If >10% die, financial model breaks → Solution: Insurance or reserve fund

**Q3: GPS Accuracy**
- Can we track individual trees or only lots?
- Current scope: Track by lot (10-100 trees per lot)
- Future: Individual tree GPS (requires RFID tags, high cost)

**Q4: Contract Legal Validity**
- Does digital signature have legal standing in Vietnam?
- Need consultation with legal team
- Fallback: Offer both digital + printed contracts

**Q5: Carbon Credit Verification**
- Who will audit and certify carbon credits?
- Timeline: Year 3-5 (out of MVP scope)
- Dependency: Partnership with Gold Standard/Verra

**Q6: USDT Price Volatility**
- How to handle USDT → VND conversion rate fluctuation?
- Solution: Lock rate for 15 minutes during checkout, or use stablecoin oracle

### Technical Risks[2]

**R1: Blockchain Wallet Generation Speed**
- Risk: Creating 100k wallets may be slow
- Mitigation: Pre-generate wallet pool, assign on demand

**R2: Image Storage Cost**
- Risk: 1M trees × 20 photos × 5 years = 100M photos → High S3 cost
- Mitigation: Aggressive compression, CDN caching, tiered storage (hot/cold)

**R3: Database Scalability**
- Risk: 1M users × 10 trees = 10M tree records → Query performance
- Mitigation: Database sharding, read replicas, caching frequently accessed data

**R4: OTP Delivery Failure**
- Risk: SMS may not deliver in rural areas
- Mitigation: Fallback to email OTP, or allow manual verification by admin

***

## 📅 RELEASE PLAN

### Phase 1: MVP (Month 1-3) - Core Experience[3]
**Goal:** Launch basic user journey + admin tools
- Week 1-4: Frontend (Landing + Dashboard)
- Week 5-8: Backend (Auth, Payment, Order management)
- Week 9-12: Admin tools (Photo upload, Status update)
- **Success Criteria:** 1,000 trees sold, 100 active users

### Phase 2: Growth (March 2026+) - Sprint 2
**Goal:** Increase engagement, admin productivity, platform quality
- Web Push Notifications (PWA) + Enhanced Email Templates
- Referral Leaderboard + CO2 Impact Dashboard
- Bulk Order Processing + Quarterly PDF Report Generator
- Advanced Analytics (cohort, churn, Excel export)
- Multi-lot Camera Management
- Tree Certificate Download + Customer Support Chat
- E2E Test Suite + Monitoring/Alerting + Performance Optimization
- **Success Criteria:** NPS ≥ 50, 30% viral coefficient, Lighthouse score ≥ 90

### Phase 3: Scale (Month 7-12) - Enterprise & Blockchain
**Goal:** Onboard B2B customers and tokenize assets
- Corporate package + API integration
- NFT certificates for trees
- Carbon credit marketplace (pilot)
- **Success Criteria:** 100,000 trees sold, 5 corporate clients

***

## ✅ DEFINITION OF DONE (DoD)

For each User Story to be considered complete:[3][2]

1. **Code Complete:**
   - ✅ Feature implemented per acceptance criteria
   - ✅ Unit tests written (≥80% coverage)
   - ✅ Code reviewed and approved by 1+ team member
   - ✅ No critical/high bugs

2. **Testing:**
   - ✅ Manual QA passed
   - ✅ Integration tests passed
   - ✅ Accessibility tested (WCAG Level AA)
   - ✅ Cross-browser tested (Chrome, Safari, Edge)

3. **Documentation:**
   - ✅ API docs updated (if backend change)
   - ✅ User-facing docs updated (if new feature)
   - ✅ Release notes drafted

4. **Deployment:**
   - ✅ Deployed to staging and tested
   - ✅ Product Owner sign-off
   - ✅ Deployed to production
   - ✅ Monitoring/alerting configured

***

## 📞 STAKEHOLDERS & APPROVALS

| Role | Name | Approval Status | Date |
|------|------|----------------|------|
| Product Owner | Luis | ⏳ Pending Review | - |
| Tech Lead | TBD | ⏳ Pending | - |
| Design Lead | TBD | ⏳ Pending | - |
| Business Stakeholder | TBD | ⏳ Pending | - |

***

## 📚 APPENDIX

### Glossary
- **Tree Code:** Mã định danh duy nhất cho mỗi cây (format: TREE-YYYY-XXXXX)
- **Lot:** Lô cây - nhóm 10-100 cây trồng cùng khu vực
- **OTP:** One-Time Password - mã xác thực 6 chữ số
- **NFR:** Non-Functional Requirement
- **FR:** Functional Requirement

### References[1][3][2]
- [BMAD Method Documentation](https://github.com/bmad-code-org/BMAD-METHOD)
- [Atlassian PRD Guide](https://www.atlassian.com/agile/product-management/requirements)
- [Tree Nation Platform](https://tree-nation.com) - Competitor analysis
- Vietnam Agarwood Market Report 2025

***

**End of PRD v1.0**

*Next Steps:*
1. Review PRD with Luis and stakeholders
2. Refine based on feedback
3. Pass to Architect Agent for Technical Design Document
4. Pass to Scrum Master for User Story breakdown
