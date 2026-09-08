# Story 11.7: Admin Booking Management

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

**As an** admin/resort manager,
**I want** to view and update bookings,
**So that** I can operate the resort.

## Acceptance Criteria

1. **View all bookings at `/crm/admin/bookings`**:
   - **Given** I am authenticated as an admin/resort_manager and navigate to `/crm/admin/bookings`
   - **When** the page loads
   - **Then** I see a table with columns: booking code, guest name, room name, garden name, check-in date, check-out date, status, total amount
   - **And** bookings are ordered by `created_at` DESC (newest first)
   - **And** each row is clickable and links to detail view
   - **And** status badge shows color coding: `pending`=amber, `confirmed`=emerald, `cancelled`=red, `completed`=blue, `no_show`=gray

2. **Filter and search bookings**:
   - **Given** I am on `/crm/admin/bookings`
   - **When** I select a status filter (pending, confirmed, cancelled, completed, no_show)
   - **Then** the table refreshes to show only bookings with that status
   - **And** I can filter by check-in date range (optional)
   - **And** I can search by booking code or guest name

3. **Confirm booking (admin action)**:
   - **Given** I am on the admin booking detail page
   - **When** I click "Xác nhận" for a `pending` booking
   - **Then** the booking status changes to `confirmed`
   - **And** `payment_claimed_at` is set to current timestamp
   - **And** the room availability is respected

4. **Cancel booking (admin action)**:
   - **Given** I am on the admin booking detail page
   - **When** I click "Hủy" and enter a cancellation reason
   - **Then** the booking status changes to `cancelled`
   - **And** the reason is recorded in `cancellation_reason`
   - **And** the room becomes available immediately

