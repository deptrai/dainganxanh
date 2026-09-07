# Story 11.4: Confirm Booking Payment

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a guest,
I want the system to confirm my booking when payment arrives,
So that I receive a booking confirmation and offline voucher.

## Acceptance Criteria

1. **Casso webhook dispatch to booking handler (already implemented in 13.1):**
   - `POST /api/webhooks/casso` reads transaction description, extracts order-code prefix `BK`, and routes to the booking handler (`processBooking`).
   - The booking handler finds the pending `room_bookings` row by `code` (without prefix) and matches the incoming `amount` against `total_amount`.
   - AC #1 from 13.1 already guarantees dispatch + `payment_transactions` ledger logging + idempotency.

2. **Booking status confirmation (already implemented in 13.1):**
   - **Given** a pending booking with code `BK-` and matching Casso transaction
   - **When** `processBooking` validates the webhook payload
   - **Then** the booking `status` transitions from `pending` -> `confirmed`
   - **And** `payment_ref` is updated with the Casso transaction ID
   - **And** `expires_at` is set to `null` to release the 15-minute lock
   - **And** `payment_transactions` records `status = 'matched'`
   - **And** the room remains locked for the booked date range (GiST exclusion covers `pending`, `confirmed`, `completed`)

3. **Amount mismatch handling (already implemented in 13.1):**
   - **Given** a pending booking and a Casso transaction with a different amount
   - **When** the handler compares amounts
   - **Then** booking remains `pending`
   - **And** `payment_transactions` records `status = 'amount_mismatch'`
   - **And** a Telegram alert is sent to admin for manual reconciliation

4. **Duplicate/stale webhook handling (already implemented in 13.1):**
   - **Given** a duplicate `casso_tid` for the same booking
   - **When** the handler runs
   - **Then** the event is rejected with `duplicate` and no booking status change occurs
   - **And** stale transactions (> 60 minutes old) are rejected with `stale` status

5. **Guest polling reflects confirmation (already implemented in 11.3):**
   - **Given** a guest is on the VietQR display page polling `GET /api/bookings/status?code={bookingCode}`
   - **When** the booking status becomes `confirmed`
   - **Then** the endpoint returns `status: 'confirmed'`
   - **And** `VietQRDisplay` stops polling and redirects to `/eco-tourism/[lotId]/book/success?code={bookingCode}`

6. **Booking success page (already implemented in 11.3):**
   - **Given** a confirmed booking
   - **When** the guest lands on `/eco-tourism/[lotId]/book/success?code={bookingCode}`
   - **Then** the page shows booking code, room name, garden name, dates, nights, guests, total, and check-in instructions

7. **Public offline voucher page (NEW):**
   - **Given** a confirmed or completed booking
   - **When** the guest opens `/eco-tourism/voucher/[code]` (public, no auth)
   - **Then** the page renders a printable voucher containing:
     - Booking code with `BK` prefix
     - Guest name and phone
     - Room name, garden (lot) name and region
     - Check-in/out dates, nights count, guests count
     - Total amount
     - A scannable QR code encoding the same public voucher URL
     - Contact hotline and check-in instructions
   - **And** the page returns 404 if the booking code does not exist or status is not `confirmed` or `completed`
   - **And** PII such as `guest_email`, `user_id`, and internal `id` is NOT exposed in the page or HTML source

8. **Voucher CTA on success page (NEW):**
   - **Given** a confirmed booking on the success page
   - **When** the guest looks at the bottom of the booking summary
   - **Then** a button "Xem vé offline" is visible
   - **And** clicking it opens `/eco-tourism/voucher/[code]` in a new tab

9. **Email confirmation (already implemented in 13.1/13.5):**
   - **Given** a confirmed booking and the guest provided `guest_email`
   - **When** status becomes `confirmed`
   - **Then** the system sends an email with subject "Xác nhận đặt phòng [bookingCode] - Đại Ngàn Xanh"
   - **And** the email contains the booking summary and a link to the offline voucher

10. **Revalidation and cache invalidation (already implemented in 13.1):**
    - **When** a booking is confirmed
    - **Then** the handler calls `revalidatePath('/eco-tourism')` and `revalidatePath('/eco-tourism/' + lotId, 'page')`

## Tasks / Subtasks

