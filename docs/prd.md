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
- **Description:** Thanh toán qua chuyển khoản ngân hàng (MB Bank via VietQR + Casso auto-confirm)
- **Updated:** 2026-03-28 — USDT/MoMo đã loại bỏ, chỉ banking (xem FR-38)
- **Acceptance Criteria:**
  - Given user confirmed order
  - When user chuyển khoản qua QR code VietQR
  - Then Casso webhook xác nhận tự động trong 5 phút
  - And update order status to "Paid"
- **Dependencies:** Casso API, MB Bank `771368999999`
- **Status:** Implemented

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
  - Given tree reaches 120 months old
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

**FR-46: Admin User Impersonation (Vào Tài Khoản User)**
- **Priority:** P1
- **Description:** Admin có thể xem tài khoản của bất kỳ user nào từ góc nhìn của họ để hỗ trợ kỹ thuật và kiểm tra trải nghiệm
- **Status:** Implemented (2026-03-29)
- **Acceptance Criteria:**
  - Given admin truy cập `/crm/admin/users`
  - When click "👁️ Vào tài khoản" của một user
  - Then set httpOnly cookie `admin_impersonate` (8h TTL) và redirect đến `/crm/my-garden`
  - And hiển thị banner vàng "Đang xem tài khoản: [tên user]" trên toàn bộ `/crm`
  - And tất cả trang user-facing (`my-garden`, `referrals`) hiển thị data của user đang được xem
  - When admin click "Thoát ←" trên banner
  - Then xóa cookie và redirect về `/crm/admin/users`
  - And admin không thể vào tài khoản của chính mình
  - And server re-verify admin role mỗi request (không chỉ khi set cookie)
- **Security:**
  - Cookie httpOnly (không đọc được từ JavaScript)
  - `adminId` trong cookie phải khớp với user đang authenticate
  - Dùng Supabase service role để bypass RLS khi đọc data user khác
- **Dependencies:** FR-13 (Admin RBAC), Story 3.8

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

**FR-22: Referral Commission Withdrawal**
- **Priority:** P2
- **Description:** User rút hoa hồng tích lũy về tài khoản ngân hàng
- **Added:** 2026-01-14
- **Dependencies:** FR-20, Banking info

**FR-23: Casso Webhook Auto Payment Verification**
- **Priority:** P0
- **Description:** Tự động xác nhận thanh toán qua MB Bank khi Casso gửi webhook
- **Added:** 2026-01-14
- **Updated:** 2026-03-28 — HMAC SHA-512 sorted keys verification (Casso V2)
- **Acceptance Criteria:**
  - Verify `x-casso-signature` header (HMAC-SHA512 with sorted JSON keys)
  - Match transaction description với order code regex `DH[A-Z0-9]{6}`
  - Amount tolerance: ±1,000 VND
  - Update order status tự động trong 5 phút
- **Dependencies:** Casso account, MB Bank `771368999999`, `CASSO_SECURE_TOKEN`
- **Status:** Implemented

**FR-24: Pre-create Pending Order at Checkout**
- **Priority:** P0
- **Description:** Tạo order pending ngay khi user xác nhận chuyển khoản để match với Casso webhook
- **Added:** 2026-01-14

**FR-25: Admin User Management**
- **Priority:** P1
- **Description:** Admin xem/quản lý tất cả user: search, filter role, thay đổi role, gán mã giới thiệu
- **Added:** 2026-03-28
- **Route:** `/crm/admin/users`

**FR-26: Admin Referral Assignment (Retroactive)**
- **Priority:** P1
- **Description:** Admin gán mã giới thiệu cho user, hoa hồng hồi tố tự động tính cho các đơn cũ
- **Added:** 2026-03-28

**FR-27: Name-based Referral Codes**
- **Priority:** P2
- **Description:** Mã giới thiệu sinh từ tên user không dấu thay vì random DNG######
- **Added:** 2026-03-28
- **Example:** "Nguyễn Văn A" → `nguyenvana`

**FR-28: Default Referral Fallback**
- **Priority:** P2
- **Description:** User đăng ký không qua referral link → tự động dùng mã DNG895075 làm người giới thiệu mặc định
- **Added:** 2026-03-28

