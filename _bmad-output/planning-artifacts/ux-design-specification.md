---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
status: complete
inputDocuments:
  - docs/prd.md
  - docs/userflow.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/architecture.md
  - dainganxanh-landing/src/app/page.tsx
  - dainganxanh-landing/tailwind.config.js
  - dainganxanh-landing/src/components/MotionWrapper.tsx
baseStyleReference: dainganxanh-landing
---

# UX Design Specification - Đại Ngàn Xanh

**Author:** Luis  
**Date:** January 10, 2026  
**Style Base:** Existing Landing Page Design System

---

## 🎨 Design Foundation (Inherited from Landing Page)

### Brand Identity

**Visual Theme:** Organic Biophilic - Nature-inspired với Forest Green palette, Glassmorphism, và smooth organic curves.

**Emotional Tone:** 
- Ấm áp, gần gũi (Warm, approachable)
- Cao cấp, tinh tế (Premium, sophisticated)  
- Thiên nhiên, bền vững (Nature, sustainable)

---

### Color System

```css
:root {
  /* Primary Brand Colors */
  --brand-50: #F0FFF4;    /* Light mint - backgrounds */
  --brand-100: #C6E6C6;   /* Soft green - secondary bg */
  --brand-500: #2E8B57;   /* Forest Green - primary */
  --brand-600: #1A3320;   /* Deep green - text */
  --brand-900: #0F2615;   /* Dark forest - dark mode */
  
  /* Accent Colors */
  --accent-gold: #FFD700; /* Gold - CTAs, success */
  --accent-blue: #87CEEB; /* Sky blue - info, links */
  
  /* Semantic Colors */
  --success: #22C55E;     /* Green - positive */
  --warning: #F59E0B;     /* Amber - caution */
  --error: #EF4444;       /* Red - errors */
  --info: #3B82F6;        /* Blue - information */
  
  /* Neutral Palette */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;
}
```

### Typography

| Element | Font | Size | Weight | Usage |
|---------|------|------|--------|-------|
| **H1** | Lora | 48-72px | Bold | Hero headlines |
| **H2** | Lora | 32-40px | Bold | Section titles |
| **H3** | Lora | 24-28px | Semibold | Card titles |
| **H4** | Raleway | 18-20px | Semibold | Subsections |
| **Body** | Raleway | 16px | Regular | Paragraphs |
| **Small** | Raleway | 14px | Regular | Captions, meta |
| **Tiny** | Raleway | 12px | Medium | Labels, badges |

### Spacing Scale

```css
/* 4px base unit */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Small elements, badges |
| `rounded-md` | 8px | Inputs, small buttons |
| `rounded-lg` | 12px | Cards, dropdowns |
| `rounded-xl` | 16px | Modals, large cards |
| `rounded-organic` | 24px | Feature cards, CTAs |
| `rounded-full` | 9999px | Pills, avatars |

### Shadows

```css
--shadow-soft: 0 10px 40px -10px rgba(46, 139, 87, 0.15);
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Glassmorphism

