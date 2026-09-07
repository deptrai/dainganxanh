# Story 11.5: Cancel Booking

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a guest,
I want to cancel a pending booking,
So that I can free the room.

## Acceptance Criteria

1. **Cancel pending booking via API (existing, verify & extend):**
   - **Given** a guest has a booking with `status = 'pending'` and a code matching `^BK[A-Z0-9]{6}$` (case-insensitive, normalized to uppercase via `.trim().toUpperCase()`)
   - **When** `POST /api/bookings/cancel` is invoked with `{ bookingCode, reason? }`
   - **Then** the booking `status` transitions from `pending` -> `cancelled`
   - **And** `cancellation_reason` is recorded (defaults to `"Khách hủy đặt phòng"` if not provided, max 200 chars)
   - **And** the GiST exclusion constraint (`room_bookings_no_overlap`) immediately frees the room dates for other guests automatically without any manual trigger/RPC
   - **And** the endpoint calls on-demand revalidation: `revalidatePath('/eco-tourism')` and `revalidatePath('/eco-tourism/' + lotId, 'page')`
   - **And** returns HTTP 200 with `{ ok: true, message: "Đã hủy đặt phòng thành công" }`
   - **And** rate-limited to 10 requests per minute per IP (HTTP 429 when exceeded)
   - **And** returns HTTP 409 if the booking is already `confirmed`, `completed`, or `cancelled`
   - **And** returns HTTP 404 if the booking code does not exist

2. **Cancel button UX & Accessible Confirmation Dialog (NEW / UX Enhancement):**
   - **Given** a guest is on the VietQR payment screen (`step === 'payment'`)
   - **When** the guest clicks the "Hủy đặt phòng" button
   - **Then** an accessible confirmation dialog (`role="dialog"`, `aria-modal="true"`) appears with backdrop blur:
     - Title: `"Xác nhận hủy đặt phòng"`
     - Body: `"Bạn có chắc chắn muốn hủy đơn đặt phòng này? Phòng sẽ được giải phóng ngay lập tức cho khách hàng khác."`
     - Cancel action button: `"Không, quay lại"`
     - Confirm action button: `"Xác nhận hủy"` (destructive red styling)
     - Closes cleanly when pressing `Escape` or clicking the backdrop
   - **When** the guest confirms cancellation
   - **Then** the confirm button shows a loading state (`Loader2` spinner), disables other actions, and calls `POST /api/bookings/cancel`
   - **When** cancellation succeeds
   - **Then** polling intervals (`pollRef`) and expiration timers (`timerRef`) are cleared immediately (`clearInterval`)
   - **And** the UI redirects the guest back to `/eco-tourism/[lotId]?cancelled=1`
   - **And** the garden detail page shows a dismissible green toast/banner: `"Đã hủy đơn đặt phòng [BKXXXXXX] thành công. Phòng đã được giải phóng."`

3. **Revisit booking payment link after 15-minute hold expired (NEW):**
   - **Given** a guest revisits or reloads a booking payment link with `?code=BKXXXXXX` (normalized to uppercase)
   - **When** the booking's 15-minute hold has expired (`expires_at < now()` or `status === 'cancelled'`)
   - **Then** the page loads and renders an expired state:
     - Prominent icon (`Clock` or `AlertCircle`)
     - Headline: `"Đơn đặt phòng đã hết hạn"` (or `"Đơn đặt phòng đã bị hủy"`)
     - Explanatory message: `"Thời gian giữ chỗ 15 phút đã hết hoặc đơn đã bị hủy. Phòng đã được giải phóng."`
     - Action button: `"Tạo đặt phòng mới"` / `"Chọn ngày khác"` linking back to `/eco-tourism/[lotId]`
   - **And** no payment QR code or payment submission controls are displayed

4. **Revisit active pending booking link (NEW):**
   - **Given** a guest reloads or navigates to `/eco-tourism/[lotId]/book?code=BKXXXXXX` while the booking is still `pending` and `expires_at > now()`
   - **When** the page loads
   - **Then** the page restores the payment step directly (`step === 'payment'`)
   - **And** `VietQRDisplay` renders the VietQR image, account info, and accurate remaining countdown based on `expires_at`
   - **And** resumes polling `GET /api/bookings/status?code={bookingCode}`

5. **Revisit already confirmed booking link (NEW):**
   - **Given** a guest opens `/eco-tourism/[lotId]/book?code=BKXXXXXX` where status is already `confirmed` or `completed`
   - **When** the page loads
   - **Then** the page redirects immediately to `/eco-tourism/[lotId]/book/success?code={bookingCode}`