**FR-29: Telegram Admin Notifications**
- **Priority:** P1
- **Description:** Gửi thông báo Telegram group khi: đơn mới, thanh toán thành công, admin gán mã giới thiệu
- **Added:** 2026-03-28
- **Dependencies:** Telegram Bot Token + Group Chat ID

**FR-34: Farm Camera Live Stream**
- **Priority:** P2
- **Description:** Hiển thị live camera stream từ vườn trồng cây qua go2rtc gateway
- **Added:** 2026-03-28
- **Acceptance Criteria:**
  - Given user hoặc admin truy cập dashboard
  - When stream available → hiển thị iframe live video
  - When stream offline → hiển thị trạng thái offline
  - And auto-check status mỗi 30 giây
- **Dependencies:** go2rtc server, `stream.dainganxanh.com.vn`
- **Route:** Component `FarmCamera.tsx` trên `/crm/my-garden/[orderId]`
- **Status:** Implemented

**FR-35: Order Cancellation**
- **Priority:** P1
- **Description:** User có thể hủy đơn hàng pending trước khi thanh toán
- **Added:** 2026-03-28
- **Acceptance Criteria:**
  - Given đơn hàng status = pending
  - When user click "Hủy đơn hàng" tại checkout
  - Then status chuyển sang cancelled
- **Route:** `POST /api/orders/cancel`
- **Status:** Implemented

**FR-36: Casso Admin Transaction Sync**
- **Priority:** P1
- **Description:** Admin đồng bộ thủ công giao dịch Casso 24h gần nhất để xử lý các payment bị miss webhook
- **Added:** 2026-03-28
- **Acceptance Criteria:**
  - Given admin ở trang Casso admin
  - When click "Đồng bộ giao dịch"
  - Then fetch transactions từ Casso API (24h gần nhất)
  - And auto-match với pending orders
  - And cho phép retry thủ công cho giao dịch lỗi
- **Dependencies:** `CASSO_API_KEY`
- **Status:** Implemented

**FR-37: Referral Commission Rate (10%)**
- **Priority:** P1
- **Description:** Hoa hồng giới thiệu = 10% giá trị đơn hàng. Hardcoded `COMMISSION_RATE = 0.10`
- **Added:** 2026-03-28
- **Note:** Hiện hardcoded trong `src/actions/referrals.ts`. Nên chuyển sang system settings (FR-45 future)
- **Status:** Implemented

**FR-38: Banking-Only Payment**
- **Priority:** P0
- **Description:** Chỉ hỗ trợ chuyển khoản ngân hàng (MB Bank via VietQR). USDT và MoMo đã được loại bỏ
- **Added:** 2026-03-28 (refactored từ FR-05)
- **Status:** Implemented

**FR-32: Customer Identity Data Collection**
- **Priority:** P0
- **Description:** Thu thập thông tin pháp lý khách hàng (CCCD, ngày sinh, địa chỉ, SĐT) SAU KHI thanh toán thành công tại trang success, phục vụ tạo hợp đồng tự động
- **Added:** 2026-03-28
- **Updated:** 2026-03-29 — Chuyển từ pre-payment sang post-payment
- **Acceptance Criteria:**
  - Given user đã thanh toán thành công (trang /checkout/success)
  - When user điền form thông tin hợp đồng
  - Then validate: CCCD (12 số), ngày sinh, địa chỉ, SĐT bắt buộc
  - And lưu vào orders table qua POST /api/orders/identity
  - And trigger contract generation nếu order đã completed
  - And user có thể bỏ qua, điền sau
- **Dependencies:** DB migration (thêm columns vào orders)

**FR-33: Auto-generate Contract from DOCX Template**
- **Priority:** P0
- **Description:** Tự động điền thông tin khách hàng vào hợp đồng mẫu DOCX, convert sang PDF, overlay chữ ký công ty, và gửi email cho khách sau khi thanh toán thành công
- **Added:** 2026-03-28
- **Acceptance Criteria:**
  - Given Casso webhook xác nhận thanh toán
  - When hệ thống trigger contract generation
  - Then fill DOCX template với customer data (tên, CCCD, ngày sinh, địa chỉ, số lượng cây, tổng tiền)
  - And convert DOCX → PDF
  - And overlay chữ ký + con dấu công ty lên trang cuối
  - And upload PDF lên Supabase Storage
  - And lưu contract_url vào orders
  - And gửi email kèm PDF attachment cho khách
