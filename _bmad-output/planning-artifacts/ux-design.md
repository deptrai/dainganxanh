---
project_name: dainganxanh
document_type: ux-design
version: 1.0
created: 2026-01-09
author: Sally (UX Designer Agent)
based_on: Twenty CRM UI Patterns
---

# UX Design Specification
## Đại Ngàn Xanh x Twenty CRM

---

## 1. Design Philosophy

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Twenty Native** | Extend existing Twenty UI components, không reinvent |
| **Mobile-First** | 70% users sẽ access từ mobile |
| **Nature-Inspired** | Green palette, organic shapes, biophilic elements |
| **Instant Gratification** | Animation sau mỗi action quan trọng |
| **Trust Through Transparency** | GPS, photos, blockchain proof |

### Design Tokens (Extended from Twenty)

```css
/* Dainganxanh Brand Colors */
--dgnx-primary: #2D5016;      /* Forest Green */
--dgnx-secondary: #8BC34A;     /* Lime Green */
--dgnx-accent: #FFB74D;        /* Golden Amber */
--dgnx-success: #4CAF50;       /* Growth Green */
--dgnx-warning: #FF9800;       /* Autumn Orange */
--dgnx-danger: #F44336;        /* Alert Red */
--dgnx-earth: #795548;         /* Earth Brown */

/* Nature Gradients */
--dgnx-gradient-forest: linear-gradient(135deg, #2D5016 0%, #4CAF50 100%);
--dgnx-gradient-sunrise: linear-gradient(135deg, #FF9800 0%, #FFB74D 100%);
```

---

## 2. User Journeys & Wireframes

### 2.1 First-Time Buyer Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    LANDING PAGE (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 HERO VIDEO (Auto-play muted)             │    │
│  │     "Gieo mầm yêu thương - Gặt hái tương lai"           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  🌳 LIVE COUNTER: 125,432 / 1,000,000 cây đã trồng      │    │
│  │  ████████████░░░░░░░░░░░░░░░░░░  12.5%                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│         [====== TRỒNG CÂY NGAY - 260,000đ/cây ======]          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  IMPACT METRICS:   |   CO2 Impact   |   Jobs Created   |        │
│     🌍 2,500 tấn   |   👷 500 nông dân  |  📜 Hợp đồng pháp lý │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Package Selection & Checkout

