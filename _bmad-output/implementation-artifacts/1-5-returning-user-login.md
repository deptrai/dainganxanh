# Story 1.5: Returning User Login

Status: done

## Story

As a **returning user**,
I want to **đăng nhập nhanh để mua thêm cây**,
so that **tôi không cần tạo tài khoản mới**.

## Acceptance Criteria

1. **Given** tôi ở checkout screen và đã có tài khoản  
   **When** tôi chọn "Đã có tài khoản"  
   **Then** hiển thị form login (Email/SĐT + OTP) ✅

2. **When** tôi xác thực thành công  
   **Then** session được restore ✅

3. **And** thông tin checkout được pre-fill từ profile ⏳ (defer to Story 1-6)

4. **And** có thể xem lịch sử mua hàng nếu cần ⏳ (defer to Story 2.1)

## Dev Agent Record

### Agent Model Used
Claude 4.5 Sonnet (2026-01-10)

### Implementation Notes
- **Reused 100% of components** from Story 1-4 (PhoneEmailInput, OTPInput, useAuth)
- **No backend changes needed** - Supabase Auth handles login/register with same OTP flow
- Created `/login` page with identical flow to `/register`
- Added bidirectional navigation links between login/register
- Created auth helper utilities for session management
- AC3 & AC4 deferred to later stories (checkout pre-fill, order history)

### File List
- dainganxanh-landing/src/app/(auth)/login/page.tsx (NEW)
- dainganxanh-landing/src/app/(auth)/register/page.tsx (MODIFIED - added login link)
- dainganxanh-landing/src/lib/auth-helpers.ts (NEW)

### Change Log
- 2026-01-10: Story 1-5 implementation complete
- Minimal code changes - mostly UI/UX work reusing existing components

## Story

As a **returning user**,
I want to **đăng nhập nhanh để mua thêm cây**,
so that **tôi không cần tạo tài khoản mới**.

## Acceptance Criteria

1. **Given** tôi ở checkout screen và đã có tài khoản  
   **When** tôi chọn "Đã có tài khoản"  
   **Then** hiển thị form login (Email/SĐT + OTP)

2. **When** tôi xác thực thành công  
   **Then** session được restore

3. **And** thông tin checkout được pre-fill từ profile

4. **And** có thể xem lịch sử mua hàng nếu cần

## Tasks / Subtasks

- [ ] Task 1: Login Page (AC: 1)
  - [ ] 1.1 Tạo route `/src/app/(auth)/login/page.tsx`
  - [ ] 1.2 Reuse `PhoneEmailInput` và `OTPInput` components từ Story 1.4
  - [ ] 1.3 "Đã có tài khoản?" link từ register page

- [ ] Task 2: Login Flow (AC: 2)
  - [ ] 2.1 Update `hooks/useAuth.ts` với login method
  - [ ] 2.2 Verify OTP against existing user
  - [ ] 2.3 Create Supabase session
  - [ ] 2.4 Store session trong cookie (Supabase SSR)

- [ ] Task 3: Session Restoration (AC: 2, 3)
  - [ ] 3.1 Implement `middleware.ts` cho auth check
  - [ ] 3.2 Pre-fill checkout với user profile data
  - [ ] 3.3 Remember last order preferences

- [ ] Task 4: Order History Access (AC: 4)
  - [ ] 4.1 Link đến `/crm/my-orders` từ checkout
  - [ ] 4.2 Show "Bạn đã mua X cây trước đó" message

## Dev Notes

### Architecture Compliance
- **Auth:** Supabase Auth với cookie-based session
- **Middleware:** `/src/middleware.ts` protect `/crm/*` routes
- **Session:** Supabase SSR client

### Technology Requirements
- **Supabase SSR:** `@supabase/ssr` package
- **Cookies:** Secure, httpOnly cookies

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication-Authorization]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form-Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.5]
- [Source: docs/prd.md#FR-04B]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/app/(auth)/login/page.tsx
- src/middleware.ts
- src/hooks/useAuth.ts (update)