- **Dependencies:** FR-32, docx-templates, LibreOffice headless, pdf-lib
- **Replaces:** Phần PDF generation cơ bản trong FR-07 (giữ nguyên email flow)

**FR-30: SEO Core Setup**
- **Priority:** P1
- **Description:** Meta tags, sitemap.xml, robots.txt, OG image, JSON-LD structured data
- **Added:** 2026-03

**FR-31: Blog CMS**
- **Priority:** P2
- **Description:** Admin viết/publish blog, public đọc bài viết tại `/blog`
- **Added:** 2026-03
- **Dependencies:** Supabase posts table, image storage

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
- Hosting: Dokploy (self-hosted)

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
│   Next.js App    │  (Dokploy — self-hosted)
│   - SSR Pages    │
│   - API Routes   │
│   - LibreOffice  │  ← contract DOCX→PDF
└────────┬─────────┘
         │
         ↓
┌─────────────────────┐
│  Supabase           │
│   - Auth (OTP)      │
│   - PostgreSQL DB   │
│   - Storage         │
│   - Edge Functions  │
└──────┬──────────────┘
       │
       ├─────→ Resend (Email)
       ├─────→ Telegram Bot (Admin alerts)
       ├─────→ Casso (Banking webhook)
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
  Given my tree is 120 months old
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


## 1. Executive Summary

This PRD extends the existing Đại Ngàn Xanh tree-investment platform into two new verticals: **Eco-Stay** (room booking at agarwood gardens) and **Trầm Hương Store** (physical agarwood merchandise). The system is a brownfield Next.js + Supabase web application in the fintech/e-commerce/hospitality domain with high complexity due to payment reconciliation, inventory control, and concurrent booking integrity.

The project has completed multi-perspective expert elicitation covering first-principles analysis, FMEA reliability, pre-mortem failure forecasting, adversarial red-team security, and cross-functional war-room trade-offs. The findings from those reviews are incorporated as **Cross-Cutting Requirements** in Section 4.

## 2. Problem & Opportunity

**Problem:** The platform currently only supports long-term tree sponsorship. It cannot capture ancillary revenue from garden visits or agarwood by-products.

**Opportunity:** Add hospitality and retail modules that share the existing Supabase/Next.js infrastructure while respecting the unique domain rules of lodging reservations (date-range exclusivity, capacity) and physical e-commerce (inventory, shipping, COD).

## 3. Product Vision

**Vision Statement:** Đại Ngàn Xanh becomes a full agarwood lifestyle ecosystem where visitors can sleep among the trees they helped plant and take home authentic agarwood products.

**Strategic Goals (6 months):**
- Launch Eco-Stay MVP with 2-3 garden locations and 1-3 bookable rooms each.
- Launch Trầm Hương Store MVP with 4 categories and direct single-item checkout.
- Maintain 99.5% payment-reconciliation accuracy via Casso webhook.
- Zero overbookings and zero overselling.

## 4. Cross-Cutting Requirements (from Expert Elicitation)

### 4.1 Concurrency & Inventory Integrity

| ID | Requirement | Motivation |
|---|---|---|
| CC-01 | Add a GiST exclusion constraint on `room_bookings` using `btree_gist` to prevent overlapping `pending`/`confirmed` bookings for the same `room_id`. | Eliminate double-booking race conditions. |
| CC-02 | Implement 15-minute ephemeral reservation locks with `expires_at` and a cron worker to release unexpired pending bookings. | Block inventory while payment is in progress. |
| CC-03 | Use atomic stock decrement (`SELECT ... FOR UPDATE` or a PostgreSQL function) for product orders; never read-then-write. | Prevent overselling. |
| CC-04 | Re-calculate all prices and totals server-side from `products`/`rooms` tables; reject client-supplied `total_amount`. | Prevent price tampering. |

### 4.2 Payment & Webhook Architecture

| ID | Requirement | Motivation |
|---|---|---|
| CC-05 | Refactor Casso webhook into a polymorphic dispatcher by order-code prefix: `DH` (tree), `BK` (booking), `ST` (store). | Avoid silently dropped store/booking payments. |
| CC-06 | Record every Casso event in an idempotent `payment_transactions` ledger before applying side-effects. | Enable reconciliation and prevent duplicate processing. |
| CC-07 | Remove USDT from `room_bookings` and `store_orders` schemas; restrict to `banking` (booking) and `banking/cod` (store). | Align with banking-only policy and reduce compliance risk. |
| CC-08 | Implement underpayment handling: partial payment ledger, Telegram alert, and customer notification with remaining amount. | Reduce failed/unknown payment states. |

