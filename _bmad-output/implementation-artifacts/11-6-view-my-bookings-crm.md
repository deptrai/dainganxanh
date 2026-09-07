# Story 11.6: View My Bookings (CRM)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

**As a** logged-in user,
**I want** to see my booking history,
**So that** I can track trips.

## Acceptance Criteria

1. **View bookings list at `/crm/my-bookings`**:
   - **Given** I am authenticated and navigate to `/crm/my-bookings`
   - **When** the page loads
   - **Then** I see a list/table with columns: code, room name, garden name, check-in date, check-out date, status, total amount
   - **And** bookings are ordered by `created_at` DESC (newest first)
   - **And** each row is clickable and links to detail view
   - **And** status badge shows color coding: `pending`=amber, `confirmed`=emerald, `cancelled`=red, `completed`=blue, `no_show`=gray
   - **And** total amount formatted as VND (e.g., "2.400.000 ₫")

2. **View booking detail at `/crm/my-bookings/[bookingId]`**:
   - **Given** I am on the bookings list
   - **When** I click a booking row
   - **Then** I navigate to `/crm/my-bookings/[bookingId]` showing detail
   - **And** detail shows: booking code, room name, garden name, check-in/out dates, nights count, guest count, guest info (name, phone, email), special requests, total amount, status, payment method
   - **And** if status is `pending` or `confirmed` and `expires_at` is in future, show QR payment button/link
   - **And** if status is `pending`, show "Hủy đặt phòng" button that calls cancel API
   - **And** if status is `confirmed` or `completed`, show "Check-in instructions" section
   - **And** check-in instructions include: garden address (from `lots.location`), check-in time note, contact phone, special requirements reminder
   - **And** if status is `cancelled` or `no_show`, show cancellation reason only if the current user is the booking owner (not for other users)
   - **And** never expose `payment_ref` or `payment_claimed_at` in any API response or UI

3. **Empty state**:
   - **Given** I have no bookings
   - **When** the page loads
   - **Then** I see "Bạn chưa có đặt phòng nào" message
   - **And** a "Khám phá vườn nghỉ dưỡng" button linking to `/eco-tourism`

4. **Access control**:
   - **Given** I am not authenticated
   - **When** I navigate to `/crm/my-bookings` or `/crm/my-bookings/[bookingId]`
   - **Then** the CRM layout redirects me to `/login` (see `src/app/crm/layout.tsx`)
   - **And** if `getImpersonationContext()` returns `null`, the page redirects to `/login?redirect=/crm/my-bookings` (or `/crm/my-bookings/[bookingId]`)
   - **And** after login, I redirect back to the original destination