6. **Mismatched lot_id guard on revisit (NEW):**
   - **Given** a guest visits `/eco-tourism/[lotId]/book?code=BKXXXXXX` where the booking belongs to a different lot (`booking.rooms.lot_id !== lotId`)
   - **When** the page loads
   - **Then** the server redirects automatically to the correct lot URL `/eco-tourism/${booking.rooms.lot_id}/book?code=${code}`

7. **Automatic inventory release via cron (existing from 13.3, verify):**
   - `POST /api/cron/expire-pending` invokes `expire_pending_bookings()` RPC
   - Transitions all `pending` bookings with `expires_at < now()` to `status = 'cancelled'` with reason `'Payment timeout (15 mins)'`
   - Frees GiST exclusion lock automatically

8. **Status polling reflects cancellation:**
   - **Given** a guest is viewing the VietQR payment screen
   - **When** the booking is cancelled in another tab, by admin, or expired by background cron
   - **Then** `GET /api/bookings/status?code={bookingCode}` returns `status: 'cancelled'` or `status: 'expired'`
   - **And** `VietQRDisplay` halts polling, clears timers, and transitions immediately to the expired/cancelled screen

## Tasks / Subtasks

- [x] Task 1: Harden cancel API endpoint with case-normalization (AC: #1)
  - [x] Inspect `src/app/api/bookings/cancel/route.ts`
  - [x] Normalize `bookingCode` with `.trim().toUpperCase()` before Zod validation and query
  - [x] Ensure proper error handling, logging with `captureError`, and revalidation of both `/eco-tourism` and `/eco-tourism/[lotId]`
  - [x] Verify rate-limiting (10 req/min)
- [x] Task 2: Build accessible cancel confirmation dialog in `VietQRDisplay` (AC: #2)
  - [x] Update `src/components/eco-tourism/VietQRDisplay.tsx`
  - [x] Add accessible modal (`role="dialog"`, `aria-modal="true"`, `Escape` listener, backdrop click)
  - [x] Show loading spinner (`Loader2`) on confirm button during request
  - [x] Ensure `clearInterval` for timer and poll refs before invoking `onCancel`
  - [x] Pass `lotId` to redirect to `/eco-tourism/[lotId]?cancelled=1`
- [x] Task 3: Support `?code=` query parameter on Booking SSR page (AC: #3, #4, #5, #6)
  - [x] Update `src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx`:
    - [x] Accept `code?: string` in `searchParams`
    - [x] If `code` is present, fetch booking by normalized code using `createServiceRoleClient`
    - [x] If `booking.rooms.lot_id !== lotId` -> redirect to `/eco-tourism/${booking.rooms.lot_id}/book?code=${code}`
    - [x] If status is `confirmed` or `completed` -> redirect to `/eco-tourism/[lotId]/book/success?code=${code}`
    - [x] If status is `cancelled` or `pending` with `expires_at <= now()` -> render "Đơn đặt phòng đã hết hạn" directly with "Tạo đặt phòng mới" CTA
    - [x] If status is `pending` and `expires_at > now()` -> pass initial booking object to `BookingPageClient` with `initialStep = 'payment'`
  - [x] Update `src/app/(marketing)/eco-tourism/[lotId]/book/BookingPageClient.tsx`:
    - [x] Accept `initialBooking?: Booking` and `initialStep?: 'form' | 'payment' | 'expired'`
- [x] Task 4: Add cancellation feedback banner on Garden Detail Page (AC: #2)
  - [x] Check `src/app/(marketing)/eco-tourism/[lotId]/page.tsx` or `GardenDetailClient.tsx` for `?cancelled=1`
  - [x] Display dismissible green alert banner: `"Đã hủy đơn đặt phòng thành công. Phòng đã được giải phóng."`
- [x] Task 5: Verify automated expiration & status polling (AC: #7, #8)
  - [x] Confirm `src/app/api/bookings/status/route.ts` returns `expired` when `expires_at < now()`
  - [x] Confirm `VietQRDisplay` polling transitions cleanly to expired view and stops intervals
- [x] Task 6: Comprehensive test suite
  - [x] Unit test `cancel/route.ts` with uppercase, lowercase, and already cancelled codes
  - [x] Unit test `VietQRDisplay.test.tsx` for confirmation dialog opening, closing via Escape/backdrop, and cancel execution
  - [x] Unit test `BookingPage` SSR with `?code=` for expired, cancelled, confirmed redirect, mismatched lot redirect, and pending resume
  - [x] Unit test garden page for `?cancelled=1` banner rendering
- [x] Task 7: Build and typecheck verification
  - [x] `npm test`
  - [x] `npx tsc --noEmit`
  - [x] `npm run build`

### Review Findings

#### Resolved during/after review (patched)
- [x] [Review][Patch] Guard array type for searchParams.code before calling trim/toUpperCase [src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx:71] — Fixed: normalized `code` to `string | string[]` first.
- [x] [Review][Patch] Add explicit redirect fallback if room/lot relationship fails during booking resume [src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx:190] — Fixed: added `console.warn` and explicit `redirect('/eco-tourism/' + lotId)` fallback.

#### From multi-agent review (Type Safety, SSR Flow, Test Coverage) — Resolved
- [x] [Review][Patch] Stop polling/timer immediately when user confirms cancel to avoid race condition with status polling [src/components/eco-tourism/VietQRDisplay.tsx] — Fixed: added `isCancellingRef` guard to skip `pollStatus` when cancel is in-flight.
- [x] [Review][Patch] Add `isCancellingRef` guard so `pollStatus` is skipped while cancel request is in-flight [src/components/eco-tourism/VietQRDisplay.tsx] — Fixed.
- [x] [Review][Patch] Add `onExpired` to `pollStatus` useCallback dependency array [src/components/eco-tourism/VietQRDisplay.tsx] — Fixed: added `onExpired` to dependency array.
- [x] [Review][Patch] Use `window.history.replaceState` to update URL with `?code=` when booking is created, so F5 reload triggers resume flow not blocking error [src/app/(marketing)/eco-tourism/[lotId]/book/BookingPageClient.tsx] — Fixed: used `router.replace` instead of `window.history.replaceState` for Next.js router.
- [x] [Review][Patch] Use `Link` component instead of bare `<a>` for back/date-pick CTAs in booking flow [src/app/(marketing)/eco-tourism/[lotId]/book/BookingPageClient.tsx, src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx] — Fixed.
- [x] [Review][Patch] Add `robots: { index: false, follow: false }` to booking page metadata [src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx] — Fixed.
- [x] [Review][Patch] Encode `lotId`/`bookingCode` in redirects and client-side `router.push` URLs [src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx, src/app/(marketing)/eco-tourism/[lotId]/book/BookingPageClient.tsx] — Fixed.
- [x] [Review][Patch] Normalize booking code in `GET /api/bookings/status` to be case-insensitive [src/app/api/bookings/status/route.ts] — Fixed.
- [x] [Review][Patch] Verify update affected rows in cancel API to avoid false-positive 200 when concurrent payment confirms [src/app/api/bookings/cancel/route.ts] — Fixed: added `.select('id')` to check affected rows.
- [x] [Review][Patch] Add test coverage for lower/uppercase `code` arrays, `completed` redirect, missing `room/lots` fallback, and invalid `cancelled` banner values — Fixed.
- [x] [Review][Patch] Add tests for cancel error display, backdrop click, and interval cleanup in `VietQRDisplay.test.tsx` — Fixed.

## Dev Notes

### Anti-Pattern & Wheel Reinvention Guard

1. **`POST /api/bookings/cancel` ALREADY EXISTS**:
   - Location: `src/app/api/bookings/cancel/route.ts`.
   - DO NOT recreate or duplicate this route. Only add `.trim().toUpperCase()` code normalization and verify error handling.
2. **Room unlocking is automatic**:
   - The PostgreSQL GiST exclusion constraint (`room_bookings_no_overlap`) on `room_bookings` is filtered with:
     `WHERE (status IN ('pending', 'confirmed', 'completed'))`.
   - The exact moment `status` changes to `'cancelled'`, the exclusion lock releases immediately. NO custom DB trigger or RPC is needed.
3. **DO NOT introduce new global state management**:
   - URL searchParams (`?code=...`, `?cancelled=1`) and local React state in `BookingPageClient` are sufficient.

### Code Architecture & Patterns

- **Next.js 15 App Router Async Params**:
  In `src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx`:
  ```ts
  interface BookingPageProps {
    params: Promise<{ lotId: string }>
    searchParams: Promise<{
      room_id?: string
      check_in?: string
      check_out?: string
      code?: string
    }>
  }
  ```
  Must `await params` and `await searchParams` before inspecting values.
- **Service Role Client**: Use `createServiceRoleClient()` from `@/lib/supabase/server` on server components and route handlers.
- **No PII Leakage**: Never pass `guest_email`, `user_id`, `payment_ref`, or `payment_claimed_at` to client props or search params.

### File List

- `src/app/api/bookings/cancel/route.ts` (modified: case-normalization)
- `src/app/api/bookings/cancel/__tests__/route.test.ts` (modified: added lowercase test)
- `src/components/eco-tourism/VietQRDisplay.tsx` (modified: cancel confirmation dialog, accessible markup, timer cleanup)
- `src/components/eco-tourism/__tests__/VietQRDisplay.test.tsx` (modified: tests for confirmation modal)
- `src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx` (modified: support `?code=`, expired state, resume state, lot mismatch guard)
- `src/app/(marketing)/eco-tourism/[lotId]/book/BookingPageClient.tsx` (modified: support initialBooking, initialStep)
- `src/app/(marketing)/eco-tourism/[lotId]/book/__tests__/page.test.tsx` (modified: tests for code param scenarios)
- `src/components/eco-tourism/GardenDetailClient.tsx` (modified: support `?cancelled=1` feedback banner)

### Testing Standards

- Jest 30: Run `npx jest --testPathPatterns 'cancel|VietQRDisplay|book'` to verify related tests.
- Full suite: `npm test`.
- Type check: `npx tsc --noEmit`.
- Production build: `npm run build`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 11.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#Eco-Tourism Architecture]
- [Source: _bmad-output/implementation-artifacts/11-3-create-booking-reservation.md]
- [Source: _bmad-output/implementation-artifacts/11-4-confirm-booking-payment.md]
- [Source: src/app/api/bookings/cancel/route.ts]
- [Source: src/components/eco-tourism/VietQRDisplay.tsx]
- [Source: src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx]
- [Source: src/app/(marketing)/eco-tourism/[lotId]/book/BookingPageClient.tsx]
- [Source: supabase/migrations/20260906000001_atomic_expire_pending_inventory.sql]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5

### Debug Log References

- `npm test`: 81 suites, 768 tests passed (0 failures).
- `npx tsc --noEmit`: 0 TypeScript compilation errors.
- `npm run build`: Next.js 16.1.1 production build succeeded with static & dynamic routes compiled.

### Completion Notes List

- Normalized `bookingCode` with `.trim().toUpperCase()` in `POST /api/bookings/cancel` and added unit test.
- Implemented accessible Cancel Confirmation Modal in `VietQRDisplay.tsx` (`role="dialog"`, `aria-modal="true"`, `Escape` listener, backdrop click, loading spinner on submit) and cleanly cleared timer and poll intervals.
- Extended `src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx` to handle `?code=` query param:
  - Validates `code` with regex.
  - Redirects mismatched `lot_id` bookings to the correct garden URL.
  - Redirects `confirmed` / `completed` bookings to success page.
  - Directly renders "Đơn đặt phòng đã hết hạn" (hoặc "Đơn đặt phòng đã bị hủy") when expired/cancelled with CTA back to lot page.
  - Resumes active pending bookings directly in payment step with `VietQRDisplay` and live countdown.
- Extended `BookingPageClient.tsx` to accept `initialBooking` and `initialStep`, redirecting to `/eco-tourism/[lotId]?cancelled=1` on cancel.
- Added `CancelledFeedbackBanner` in `GardenDetailClient.tsx` rendering dismissible green confirmation banner when `?cancelled=1`.
- Added unit tests in `GardenDetailClient.test.tsx`, `page.test.tsx`, `VietQRDisplay.test.tsx`, `cancel/route.test.ts`, and `status/route.test.ts`.

### File List

- `src/app/api/bookings/cancel/route.ts` (modified)
- `src/app/api/bookings/cancel/__tests__/route.test.ts` (modified)
- `src/components/eco-tourism/VietQRDisplay.tsx` (modified)
- `src/components/eco-tourism/__tests__/VietQRDisplay.test.tsx` (modified)
- `src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx` (modified)
- `src/app/(marketing)/eco-tourism/[lotId]/book/BookingPageClient.tsx` (modified)
- `src/app/(marketing)/eco-tourism/[lotId]/book/__tests__/page.test.tsx` (modified)
- `src/components/eco-tourism/GardenDetailClient.tsx` (modified)
- `src/components/eco-tourism/__tests__/GardenDetailClient.test.tsx` (new)
- `src/app/api/bookings/status/__tests__/route.test.ts` (modified)

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-09-07 | 1.0 | Created comprehensive story for Cancel Booking & Expired Revisit UX | Scrum Master |
| 2026-09-07 | 1.1 | Applied all quality checklist improvements (case-normalization, lot mismatch guard, accessible dialog, cancellation banner) | Quality Auditor |
| 2026-09-07 | 1.2 | Implemented cancel normalization, confirmation modal, SSR ?code= handling, cancellation banner, and comprehensive tests | Dev Agent |