```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--rounded-organic);
}

.glass-dark {
  background: rgba(15, 38, 21, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## 🎬 Animation Patterns

### Reveal Animations (On Scroll)

| Animation | Behavior | Duration | Easing |
|-----------|----------|----------|--------|
| `FadeIn` | opacity 0→1, y 20→0 | 600ms | ease-out |
| `StaggerChildren` | Sequential reveal | 150ms delay | ease-out |
| `TextReveal` | Word-by-word | 50ms/word | ease-out |

### Interactive Animations

| Animation | Trigger | Effect |
|-----------|---------|--------|
| `ScaleHover` | hover | scale 1.05 |
| `ScaleTap` | press | scale 0.95 |
| `ButtonGlow` | hover | ring-4 glow |
| `CardLift` | hover | translateY -8px |

### Micro-interactions

| Element | Interaction | Feedback |
|---------|-------------|----------|
| Buttons | Click | Scale + ripple |
| Cards | Hover | Lift + shadow |
| Inputs | Focus | Border glow |
| Toggles | Change | Smooth slide |
| Loading | Wait | Pulse/skeleton |

---

## Executive Summary

### Project Vision

Đại Ngàn Xanh là nền tảng "adopt-a-tree" kết nối người thành thị với thiên nhiên thông qua việc trồng và theo dõi cây Dó Đen thật. Với 260,000 VNĐ, người dùng sở hữu 1 cây được chăm sóc 5 năm, theo dõi qua dashboard số với ảnh thực, GPS, và CO2 impact.

**UX Mission:** Tạo trải nghiệm emotional, transparent, và frictionless để biến người cuộn trang thành người gieo mầm xanh.

### Target Users

**Primary Personas:**
1. **Urban Millennials (25-40)**: Environmentally conscious professionals, busy, mobile-first, willing to pay for convenience
2. **Gen Z Conscious (18-25)**: Social impact driven, love to share achievements, mobile-only
3. **Legacy Parents (30-45)**: Want to create meaningful gift for children, medium tech-savvy
4. **Corporate Gifters**: HR/Admin buying bulk as employee gifts

**User Context:**
- 60-70% mobile web access
- Evening/weekend primary usage
- Quarterly engagement patterns
- Social media referral as primary acquisition

### Key Design Challenges

1. **Emotional Conversion** - Convert visitors to buyers in <60 seconds through compelling storytelling and visuals
2. **Trust Building** - Prove trees are real through GPS, photos, and blockchain transparency
3. **Instant Gratification** - Provide immediate emotional reward before physical tree exists
4. **Long-term Engagement** - Maintain user interest over 5-year tree lifecycle
5. **Frictionless Auth** - OTP-only authentication, zero password complexity

### Design Opportunities

1. **Gamification Elements** - CO2 counters, growth milestones, achievement badges
2. **Social Proof Mechanisms** - Real-time "X người vừa trồng" counters, testimonials
3. **Beautiful Share Assets** - Auto-generated share cards for social virality
4. **Emotional Timeline** - Visual journey from seedling to mature tree
5. **Map Visualization** - Satellite view of actual tree location with GPS coordinates

---

## Core User Experience

### Defining Experience

**Core Loop:** Visit → Emotion → Purchase → Instant Gratification → Share → Referral

Người dùng đến trang, được truyền cảm hứng bởi video và counter, mua cây trong <60 giây, nhận ngay share card đẹp, và chia sẻ với bạn bè. Loop lặp lại qua referral.

**Core Action:** Một người thành thị, bằng một cú chạm, trở thành người gieo mầm cho Đại Ngàn.

### Platform Strategy

| Platform | Approach |
|----------|----------|
| **Mobile Web (Primary)** | PWA-like experience, touch-optimized, bottom navigation |
| **Desktop Web** | Full experience với larger visuals, sidebar navigation |
| **Responsive Breakpoints** | 640px (sm), 768px (md), 1024px (lg), 1280px (xl) |

**Technical Requirements:**
- Touch targets ≥44x44px
- Lazy loading cho images
- Skeleton loading states
- Offline-capable for dashboard viewing

### Effortless Interactions

1. **OTP-only Authentication** - No passwords, no forms, just phone/email + 6 digits
2. **1-Click Purchase** - Quantity → OTP → Pay → Done
3. **Auto-generated Share Cards** - Beautiful image ready to share immediately
4. **Deep Links** - Email links go directly to relevant content
5. **Cached Sessions** - Stay logged in across visits

### Critical Success Moments

| Moment | Design Response |
|--------|-----------------|
| **Purchase Complete** | Confetti animation + share card + "Cây đang được gieo mầm" |
| **First Real Photo** | Push notification + prominent display + "Cây của bạn đã có ảnh thực!" |
| **Quarterly Update** | Email với embedded photos + "X tháng tuổi, hấp thụ Ykg CO2" |
| **1-Year Milestone** | Achievement badge + before/after comparison |
| **5-Year Harvest** | Clear 3 options UI + celebration of completion |

### Experience Principles

1. **Emotion Over Function** - Lead every interaction with feeling, not features
2. **Transparency Always** - GPS, photos, contracts always visible and accessible  
3. **Zero-Friction Design** - Remove every unnecessary step, auto-fill, auto-proceed
4. **Nature-First Aesthetic** - Organic shapes, forest colors, natural textures
5. **Celebrate Every Step** - Acknowledge and celebrate user progress at every milestone

## Desired Emotional Response

### Primary Emotional Goals

| Emotion | When | How |
|---------|------|-----|
| **Tự hào (Pride)** | After purchase | "Tôi là người gieo mầm xanh" |
| **Tin tưởng (Trust)** | Seeing GPS/photos | Real data, không fake |
| **Háo hức (Excitement)** | Quarterly updates | Cây đang lớn dần |
| **Kết nối (Connection)** | Via dashboard | Cảm giác sở hữu thật |

### Emotional Journey Map

```
Discovery     →  Consideration  →  Purchase   →  Post-Purchase  →  Long-term
Curious/Intrigued  Hopeful/Trusting  Excited     Proud/Joyful     Connected/Loyal
```

### Micro-Emotions by Interaction

| Interaction | Desired Feeling | Design Response |
|-------------|-----------------|-----------------|
| Landing load | Wonder, curiosity | Video hero, counter animation |
| Reading price | Affordable, worthwhile | "Chỉ 260k/cây" framing |
| OTP entry | Effortless | Large inputs, auto-focus |
| Payment wait | Confident | Progress indicator, reassurance |
| Success screen | Joyful, accomplished | Confetti, share card |
| Dashboard view | Proud, connected | Beautiful tree cards |
| Photo update | Surprised, delighted | Push notification, zoom view |

### Emotions to Avoid

| ❌ Negative Emotion | Prevention Strategy |
|--------------------|---------------------|
| Confusion | Clear navigation, obvious CTAs |
| Anxiety | Transparent pricing, no hidden fees |
| Frustration | Fast load times, no errors |
| Skepticism | Real photos, GPS, blockchain proof |
| Abandoned | Quarterly engagement, notifications |

---

## User Journeys

### Journey 1: First-Time Buyer (Epic 1)

```
Landing → Video Impact → Counter Social Proof → CTA Click
   ↓