```
┌─────────────────────────────────────────────────────────────────┐
│                    PACKAGE SELECTION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    Số lượng cây:                          │
│  │   🌱 GÓI CÁ NHÂN │    ┌─────┐                                │
│  │   260,000đ/cây   │    │  5  │ cây    [−] [+]                 │
│  │                  │    └─────┘                                │
│  │  Chi tiết:       │                                           │
│  │  • Giống: 40k    │    ─────────────────────────              │
│  │  • Chăm sóc: 194k│    Tổng: 1,300,000đ                       │
│  │  • Quỹ: 26k      │    CO2: ~75kg/năm 🌍                      │
│  └──────────────────┘                                           │
│                                                                  │
│         [========== TIẾP TỤC THANH TOÁN ==========]             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Email Verification Flow (Twenty Native)

**Pattern:** Uses Twenty's existing `EmailVerificationSent` component

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUICK REGISTRATION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│     ┌─────────────────────────────────────────┐                 │
│     │ 📧 Email của bạn                        │                 │
│     │ _______________________________________ │                 │
│     └─────────────────────────────────────────┘                 │
│                                                                  │
│              [======= TIẾP TỤC =======]                         │
│                                                                  │
│     ─────────────────────────────────────────────               │
│                                                                  │
│     ✉️  Kiểm tra email của bạn                                  │
│                                                                  │
│     Chúng tôi đã gửi link xác thực đến:                         │
│     luis@example.com                                            │
│                                                                  │
│     Click vào link trong email để hoàn tất đăng ký.            │
│                                                                  │
│     📬 Không thấy email?                                        │
│     • Kiểm tra thư mục Spam/Junk                                │
│     • [Gửi lại email]                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

> **Note:** Sử dụng Twenty's `SignInUpWorkspaceScopeForm` + `EmailVerificationSent` components

### 2.4 Payment Selection

```
┌─────────────────────────────────────────────────────────────────┐
│                    THANH TOÁN                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Tổng thanh toán: 1,300,000đ (5 cây)                           │
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────┐        │
│  │ 🏦 CHUYỂN KHOẢN       │  │ 💎 USDT (Polygon)      │        │
│  │                        │  │                        │        │
│  │ Ngân hàng tùy chọn     │  │ Stablecoin, phí thấp  │        │
│  │ Xác nhận trong 5 phút  │  │ Xác nhận trong 2 phút │        │
│  │                        │  │                        │        │
│  │      [CHỌN] ●          │  │      [CHỌN] ○          │        │
│  └────────────────────────┘  └────────────────────────┘        │
│                                                                  │
│  ─────────────── BANKING SELECTED ───────────────               │
│                                                                  │
│  ┌─────────────────────────────────────────────────┐           │
│  │  [QR CODE]   Ngân hàng: Vietcombank            │           │
│  │              STK: 1234567890                    │           │
│  │              Tên: ĐẠI NGÀN XANH JSC            │           │
│  │              Nội dung: DGX-20260109-00123      │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
│         [===== TÔI ĐÃ CHUYỂN KHOẢN =====]                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.5 Success Screen + Share Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎉 THANH TOÁN THÀNH CÔNG!                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│     ╔═══════════════════════════════════════════════════╗       │
│     ║           🌳🌳🌳🌳🌳                               ║       │
│     ║     ANIMATION: Cây đang mọc lên từ đất            ║       │
│     ║     (Lottie animation, 3 seconds)                 ║       │
│     ╚═══════════════════════════════════════════════════╝       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              SHARE CARD (Auto-generated)                │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │  🌳 Luis vừa trồng 5 CÂY DÓ ĐEN                │   │    │
│  │  │                                                  │   │    │
│  │  │  🌍 75 kg CO2 sẽ được hấp thụ mỗi năm          │   │    │
│  │  │  📍 Đắk Nông, Việt Nam                          │   │    │
│  │  │                                                  │   │    │
│  │  │         [Đại Ngàn Xanh Logo]                    │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│     [  📲 SHARE FACEBOOK  ]    [  💾 TẢI ẢNH  ]                │
│                                                                  │
│         [===== XEM VƯỜN CỦA TÔI =====]                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Twenty Frontend Extensions (User Portal)

### 3.1 My Garden Dashboard Page

**Pattern:** Extends Twenty `RecordIndexPage` with custom grid view

