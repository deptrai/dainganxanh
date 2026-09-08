# Story 11.8: Admin Room Calendar

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

**As an** admin/resort manager,
**I want** a calendar view of room availability,
**So that** I can manage operations.

## Acceptance Criteria

1. **View room calendar at `/crm/admin/rooms`**:
   - **Given** I am authenticated as an admin/resort_manager and navigate to `/crm/admin/rooms`
   - **When** the page loads
   - **Then** I see a calendar view of bookings per room, grouped by khu vườn (lot)
   - **And** each booking is shown as a horizontal bar from `check_in_date` (inclusive) to `check_out_date` (exclusive)
   - **And** bookings are color-coded by status: `pending`=amber, `confirmed`=emerald, `cancelled`=red, `completed`=blue, `no_show`=gray (reuse `BookingStatusBadge` palette)
   - **And** each calendar entry shows room name, booking code, and guest name
   - **And** clicking a booking entry navigates to `/crm/admin/bookings/[bookingId]`

2. **Room blocking for maintenance**:
   - **Given** I am on the room calendar page
   - **When** I select a room and click "Khóa phòng bảo trì" (Block for maintenance)
   - **Then** I can choose a date range (`start_date`, `end_date`) and a reason
   - **And** the system creates a `room_blocks` record with `status = 'maintenance'`
   - **And** blocked periods are displayed as a distinct color (e.g., gray with pattern) on the calendar
   - **And** blocked rooms cannot be booked by guests during the blocked period (create booking API must check `room_blocks` for date overlap)
   - **And** an admin can delete/unblock a maintenance block

3. **Access control**:
   - **Given** I am not authenticated
   - **When** I navigate to `/crm/admin/rooms`
   - **Then** I am redirected to `/auth/login`
   - **Given** I am authenticated but not `admin`, `super_admin`, or `resort_manager`
   - **When** I navigate to `/crm/admin/rooms`
   - **Then** I am redirected to `/crm/my-bookings`

4. **Calendar navigation**:
   - **Given** the calendar view loads
   - **When** I view a specific month
   - **Then** I can navigate to previous/next month
   - **And** I see room names in the first column
   - **And** date columns show the days of the selected month

## Tasks / Subtasks