### 4.3 Security & Access Control

| ID | Requirement | Motivation |
|---|---|---|
| CC-09 | Remove open RLS `WITH CHECK (true)` insert policies on `room_bookings`, `store_orders`, `store_order_items`; route all creates through authenticated server routes / Edge Functions. | Prevent anonymous fake orders, status manipulation, and inventory DoS. |
| CC-10 | Replace repetitive admin subqueries with a `SECURITY DEFINER` `public.is_admin()` function. | Improve RLS performance and avoid recursion. |
| CC-11 | Make the `contracts` storage bucket private; serve contracts via short signed URLs. | Prevent mass PII leakage. |
| CC-12 | Enforce hard API-secret validation (minimum 32 chars, no empty fallbacks) on `/api/contracts/generate` and `/api/orders/identity`. | Prevent unauthorized contract generation and DoS. |
| CC-13 | Add input sanitization for DOCX template fields to prevent XML/template injection. | Avoid LibreOffice crashes and document manipulation. |

### 4.4 Cart & Checkout UX

| ID | Requirement | Motivation |
|---|---|---|
| CC-14 | Use three separate checkout flows: `/checkout/tree`, `/checkout/booking`, `/checkout/store`; do not reuse the tree KYC flow for rooms/products. | Reduce abandonment and branching complexity. |
| CC-15 | Use a hybrid cart: guest items in `localStorage` (product id + qty only) and authenticated users sync to `user_carts` table. | Support cross-device and prevent price drift. |
| CC-16 | For store COD orders, immediately show order confirmation and skip QR/payment polling. | Match customer mental model. |

### 4.5 Operations & Admin

| ID | Requirement | Motivation |
|---|---|---|
| CC-17 | Introduce lot-scoped roles (`resort_manager`, `store_staff`) in addition to coarse `admin`. | Limit on-site staff privileges. |
| CC-18 | Build separate admin views: calendar availability for rooms, inventory ledger for products. | Match operational needs. |
| CC-19 | Add product `origin_type` and `batch_certificate_url` fields; marketing copy must avoid implying new trees produce current oil. | Prevent greenwashing accusations. |
| CC-20 | Send three distinct transactional email templates: Tree Contract, Eco-Stay Voucher, Store Dispatch. | Provide correct post-purchase details. |

### 4.6 Data Validation & Constraints

| ID | Requirement | Motivation |
|---|---|---|
| CC-21 | Enforce `check_in_date >= CURRENT_DATE`, max stay duration (e.g., 30 days), and `guests_count <= rooms.capacity`. | Prevent data corruption and abuse. |
| CC-22 | Add `CHECK (stock_quantity >= 0)` on `products` and reject stale Casso transfers outside a 60-minute window. | Prevent negative inventory and expired payment confirmation. |

### 4.7 Launch & Real-World Operations

| ID | Requirement | Motivation |
|---|---|---|
| CC-23 | Provide offline downloadable booking voucher with QR, turn-by-turn directions, and on-site contact. | Support remote gardens with poor connectivity. |
| CC-24 | Implement on-demand Next.js cache revalidation (`revalidatePath('/store')`) when product/room inventory changes. | Avoid stale stock/availability pages. |
| CC-25 | Add dynamic `room_pricing_rules` for seasonal/weekend/holiday rates instead of flat `price_per_night`. | Avoid revenue loss during peak periods. |

## 5. User Personas

### 5.1 Eco-Tourist (Guest)
- Wants to discover gardens, compare rooms, and book a stay without heavy KYC.
- Concerns: accurate availability, clear pricing, easy check-in, offline access.

### 5.2 Retail Customer
- Wants authentic agarwood products, transparent origin, safe shipping.
- Concerns: stock accuracy, COD trust, fragile packaging, tracking.

### 5.3 Resort Manager
- Needs daily check-in/check-out schedule, room cleaning state, limited access to their lot.
- Concerns: overbooking, staff access, guest communication.

### 5.4 Store Fulfillment Staff
- Needs order queue, inventory tracking, shipping label/tracking input.
- Concerns: overselling, COD fraud, packaging standards.

