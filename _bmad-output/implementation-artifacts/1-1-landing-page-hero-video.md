# Story 1.1: Landing Page với Hero Video & Counter

Status: ready-for-dev

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

- [ ] Task 1: Setup Page Structure (AC: 1, 3, 5)
  - [ ] 1.1 Tạo route `/src/app/(marketing)/page.tsx`
  - [ ] 1.2 Import existing layout từ `dainganxanh-landing`
  - [ ] 1.3 Verify Tailwind config với brand colors từ `tailwind.config.js`

- [ ] Task 2: Hero Video Component (AC: 1)
  - [ ] 2.1 Tạo `components/marketing/HeroVideo.tsx`
  - [ ] 2.2 Implement autoplay với muted + controls
  - [ ] 2.3 Fallback poster image nếu video chưa load
  - [ ] 2.4 Optimize video với CDN (Vercel Edge)

- [ ] Task 3: Live Counter Component (AC: 2)
  - [ ] 3.1 Tạo `components/marketing/TreeCounter.tsx`
  - [ ] 3.2 Setup Supabase realtime subscription cho `trees` count
  - [ ] 3.3 Implement animated number increment (Framer Motion)
  - [ ] 3.4 Format số với dấu phẩy: "138,592 / 1,000,000"

- [ ] Task 4: CTA Button (AC: 4)
  - [ ] 4.1 Tạo `components/marketing/CTAButton.tsx`
  - [ ] 4.2 Style theo brand: green gradient với hover animation
  - [ ] 4.3 Link đến `/crm/checkout` hoặc `/register` nếu chưa login

- [ ] Task 5: Performance Optimization (AC: 3)
  - [ ] 5.1 Implement lazy loading cho video
  - [ ] 5.2 Add metadata và OG tags
  - [ ] 5.3 Test Lighthouse score ≥ 90

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
{{agent_model_name_version}}

### Completion Notes List

### File List
- src/app/(marketing)/page.tsx
- src/components/marketing/HeroVideo.tsx
- src/components/marketing/TreeCounter.tsx
- src/components/marketing/CTAButton.tsx
