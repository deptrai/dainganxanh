# Story 1.7: Success Animation & Share Card

Status: ready-for-dev

## Story

As a **buyer vừa thanh toán xong**,
I want to **thấy confirmation ngay lập tức và share thành tựu**,
so that **tôi cảm thấy vui và có thể inspire bạn bè**.

## Acceptance Criteria

1. **Given** thanh toán thành công  
   **When** success screen load  
   **Then** hiển thị animation "🎉 Cây đang được gieo mầm"

2. **And** auto-generate share card với: tên user, số cây, CO2 impact

3. **And** button "Chia sẻ" nổi bật (sử dụng Web Share API)

4. **When** click share  
   **Then** mở share dialog với text + image + ref link đã chuẩn bị sẵn

5. **And** có buttons: "Về Dashboard" và "Mua Thêm"

## Tasks / Subtasks

- [ ] Task 1: Success Page (AC: 1, 5)
  - [ ] 1.1 Tạo route `/src/app/crm/checkout/success/page.tsx`
  - [ ] 1.2 Receive orderId từ query params
  - [ ] 1.3 Fetch order details + user info

- [ ] Task 2: Celebration Animation (AC: 1)
  - [ ] 2.1 Tạo `components/checkout/SuccessAnimation.tsx`
  - [ ] 2.2 Confetti effect với canvas-confetti
  - [ ] 2.3 Tree growing animation với Framer Motion
  - [ ] 2.4 "Cây đang được gieo mầm" text với typewriter effect

- [ ] Task 3: Share Card Generation (AC: 2)
  - [ ] 3.1 Tạo `/src/app/api/share-card/route.ts` (OG Image)
  - [ ] 3.2 Use `next/og` ImageResponse
  - [ ] 3.3 Design: Green gradient background, user name, tree count, CO2
  - [ ] 3.4 Size: 1200x630 cho social share

- [ ] Task 4: Share Button (AC: 3, 4)
  - [ ] 4.1 Tạo `components/checkout/ShareButton.tsx`
  - [ ] 4.2 Implement Web Share API (native share dialog)
  - [ ] 4.3 Fallback: Copy link button
  - [ ] 4.4 Share text: "Tôi vừa trồng X cây cho Mẹ Thiên Nhiên 🌳"

- [ ] Task 5: Share Card Preview (AC: 2)
  - [ ] 5.1 Tạo `components/checkout/ShareCardPreview.tsx`
  - [ ] 5.2 Display preview của share card
  - [ ] 5.3 Include ref link: `dainganxanh.com.vn/ref/{code}`

- [ ] Task 6: Navigation (AC: 5)
  - [ ] 6.1 "Về Dashboard" → `/crm/dashboard`
  - [ ] 6.2 "Mua Thêm" → `/crm/checkout`

## Dev Notes

### Architecture Compliance
- **Route:** `/crm/checkout/success` - protected
- **API Route:** `/api/share-card` - public (for og:image)
- **Animation:** Framer Motion + canvas-confetti

### Technology Requirements
- **OG Image:** `next/og` với `ImageResponse`
- **Confetti:** `canvas-confetti` library
- **Web Share API:** Native browser sharing

### Share Card Design
```typescript
// Dimensions
const WIDTH = 1200
const HEIGHT = 630

// Colors
const BG_GRADIENT = 'linear-gradient(135deg, #2E8B57, #1A3320)'
const TEXT_COLOR = '#FFFFFF'
const ACCENT_COLOR = '#FFD700' // Gold

// Content
- Logo: Đại Ngàn Xanh
- User Name
- Tree Count (large, gold)
- CO2 Impact: "{count * 20}kg CO2/năm"
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Routes]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Success-Share]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Animation-Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.7]
- [Source: docs/prd.md#FR-06]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/app/crm/checkout/success/page.tsx
- src/components/checkout/SuccessAnimation.tsx
- src/components/checkout/ShareButton.tsx
- src/components/checkout/ShareCardPreview.tsx
- src/app/api/share-card/route.ts
