# Story 11.6: View My Bookings (CRM)

Status: done

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
   - **And** check-in instructions include: garden name (from `lots.name`), region (from `lots.region`), description (from `lots.description`), check-in time note, contact info from `guest_phone` (as fallback), special requirements reminder
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

- [x] Task 1: Create API route `GET /api/bookings/my` (AC: #1, #4, #5, #6)
  - [x] Create `src/app/api/bookings/my/route.ts`
  - [x] Use `createServiceRoleClient` with `getImpersonationContext` to get `effectiveUserId`
  - [x] Query `room_bookings` where `user_id = effectiveUserId`
  - [x] Join with `rooms` and `lots` to get room name and garden name
  - [x] Order by `created_at` DESC
  - [x] Return only safe fields: id, code, room_name, lot_name, check_in_date, check_out_date, nights_count, guests_count, status, total_amount, payment_method, expires_at, created_at
  - [x] Add rate limiting (100 req/min per IP)
  - [x] Add `captureError` for server errors

- [x] Task 2: Create page `GET /crm/my-bookings` (AC: #1, #3, #4, #5)
  - [x] Create `src/app/crm/my-bookings/page.tsx`
  - [x] Use `getImpersonationContext` in Server Component
  - [x] Fetch bookings via `createServiceRoleClient` (server-side, not API call)
  - [x] Display list/table with all columns
  - [x] Add pagination (20 items per page) with simple offset/limit or cursor
  - [x] Default sort `created_at` DESC
  - [x] Make rows clickable to navigate to detail
  - [x] Add empty state with link to `/eco-tourism`
  - [x] Style with existing CRM theme (emerald/green palette)
  - [x] Add `Suspense` boundary for loading state

- [x] Task 3: Create page `GET /crm/my-bookings/[bookingId]` (AC: #2, #4, #5, #6)
  - [x] Create `src/app/crm/my-bookings/[bookingId]/page.tsx`
  - [x] Use `getImpersonationContext` and `createServiceRoleClient`
  - [x] Fetch single booking by `id` + `user_id = effectiveUserId`
  - [x] If not found, return `notFound()` (404)
  - [x] Display all detail fields
  - [x] Show conditional sections based on status:
    - `pending` → payment QR button + cancel button
    - `confirmed`/`completed` → check-in instructions
    - `cancelled`/`no_show` → cancellation reason (if exists and not empty)
  - [x] Add "Back to list" link
  - [x] Add `robots: { index: false }` metadata

- [x] Task 4: Create reusable components (AC: #1, #2)
  - [x] `src/components/crm/BookingTable.tsx` — table/list for bookings
  - [x] `src/components/crm/BookingStatusBadge.tsx` — color-coded status badge
  - [x] `src/components/crm/BookingDetail.tsx` — detail view component
  - [x] `src/components/crm/CancelBookingButton.tsx` — cancel button with confirm modal (reuse pattern from `VietQRDisplay`)
    - [x] Calls `POST /api/bookings/cancel` with `{ bookingCode, reason: "Khách hủy từ CRM" }`
    - [x] On success, redirect to `/crm/my-bookings?cancelled=1`
    - [x] On error, show inline error message
  - [x] `src/components/crm/CheckInInstructions.tsx` — instructions block showing garden name, region, description, check-in/out times, contact info from guest_phone, and special requests if any

- [x] Task 5: Add navigation link in CRM header (AC: #1)
  - [x] Update `src/components/layout/CRMHeader.tsx`
  - [x] Add "Đặt phòng" or "Lịch sử đặt phòng" link to `/crm/my-bookings` in nav items
  - [x] Icon: use `Calendar` or `Bed` from lucide-react

- [x] Task 6: Write tests (AC: all)
  - [x] `src/app/api/bookings/my/__tests__/route.test.ts` — test list endpoint, auth, impersonation, error cases
  - [x] `src/app/crm/my-bookings/__tests__/page.test.tsx` — test list render, empty state, auth redirect, pagination controls
  - [x] `src/app/crm/my-bookings/[bookingId]/__tests__/page.test.tsx` — test detail render, 404 for other user's booking
  - [x] `src/components/crm/__tests__/BookingTable.test.tsx` — test table rendering
  - [x] `src/components/crm/__tests__/BookingStatusBadge.test.tsx` — test status colors and labels
  - [x] `src/components/crm/__tests__/CancelBookingButton.test.tsx` — test modal, cancel API call, redirect

- [x] Task 7: Build and typecheck verification
  - [x] `npm test`
  - [x] `npx tsc --noEmit`
  - [x] `npm run build`

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
    .select('*, rooms(name), lots(name, region, description)')
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

Claude Sonnet 5 / Claude Opus 5

### Debug Log References

- Fixed Supabase join from `room_bookings -> lots` to `room_bookings -> rooms -> lots(name, region, description)`.
- Replaced duplicate `formatDateVN` implementations across components with shared `@/lib/date`.
- Hardened `CancelBookingButton` with accessible modal focus trap and safe non-JSON error handling.
- Ensured proper parameter preservation across pagination in `BookingsList`.
- All 89 test suites (828 tests) passing; Next.js 16 build passing with zero errors.

### Completion Notes List

- Implemented GET /api/bookings/my route with impersonation context, pagination, and safe field mapping.
- Created /crm/my-bookings list page and /crm/my-bookings/[bookingId] detail page.
- Created reusable components: BookingTable, BookingStatusBadge, BookingDetail, CancelBookingButton, CheckInInstructions, and BookingsList.
- Added "Dat phong" link to CRMHeader with Calendar icon.
- Applied all 19 code review findings and verified tests and production build.

### File List

- `src/app/api/bookings/my/route.ts`
- `src/app/api/bookings/my/__tests__/route.test.ts`
- `src/app/crm/my-bookings/page.tsx`
- `src/app/crm/my-bookings/__tests__/page.test.tsx`
- `src/app/crm/my-bookings/[bookingId]/page.tsx`
- `src/app/crm/my-bookings/[bookingId]/__tests__/page.test.tsx`
- `src/components/crm/BookingTable.tsx`
- `src/components/crm/BookingStatusBadge.tsx`
- `src/components/crm/BookingDetail.tsx`
- `src/components/crm/BookingsList.tsx`
- `src/components/crm/CancelBookingButton.tsx`
- `src/components/crm/CheckInInstructions.tsx`
- `src/components/crm/__tests__/BookingTable.test.tsx`
- `src/components/crm/__tests__/BookingStatusBadge.test.tsx`
- `src/components/crm/__tests__/BookingDetail.test.tsx`
- `src/components/crm/__tests__/CancelBookingButton.test.tsx`
- `src/components/crm/__tests__/CheckInInstructions.test.tsx`
- `src/components/layout/CRMHeader.tsx`
- `src/lib/date.ts`

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-09-07 | 1.0 | Created story for View My Bookings (CRM) | Scrum Master |
| 2026-09-07 | 1.1 | Implemented story 11.6, applied code review patches, verified tests & build | Dev Agent |

## Review Findings

### Decision Needed
_ None — all findings are patchable without human input.

### Patch
- [x] [Review][Patch] **CRITICAL: Invalid Supabase join `room_bookings → lots`** — `src/app/api/bookings/my/route.ts:55`, `src/app/crm/my-bookings/page.tsx:55`, and `src/app/crm/my-bookings/[bookingId]/page.tsx:47` all query `lots(...)` directly on `room_bookings`. But `room_bookings` has no direct FK to `lots`; the correct schema is `room_bookings → rooms → lots`. Use `rooms(name, lots(name, region, description))` as in `src/app/(marketing)/eco-tourism/voucher/[code]/page.tsx`. This will cause `Could not find a relationship between 'room_bookings' and 'lots' in the schema cache` errors and render every CRM bookings page unusable.
- [x] [Review][Patch] Broken "Tiếp tục thanh toán" resume link — `BookingDetail.tsx:71` builds `/eco-tourism/${booking.lotId || 'direct'}/book?code=...` but `room_bookings` has no `lot_id` column; `lotId` is never populated, so the link always falls back to the invalid route `/eco-tourism/direct/book`. Fix: select `rooms(lot_id)` in the detail page and pass it to `BookingDetail`.
- [x] [Review][Patch] Detail page query omits `rooms(lot_id)` — `src/app/crm/my-bookings/[bookingId]/page.tsx` currently selects `rooms(name)`; must include `lot_id` for the resume-payment link.
- [x] [Review][Patch] Dead `lotId` prop on `MyBookingDetail` — `BookingDetail.tsx:47` declares `lotId?: string` but the page never supplies it.
- [x] [Review][Patch] Unused `AlertCircle` import — `src/components/crm/BookingDetail.tsx:16`.
- [x] [Review][Patch] Unnecessary `Suspense` boundary around `BookingsList` — `src/app/crm/my-bookings/page.tsx:102` wraps a synchronous client component; it provides no benefit because data is fetched before render.
- [x] [Review][Patch] Duplicate `formatDateVN` helper — exists in `BookingTable.tsx` and `CheckInInstructions.tsx`; extract to a shared utility to avoid drift.
- [x] [Review][Patch] Duplicate `notFound()` guard — `src/app/crm/my-bookings/[bookingId]/page.tsx:55-58` calls `notFound()` twice in succession for the same condition.
- [x] [Review][Patch] `cancellationReason` carried in list payload — `src/app/crm/my-bookings/page.tsx:89` includes it in each list row, but `BookingTable` never renders it and the spec restricts its visibility; remove from list mapping to reduce data surface.
- [x] [Review][Patch] `guestPhone` rendered as reception contact — `src/components/crm/CheckInInstructions.tsx:112-116` shows the guest's own phone number under "Liên hệ lễ tân / quản gia". The spec intends `guest_phone` as a fallback for contact info, not as the reception number. Use a static reception hotline or lot contact instead.
- [x] [Review][Patch] `res.json()` called before `res.ok` check — `src/components/crm/CancelBookingButton.tsx:41-44` will throw `SyntaxError` on non-JSON error responses (500/502/504), hiding the real server error. Wrap `res.json()` in `try` or check `res.ok` first.
- [x] [Review][Patch] Missing focus trap and initial focus in cancel modal — `CancelBookingButton.tsx` sets `role="dialog"`/`aria-modal` but does not trap Tab focus or focus the dialog on open; focus can escape to background.
- [x] [Review][Patch] 140 duplicate links per page — `BookingTable.tsx` wraps every `<td>` cell in a separate `<Link>` to the same detail URL, forcing screen-reader and keyboard users through 7 links per row. Use a single row-level link or make only the code cell clickable.
- [x] [Review][Patch] Timezone-unaware `formatDateVN` — both copies split ISO strings on `'T'` without converting to UTC+7; timestamps near midnight can render the wrong day. Use `toLocaleDateString('vi-VN')` or add explicit offset handling.
- [x] [Review][Patch] Login redirect discards booking detail target — `src/app/crm/my-bookings/[bookingId]/page.tsx:19` always redirects to `/login?redirect=/crm/my-bookings`; it should redirect back to `/crm/my-bookings/${bookingId}`.
- [x] [Review][Patch] Pagination discards other query params — `BookingsList.tsx:29-31` uses `router.push(`${pathname}?page=${newPage}`)` without preserving existing search params like `cancelled=1`.
- [x] [Review][Patch] `isFuture` computed once during render — `BookingDetail.tsx:58` uses `Date.now()` in render; expired pending bookings will continue to show active payment/cancel buttons until refresh. Recompute inside an effect or use a timer.
- [x] [Review][Patch] Unused fields fetched in list API — `src/app/api/bookings/my/route.ts` selects `special_requests` and `cancellation_reason` but never returns them in `formatted`; remove from the select to reduce payload.
- [x] [Review][Patch] Missing `captureError` on list page DB error — `src/app/crm/my-bookings/page.tsx:63-71` only logs to console, unlike the API route which reports to monitoring.

### Defer
- [x] [Review][Defer] Type assertion `as unknown as { name: string }` for Supabase joined data — a pre-existing pattern across eco-tourism modules; replace with generated Supabase types in a follow-up.
- [x] [Review][Defer] `nights_count` not inserted in `create` route — `src/app/api/bookings/create/route.ts` computes `diffDays` but does not insert `nights_count`; DB likely populates it via generated column or trigger. Verify separately.
- [x] [Review][Defer] Rate limit of 100 req/min for `/api/bookings/my` — acceptable for MVP, revisit after production usage.
- [x] [Review][Defer] Service-role client bypasses RLS — both pages and the API use `createServiceRoleClient()` with application-level `.eq('user_id', ...)`; the pattern is consistent with existing CRM code but removes DB-level defense-in-depth.

## Review Findings — Second Pass

### Decision Needed
_ None — all findings are patchable without human input.

### Patch
- [x] [Review][Patch] Payment button condition narrower than spec — `src/components/crm/BookingDetail.tsx` now shows the payment link when `(status === 'pending' || status === 'confirmed') && isFuture`, matching AC 2.
- [x] [Review][Patch] Desktop table rows not keyboard/middle-click accessible — `src/components/crm/BookingTable.tsx` now keeps the row `onClick` and exposes a real `<Link>` in the booking-code cell; the row click ignores clicks originating from inner links.
- [x] [Review][Patch] Pagination drops `cancelled=1` query param — `src/components/crm/BookingsList.tsx` now deletes the one-shot `cancelled` param when changing pages.
- [x] [Review][Patch] `BookingTable` row-click test only asserts `cursor-pointer` class — `src/components/crm/__tests__/BookingTable.test.tsx` now asserts `router.push('/crm/my-bookings/booking-1')`.
- [x] [Review][Patch] `formatDateVN` returns raw `dateStr` on invalid date — `src/lib/date.ts` now returns `''` for unparseable input.
- [x] [Review][Patch] Payment fallback URL ignores `code` query — `src/components/crm/BookingDetail.tsx` now falls back to plain `/eco-tourism` when `lotId` is unavailable.
- [x] [Review][Defer] `CheckInInstructions` hardcodes reception hotline `1900 8888` — product decision; keep the static hotline and `guestPhone` as secondary contact for MVP.

### Defer
- [x] [Review][Defer] Repetitive IIFE extraction of `rooms.lots` in list page — `src/app/crm/my-bookings/page.tsx:72-93` can be refactored into a small helper, but is a readability nit.
- [x] [Review][Defer] `BookingDetail` `useState(Date.now())` + 60s interval — minor hydration boundary risk if server-rendered at exact expiry; acceptable for MVP.
- [x] [Review][Defer] `CheckInInstructions` hardcoded hotline — revisit if lot-specific hotline numbers are introduced.

### Dismissed as noise
- `BookingStatusBadge` colors match spec exactly.
- Empty state, access control, impersonation, and 404 behavior are correct.
- `payment_ref`, `payment_claimed_at`, and `cancellation_reason` are not exposed.
- `CancelBookingButton` focus trap and non-JSON error handling are correct.
