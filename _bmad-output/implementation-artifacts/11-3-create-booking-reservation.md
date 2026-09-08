# Story 11.3: Create Booking Reservation

Status: done

## Story

As a guest,
I want to submit my contact info and reserve a room for 15 minutes,
So that I can pay later via bank transfer.

## Acceptance Criteria

1. **Booking page route:**
   - `/eco-tourism/[lotId]/book` is a public, server-rendered Next.js App Router page.
   - Page reads `searchParams` for `room_id`, `check_in`, `check_out` (all required, validated as YYYY-MM-DD). In Next.js 15, `searchParams` is a `Promise` -- use `const searchParams = await props.searchParams` or type it as `Promise<{ room_id?: string; check_in?: string; check_out?: string }>`.
   - If any param is missing or malformed, redirect to `/eco-tourism/[lotId]`.
   - Metadata: Vietnamese title/description, canonical URL.
   - Page fetches `rooms` + `lots` server-side via `createServiceRoleClient`; 404 if room does not exist, is not `active`, or does not belong to `[lotId]`.
   - SSR: `export const dynamic = 'force-dynamic'` or `revalidate = 0`.

2. **Booking form (client):**
   - Fields: `guest_name`, `guest_phone` (10 digits starting with `0`), `guest_email` (optional), `guests_count` (>=1, <= capacity, `parseInt()` from `<input type="number">`), `special_requests` (optional, max 500).
   - Client-side validation mirrors `createBookingSchema` in `src/app/api/bookings/create/route.ts`.
   - Submit POSTs to `/api/bookings/create`.
   - On 201, swap to VietQR display.

3. **Order summary:**
   - Calls `POST /api/bookings/calculate-price` for live total.
   - Shows room, garden, dates, nights, guests, total formatted `vi-VN`.
   - Displays per-night breakdown with special rule badges.
   - On pricing error, show inline and disable submit.

4. **Reservation creation (server, already implemented):**
   - `POST /api/bookings/create` validates Zod, server-side pricing, generates `BK-` code, `pending` with 15-min `expires_at`.
   - Returns 409 on GiST `23P01` overlap.

5. **VietQR payment display (client):**
   - VietQR image via `img.vietqr.io` with `MB` bank, `amount`, `addInfo=bookingCode`.
   - 15-minute countdown from `expiresAt` (ISO 8601 `timestamptz` string). Use `new Date(booking.expiresAt).getTime() - Date.now()` to compute remaining seconds; do not assume a fixed 15:00.
   - Copy buttons for code, amount, account, account holder.
   - Poll `GET /api/bookings/status?code={bookingCode}` every 5s.
   - "Đã chuyển tiền" -> `POST /api/bookings/claim-payment`.
   - "Hủy" -> `POST /api/bookings/cancel`.
   - On `confirmed`, redirect to `/eco-tourism/[lotId]/book/success?code={bookingCode}`.

6. **New API endpoints:**
   - `GET /api/bookings/status?code={bookingCode}` - PUBLIC endpoint (no auth; guests check status without login). Validate `code` matches `BK[A-Z0-9]{6}`. Returns `{ status, expiresAt, totalAmount, roomName, checkInDate, checkOutDate, guestsCount }`. 404 if not found. Rate-limit 60 req/min per IP. Do NOT return `guest_name`, `guest_phone`, `guest_email`, or `user_id`.
   - `POST /api/bookings/claim-payment` - sets `payment_claimed_at` on `pending` booking; 404/409 if not found or not pending. Rate-limit 10 req/min.
   - `POST /api/bookings/cancel` - sets `status='cancelled'` on `pending` booking and revalidates; 404/409 if not found or not pending. Rate-limit 10 req/min.

7. **Expired-hold UX:**
   - Show "Đơn đặt phòng đã hết hạn" with a back link.

8. **Edge cases:**
   - Capacity exceeded, past dates, GiST overlap all show inline errors.

## Tasks / Subtasks

- [x] Task 1: Replace stub `/eco-tourism/[lotId]/book/page.tsx` with real booking page.
- [x] Task 2: Build `BookingPageClient` orchestrator.
- [x] Task 3: Build `BookingForm` component.
- [x] Task 4: Build `OrderSummary` component.
- [x] Task 5: Build `VietQRDisplay` component.
- [x] Task 6: Implement `GET /api/bookings/status`.
- [x] Task 7: Implement `POST /api/bookings/claim-payment`.
- [x] Task 8: Implement `POST /api/bookings/cancel`.
- [x] Task 9: Wire form -> payment flow.
- [x] Task 10: Build booking success page.
- [x] Task 11: Write tests.

