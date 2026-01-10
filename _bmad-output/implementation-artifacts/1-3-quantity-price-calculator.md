# Story 1.3: Quantity Input & Price Calculator

Status: done

## Story

As a **buyer**,
I want to **nhập số lượng cây muốn trồng**,
so that **tôi có thể mua nhiều cây cùng lúc**.

## Acceptance Criteria

1. **Given** tôi ở màn hình tùy chỉnh  
   **When** tôi nhập số lượng từ 1-1000  
   **Then** tổng tiền tự động tính: quantity × 260,000

2. **And** hiển thị: "Tổng: [quantity] × 260,000 = [total] VNĐ"

3. **And** nếu nhập invalid (0, negative, >1000) → hiển thị error message

4. **And** có nút +/- để tăng giảm số lượng nhanh

5. **And** Số lượng tối thiểu = 1, tối đa = 1000

## Tasks / Subtasks

- [x] Task 1: Quantity Selector Component (AC: 1, 2, 4, 5)
  - [x] 1.1 Tạo `components/checkout/QuantitySelector.tsx`
  - [x] 1.2 Input field với type="number"
  - [x] 1.3 Buttons +/- với increment/decrement
  - [x] 1.4 Min/max validation (1-1000)

- [x] Task 2: Price Calculator (AC: 1, 2)
  - [x] 2.1 Tạo `hooks/usePriceCalculator.ts`
  - [x] 2.2 Real-time calculation: quantity × 260,000
  - [x] 2.3 Format currency với Intl.NumberFormat('vi-VN')

- [x] Task 3: Validation & Error Handling (AC: 3)
  - [x] 3.1 Validate input on change
  - [x] 3.2 Show error message cho invalid values
  - [x] 3.3 Disable CTA button khi invalid

- [x] Task 4: Price Summary Display (AC: 2)
  - [x] 4.1 Tạo `components/checkout/PriceSummary.tsx`
  - [x] 4.2 Format: "5 × 260,000 = 1,300,000 VNĐ"
  - [x] 4.3 Highlight tổng tiền với font lớn

## Dev Notes

### Architecture Compliance
- **Component Location:** `/src/components/checkout/`
- **Hook Location:** `/src/hooks/`
- **State:** Local component state, chưa cần Zustand

### Technology Requirements
- **Validation:** Zod schema cho form validation
- **Format:** Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Quantity-Price-Calculator]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Interactive-Elements]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.3]
- [Source: docs/prd.md#FR-03]

## Dev Agent Record

### Agent Model Used
Claude 4.5 Sonnet (2026-01-10)

### Implementation Notes
- Created custom hook `usePriceCalculator` with comprehensive validation
- Implemented +/- buttons with Minus/Plus Lucide icons
- Real-time calculation: quantity × 260,000 VNĐ
- Validation messages for min (1), max (1000), invalid inputs
- Quick select buttons: 5, 10, 50, 100 trees
- Price summary with formula display and CO₂ calculation
- Disabled states for buttons when limits reached
- Error display with animation (Framer Motion)

### File List
- dainganxanh-landing/src/hooks/usePriceCalculator.ts
- dainganxanh-landing/src/components/checkout/QuantitySelector.tsx
- dainganxanh-landing/src/components/checkout/PriceSummary.tsx
- dainganxanh-landing/src/app/(marketing)/quantity/page.tsx

### Change Log
- 2026-01-10: Initial implementation of quantity calculator (Story 1-3)


## Story

As a **buyer**,
I want to **nhập số lượng cây muốn trồng**,
so that **tôi có thể mua nhiều cây cùng lúc**.

## Acceptance Criteria

1. **Given** tôi ở màn hình tùy chỉnh  
   **When** tôi nhập số lượng từ 1-1000  
   **Then** tổng tiền tự động tính: quantity × 260,000

2. **And** hiển thị: "Tổng: [quantity] × 260,000 = [total] VNĐ"

3. **And** nếu nhập invalid (0, negative, >1000) → hiển thị error message

4. **And** có nút +/- để tăng giảm số lượng nhanh

5. **And** Số lượng tối thiểu = 1, tối đa = 1000

## Tasks / Subtasks

- [x] Task 1: Quantity Selector Component (AC: 1, 2, 4, 5)
  - [x] 1.1 Tạo `components/checkout/QuantitySelector.tsx`
  - [x] 1.2 Input field với type="number"
  - [x] 1.3 Buttons +/- với increment/decrement
  - [x] 1.4 Min/max validation (1-1000)

- [x] Task 2: Price Calculator (AC: 1, 2)
  - [x] 2.1 Tạo `hooks/usePriceCalculator.ts`
  - [x] 2.2 Real-time calculation: quantity × 260,000
  - [x] 2.3 Format currency với Intl.NumberFormat('vi-VN')

- [x] Task 3: Validation & Error Handling (AC: 3)
  - [x] 3.1 Validate input on change
  - [x] 3.2 Show error message cho invalid values
  - [x] 3.3 Disable CTA button khi invalid

- [x] Task 4: Price Summary Display (AC: 2)
  - [x] 4.1 Tạo `components/checkout/PriceSummary.tsx`
  - [x] 4.2 Format: "5 × 260,000 = 1,300,000 VNĐ"
  - [x] 4.3 Highlight tổng tiền với font lớn

## Dev Notes

### Architecture Compliance
- **Component Location:** `/src/components/checkout/`
- **Hook Location:** `/src/hooks/`
- **State:** Local component state, chưa cần Zustand

### Technology Requirements
- **Validation:** Zod schema cho form validation
- **Format:** Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Quantity-Price-Calculator]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Interactive-Elements]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.3]
- [Source: docs/prd.md#FR-03]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/components/checkout/QuantitySelector.tsx
- src/components/checkout/PriceSummary.tsx
- src/hooks/usePriceCalculator.ts
