# Story 1.2: Package Selection Screen

Status: done

## Story

As a **potential buyer**,
I want to **xem rõ ràng giá 1 gói cây 260,000đ**,
so that **tôi biết chính xác mình đang trả cho cái gì**.

## Acceptance Criteria

1. **Given** tôi click CTA "Trồng cây ngay"  
   **When** màn hình package hiển thị  
   **Then** hiển thị "Gói Cá nhân: 260,000 VNĐ/cây"

2. **And** có breakdown chi phí:
   - 40,000đ: Cây giống chất lượng cao
   - 194,000đ: Phí chăm sóc 5 năm
   - 26,000đ: Quỹ phát triển cộng đồng

3. **And** button "Tùy chỉnh số lượng" enabled và nổi bật

4. **And** Icon/visual representation cho package làm tăng trust

## Tasks / Subtasks

- [x] Task 1: Package Selection Page (AC: 1, 2, 3, 4)
  - [x] 1.1 Tạo route `/src/app/(marketing)/pricing/page.tsx` HOẶC modal component
  - [x] 1.2 Tạo `components/marketing/PackageCard.tsx`
  - [x] 1.3 Implement cost breakdown với visual icons
  - [x] 1.4 Style theo wireframe: card với border-radius organic

- [x] Task 2: Package Data (AC: 1, 2)
  - [x] 2.1 Define package constants trong `lib/constants.ts`
  - [x] 2.2 Unit price: 260,000 VNĐ
  - [x] 2.3 Breakdown percentages

- [x] Task 3: Navigation Flow (AC: 3)
  - [x] 3.1 CTA button navigates to quantity selector
  - [x] 3.2 Smooth transition animation
  - [x] 3.3 Breadcrumb hoặc step indicator

## Dev Notes

### Architecture Compliance
- **Route:** Có thể là modal overlay từ landing HOẶC separate page `/pricing`
- **State:** Chưa cần global state, local component state đủ

### Technology Requirements
- **UI:** shadcn/ui Card component
- **Animation:** Framer Motion cho hover effects
- **Icons:** Lucide React icons

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Route-Structure]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Package-Selection]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component-Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2]
- [Source: docs/prd.md#FR-02]

## Dev Agent Record

### Agent Model Used
Claude 4.5 Sonnet (2026-01-10)

### Implementation Notes
- Installed dependencies: lucide-react, class-variance-authority, clsx, tailwind-merge
- Created pricing constants with validation (breakdown sums to 260k)
- Implemented PackageCard with Framer Motion animations
- Used Lucide icons: Sprout (seedling), Heart (care), Users (community)
- Pricing page includes trust indicators (5 năm, 100% GPS, 20kg CO₂)

### File List
- dainganxanh-landing/src/lib/constants.ts
- dainganxanh-landing/src/lib/utils.ts
- dainganxanh-landing/src/components/marketing/PackageCard.tsx
- dainganxanh-landing/src/app/(marketing)/pricing/page.tsx

### Change Log
- 2026-01-10: Initial implementation of package selection screen (Story 1-2)


## Story

As a **potential buyer**,
I want to **xem rõ ràng giá 1 gói cây 260,000đ**,
so that **tôi biết chính xác mình đang trả cho cái gì**.

## Acceptance Criteria

1. **Given** tôi click CTA "Trồng cây ngay"  
   **When** màn hình package hiển thị  
   **Then** hiển thị "Gói Cá nhân: 260,000 VNĐ/cây"

2. **And** có breakdown chi phí:
   - 40,000đ: Cây giống chất lượng cao
   - 194,000đ: Phí chăm sóc 5 năm
   - 26,000đ: Quỹ phát triển cộng đồng

3. **And** button "Tùy chỉnh số lượng" enabled và nổi bật

4. **And** Icon/visual representation cho package làm tăng trust

## Tasks / Subtasks

- [x] Task 1: Package Selection Page (AC: 1, 2, 3, 4)
  - [x] 1.1 Tạo route: `/src/app/(marketing)/pricing/page.tsx` HOẶC modal component
  - [x] 1.2 Tạo `components/marketing/PackageCard.tsx`
  - [x] 1.3 Implement cost breakdown với visual icons
  - [x] 1.4 Style theo wireframe: card với border-radius organic

- [x] Task 2: Package Data (AC: 1, 2)
  - [x] 2.1 Define package constants trong `lib/constants.ts`
  - [x] 2.2 Unit price: 260,000 VNĐ
  - [x] 2.3 Breakdown percentages

- [x] Task 3: Navigation Flow (AC: 3)
  - [x] 3.1 CTA button navigates to quantity selector
  - [x] 3.2 Smooth transition animation
  - [x] 3.3 Breadcrumb hoặc step indicator

## Dev Notes

### Architecture Compliance
- **Route:** Có thể là modal overlay từ landing HOẶC separate page `/pricing`
- **State:** Chưa cần global state, local component state đủ

### Technology Requirements
- **UI:** shadcn/ui Card component
- **Animation:** Framer Motion cho hover effects
- **Icons:** Lucide React icons

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Route-Structure]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Package-Selection]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component-Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2]
- [Source: docs/prd.md#FR-02]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/app/(marketing)/pricing/page.tsx (optional)
- src/components/marketing/PackageCard.tsx
- src/lib/constants.ts