5. **Impersonation support**:
   - **Given** admin is impersonating a user
   - **When** I view `/crm/my-bookings` or detail
   - **Then** I see bookings for the impersonated user (not admin's own bookings)

6. **Security & privacy**:
   - **Given** I am authenticated
   - **When** I view another user's booking detail via direct URL
   - **Then** I see "Không tìm thấy đặt phòng" (404) or redirect to my own list (not 403)
   - **And** never expose `payment_ref`, `payment_claimed_at`, or `cancellation_reason` (if admin-only) in UI

## Tasks / Subtasks

- [ ] Task 1: Create API route `GET /api/bookings/my` (AC: #1, #4, #5, #6)
  - [ ] Create `src/app/api/bookings/my/route.ts`
  - [ ] Use `createServiceRoleClient` with `getImpersonationContext` to get `effectiveUserId`
  - [ ] Query `room_bookings` where `user_id = effectiveUserId`
  - [ ] Join with `rooms` and `lots` to get room name and garden name
  - [ ] Order by `created_at` DESC
  - [ ] Return only safe fields: id, code, room_name, lot_name, check_in_date, check_out_date, nights_count, guests_count, status, total_amount, payment_method, expires_at, created_at
  - [ ] Add rate limiting (100 req/min per IP)
  - [ ] Add `captureError` for server errors

- [ ] Task 2: Create page `GET /crm/my-bookings` (AC: #1, #3, #4, #5)
  - [ ] Create `src/app/crm/my-bookings/page.tsx`
  - [ ] Use `getImpersonationContext` in Server Component
  - [ ] Fetch bookings via `createServiceRoleClient` (server-side, not API call)
  - [ ] Display list/table with all columns
  - [ ] Add pagination (20 items per page) with simple offset/limit or cursor
  - [ ] Default sort `created_at` DESC
  - [ ] Make rows clickable to navigate to detail
  - [ ] Add empty state with link to `/eco-tourism`
  - [ ] Style with existing CRM theme (emerald/green palette)
  - [ ] Add `Suspense` boundary for loading state

- [ ] Task 3: Create page `GET /crm/my-bookings/[bookingId]` (AC: #2, #4, #5, #6)
  - [ ] Create `src/app/crm/my-bookings/[bookingId]/page.tsx`
  - [ ] Use `getImpersonationContext` and `createServiceRoleClient`
  - [ ] Fetch single booking by `id` + `user_id = effectiveUserId`
  - [ ] If not found, return `notFound()` (404)
  - [ ] Display all detail fields
  - [ ] Show conditional sections based on status:
    - `pending` → payment QR button + cancel button
    - `confirmed`/`completed` → check-in instructions
    - `cancelled`/`no_show` → cancellation reason (if exists and not empty)
  - [ ] Add "Back to list" link
  - [ ] Add `robots: { index: false }` metadata

- [ ] Task 4: Create reusable components (AC: #1, #2)
  - [ ] `src/components/crm/BookingTable.tsx` — table/list for bookings
  - [ ] `src/components/crm/BookingStatusBadge.tsx` — color-coded status badge
  - [ ] `src/components/crm/BookingDetail.tsx` — detail view component
  - [ ] `src/components/crm/CancelBookingButton.tsx` — cancel button with confirm modal (reuse pattern from `VietQRDisplay`)
    - [ ] Calls `POST /api/bookings/cancel` with `{ bookingCode, reason: "Khách hủy từ CRM" }`
    - [ ] On success, redirect to `/crm/my-bookings?cancelled=1`
    - [ ] On error, show inline error message
  - [ ] `src/components/crm/CheckInInstructions.tsx` — instructions block

- [ ] Task 5: Add navigation link in CRM header (AC: #1)
  - [ ] Update `src/components/layout/CRMHeader.tsx`
  - [ ] Add "Đặt phòng" or "Lịch sử đặt phòng" link to `/crm/my-bookings` in nav items
  - [ ] Icon: use `Calendar` or `Bed` from lucide-react

- [ ] Task 6: Write tests (AC: all)
  - [ ] `src/app/api/bookings/my/__tests__/route.test.ts` — test list endpoint, auth, impersonation, error cases
  - [ ] `src/app/crm/my-bookings/__tests__/page.test.tsx` — test list render, empty state, auth redirect, pagination controls
  - [ ] `src/app/crm/my-bookings/[bookingId]/__tests__/page.test.tsx` — test detail render, 404 for other user's booking
  - [ ] `src/components/crm/__tests__/BookingTable.test.tsx` — test table rendering
  - [ ] `src/components/crm/__tests__/BookingStatusBadge.test.tsx` — test status colors and labels
  - [ ] `src/components/crm/__tests__/CancelBookingButton.test.tsx` — test modal, cancel API call, redirect

- [ ] Task 7: Build and typecheck verification
  - [ ] `npm test`
  - [ ] `npx tsc --noEmit`
  - [ ] `npm run build`

## Dev Notes

### Anti-Pattern & Wheel Reinvention Guard

1. **DO NOT create new state management** — Use server components + `searchParams` for detail view if needed.
2. **Reuse existing patterns**:
   - `getImpersonationContext` from `@/lib/getImpersonationContext` for effective user ID
   - `createServiceRoleClient` from `@/lib/supabase/server` for DB access
   - `captureError` from `@/lib/monitoring` for error tracking
   - `rateLimit` from `@/lib/rate-limit` for API rate limiting
3. **DO NOT expose sensitive fields** in list or detail view:
   - `payment_ref` — internal reference
   - `payment_claimed_at` — internal timestamp
   - `cancellation_reason` — only show to admin or when status is `cancelled`/`no_show`
4. **DO NOT allow direct booking ID enumeration** — Always filter by `user_id` in detail query.

### Code Architecture & Patterns

- **Next.js 16 App Router**: Use `params` and `searchParams` as Promises:
  ```ts
  interface BookingDetailPageProps {
    params: Promise<{ bookingId: string }>
  }
  ```
- **Service Role + Impersonation**:
  ```ts
  const ctx = await getImpersonationContext()
  if (!ctx) redirect('/login?redirect=/crm/my-bookings')
  const serviceClient = createServiceRoleClient()
  const { data, error } = await serviceClient
    .from('room_bookings')
    .select('*, rooms(name), lots(name, location)')
    .eq('user_id', ctx.effectiveUserId)
  ```
- **Status Colors**:
  - `pending` → `bg-amber-100 text-amber-800` (label: "Chờ thanh toán")
  - `confirmed` → `bg-emerald-100 text-emerald-800` (label: "Đã xác nhận")
  - `cancelled` → `bg-red-100 text-red-800` (label: "Đã hủy")
  - `completed` → `bg-blue-100 text-blue-800` (label: "Hoàn thành")
  - `no_show` → `bg-gray-100 text-gray-800` (label: "Không đến")
- **Date Formatting**: Use `toLocaleDateString('vi-VN')` for dates, `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` for amounts.
- **Cancel Button**: Reuse the accessible modal pattern from `VietQRDisplay.tsx` — `role="dialog"`, `aria-modal="true"`, Escape/backdrop close, loading spinner.

### File List

- `src/app/api/bookings/my/route.ts` (new)
- `src/app/api/bookings/my/__tests__/route.test.ts` (new)
- `src/app/crm/my-bookings/page.tsx` (new)
- `src/app/crm/my-bookings/__tests__/page.test.tsx` (new)
- `src/app/crm/my-bookings/[bookingId]/page.tsx` (new)
- `src/app/crm/my-bookings/[bookingId]/__tests__/page.test.tsx` (new)
- `src/components/crm/BookingTable.tsx` (new)
- `src/components/crm/BookingStatusBadge.tsx` (new)
- `src/components/crm/BookingDetail.tsx` (new)
- `src/components/crm/CancelBookingButton.tsx` (new)
- `src/components/crm/CheckInInstructions.tsx` (new)
- `src/components/crm/__tests__/BookingTable.test.tsx` (new)
- `src/components/crm/__tests__/BookingStatusBadge.test.tsx` (new)
- `src/components/layout/CRMHeader.tsx` (modified)

### Testing Standards

- Jest 30: `npx jest --testPathPatterns 'my-bookings|Booking'`
- Full suite: `npm test`
- Type check: `npx tsc --noEmit`
- Production build: `npm run build`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 11.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#Eco-Tourism Architecture]
- [Source: src/app/api/bookings/create/route.ts]
- [Source: src/app/crm/my-garden/page.tsx]
- [Source: src/components/eco-tourism/VietQRDisplay.tsx]
- [Source: supabase/migrations/20260530000001_eco_tourism_schema.sql]
- [Source: supabase/migrations/20260907000000_add_admin_user_lots.sql]

## Dev Agent Record

### Agent Model Used

Claude Opus 5

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-09-07 | 1.0 | Created story for View My Bookings (CRM) | Scrum Master |
