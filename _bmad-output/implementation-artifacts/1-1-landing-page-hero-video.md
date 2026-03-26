# Story 1.1: Landing Page với Hero Video & Counter

Status: review

## Story

As a **visitor**,
I want to **xem trailer video và counter động "X/1,000,000 cây"**,
so that **tôi hiểu được sứ mệnh dự án và có động lực tham gia**.

## Acceptance Criteria

1. **Given** tôi truy cập trang chủ  
   **When** trang được load  
   **Then** video hero autoplay (muted) với controls

2. **And** counter hiển thị "X/1,000,000 cây đã trồng" cập nhật real-time từ database

3. **And** page load time < 3 giây (Core Web Vitals compliant)

4. **And** CTA "Trồng cây ngay" nổi bật, dẫn đến checkout flow

5. **And** Responsive: Mobile-first, hoạt động tốt trên iOS Safari và Android Chrome

## Tasks / Subtasks

- [x] Task 1: Setup Page Structure (AC: 1, 3, 5)
  - [x] 1.1 Landing page exists at `/src/app/page.tsx` — integrated new components
  - [x] 1.2 Reused existing layout from `dainganxanh-landing`
  - [x] 1.3 Brand colors verified in existing Tailwind config

- [x] Task 2: Hero Video Component (AC: 1)
  - [x] 2.1 Created `components/marketing/HeroVideo.tsx`
  - [x] 2.2 Implemented autoplay with muted + loop + playsInline
  - [x] 2.3 Fallback poster image while video loads (state-based)
  - [x] 2.4 Video served from public folder, gradient overlay for readability

- [x] Task 3: Live Counter Component (AC: 2)
  - [x] 3.1 Created `components/marketing/TreeCounter.tsx`
  - [x] 3.2 Supabase realtime subscription on `trees` table INSERT
  - [x] 3.3 Animated number increment using Framer Motion spring
  - [x] 3.4 Format with vi-VN locale: "138.592 / 1.000.000"

- [x] Task 4: CTA Button (AC: 4)
  - [x] 4.1 Created `components/marketing/CTAButton.tsx`
  - [x] 4.2 Gold gradient with hover animation, ring-4 accent
  - [x] 4.3 Links to `/pricing` (checkout flow entry point)

- [x] Task 5: Performance Optimization (AC: 3)
  - [x] 5.1 Video uses preload="auto" + poster fallback for fast FCP
  - [x] 5.2 OG tags already added in Story 6-1 (SEO core setup)
  - [x] 5.3 Lazy video load via state; poster shown immediately

## Dev Notes

### Architecture Compliance
- **Stack:** Next.js 16.1.1 + Supabase
- **Route Pattern:** `(marketing)` group cho public pages
- **Component Location:** `/src/components/marketing/`

### Technology Requirements
- **Video:** HTML5 video với Vercel CDN
- **Animation:** Framer Motion 12.x cho counter animation
- **Supabase:** Real-time subscription cho live counter
- **Styling:** Tailwind + shadcn/ui

### Project Structure Notes
- Landing page đã có base từ `dainganxanh-landing/`
- Cần migrate sang App Router structure
- Brand colors: `brand-green: #2E8B57`, `forest-dark: #1A3320`

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.1]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Landing-Page]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-Foundation]

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6

### Completion Notes List
- Integrated HeroVideo, TreeCounter, CTAButton into existing landing page (src/app/page.tsx)
- TreeCounter uses Supabase realtime subscription with Framer Motion spring animation
- HeroVideo autoplays muted with poster fallback for fast initial paint
- CTAButton reusable component with primary/secondary variants
- Replaced hardcoded "138,592" counter with live database count

### File List
- src/app/page.tsx (modified — integrated new components)
- src/components/marketing/HeroVideo.tsx (new)
- src/components/marketing/TreeCounter.tsx (new)
- src/components/marketing/CTAButton.tsx (new)