```
┌─────────────────────────────────────────────────────────────────┐
│  🌳 Đại Ngàn Xanh          [Search] [🔔] [👤 Luis]             │
├─────────────────────────────────────────────────────────────────┤
│  📊 Dashboard  │ 🌲 Vườn của tôi  │ 📜 Đơn hàng │ 👤 Tài khoản │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ SUMMARY BAR ────────────────────────────────────────────┐   │
│  │ 🌳 5 cây  │  🌍 75kg CO2/năm  │  📅 2 tháng tuổi         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Sort: [Ngày trồng ▼]    Filter: [Tất cả trạng thái ▼]         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ [Photo]  │  │ [Photo]  │  │ [Photo]  │  │ [Photo]  │        │
│  │          │  │          │  │          │  │          │        │
│  │ TREE-001 │  │ TREE-002 │  │ TREE-003 │  │ TREE-004 │        │
│  │ 🌱 Ươm   │  │ 🌱 Ươm   │  │ 🌱 Ươm   │  │ 🌱 Ươm   │        │
│  │ 15kg CO2 │  │ 15kg CO2 │  │ 15kg CO2 │  │ 15kg CO2 │        │
│  │ 2 tháng  │  │ 2 tháng  │  │ 2 tháng  │  │ 2 tháng  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│         [===== TRỒNG THÊM CÂY =====]                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Tree Detail Page

**Pattern:** Extends Twenty `RecordShowPage`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Vườn của tôi                                    [⋮ Actions] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    [HERO PHOTO]                          │    │
│  │               (Latest tree photo 16:9)                   │    │
│  │                                                          │    │
│  │  [◀] Photo Gallery Carousel [▶]                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─ TREE INFO ──────────────────────────────────────────────┐   │
│  │ TREE-2026-00001                          🌱 Đang ươm     │   │
│  │ Trồng: 09/01/2026   │   Thu hoạch dự kiến: 09/01/2031   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ CO2 IMPACT ─────────────────────────────────────────────┐   │
│  │  🌍 TỔNG CO2 HẤP THỤ                                     │   │
│  │                                                           │   │
│  │  ██████████████████░░░░░░░░░░░░░░░░░░░ 12.5 / 300 kg     │   │
│  │                                                           │   │
│  │  = 🚗 50km lái xe  │  = 🍾 500 chai nhựa  │  = 💡 100 giờ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ TIMELINE ───────────────────────────────────────────────┐   │
│  │  📅 Q1-2026 ──●── Gieo hạt                               │   │
│  │                │   [Placeholder image]                    │   │
│  │               ●── Nảy mầm (hiện tại)                     │   │
│  │                │                                          │   │
│  │  📅 Q2-2026 ──○── Trồng xuống đất                        │   │
│  │  📅 Q4-2026 ──○── Ảnh thực tế đầu tiên                   │   │
│  │  📅 2031    ──○── Sẵn sàng thu hoạch 🎉                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ GPS LOCATION ───────────────────────────────────────────┐   │
│  │  [MAP VIEW - Leaflet/Mapbox]                              │   │
│  │                                                           │   │
│  │         📍 Lô A - Đắk Nông                               │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   [📲 SHARE]   [📄 TẢI BÁO CÁO]   [📞 LIÊN HỆ HỖ TRỢ]        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Admin Dashboard (Twenty Standard)

### 4.1 Order Management

**Pattern:** Uses Twenty standard `RecordIndexPage` with filters

| View | Description |
|------|-------------|
| **Table View** | Default, sortable columns |
| **Kanban View** | By order status (Created → Paid → Assigned → Completed) |
| **Filters** | Status, date range, payment method |
| **Actions** | Verify, Assign to Lot, Print Contract |

### 4.2 Tree Lot Management

**Pattern:** Kanban view with capacity indicators

```
┌─────────────────────────────────────────────────────────────────┐
│  Tree Lots                          [+ Add Lot] [View: Kanban]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ LOT-001 ────────┐  ┌─ LOT-002 ────────┐  ┌─ LOT-003 ──────┐│
│  │ Đắk Nông - Lô A  │  │ Đắk Nông - Lô B  │  │ Lâm Đồng - C   ││
│  │                  │  │                  │  │                 ││
│  │ ████████░░ 80%   │  │ █████░░░░░ 50%   │  │ ██░░░░░░░░ 20% ││
│  │ 8,000/10,000     │  │ 4,000/8,000      │  │ 1,000/5,000    ││
│  │                  │  │                  │  │                 ││
│  │ 👷 Operator: Hùng│  │ 👷 Operator: Lan │  │ 👷 Unassigned  ││
│  │                  │  │                  │  │                 ││
│  │ [View Trees]     │  │ [View Trees]     │  │ [View Trees]   ││
│  └──────────────────┘  └──────────────────┘  └─────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Photo Upload (Field Operator)

**Pattern:** Mobile-optimized upload flow

