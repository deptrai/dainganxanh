# Story 11.4: Confirm Booking Payment

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a guest,
I want the system to confirm my booking when payment arrives,
So that I receive a booking confirmation and offline voucher.

## Acceptance Criteria

1. **Casso webhook dispatch to booking handler (already implemented in 13.1):**
   - `POST /api/webhooks/casso` reads transaction description, extracts order-code prefix `BK`, and routes to the booking handler (`processBooking`).
   - The booking handler finds the pending `room_bookings` row by `code` (including the `BK` prefix; database stores `code` as `BK` + 6 chars) and matches the incoming `amount` against `total_amount`.
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
   - **And** PII such as `guest_email`, `user_id`, internal `id`, `room_id`, `expires_at`, `payment_claimed_at`, `payment_ref`, `cancellation_reason`, `created_at`, and `updated_at` is NOT exposed in the page or HTML source

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

- [x] Task 1: Review existing implementation (AC: #1-#6, #9, #10)
  - [x] Confirm `src/app/api/webhooks/casso/route.ts` `processBooking` already:
  - [x] Finds pending booking by `code` with `BK` prefix
  - [x] Confirms it updates `status='confirmed'`, `payment_ref`, `expires_at=null`
  - [x] Confirms it calls `revalidatePath`, `notifyBookingConfirmed`
  - [x] Confirms `GET /api/bookings/status` returns `confirmed` and `VietQRDisplay` redirects correctly
  - [x] Confirms it sends `sendEcoStayVoucherEmail` when `guest_email` present
- [x] Task 2: Implement public offline voucher page (AC: #7)
  - [x] Create `src/app/(marketing)/eco-tourism/voucher/[code]/page.tsx`
  - [x] Fetch booking by code using `createServiceRoleClient`
  - [x] 404 if booking not found, not `confirmed`, not `completed`
  - [x] Render printable voucher with QR code
  - [x] Expose only `guest_name`, `guest_phone`, `room.name`, `lots.name`, `lots.region`, dates, counts, total
  - [x] Generate QR code data URL for the voucher URL
- [x] Task 3: Add voucher CTA to booking success page (AC: #8)
  - [x] Modify `src/app/(marketing)/eco-tourism/[lotId]/book/success/page.tsx`
  - [x] Add "Xem vé offline" link/button above or beside existing CTAs
  - [x] Link to `/eco-tourism/voucher/[code]`
- [x] Task 4: Verify `EcoStayVoucherEmail` contains voucher link (AC: #9)
  - [x] Read `src/emails/EcoStayVoucherEmail.tsx`
  - [x] Ensure it links to public voucher page URL
- [x] Task 5: Update `sendEcoStayVoucherEmail` arguments to include voucher URL if not already (AC: #9)
  - [x] Replace `crmBookingUrl` default `https://dainganxanh.com.vn/crm/my-bookings` with `voucherUrl` prop pointing to `/eco-tourism/voucher/[code]`
  - [x] Pass `voucherUrl` from `processBooking` in webhook route
- [x] Task 6: Write tests
  - [x] Unit test public voucher page: `src/app/(marketing)/eco-tourism/voucher/[code]/__tests__/page.test.tsx`
    - [x] 200 for confirmed booking, 404 for non-existent, 404 for pending/cancelled
    - [x] Assert QR code rendered and PII not in HTML
  - [x] Unit test success page shows voucher CTA
  - [x] Unit test webhook route `processBooking` confirms booking and triggers email
  - [x] Add `@jest-environment node` to API route tests
- [x] Task 7: Run build and test verification
  - [x] `npm test`
  - [x] `npx tsc --noEmit`
  - [x] `npm run build`

### Review Findings

- [x] [Review][Patch] Revalidate lot page `/eco-tourism/[lotId]` on booking confirmation to satisfy AC #10 [src/app/api/webhooks/casso/route.ts:323]
- [x] [Review][Patch] Redirect unconfirmed bookings on success page to prevent premature confirmation view [src/app/(marketing)/eco-tourism/[lotId]/book/success/page.tsx:49]
- [x] [Review][Patch] Add client-side print button (`VoucherPrintButton`) on printable voucher page with `window.print()` [src/components/eco-tourism/VoucherPrintButton.tsx:1]
- [x] [Review][Patch] Normalize booking code to uppercase in voucher SSR route and metadata [src/app/(marketing)/eco-tourism/voucher/[code]/page.tsx:35]
- [x] [Review][Patch] Update voucher page metadata title with dynamic booking code and noindex robots tags [src/app/(marketing)/eco-tourism/voucher/[code]/page.tsx:37]
- [x] [Review][Patch] Add unit tests for lowercase code normalization, print button invocation, and metadata generation [src/app/(marketing)/eco-tourism/voucher/[code]/__tests__/page.test.tsx:132]
- [x] [Review][Patch] Fix `EcoStayVoucherEmail` default `voucherUrl` to point to voucher page instead of eco-tourism listing [src/emails/EcoStayVoucherEmail.tsx:36]
- [x] [Review][Patch] Log Supabase error before `notFound()` on voucher page [src/app/(marketing)/eco-tourism/voucher/[code]/page.tsx:81]
- [x] [Review][Patch] Log QR code generation failure instead of silent catch [src/app/(marketing)/eco-tourism/voucher/[code]/page.tsx:89]
- [x] [Review][Patch] URL-encode `rawBooking.code` in success page voucher link [src/app/(marketing)/eco-tourism/[lotId]/book/success/page.tsx:144]
- [x] [Review][Patch] Assert `voucherUrl` href in `EcoStayVoucherEmail` template test [src/emails/__tests__/templates.test.tsx:61]

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

### Important: Booking Code Format

`room_bookings.code` is stored **WITH** the `BK` prefix (e.g., `BKABC123`). `generateBookingCode()` returns `BK` + 6 chars. `findPendingOrder` queries `.eq("code", orderCode)` where `orderCode` already includes `BK`. Do NOT strip the prefix when querying.

### What Needs Implementation

1. **Public offline voucher page** is missing. Need a public, PII-safe, printable voucher view.
2. **Voucher CTA on success page** is missing.
3. **Voucher link in `EcoStayVoucherEmail`** currently points to `/crm/my-bookings` (Story 11.6 not implemented); must be updated to `/eco-tourism/voucher/[code]` and `sendEcoStayVoucherEmail` must accept `voucherUrl`.

### Architecture Compliance

- **File structure:**
  - `src/app/api/webhooks/casso/route.ts` (update `sendEcoStayVoucherEmail` call to pass `voucherUrl`)
  - `src/app/(marketing)/eco-tourism/voucher/[code]/page.tsx` (NEW voucher page)
  - `src/lib/qrcode.ts` or inline QR code generation helper
  - `src/app/(marketing)/eco-tourism/[lotId]/book/success/page.tsx` (add voucher CTA)
  - `src/emails/EcoStayVoucherEmail.tsx` (update voucher link)
  - `src/lib/email/index.ts` (update `sendEcoStayVoucherEmail` signature if needed)

- **Database:**
  - `room_bookings.status` enum: `pending`, `confirmed`, `completed`, `cancelled`, `no_show`
  - `room_bookings.code` is stored WITH `BK` prefix (e.g., `BKABC123`)
  - `payment_transactions.status` enum: `pending`, `matched`, `amount_mismatch`, `stale`, `duplicate`

- **QR Code generation:**
  - Use `qrcode` npm package already in `package.json` to generate a data URL server-side.
  - `qrcode` and `qrcode.react` are already installed; no `npm install` needed.
  - Example: `import QRCode from 'qrcode'; const dataUrl = await QRCode.toDataURL(voucherUrl, { margin: 1, scale: 4 })`

- **SEO / metadata for voucher page:**
  - Add `metadata.robots: 'noindex, nofollow'` or equivalent because voucher page is personal and not meant for search indexing.
  - Keep `generateMetadata` minimal (e.g., title "Vé đặt phòng - Đại Ngàn Xanh").

- **Environment variables:**
  - `NEXT_PUBLIC_BASE_URL` must be set to build the public voucher URL (e.g., `https://dainganxanh.com.vn`).
  - Fallback: derive from request origin if env is missing.

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
  - Signature: `SendEcoStayVoucherEmailParams` includes `bookingId`, `recipientEmail`, plus all `EcoStayVoucherEmailProps`
  - Update `EcoStayVoucherEmailProps` to include `voucherUrl?: string` and render it as the primary CTA
  - Non-blocking execution; failures logged via `captureError`
  - `RESEND_API_KEY` not configured in local dev returns `{ success: true, id: 'dev-mock-id' }`

### Code Patterns to Follow

1. **Service Role Client**: `createServiceRoleClient()` from `@/lib/supabase/server`
2. **SSR page pattern**: public, uses `createServiceRoleClient`, `export const dynamic = 'force-dynamic'`, `generateMetadata`
3. **Error Handling**: wrap QR generation and database calls in `try/catch`, `captureError`
4. **Amount comparison**: `processBooking` uses `Math.abs(Number(tx.amount) - Number(order.total_amount)) > 1000` to detect mismatch with 1,000đ tolerance
5. **Code extraction**: `orderCode` in webhook description may be `BK-XXXXXX` or `BKXXXXXX`; `processBooking` already strips prefix via regex

### UX Notes

- Vietnamese labels; `emerald-600` primary.
- Success page: `emerald-50` background, `rounded-lg` cards.
- Voucher: printable A4-friendly layout, QR code clearly visible, contact hotline prominent.
- Voucher page should be minimal, no marketing navigation, printer-friendly.
- Include `@media print` CSS or print-optimized layout so the voucher looks clean when saved/printed.
- Email: responsive, includes logo, booking summary, voucher CTA.

### Testing Standards

- Jest 30: `--testPathPatterns` (plural) to filter.
- Mock Supabase chain; mock `fetch` for client components.
- Mock `qrcode` library for server-side QR generation.
- Add `/** @jest-environment node */` to API route tests.
- Run `npm test`, `npx tsc --noEmit`.

### Previous Story Intelligence (11.3)

- `room_bookings.code` is stored WITH the `BK` prefix in the database (e.g., `BKABC123`); client-facing code is shown with `BK` prefix.
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

Claude Sonnet 5

### Debug Log References

- `npx tsc --noEmit` — clean
- `npm test` — 80 suites / 752 tests pass
- `npm run build` — Next.js 16.1.1 compiled successfully, `/eco-tourism/voucher/[code]` route generated

### Completion Notes List

- Existing `processBooking` (Story 13.1) already handles booking confirmation, `payment_ref`, `expires_at`, `revalidatePath`, Telegram alerts, and email sending; this story only added the missing public voucher page, the success page CTA, and the email voucher URL.
- Created a public, PII-safe, printable voucher page at `/eco-tourism/voucher/[code]` with QR code (`qrcode` package already installed).
- Updated `EcoStayVoucherEmail` CTA from `crmBookingUrl` to `voucherUrl` pointing to `/eco-tourism/voucher/[code]`.
- `sendEcoStayVoucherEmail` signature already included `voucherUrl` via `EcoStayVoucherEmailProps`; only needed to pass the value from `processBooking`.
- Updated email template test expectation from `Xem Chi Tiết Đặt Phòng` to `Xem Vé Offline` to match new CTA copy.
- Added unit tests for voucher page (5 tests) and success page CTA.
- Senior Developer Code Review: 11 patches applied and verified (lot page revalidation on confirmation, success page unconfirmed status guard, case-insensitive booking code normalization, dynamic metadata title with booking code, VoucherPrintButton with print:hidden, corrected email default voucher URL, error logging for voucher page/QR, URL-encoded booking code, voucher href assertion, and comprehensive unit tests). All 80 test suites passed (755 tests). Status updated to `done`.

### File List

- `src/app/(marketing)/eco-tourism/voucher/[code]/page.tsx` (new)
- `src/app/(marketing)/eco-tourism/voucher/[code]/__tests__/page.test.tsx` (new)
- `src/components/eco-tourism/VoucherPrintButton.tsx` (new)
- `src/app/(marketing)/eco-tourism/[lotId]/book/success/page.tsx` (modified)
- `src/app/(marketing)/eco-tourism/[lotId]/book/success/__tests__/page.test.tsx` (modified)
- `src/emails/EcoStayVoucherEmail.tsx` (modified)
- `src/emails/__tests__/templates.test.tsx` (modified)
- `src/app/api/webhooks/casso/route.ts` (modified)

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-09-05 | 1.0 | Implemented public voucher page, success CTA, email voucher URL, and tests | Dev Agent |
| 2026-09-07 | 1.1 | Code review: code case normalization, dynamic metadata title, VoucherPrintButton, and tests | Review Agent |