## 6. User Stories & Acceptance Criteria

### 6.1 Eco-Stay (Room Booking)

#### US-ES-01: Browse Gardens
**As a** guest, **I want** to see gardens with bookable rooms and filter by region, **so that** I can choose a location.
- Acceptance:
  - `/eco-tourism` shows cards with image, name, region, price from, and CTA.
  - Filter tabs: Tất cả, Miền Bắc, Miền Trung, Miền Nam.
  - Only lots with at least one active room are shown.

#### US-ES-02: View Garden & Room Details
**As a** guest, **I want** to see room photos, capacity, amenities, and availability, **so that** I can decide.
- Acceptance:
  - `/eco-tourism/[lotId]` shows gallery, description, map, room cards.
  - Room card shows price/night, capacity, amenities, status.
  - Selecting dates disables rooms already booked in the range.

#### US-ES-03: Book a Room
**As a** guest, **I want** to complete a reservation with my contact info and pay by bank transfer, **so that** I receive a booking confirmation.
- Acceptance:
  - Form: name, phone, email, guest count, special requests.
  - Total = `nights * price_per_night` computed server-side.
  - 15-minute VietQR code with booking code.
  - Casso webhook confirms; status changes to `confirmed`.
  - Success page: booking code, summary, offline voucher link.

#### US-ES-04: Cancel Booking
**As a** guest, **I want** to cancel a pending booking, **so that** I can free the room.
- Acceptance:
  - Cancel button available when status is `pending`.
  - Booking transitions to `cancelled` with reason.
  - Room becomes available immediately.

#### US-ES-05: View My Bookings (CRM)
**As a** logged-in user, **I want** to see my booking history, **so that** I can track trips.
- Acceptance:
  - `/crm/my-bookings` lists bookings: code, room, garden, dates, status, total.
  - Click row to see detail with check-in instructions and QR.

### 6.2 Trầm Hương Store

#### US-ST-01: Browse Products
**As a** customer, **I want** to browse featured products and filter by category, **so that** I can find items.
- Acceptance:
  - `/store` shows hero, category pills, featured section, all-product grid.
  - Filter by category; search by name/description.
  - Card shows image, name, price, stock status, origin badge.

#### US-ST-02: View Product Detail
**As a** customer, **I want** to see full product info, **so that** I can decide to buy.
- Acceptance:
  - `/store/[productSlug]` shows image gallery, name, price, compare-at price, description, specifications table, origin, stock, quantity selector.
  - Related products shown.

#### US-ST-03: Direct Buy Now
**As a** customer, **I want** to buy a product directly, **so that** I can complete a purchase.
- Acceptance:
  - Checkout form: name, phone, email, shipping address, province, note.
  - Payment method: Banking or COD.
  - Banking: 15-minute VietQR.
  - COD: order confirmation without QR.
  - Server-side calculation of subtotal + shipping + total.

#### US-ST-04: Order Tracking
**As a** logged-in user, **I want** to see my store orders, **so that** I can track delivery.
- Acceptance:
  - `/crm/my-store-orders` lists orders: code, items, total, status, date.
  - Detail page shows products, shipping address, tracking number.

### 6.3 Admin Operations

#### US-AD-01: Manage Bookings
**As an** admin/resort manager, **I want** to view and update bookings, **so that** I can operate the resort.
- Acceptance:
  - Table: code, guest, room, garden, dates, status, total.
  - Filter by status, date range, garden.
  - Confirm/cancel actions with reason.

#### US-AD-02: Manage Products
**As an** admin, **I want** to add/edit products, **so that** I can run the store.
- Acceptance:
  - CRUD with name, slug, category, price, stock, SKU, images, specs, origin.
  - Image upload to `product-images` bucket with WebP/thumbnail optimization.

#### US-AD-03: Manage Store Orders
**As an** admin/store staff, **I want** to process orders, **so that** I can ship products.
- Acceptance:
  - Table: code, customer, items, total, address, status.
  - Update status: `pending -> confirmed -> processing -> shipped -> delivered`.
  - Add tracking number when shipped.

## 7. Functional Requirements