```
┌─────────────────────────────────────────────────────────────────┐
│  📷 Upload Photos                              [Cancel] [Done]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │     [+] Tap to add photos from camera/gallery           │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Selected: 12 photos                                            │
│                                                                  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                    │
│  │ 📷 │ │ 📷 │ │ 📷 │ │ 📷 │ │ 📷 │ │ 📷 │   [6 more...]     │
│  │ ✓  │ │ ✓  │ │ ✓  │ │ ✓  │ │ ✓  │ │ ✓  │                    │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                    │
│                                                                  │
│  📍 GPS detected: 12.4°N, 107.6°E                              │
│  🏷️ Auto-tag to: LOT-001 (Đắk Nông - Lô A)                     │
│                                                                  │
│  ┌─ Compression ────────────────────────────────────────────┐   │
│  │  ░░░░░░░░░░░░░░░░░░░░░░  Compressing... 3/12            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│         [======== UPLOAD & NOTIFY USERS ========]              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile S | 320px | Single column, bottom nav |
| Mobile L | 425px | Single column, larger touch targets |
| Tablet | 768px | 2 columns, side nav appears |
| Laptop | 1024px | 3 columns, full sidebar |
| Desktop | 1440px+ | 4 columns, expanded views |

---

## 6. Animation & Micro-interactions

### Key Animations

| Trigger | Animation | Duration |
|---------|-----------|----------|
| Payment Success | Tree growing from seed (Lottie) | 3s |
| Tree Status Change | Status badge pulse | 0.5s |
| Photo Upload Complete | Checkmark bounce | 0.3s |
| Counter Update | Number count up | 1s |
| Card Hover | Subtle lift + shadow | 0.2s |
| Page Transition | Fade + slide | 0.3s |

### Loading States

- Skeleton screens for data loading
- Shimmer effect on images
- Progress bar for uploads
- Spinner for quick actions

---

## 7. Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Color Contrast | All text ≥ 4.5:1 ratio |
| Focus States | Visible focus ring (green) |
| Screen Reader | Semantic HTML, ARIA labels |
| Keyboard Nav | Full keyboard navigation |
| Touch Targets | Minimum 44x44px |
| Reduced Motion | Respect prefers-reduced-motion |

---

## 8. Component Library

### Using Twenty UI Components

| Component | Twenty Source | Customization |
|-----------|---------------|---------------|
| Button | `twenty-ui/Button` | Green variants |
| Card | `twenty-ui/Card` | Photo card variant |
| Table | `object-record/RecordTable` | Tree columns |
| Kanban | `views/KanbanView` | Lot management |
| Modal | `twenty-ui/Modal` | Payment dialogs |
| Form | `object-record/RecordForm` | Order form |

### New Components Needed

| Component | Purpose | Priority |
|-----------|---------|----------|
| TreeCard | Grid view tree display | P0 |
| CO2Gauge | Carbon impact visualization | P0 |
| TimelineMilestone | Tree history timeline | P0 |
| ShareCard | Social share image | P0 |
| PhotoUploader | Multi-photo upload | P0 |
| MapView | GPS location display | P1 |
| ProgressRing | Circular progress | P1 |

---

## 9. User Testing Checklist

- [ ] First-time buyer can complete purchase in < 3 minutes
- [ ] Email verification link received within 30 seconds
- [ ] Share card appears immediately after payment
- [ ] Dashboard loads in < 2 seconds
- [ ] Tree detail shows timeline correctly
- [ ] Admin can upload 20 photos in < 2 minutes
- [ ] Mobile users can complete all flows
- [ ] Accessibility passes automated scan

---

## References

- [Twenty UI Components](file:///Users/mac_1/Documents/GitHub/dainganxanh/d/packages/twenty-front/src/modules/ui)
- [PRD](file:///Users/mac_1/Documents/GitHub/dainganxanh/docs/prd.md)
- [Architecture](file:///Users/mac_1/Documents/GitHub/dainganxanh/_bmad-output/planning-artifacts/architecture.md)

---

**Document Status:** Complete  
**Next Step:** Create Excalidraw wireframes for key pages