### Review Findings

- [x] [Review][Patch] Missing cancellation_reason column in migration [supabase/migrations/20260908000001_add_payment_claimed_at_to_room_bookings.sql:1]
- [x] [Review][Patch] Stop polling and handle expired/cancelled status in VietQRDisplay [src/components/eco-tourism/VietQRDisplay.tsx:57]
- [x] [Review][Patch] Validate checkIn < checkOut and not in past on booking SSR page [src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx:68]
- [x] [Review][Patch] Fix timezone shift in date formatting across OrderSummary and BookingSuccessPage [src/components/eco-tourism/OrderSummary.tsx:73]
- [x] [Review][Patch] Trim guest_name and guest_phone in BookingForm before submit [src/components/eco-tourism/BookingForm.tsx:75]

## Dev Notes

### Architecture Compliance

- **File structure:**
  - `src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx`
  - `src/app/(marketing)/eco-tourism/[lotId]/book/BookingPageClient.tsx`
  - `src/app/(marketing)/eco-tourism/[lotId]/book/success/page.tsx`
  - `src/components/eco-tourism/BookingForm.tsx`
  - `src/components/eco-tourism/OrderSummary.tsx`
  - `src/components/eco-tourism/VietQRDisplay.tsx`
  - `src/app/api/bookings/status/route.ts`
  - `src/app/api/bookings/claim-payment/route.ts`
  - `src/app/api/bookings/cancel/route.ts`

- **Reuse, do NOT reinvent:**
  - `POST /api/bookings/create` (Story 13.2)
  - `calculateBookingPrice` (`src/lib/pricing/booking.ts`)
  - `isBookingBlocking`, `getBlockingBookings` (`src/lib/eco-tourism/availability.ts`)
  - `BankingPayment.tsx` pattern for VietQR/countdown/copy/poll
  - `rateLimit`, `captureError`, `getEffectiveUser`, `createServiceRoleClient`, `createBrowserClient`