- [ ] Task 1: Create admin room calendar page (AC: #1, #3)
  - [ ] Create `src/app/crm/admin/rooms/page.tsx`
  - [ ] Verify admin role via `verifyAdminRole()` from `src/actions/adminBookings.ts` or shared helper
  - [ ] Add `robots: { index: false }` metadata
  - [ ] Display `RoomCalendarClient` component

- [ ] Task 2: Create calendar component (AC: #1, #4)
  - [ ] Create `src/components/admin/RoomCalendar.tsx`
  - [ ] Fetch lots → rooms → bookings and `room_blocks`
  - [ ] Render month-based calendar with room rows
  - [ ] Show booking bars with status colors and guest/room info
  - [ ] Add month navigation (previous/next)
  - [ ] Make booking entries clickable (link to `/crm/admin/bookings/[bookingId]`)

- [ ] Task 3: Add room blocking server actions (AC: #2)
  - [ ] Create `src/actions/adminRooms.ts`
  - [ ] `blockRoomForMaintenance(roomId, startDate, endDate, reason)` — verify admin, insert `room_blocks` row
  - [ ] `unblockRoom(blockId)` — delete `room_blocks` row
  - [ ] All actions use `createServiceRoleClient` and `captureError`
  - [ ] Validate `start_date < end_date` and no overlap with existing confirmed/pending bookings

- [ ] Task 4: Extend schema for room blocking (AC: #2)
  - [ ] Create migration `add_room_blocks.sql` with table:
    ```sql
    CREATE TABLE room_blocks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'maintenance',
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT room_blocks_dates CHECK (start_date < end_date)
    );
    ```
  - [ ] Add RLS/permissions for service role access
  - [ ] Add index on `(room_id, start_date, end_date)`
  - [ ] If `rooms` table already has `maintenance` in `status` enum, use it only for permanent room closure; `room_blocks` is for date-range blocking

- [ ] Task 5: Update booking creation to respect room blocks (AC: #2)
  - [ ] Modify `src/app/api/bookings/create/route.ts` to check `room_blocks` for overlap
  - [ ] Return `409` with message "Phòng đang bảo trì trong khoảng thời gian này" if blocked
  - [ ] Update `src/lib/pricing/booking.ts` or `calculateBookingPrice` to also check blocks (or rely on route-level check)

- [ ] Task 6: Add admin navigation (AC: #1)
  - [ ] Update `src/components/admin/AdminSidebar.tsx`
  - [ ] Add "Lịch phòng" link to `/crm/admin/rooms` with `Calendar` icon

- [ ] Task 7: Write tests
  - [ ] `src/app/crm/admin/rooms/__tests__/page.test.tsx` — page render, auth redirect
  - [ ] `src/components/admin/__tests__/RoomCalendar.test.tsx` — calendar render, month nav
  - [ ] `src/actions/__tests__/adminRooms.test.ts` — block/unblock validation and overlap checks
  - [ ] Update `src/app/api/bookings/create/__tests__/route.test.ts` — room block overlap case

- [ ] Task 8: Build, typecheck, and E2E verification
  - [ ] `npx tsc --noEmit` — 0 errors
  - [ ] `npx jest` — all tests pass
  - [ ] `npm run build` — builds successfully
  - [ ] Manual E2E: verify admin can view calendar, block/unblock room, booking respects blocks

## Dev Notes

- **Re-use existing patterns:**
  - Auth pattern from `src/app/crm/admin/bookings/page.tsx`
  - Server action pattern from `src/actions/adminBookings.ts`
  - `BookingStatusBadge` for status colors in `src/components/crm/BookingStatusBadge.tsx`
  - `BookingStatus` type in `src/lib/eco-tourism/availability.ts`
  - `useDebounce` for any search/filter in calendar

- **Schema reality check:**
  - `rooms` table has `status` enum: `'active' | 'inactive' | 'maintenance'` (see `src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx` Room interface)
  - Permanent room closure: set `rooms.status = 'maintenance'`
  - Date-range maintenance: create `room_blocks` row
  - Booking date overlap already uses `getBlockingBookings` and `calculateBookingPrice` with Postgres exclusion constraint
  - `room_blocks` must also be checked in create API to prevent new bookings during maintenance

- **Calendar UI notes:**
  - Month view with room rows is simplest for MVP
  - Show bookings as bars spanning check_in_date (inclusive) to check_out_date (exclusive)
  - Show `room_blocks` in a distinct color/pattern
  - Clicking a booking bar links to admin booking detail

- **Admin role gating:**
  - Reuse `verifyAdminRole()` pattern; `resort_manager` requires `admin_user_lots` assignment

### Project Structure Notes

- `src/app/crm/admin/rooms/page.tsx` follows existing `/crm/admin/*` pattern
- `src/components/admin/RoomCalendar.tsx` is a client component for month navigation
- `src/actions/adminRooms.ts` for room-specific admin actions
- New migration in `dainganxanh-landing/supabase/migrations/`

### References

- Story file: `_bmad-output/implementation-artifacts/11-8-admin-room-calendar.md`
- Previous story: `_bmad-output/implementation-artifacts/11-7-admin-booking-management.md`
- Admin pattern: `src/app/crm/admin/bookings/page.tsx`
- Admin actions pattern: `src/actions/adminBookings.ts`
- Booking create API: `src/app/api/bookings/create/route.ts`
- Availability helpers: `src/lib/eco-tourism/availability.ts`
- Room pricing: `src/lib/pricing/booking.ts`
- Booking status badge: `src/components/crm/BookingStatusBadge.tsx`
- Sidebar: `src/components/admin/AdminSidebar.tsx`

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