Package View → Quantity Selection → Price Calculation
   ↓
OTP Registration (30s) → Phone/Email + 6 digits
   ↓
Payment Selection → Banking QR / USDT Address
   ↓
Success Animation → Share Card Generation → Social Share
   ↓
Email Confirmation → PDF Contract → Dashboard Access
```

**Key Screens:** Landing, Package, Checkout, OTP, Payment, Success, Dashboard

### Journey 2: Returning User Dashboard (Epic 2)

```
Email/Push Notification → Deep Link → Auto-Login (cached)
   ↓
My Garden Dashboard → Tree Grid View → Select Tree
   ↓
Tree Detail → Timeline + Photos + Map → CO2 Stats
   ↓
Quarterly Report → Photo Comparison → Share Progress
```

**Key Screens:** Dashboard, Tree List, Tree Detail, Photo Gallery, Map View

### Journey 3: Admin Operations (Epic 3)

```
Admin Login → Order Dashboard → Filter "Pending"
   ↓
Order Detail → Verify Payment → Confirm
   ↓
Lot Assignment → Select Available Lot → Generate Codes
   ↓
Field App → Upload Photos → GPS Tag → Bulk Assign
   ↓
Reports → Analytics Dashboard → Export PDF
```

**Key Screens:** Admin Login, Order List, Order Detail, Lot Manager, Photo Upload, Analytics

---

## Component Strategy

### Core UI Components (shadcn/ui base)

| Component | Usage | Customization |
|-----------|-------|---------------|
| **Button** | CTAs, actions | Gold/Green variants, organic radius |
| **Card** | Tree cards, orders | Glass effect, soft shadow |
| **Input** | OTP, forms | Large size for mobile, focus glow |
| **Dialog** | Confirmations | Centered, blur backdrop |
| **Toast** | Notifications | Forest green theme |
| **Tabs** | Navigation sections | Underline style |
| **Badge** | Status, counts | Pill shape, semantic colors |

### Custom Components (Project-specific)

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **TreeCard** | Display tree in grid | Photo, status badge, CO2, GPS icon |
| **OrderCard** | Display order | Amount, status, date, action buttons |
| **ShareCard** | Social share image | Canvas-generated, branded |
| **TimelineStep** | Growth milestones | Icon, date, expandable content |
| **MapView** | GPS location | Satellite view, tree marker |
| **PhotoGallery** | Tree photos | Lightbox, swipe, zoom |
| **Counter** | Live tree counter | Animated number, gradient |
| **OTPInput** | 6-digit code | Auto-focus, paste support |
| **PaymentQR** | Bank/USDT QR | Dynamic generation, copy button |

### Layout Components

| Component | Purpose | Responsive Behavior |
|-----------|---------|---------------------|
| **MarketingLayout** | Landing pages | Full-width, no sidebar |
| **CRMLayout** | Dashboard area | Sidebar (desktop), bottom nav (mobile) |
| **AuthLayout** | Login/Register | Centered card, forest background |
| **AdminLayout** | Admin panel | Collapsible sidebar |

---

## UX Patterns

### Navigation Patterns

| Pattern | Desktop | Mobile |
|---------|---------|--------|
| **Primary Nav** | Top navbar (glass) | Bottom tab bar |
| **Secondary Nav** | Sidebar links | Hamburger menu |
| **Breadcrumbs** | Full path | Back arrow + title |
| **Quick Actions** | FAB (optional) | Bottom sheet |

### Form Patterns

| Pattern | Implementation |
|---------|----------------|
| **OTP Entry** | 6 separate boxes, auto-advance, paste support |
| **Quantity Input** | Stepper with +/- buttons, direct input |
| **Selection** | Radio cards for payment method |
| **Confirmation** | Bottom action bar with primary/secondary |

### Feedback Patterns

| State | Visual Treatment |
|-------|------------------|
| **Loading** | Skeleton shimmer + subtle pulse |
| **Empty** | Illustration + CTA |
| **Error** | Red border + inline message |
| **Success** | Green checkmark + toast |
| **Progress** | Linear indicator for multi-step |

### Data Display Patterns

| Pattern | Use Case |
|---------|----------|
| **Card Grid** | Tree list, order list |
| **Detail Page** | Tree detail with sections |
| **Timeline** | Growth milestones |
| **Stats Cards** | Dashboard KPIs |
| **Data Table** | Admin order management |

---

## Responsive & Accessibility

### Breakpoint Strategy

| Breakpoint | Min Width | Layout Changes |
|------------|-----------|----------------|
| **Mobile** | 0 | Bottom nav, stacked cards, full-width buttons |
| **Tablet** | 768px | Side nav visible, 2-column grid |
| **Desktop** | 1024px | Full sidebar, 3-column grid, hover states |
| **Large** | 1280px | Max-width container, larger spacing |

### Touch Targets

- Minimum touch target: 44×44px
- Spacing between targets: 8px minimum
- Mobile CTAs: Full-width with 56px height

### Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| **Color Contrast** | 4.5:1 for text, 3:1 for large text |
| **Focus States** | Visible focus ring on all interactive elements |
| **Keyboard Nav** | Tab order, arrow keys for menus |
| **Screen Reader** | Semantic HTML, ARIA labels |
| **Reduced Motion** | prefers-reduced-motion media query |
| **Language** | Vietnamese primary, English support |

### Performance Targets

| Metric | Target |
|--------|--------|
| **LCP** | < 2.5s |
| **FID** | < 100ms |
| **CLS** | < 0.1 |
| **TTI** | < 3.5s |

---

## Implementation Notes

### Technology Stack (from Architecture)

- **Frontend:** Next.js 16.1.1 (App Router)
- **Styling:** Tailwind CSS + CSS Variables
- **Components:** shadcn/ui (customized)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **State:** Zustand
- **Data:** React Query + Supabase

### Design Handoff

All design tokens are defined in:
- `tailwind.config.js` - Colors, fonts, spacing
- `globals.css` - CSS variables, animations
- This document - UX patterns, component specs

### Priority Implementation Order

1. **Week 1-2:** Design system setup, core components (Button, Card, Input)
2. **Week 3-4:** Landing page, Auth flow, Checkout
3. **Week 5-6:** Dashboard, Tree detail, Admin basics
4. **Week 7-8:** Polish, animations, accessibility audit

---

**End of UX Design Specification**