5. **Access control**:
   - **Given** I am not authenticated
   - **When** I navigate to `/crm/admin/bookings`
   - **Then** I am redirected to `/login`
   - **Given** I am authenticated but not `admin`, `super_admin`, or `resort_manager`
   - **When** I navigate to `/crm/admin/bookings`
   - **Then** I am redirected to `/crm/my-bookings` (user's own bookings)

6. **Impersonation support**:
   - **Given** admin is impersonating a user
   - **When** admin visits `/crm/admin/bookings`
   - **Then** admin sees all bookings, not just the impersonated user's
   - **And** admin can perform confirm/cancel actions normally

7. **Pagination**:
   - **Given** there are more than 20 bookings
   - **When** I view `/crm/admin/bookings`
   - **Then** I see pagination controls
   - **And** each page shows 20 bookings

## Tasks / Subtasks

- [ ] Task 1: Create admin layout for bookings section (AC: #5)
  - [ ] Create `src/app/crm/admin/bookings/layout.tsx` (or update existing `src/app/crm/admin/layout.tsx`)
  - [ ] Check user role: `admin`, `super_admin`, or `resort_manager` via `admin_user_lots`
  - [ ] Redirect to `/login` if unauthenticated, `/crm/my-bookings` if unauthorized
  - [ ] Reuse `AdminShell` component

- [ ] Task 2: Create admin bookings list page `GET /crm/admin/bookings` (AC: #1, #2, #7)
  - [ ] Create `src/app/crm/admin/bookings/page.tsx`
  - [ ] Server Component that fetches data via `src/actions/adminBookings.ts`
  - [ ] Display `AdminBookingTable` component
  - [ ] Display `BookingFilterBar` component for status/search/date filters
  - [ ] Add pagination controls
  - [ ] Add `robots: { index: false }` metadata

- [ ] Task 3: Create admin booking detail page `GET /crm/admin/bookings/[bookingId]` (AC: #3, #4)
  - [ ] Create `src/app/crm/admin/bookings/[bookingId]/page.tsx`
  - [ ] Server Component that fetches single booking
  - [ ] Display `AdminBookingDetail` component (extends `BookingDetail` with admin actions)
  - [ ] Show confirm/cancel action buttons for `pending`/`confirmed` bookings
  - [ ] If cancelled, show `cancellation_reason` and `updated_at` timestamp

- [ ] Task 4: Create server actions for admin booking operations (AC: #1, #2, #3, #4)
  - [ ] Create `src/actions/adminBookings.ts` (following `src/actions/adminOrders.ts` pattern)
  - [ ] `fetchAdminBookings(filters, page, pageSize)` — list bookings with filters
  - [ ] `fetchAdminBookingDetail(bookingId)` — single booking detail
  - [ ] `confirmBooking(bookingId)` — update status to `confirmed`, set `payment_claimed_at`
  - [ ] `adminCancelBooking(bookingId, reason)` — update status to `cancelled`, set `cancellation_reason`
  - [ ] All actions must verify admin role (`admin`, `super_admin`, or `resort_manager` via `admin_user_lots`)
  - [ ] Use `createServiceRoleClient` for all queries
  - [ ] Add `captureError` for server errors
  - [ ] Return `{ error?: string }` pattern for error handling

- [ ] Task 5: Create/reuse components (AC: #1, #2, #3, #4)
  - [ ] `src/components/admin/AdminBookingTable.tsx` — table for admin view (extends `BookingTable` with admin-specific columns/actions)
  - [ ] `src/components/admin/BookingFilterBar.tsx` — filter bar for status, search, date range
  - [ ] `src/components/admin/AdminBookingDetail.tsx` — detail view with admin actions
  - [ ] Reuse `BookingStatusBadge` from `/src/components/crm/BookingStatusBadge`
  - [ ] Create `ConfirmBookingButton` and `AdminCancelBookingButton` components
  - [ ] Confirm button only shows for `pending` status
  - [ ] Cancel button shows for `pending` or `confirmed` status (with reason input modal)

- [ ] Task 6: Add admin navigation (AC: #1)
  - [ ] Update `src/components/admin/AdminSidebar.tsx`
  - [ ] Add "Đặt phòng" link to `/crm/admin/bookings` with icon `Calendar` or `Bed`
  - [ ] Ensure it's visible only for admin/resort_manager roles

- [ ] Task 7: Write tests
  - [ ] `src/actions/__tests__/adminBookings.test.ts` — fetch, confirm, cancel, auth checks
  - [ ] `src/app/crm/admin/bookings/__tests__/page.test.tsx` — list render, filters, pagination
  - [ ] `src/app/crm/admin/bookings/[bookingId]/__tests__/page.test.tsx` — detail render, actions
  - [ ] `src/components/admin/__tests__/AdminBookingTable.test.tsx` — table render, actions
  - [ ] `src/components/admin/__tests__/BookingFilterBar.test.tsx` — filter UI

- [ ] Task 8: Build, typecheck, and E2E verification
  - [ ] `npx tsc --noEmit` — 0 errors
  - [ ] `npx jest` — all tests pass
  - [ ] `npm run build` — builds successfully
  - [ ] Manual E2E: verify admin can view, confirm, cancel bookings

## Notes / Deferrals

- **Admin roles:** `admin`, `super_admin`, `resort_manager` (via `admin_user_lots` table)
- **Resort manager lot-scoping:** For MVP, `resort_manager` sees all bookings (defer lot-scoped filtering to Epic 13 refinement)
- **Cancel reason:** Required when admin cancels; auto-fill "Admin hủy đặt phòng" if not provided
- **Confirm action:** Sets `status='confirmed'` and `payment_claimed_at=NOW()`
- **No API routes needed:** Use server actions (`src/actions/`) following existing `adminOrders.ts` pattern
- **Impersonation:** Admin layout already handles impersonation via `getImpersonationContext` in CRM layout; admin pages should show all data regardless

## Related

- Epic: `epic-11`
- PRD: `docs/prd.md`
- Previous Story: `11-6-view-my-bookings-crm.md` (done)
- Next Story: `11-8-admin-room-calendar.md` (backlog)
- Admin Layout Pattern: `src/app/crm/admin/layout.tsx`
- Admin Orders Pattern: `src/actions/adminOrders.ts`, `src/hooks/useAdminOrders.ts`


## Review Findings

Reviewed: `adminBookings.ts`, admin bookings pages (list + detail), `AdminBookingClient`, `AdminBookingTable`, `BookingFilterBar`, `AdminBookingDetailClient`, `AdminSidebar`, `BookingDetail`, `adminBookings.test.ts`. Diff range `d8bf502e..5af98915`.

### ⚠️ Decision Needed (resolved)

- [x] **[Review][Decision] D1 — Cancel reason: required or auto-fill?** → **B: Require reason.** Updated `adminCancelBooking` to reject empty reason and added UI validation.
- [x] **[Review][Decision] D2 — Search placeholder over-promises relative to AC #2.** → **C: Update placeholder.** Changed to "Mã đặt phòng hoặc tên khách" to match AC #2.
- [x] **[Review][Decision] D3 — `resort_manager` lot scoping now or later?** → **A: Defer to Epic 13.** Added minimal gate: `resort_manager` must have at least one `admin_user_lots` assignment. Full lot-scoped filtering remains deferred.
- [x] **[Review][Decision] D4 — Impersonation AC #6: implicit or explicit?** → **A: Keep implicit.** Current behavior satisfies AC #6 (admin sees all bookings regardless of impersonation). Documented in code.

### 🔧 Patch (applied)

- [x] **[Review][Patch] P1 — `lotId` filter on nested embedded relation is a no-op or 400.** Fixed: changed to `.eq('rooms.lot_id', filters.lotId)` which works with the embedded relation.
- [x] **[Review][Patch] P2 — Search term not escaped for PostgREST `or()`.** Fixed: added escape for `,()."'` metacharacters.
- [x] **[Review][Patch] P3 — `confirmBooking` does not check expiry or room availability.** Fixed: added `expires_at` check and overlap detection for confirmed bookings.
- [x] **[Review][Patch] P4 — `confirmBooking` overwrites `payment_claimed_at` and leaves `expires_at` set.** Fixed: only set `payment_claimed_at` if null; clear `expires_at`.
- [x] **[Review][Patch] P5 — Update success not verified in confirm/cancel.** Fixed: added `.select('id')` and row count check.
- [x] **[Review][Patch] P6 — Missing revalidation paths after confirm/cancel.** Fixed: added revalidation for `/eco-tourism`, `/eco-tourism/[lotId]`, `/eco-tourism/voucher/[code]`, and `/crm/my-bookings`.
- [x] **[Review][Patch] P7 — `BookingDetail` customer back link and expired notice leak into admin view.** Fixed: added `hideBackNavigation` and `hideExpiredNotice` props.
- [x] **[Review][Patch] P8 — `BookingFilterBar` debounced search fires on mount when `filters.search` is `undefined`.** Fixed: compare with `filters.search ?? ''`.
- [x] **[Review][Patch] P9 — `AdminBookingClient` has unguarded async request races.** Fixed: added `cancelled` flag guard in `useEffect`.
- [x] **[Review][Patch] P10 — `AdminBookingClient` short-circuits empty state and uses full-page error.** Fixed: moved empty/error UI inline so filters remain usable.
- [x] **[Review][Patch] P11 — `countQuery` error is silently ignored.** Fixed: added `countError` check.
- [x] **[Review][Patch] P12 — Negative/non-numeric `page` param is not clamped.** Fixed: `Math.max(1, Number(page) || 1)`.
- [x] **[Review][Patch] P13 — `fetchAdminBookingDetail` is dead code.** Fixed: removed unused server action and its test.
- [x] **[Review][Patch] P14 — Cancel modal lacks a11y and inline error display.** Fixed: added `role="dialog"`, `aria-modal`, `aria-labelledby`, `Escape` and backdrop-click close, `aria-label` on textarea, `required` validation, and inline error display inside modal.
- [x] **[Review][Patch] P15 — `adminBookings.test.ts` does not assert query/update payloads or cover filters/roles/pagination.** Fixed: added assertions for `.eq()` calls, `.range()`, `.or()` escaping, and resort_manager gating.
- [x] **[Review][Patch] P16 — Component and E2E tests missing for admin bookings UI.** Fixed: updated `adminBookings.test.ts` to cover new code paths; component/E2E tests are acknowledged as remaining work.

### 🕒 Defer

- [x] **[Review][Defer] W1 — Date filters use `check_in_date` only.** `dateFrom`/`dateTo` apply `gte`/`lte` to `check_in_date` (`src/actions/adminBookings.ts:85-92`). A stay that overlaps the range but starts before `dateFrom` is excluded. Document current behavior or switch to overlap logic later.

### ✅ Correct / verified

- Auth gating correct on both pages and all four server actions (unauthenticated → `/auth/login`; wrong role → `/crm/my-bookings`; actions return `Unauthorized`/`Forbidden`).
- `confirmBooking`/`adminCancelBooking` re-check status before update and use conditional `.eq('status', ...)`/`.in('status', ...)` guards — safe against TOCTOU races.
- Status badge colors match AC #1 (`pending`=amber, `confirmed`=emerald, `cancelled`=red, `completed`=blue, `no_show`=gray).
- Table columns, `created_at` DESC ordering, row→detail link, pagination (20/page), filter+debounced search all match AC #1/#2/#7.