### 7.1 Eco-Tourism

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| F-ES-01 | Garden landing page with region filter | P0 | SSR, revalidate on room changes. |
| F-ES-02 | Garden detail with room list | P0 | Reuse marketing header/footer. |
| F-ES-03 | Date-based availability check | P0 | Client + server validation. |
| F-ES-04 | Guest booking form | P0 | Name, phone, email, guest count. |
| F-ES-05 | 15-minute VietQR payment | P0 | Prefix `BK-`. |
| F-ES-06 | Casso webhook confirm | P0 | Update booking, lock room. |
| F-ES-07 | Booking success & offline voucher | P0 | PDF/QR, directions. |
| F-ES-08 | CRM my-bookings list/detail | P1 | Authenticated. |
| F-ES-09 | Admin booking management | P1 | Confirm/cancel/filter. |
| F-ES-10 | Calendar-based room admin | P2 | Gantt/calendar view. |

### 7.2 Trầm Hương Store

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| F-ST-01 | Product catalog page | P0 | Category filter, search. |
| F-ST-02 | Product detail page | P0 | SEO-friendly, SSR. |
| F-ST-03 | Direct buy-now checkout | P0 | Single-item MVP. |
| F-ST-04 | Banking & COD payment | P0 | Prefix `ST-`. |
| F-ST-05 | Casso webhook confirm | P0 | Decrement stock. |
| F-ST-06 | Store order success | P0 | Order code, summary. |
| F-ST-07 | CRM my-store-orders | P1 | Authenticated. |
| F-ST-08 | Admin product CRUD | P1 | Image upload, specs. |
| F-ST-09 | Admin store order management | P1 | Fulfillment workflow. |
| F-ST-10 | Multi-item persistent cart | P2 | Deferred. |

### 7.3 Shared Infrastructure

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| F-SH-01 | Polymorphic Casso webhook dispatcher | P0 | `DH/BK/ST` routing. |
| F-SH-02 | Secure order creation APIs | P0 | Service role, Zod, rate limits. |
| F-SH-03 | Server-side price/total calculation | P0 | Reject client totals. |
| F-SH-04 | Inventory reservation & release | P0 | 15-min timeout worker. |
| F-SH-05 | Three transactional email templates | P1 | Tree/Stay/Store. |
| F-SH-06 | Lot-scoped admin roles | P2 | `resort_manager`, `store_staff`. |

## 8. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Page load time (public pages) | < 3 seconds on 3G |
| NFR-02 | Payment confirmation end-to-end | < 5 minutes via Casso |
| NFR-03 | Overbooking & overselling | 0 incidents |
| NFR-04 | Customer PII exposure | 0 unauthorized leaks |
| NFR-05 | Uptime | 99.5% |
| NFR-06 | Mobile-first responsive | All public pages |
| NFR-07 | WCAG 2.1 AA | Public pages |

## 9. Database Schema (Refined)

### 9.1 Core Tables

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 2,
  price_per_night BIGINT NOT NULL CHECK (price_per_night > 0),
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Room pricing rules (seasonal / weekend / holiday)
CREATE TABLE IF NOT EXISTS public.room_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_per_night BIGINT NOT NULL CHECK (price_per_night > 0),
  min_nights INTEGER DEFAULT 1,
  CHECK (end_date >= start_date)
);

-- Room bookings
CREATE TABLE IF NOT EXISTS public.room_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests_count INTEGER NOT NULL DEFAULT 1 CHECK (guests_count > 0),
  nights_count INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
  total_amount BIGINT NOT NULL CHECK (total_amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('banking')),
  payment_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  special_requests TEXT,
  cancellation_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT room_bookings_dates_check CHECK (check_out_date > check_in_date),
  CONSTRAINT room_bookings_stay_check CHECK (check_out_date - check_in_date <= 30),
  CONSTRAINT exclude_overlapping_bookings
    EXCLUDE USING gist (
      room_id WITH =,
      daterange(check_in_date, check_out_date, '[)') WITH &&
    ) WHERE (status IN ('pending', 'confirmed', 'completed'))
);