- [ ] Task 1: Verify `processBooking` fully confirms room bookings (AC: #2)
  - [ ] Read `src/app/api/webhooks/casso/route.ts` `processBooking` function
  - [ ] Confirm it updates `status='confirmed'`, `payment_ref`, `expires_at=null`
  - [ ] Confirm it calls `revalidatePath` and `notifyBookingConfirmed`
  - [ ] Confirm it sends `sendEcoStayVoucherEmail` when `guest_email` present
- [ ] Task 2: Implement public offline voucher page (AC: #7)
  - [ ] Create `src/app/(marketing)/eco-tourism/voucher/[code]/page.tsx`
  - [ ] Fetch booking by code using `createServiceRoleClient`
  - [ ] 404 if booking not found, not `confirmed`, not `completed`
  - [ ] Render printable voucher with QR code
  - [ ] Expose only `guest_name`, `guest_phone`, `room.name`, `lots.name`, `lots.region`, dates, counts, total
  - [ ] Generate QR code data URL for the voucher URL
- [ ] Task 3: Add voucher CTA to booking success page (AC: #8)
  - [ ] Modify `src/app/(marketing)/eco-tourism/[lotId]/book/success/page.tsx`
  - [ ] Add "Xem vé offline" link/button above or beside existing CTAs
  - [ ] Link to `/eco-tourism/voucher/[code]`
- [ ] Task 4: Verify `EcoStayVoucherEmail` contains voucher link (AC: #9)
  - [ ] Read `src/emails/EcoStayVoucherEmail.tsx`
  - [ ] Ensure it links to public voucher page URL
- [ ] Task 5: Update `sendEcoStayVoucherEmail` arguments to include voucher URL if not already (AC: #9)
  - [ ] Add `voucherUrl` prop if missing
- [ ] Task 6: Write tests
  - [ ] Unit test public voucher page: `src/app/(marketing)/eco-tourism/voucher/[code]/__tests__/page.test.tsx`
    - [ ] 200 for confirmed booking, 404 for non-existent, 404 for pending/cancelled
    - [ ] Assert QR code rendered and PII not in HTML
  - [ ] Unit test success page shows voucher CTA
  - [ ] Unit test webhook route `processBooking` confirms booking and triggers email
  - [ ] Add `@jest-environment node` to API route tests
- [ ] Task 7: Run build and test verification
  - [ ] `npm test`
  - [ ] `npx tsc --noEmit`
  - [ ] `npm run build`

## Dev Notes

### Current Implementation Analysis

The existing polymorphic webhook at `src/app/api/webhooks/casso/route.ts` (Story 13.1) already contains:
- HMAC signature verification (`verifyCassoSignature`)
- Prefix extraction and dispatch to `processBooking`
- `payment_transactions` ledger (`logPaymentTransaction`)
- Idempotency via `UNIQUE (casso_tid, order_code)`
- Duplicate/stale detection
- Telegram alert pattern
- `processBooking` updates `room_bookings` to `confirmed`, sets `payment_ref`, `expires_at = null`, calls `revalidatePath`, `notifyBookingConfirmed`, and triggers `sendEcoStayVoucherEmail` for bookings with `guest_email`

The booking page and status polling from Story 11.3 already contain:
- `GET /api/bookings/status` returning `confirmed`
- `VietQRDisplay` stops polling and calls `onSuccess()` -> redirects to success page
- Success page at `src/app/(marketing)/eco-tourism/[lotId]/book/success/page.tsx`

The email template from Story 13.5 already contains:
- `src/emails/EcoStayVoucherEmail.tsx` for booking voucher emails
- `src/lib/email/` mailer client with Resend fallback and `email_logs` table logging

### What Needs Implementation

1. **Public offline voucher page** is missing. Need a public, PII-safe, printable voucher view.
2. **Voucher CTA on success page** is missing.
3. **Voucher link in `EcoStayVoucherEmail`** may be missing or may need to point to the new public page.

### Architecture Compliance

- **File structure:**
  - `src/app/api/webhooks/casso/route.ts` (verify existing `processBooking`)
  - `src/app/(marketing)/eco-tourism/voucher/[code]/page.tsx` (NEW voucher page)
  - `src/lib/qrcode.ts` or inline QR code generation helper
  - `src/app/(marketing)/eco-tourism/[lotId]/book/success/page.tsx` (add voucher CTA)
  - `src/emails/EcoStayVoucherEmail.tsx` (update voucher link)
  - `src/lib/email/index.ts` (update `sendEcoStayVoucherEmail` signature if needed)

- **Database:**
  - `room_bookings.status` enum: `pending`, `confirmed`, `completed`, `cancelled`, `no_show`
  - `room_bookings.code` is stored WITHOUT `BK` prefix
  - `payment_transactions.status` enum: `pending`, `matched`, `amount_mismatch`, `stale`, `duplicate`

- **QR Code generation:**
  - Option A: Use `qrcode` npm package (already common) to generate data URL server-side.
  - Option B: Use a third-party QR API, but avoid external network dependency; prefer server-side rendering.
  - If adding dependency, run `npm install qrcode @types/qrcode --save`.

- **Revalidation pattern (existing):**
  ```ts
  import { revalidatePath } from 'next/cache'
  revalidatePath('/eco-tourism')
  revalidatePath(`/eco-tourism/${lotId}`, 'page')
  ```

- **Telegram alert pattern (existing):**
  - `notifyBookingConfirmed(orderCode, guestName, amount)`
  - `notifyPaymentMismatch(orderCode, expected, received, 'booking')`

- **Email pattern (existing):**
  - `sendEcoStayVoucherEmail` in `src/lib/email/index.ts`
  - Non-blocking execution; failures logged via `captureError`
  - `RESEND_API_KEY` not configured in local dev returns `{ success: true, id: 'dev-mock-id' }`

### Code Patterns to Follow

1. **Service Role Client**: `createServiceRoleClient()` from `@/lib/supabase/server`
2. **SSR page pattern**: public, uses `createServiceRoleClient`, `export const dynamic = 'force-dynamic'`, `generateMetadata`
3. **Error Handling**: wrap QR generation and database calls in `try/catch`, `captureError`
4. **Amount comparison**: already handled in `processBooking` by comparing integer amounts from Casso to `room_bookings.total_amount`
5. **Code extraction**: `orderCode` in webhook description may be `BK-XXXXXX` or `BKXXXXXX`; `processBooking` already strips prefix via regex

### UX Notes

- Vietnamese labels; `emerald-600` primary.
- Success page: `emerald-50` background, `rounded-lg` cards.
- Voucher: printable A4-friendly layout, QR code clearly visible, contact hotline prominent.
- Voucher page should be minimal, no marketing navigation, printer-friendly.
- Email: responsive, includes logo, booking summary, voucher CTA.

### Testing Standards

- Jest 30: `--testPathPatterns` (plural) to filter.
- Mock Supabase chain; mock `fetch` for client components.
- Mock `qrcode` library for server-side QR generation.
- Add `/** @jest-environment node */` to API route tests.
- Run `npm test`, `npx tsc --noEmit`.

### Previous Story Intelligence (11.3)

- `room_bookings.code` is stored WITHOUT the `BK` prefix in the database; client-facing code is shown with `BK` prefix.
- `status` endpoint returns `status`, `expiresAt`, `totalAmount`, `roomName`, etc. and hides PII.
- `VietQRDisplay` polls every 5s and calls `onSuccess()` when `status === 'confirmed'`.
- `revalidatePath` is called on booking creation and cancellation.
- `todayVN = new Date(Date.now() + 7*60*60*1000).toISOString().slice(0,10)` for timezone safety.
- `formatVND` and `formatDate` helpers use `vi-VN` and midnight-safe date parsing.

### Previous Story Intelligence (13.1)

- `payment_transactions` has unique constraint `(casso_tid, order_code)`.
- `logPaymentTransaction` uses upsert/insert and maps `23505` violation to `duplicate`.
- `POLYMORPHIC_WEBHOOK_ENABLED` feature flag controls fallback.
- Each handler runs in isolated `try/catch` to prevent one vertical from crashing others.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 11.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Eco-Tourism Architecture, Payment Flow]
- [Source: _bmad-output/implementation-artifacts/13-1-polymorphic-casso-webhook.md]
- [Source: _bmad-output/implementation-artifacts/13-2-secure-order-creation-apis.md]
- [Source: _bmad-output/implementation-artifacts/13-5-transactional-email-templates.md]
- [Source: _bmad-output/implementation-artifacts/11-3-create-booking-reservation.md]
- [Source: src/app/api/webhooks/casso/route.ts]
- [Source: src/app/api/bookings/status/route.ts]
- [Source: src/app/api/bookings/create/route.ts]
- [Source: src/components/eco-tourism/VietQRDisplay.tsx]
- [Source: src/app/(marketing)/eco-tourism/[lotId]/book/success/page.tsx]
- [Source: src/emails/EcoStayVoucherEmail.tsx]
- [Source: src/lib/email/index.ts]

## Dev Agent Record

### Agent Model Used



### Debug Log References



### Completion Notes List



### File List
