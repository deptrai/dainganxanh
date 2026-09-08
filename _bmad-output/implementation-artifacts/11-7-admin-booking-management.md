# Story 11.7: Admin Booking Management

Status: done

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