-- Product categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE RESTRICT,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price BIGINT NOT NULL CHECK (price > 0),
  compare_at_price BIGINT CHECK (compare_at_price > 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  sku TEXT UNIQUE,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  origin_type TEXT NOT NULL DEFAULT 'mature_partner_plantation' CHECK (origin_type IN ('mature_partner_plantation', 'cooperative_farm', 'dainganxanh_harvest')),
  batch_certificate_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Store orders
CREATE TABLE IF NOT EXISTS public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  shipping_address TEXT NOT NULL,
  shipping_province TEXT,
  shipping_note TEXT,
  subtotal BIGINT NOT NULL CHECK (subtotal > 0),
  shipping_fee BIGINT NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  total_amount BIGINT NOT NULL CHECK (total_amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('banking', 'cod')),
  payment_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  tracking_number TEXT,
  cancellation_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Store order items
CREATE TABLE IF NOT EXISTS public.store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price BIGINT NOT NULL CHECK (unit_price > 0),
  subtotal BIGINT GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment transactions ledger
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type TEXT NOT NULL CHECK (order_type IN ('tree', 'booking', 'store')),
  order_id UUID NOT NULL,
  order_code TEXT NOT NULL,
  casso_tid TEXT NOT NULL,
  amount BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'amount_mismatch', 'stale', 'duplicate')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User carts (for authenticated users)
CREATE TABLE IF NOT EXISTS public.user_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
```

### 9.2 Stored Procedures

```sql
-- Admin check helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  );
$$;

