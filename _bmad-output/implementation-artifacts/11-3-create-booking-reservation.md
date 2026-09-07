# Story 11.3: Create Booking Reservation

Status: ready-for-dev

## Story

As a guest,
I want to submit my contact info and reserve a room for 15 minutes,
So that I can pay later via bank transfer.

## Acceptance Criteria

1. **Booking page route:**
   - `/eco-tourism/[lotId]/book` is a public, server-rendered Next.js App Router page.
   - Page reads `searchParams` for `room_id`, `check_in`, `check_out` (all required, validated as YYYY-MM-DD).
   - If any param is missing or malformed, redirect to `/eco-tourism/[lotId]`.
   - Metadata: Vietnamese title/description, canonical URL.
   - Page fetches `rooms` + `lots` server-side via `createServiceRoleClient`; 404 if room does not exist, is not `active`, or does not belong to `[lotId]`.
   - SSR: `export const dynamic = 'force-dynamic'` or `revalidate = 0`.

2. **Booking form (client):**
   - Fields: `guest_name`, `guest_phone` (10 digits starting with `0`), `guest_email` (optional), `guests_count` (>=1, <= capacity), `special_requests` (optional, max 500).
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
   - 15-minute countdown from `expiresAt`.
   - Copy buttons for code, amount, account, account holder.
   - Poll `GET /api/bookings/status?code={bookingCode}` every 5s.
   - "Đã chuyển tiền" -> `POST /api/bookings/claim-payment`.
   - "Hủy" -> `POST /api/bookings/cancel`.
   - On `confirmed`, redirect to `/eco-tourism/[lotId]/book/success?code={bookingCode}`.

6. **New API endpoints:**
   - `GET /api/bookings/status` - returns status without guest PII.
   - `POST /api/bookings/claim-payment` - sets `payment_claimed_at` on pending.
   - `POST /api/bookings/cancel` - sets `status='cancelled'` on pending and revalidates.

7. **Expired-hold UX:**
   - Show "Đơn đặt phòng đã hết hạn" with a back link.

8. **Edge cases:**
   - Capacity exceeded, past dates, GiST overlap all show inline errors.

## Tasks / Subtasks

- [ ] Task 1: Replace stub `/eco-tourism/[lotId]/book/page.tsx` with real booking page.
- [ ] Task 2: Build `BookingPageClient` orchestrator.
- [ ] Task 3: Build `BookingForm` component.
- [ ] Task 4: Build `OrderSummary` component.
- [ ] Task 5: Build `VietQRDisplay` component.
- [ ] Task 6: Implement `GET /api/bookings/status`.
- [ ] Task 7: Implement `POST /api/bookings/claim-payment`.
- [ ] Task 8: Implement `POST /api/bookings/cancel`.
- [ ] Task 9: Wire form -> payment flow.
- [ ] Task 10: Build booking success page.
- [ ] Task 11: Write tests.

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

- **`payment_claimed_at`:** Add column via `supabase/migrations/20260908000001_add_payment_claimed_at_to_room_bookings.sql` if missing.

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

claude-opus-5[1m]

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story 11.3 wires up the booking UX on top of already-implemented backend (Stories 13.1-13.4). New server work: status poll, claim-payment, cancel endpoints and optional `payment_claimed_at` column.

### File List

**New files to create:**
- `src/app/(marketing)/eco-tourism/[lotId]/book/BookingPageClient.tsx`
- `src/app/(marketing)/eco-tourism/[lotId]/book/success/page.tsx`
- `src/components/eco-tourism/BookingForm.tsx`
- `src/components/eco-tourism/OrderSummary.tsx`
- `src/components/eco-tourism/VietQRDisplay.tsx`
- `src/app/api/bookings/status/route.ts`
- `src/app/api/bookings/claim-payment/route.ts`
- `src/app/api/bookings/cancel/route.ts`
- Tests for the above.
- `supabase/migrations/20260908000001_add_payment_claimed_at_to_room_bookings.sql` (if needed)

**Existing files to modify:**
- `src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx` (replace stub)