- **VietQR URL pattern:**
  ```ts
  const BANK_INFO = {
    bank: process.env.NEXT_PUBLIC_BANK_NAME || "MB Bank",
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT || "796333999",
    accountName: process.env.NEXT_PUBLIC_BANK_HOLDER || "CONG TY CO PHAN DAI NGAN XANH GROUP",
  }
  const vietQRUrl = `https://img.vietqr.io/image/MB-${BANK_INFO.accountNumber}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`
  ```

- **Booking code:** `BK` + 6 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.

- **GiST constraint error:** PostgreSQL `23P01`; API returns 409.

- **Timezone:** `todayVN = new Date(Date.now() + 7*60*60*1000).toISOString().slice(0,10)`.

- **`payment_claimed_at`:** This column does NOT exist yet on `room_bookings`. Create migration `supabase/migrations/20260908000001_add_payment_claimed_at_to_room_bookings.sql` before implementing `claim-payment`:
  ```sql
  ALTER TABLE public.room_bookings
    ADD COLUMN IF NOT EXISTS payment_claimed_at timestamp with time zone;
  ```

- **Statuses:** `pending`, `confirmed`, `completed`, `cancelled`, `no_show`.

### UX Notes

- Form + OrderSummary side-by-side desktop, stacked mobile.
- VietQR: QR image + 15-min countdown + copy buttons.
- Vietnamese labels; `emerald-600` primary, `amber-50` waiting, `red-50` errors, `emerald-50` success.
- `rounded-lg` cards/inputs, `rounded-full` badges.

### Testing Standards

- Jest 30: `--testPathPatterns` (plural) to filter.
- Mock Supabase chain; mock `fetch` for client components.
- Run `npm test`, `npx tsc --noEmit`.

### Previous Story Intelligence (11.2)

- `Array.isArray(images)` guards.
- `error?.message` only for logging.
- `images.unsplash.com` in `next.config.js` `remotePatterns`.
- `createServiceRoleClient` bypasses RLS.
- `'use client'` required for hooks.
- Booking pages per-request, not cached.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 11.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Contracts, Payment Flow]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#3. `/eco-tourism/[lotId]/book` - Booking Checkout]
- [Source: _bmad-output/implementation-artifacts/13-2-secure-order-creation-apis.md]
- [Source: _bmad-output/implementation-artifacts/13-4-server-side-price-validation.md]
- [Source: _bmad-output/implementation-artifacts/13-3-inventory-reservation-and-release.md]
- [Source: _bmad-output/implementation-artifacts/13-1-polymorphic-casso-webhook.md]
- [Source: src/app/api/bookings/create/route.ts]
- [Source: src/lib/pricing/booking.ts]
- [Source: src/lib/eco-tourism/availability.ts]
- [Source: src/components/checkout/BankingPayment.tsx]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Completion Notes List

- Task 1: Replaced stub `src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx` with full SSR implementation validating query params, checking active room belonging to lot, checking blocking bookings via `getBlockingBookings`, and rendering `BookingPageClient`.
- Task 2: Built `BookingPageClient` managing steps (`form`, `payment`, `success`, `expired`).
- Task 3: Built `BookingForm` with full client validation matching `createBookingSchema`, Vietnamese error messages, submitting to `POST /api/bookings/create`, handling 409 GiST overlap errors.
- Task 4: Built `OrderSummary` fetching authoritative pricing from `POST /api/bookings/calculate-price` with 300ms debounce, formatting total VND, displaying custom pricing rule breakdown.
- Task 5: Built `VietQRDisplay` with VietQR image (`img.vietqr.io`), accurate countdown timer derived from `expiresAt`, copy buttons with feedback, claim payment action, cancel reservation action, and 5-second polling of `GET /api/bookings/status`.
- Task 6: Implemented `GET /api/bookings/status` (rate limited, no PII leakage, expired calculation).
- Task 7: Implemented `POST /api/bookings/claim-payment` (rate limited, updates `payment_claimed_at` on pending booking).
- Task 8: Implemented `POST /api/bookings/cancel` (rate limited, cancels pending booking and revalidates marketing pages).
- Task 9: Wired full form -> payment -> confirmed -> success flow.
- Task 10: Built `src/app/(marketing)/eco-tourism/[lotId]/book/success/page.tsx` displaying booking code, room, dates, nights, guests, total amount, and check-in instructions.
- Task 11: Added unit and integration tests across 6 test suites: `page.test.tsx` (book SSR), `BookingPageClient.test.tsx`, `BookingForm.test.tsx`, `OrderSummary.test.tsx`, `VietQRDisplay.test.tsx`, `status/route.test.ts`, `claim-payment/route.test.ts`, `cancel/route.test.ts`, `success/page.test.tsx`.
- Verification: 79 test suites passed, 746 tests passed, TypeScript `tsc --noEmit` passed with 0 errors, Next.js build succeeded.
- Senior Developer Code Review: 5 patches applied and verified (migration column `cancellation_reason`, terminal status polling in VietQRDisplay, SSR date order validation `checkIn < checkOut` and future dates, timezone-safe date formatting, trimmed input fields). All 79 test suites passed (747 tests). Status updated to `done`.

### File List

**New files created:**
- `dainganxanh-landing/src/app/(marketing)/eco-tourism/[lotId]/book/BookingPageClient.tsx`
- `dainganxanh-landing/src/app/(marketing)/eco-tourism/[lotId]/book/success/page.tsx`
- `dainganxanh-landing/src/components/eco-tourism/BookingForm.tsx`
- `dainganxanh-landing/src/components/eco-tourism/OrderSummary.tsx`
- `dainganxanh-landing/src/components/eco-tourism/VietQRDisplay.tsx`
- `dainganxanh-landing/src/app/api/bookings/status/route.ts`
- `dainganxanh-landing/src/app/api/bookings/claim-payment/route.ts`
- `dainganxanh-landing/src/app/api/bookings/cancel/route.ts`
- `dainganxanh-landing/src/app/(marketing)/eco-tourism/[lotId]/book/__tests__/page.test.tsx`
- `dainganxanh-landing/src/app/(marketing)/eco-tourism/[lotId]/book/__tests__/BookingPageClient.test.tsx`
- `dainganxanh-landing/src/app/(marketing)/eco-tourism/[lotId]/book/success/__tests__/page.test.tsx`
- `dainganxanh-landing/src/components/eco-tourism/__tests__/BookingForm.test.tsx`
- `dainganxanh-landing/src/components/eco-tourism/__tests__/OrderSummary.test.tsx`
- `dainganxanh-landing/src/components/eco-tourism/__tests__/VietQRDisplay.test.tsx`
- `dainganxanh-landing/src/app/api/bookings/status/__tests__/route.test.ts`
- `dainganxanh-landing/src/app/api/bookings/claim-payment/__tests__/route.test.ts`
- `dainganxanh-landing/src/app/api/bookings/cancel/__tests__/route.test.ts`
- `dainganxanh-landing/supabase/migrations/20260908000001_add_payment_claimed_at_to_room_bookings.sql`

**Modified files:**
- `dainganxanh-landing/src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx`