-- Atomic product stock reservation
CREATE OR REPLACE FUNCTION public.reserve_product_stock(p_product_id UUID, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - p_qty,
      reserved_quantity = reserved_quantity + p_qty
  WHERE id = p_product_id AND stock_quantity >= p_qty;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Release reserved product stock
CREATE OR REPLACE FUNCTION public.release_product_stock(p_product_id UUID, p_qty INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity + p_qty,
      reserved_quantity = GREATEST(reserved_quantity - p_qty, 0)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Booking capacity and date validation trigger
CREATE OR REPLACE FUNCTION public.validate_room_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_capacity INT;
BEGIN
  SELECT capacity INTO v_capacity FROM public.rooms WHERE id = NEW.room_id;

  IF NEW.guests_count > v_capacity THEN
    RAISE EXCEPTION 'Guest count exceeds room capacity of %', v_capacity;
  END IF;

  IF NEW.check_in_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Check-in date cannot be in the past';
  END IF;

  IF NEW.check_out_date - NEW.check_in_date > 30 THEN
    RAISE EXCEPTION 'Stay cannot exceed 30 nights';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_room_booking
BEFORE INSERT OR UPDATE ON public.room_bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_room_booking();

-- Release expired pending bookings
CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS void AS $$
BEGIN
  UPDATE public.room_bookings
  SET status = 'cancelled', cancellation_reason = 'Payment timeout (15 mins)'
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Release expired pending store orders
CREATE OR REPLACE FUNCTION public.expire_pending_store_orders()
RETURNS void AS $$
BEGIN
  UPDATE public.store_orders
  SET status = 'cancelled', cancellation_reason = 'Payment timeout (15 mins)'
  WHERE status = 'pending'
    AND payment_method = 'banking'
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
```

### 9.3 RLS Policies

```sql
-- Rooms: public read, admin write
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_public_read"
  ON public.rooms FOR SELECT
  USING (status = 'active');

CREATE POLICY "rooms_admin_all"
  ON public.rooms FOR ALL
  USING (public.is_admin());

-- Room bookings: no direct client insert
ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_bookings_user_select"
  ON public.room_bookings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "room_bookings_admin_all"
  ON public.room_bookings FOR ALL
  USING (public.is_admin());

-- Product categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_categories_public_read"
  ON public.product_categories FOR SELECT
  USING (true);

CREATE POLICY "product_categories_admin_all"
  ON public.product_categories FOR ALL
  USING (public.is_admin());

-- Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_public_read"
  ON public.products FOR SELECT
  USING (status IN ('active', 'out_of_stock'));

CREATE POLICY "products_admin_all"
  ON public.products FOR ALL
  USING (public.is_admin());

-- Store orders: no direct client insert
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_orders_user_select"
  ON public.store_orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "store_orders_admin_all"
  ON public.store_orders FOR ALL
  USING (public.is_admin());

-- Store order items
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_order_items_user_select"
  ON public.store_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_orders
      WHERE store_orders.id = store_order_items.store_order_id
      AND store_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "store_order_items_admin_all"
  ON public.store_order_items FOR ALL
  USING (public.is_admin());

-- User carts
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_carts_owner"
  ON public.user_carts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 9.4 Storage Buckets

```sql
-- Product and room images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-images',
  'room-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "room_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'room-images');

CREATE POLICY "product_images_admin_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

CREATE POLICY "room_images_admin_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'room-images'
    AND public.is_admin()
  );
```

## 10. API Routes

### 10.1 Eco-Stay

| Method | Route | Description |
|---|---|---|
| GET | `/api/rooms?lotId=...` | List active rooms by lot |
| GET | `/api/bookings/availability?roomId=...&checkIn=...&checkOut=...` | Check availability |
| POST | `/api/bookings/create` | Create pending booking (server-validated) |
| GET | `/api/bookings/status?code=...` | Poll booking status |
| POST | `/api/bookings/cancel` | Cancel pending booking |
| PUT | `/api/admin/bookings/[id]/confirm` | Admin confirm booking |
| PUT | `/api/admin/bookings/[id]/cancel` | Admin cancel booking |

### 10.2 Store

| Method | Route | Description |
|---|---|---|
| GET | `/api/store/products` | List active products |
| GET | `/api/store/products/[slug]` | Product detail |
| POST | `/api/store/cart/sync` | Sync localStorage cart for authenticated users |
| POST | `/api/store/orders/create` | Create store order (server-validated) |
| GET | `/api/store/orders/[id]/status` | Poll store order status |
| PUT | `/api/admin/store-orders/[id]/status` | Admin update order status |
| PUT | `/api/admin/store-orders/[id]/ship` | Add tracking number |

### 10.3 Payment

| Method | Route | Description |
|---|---|---|
| POST | `/api/webhooks/casso` | Polymorphic dispatcher for DH/BK/ST |
| POST | `/api/payments/expire-pending` | Cron endpoint to release expired holds |

## 11. Route Structure

### Public Routes
- `/eco-tourism` — Garden listing
- `/eco-tourism/[lotId]` — Garden detail
- `/eco-tourism/[lotId]/book` — Booking form
- `/eco-tourism/booking/success` — Booking success
- `/store` — Store catalog
- `/store/[productSlug]` — Product detail
- `/store/checkout` — Store checkout
- `/store/checkout/success` — Order success

### CRM Routes (authenticated)
- `/crm/my-bookings` — My bookings
- `/crm/my-bookings/[id]` — Booking detail
- `/crm/my-store-orders` — My store orders
- `/crm/my-store-orders/[id]` — Store order detail

### Admin Routes
- `/crm/admin/bookings` — Manage bookings
- `/crm/admin/rooms` — Manage rooms
- `/crm/admin/products` — Manage products
- `/crm/admin/store-orders` — Manage store orders

## 12. Webhook & Payment Reconciliation Flow

```
Casso -> /api/webhooks/casso
  |
  +-- Prefix DH -> process tree order
  +-- Prefix BK -> confirm room booking
  +-- Prefix ST -> confirm store order (decrement stock)
  |
  +-- amount_mismatch -> payment_transactions ledger + alert + customer notify
  +-- stale -> reject
  +-- duplicate -> idempotent skip
```

## 13. UI/UX Notes

- No shadcn/ui; use native HTML inputs + Tailwind + lucide-react.
- Mobile-first; date pickers use `<input type="date">` with `min`/`max` validation.
- Payment screens show 15-minute countdown and copyable transfer description.
- Admin room view uses calendar; admin product view uses inventory ledger.

## 14. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Double-booking | GiST exclusion constraint + reservation locks |
| Overselling | Atomic stock decrement + reservation system |
| Payment drops | Polymorphic webhook + payment transactions ledger |
| Client price tampering | Server-side total calculation |
| PII leakage | Private contract bucket + signed URLs |
| Stale cache | On-demand revalidation on inventory change |
| Offline check-in | Downloadable voucher with QR and directions |
| COD fraud/risk | OTP for guests, deposit for high-value orders |

## 15. Open Questions

1. Should COD orders > 1,000,000 VND require a partial banking deposit?
2. Should tree owners receive a discount code for Eco-Stay and Store?
3. Which courier(s) will be integrated for live tracking after MVP?
4. Which gardens and rooms will be piloted for launch?
5. Do existing tree investors need the CCCD fields pre-filled from `orders` table?

---

*PRD generated from expert elicitation: First-Principles, FMEA, Pre-Mortem, Red-Team Security, Cross-Functional War Room.*


---

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
