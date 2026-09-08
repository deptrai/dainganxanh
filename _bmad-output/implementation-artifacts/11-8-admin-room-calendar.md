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
   - **Then** I see a calendar/gantt view of bookings per room
   - **And** each room shows its bookings in a timeline format (check-in to check-out dates)
   - **And** bookings are color-coded by status: `pending`=amber, `confirmed`=emerald, `cancelled`=red, `completed`=blue, `no_show`=gray
   - **And** rooms are grouped by their khu vườn (lot)

2. **Room blocking for maintenance**:
   - **Given** I am on the room calendar page
   - **When** I select a room and click "Block for maintenance"
   - **Then** I can choose a date range and reason
   - **And** the room status changes to `maintenance` or the room is marked as unavailable for the selected dates
   - **And** blocked periods are displayed distinctly on the calendar
   - **And** blocked rooms cannot be booked by guests during the blocked period

3. **Access control**:
   - **Given** I am not authenticated
   - **When** I navigate to `/crm/admin/rooms`
   - **Then** I am redirected to `/login`
   - **Given** I am authenticated but not `admin`, `super_admin`, or `resort_manager`
   - **When** I navigate to `/crm/admin/rooms`
   - **Then** I am redirected to `/crm/my-bookings`

4. **Data display**:
   - **Given** the calendar view loads
   - **When** I view a specific date range
   - **Then** I can navigate between months/weeks
   - **And** I see room names, booking codes, guest names on calendar entries
   - **And** clicking a booking shows booking details or links to booking detail

## Tasks / Subtasks

- [ ] Task 1: Create admin room calendar page (AC: #1, #3)
  - [ ] Create `src/app/crm/admin/rooms/page.tsx`
  - [ ] Verify admin role (admin, super_admin, resort_manager with admin_user_lots)
  - [ ] Add `robots: { index: false }` metadata
  - [ ] Display `RoomCalendar` component
  - [ ] Add room list with grouping by lot

- [ ] Task 2: Create room calendar component (AC: #1, #4)
  - [ ] Create `src/components/admin/RoomCalendar.tsx`
  - [ ] Fetch rooms and their bookings
  - [ ] Display calendar/gantt view showing check-in/check-out dates
  - [ ] Color-code bookings by status
  - [ ] Add month/week navigation
  - [ ] Make booking entries clickable (link to booking detail)

- [ ] Task 3: Create room blocking functionality (AC: #2)
  - [ ] Create `src/components/admin/BlockRoomButton.tsx` or similar
  - [ ] Create server action `blockRoomForMaintenance` in `src/actions/adminBookings.ts`
  - [ ] Accept room_id, start_date, end_date, reason
  - [ ] Update room status or create blocking record
  - [ ] Revalidate relevant paths

- [ ] Task 4: Extend room schema for blocking (AC: #2)
  - [ ] Check if `rooms` table has `status` field or `blocked_dates` field
  - [ ] If needed, create migration for blocking (e.g., `room_blocks` table or `status` enum update)
  - [ ] Update booking creation to check for blocked rooms

- [ ] Task 5: Navigation (AC: #1)
  - [ ] Update `src/components/admin/AdminSidebar.tsx`
  - [ ] Add "Lịch phòng" link to `/crm/admin/rooms` with icon

- [ ] Task 6: Write tests
  - [ ] `src/app/crm/admin/rooms/__tests__/page.test.tsx` — page render, auth, data fetching
  - [ ] `src/components/admin/__tests__/RoomCalendar.test.tsx` — calendar render, navigation
  - [ ] `src/actions/__tests__/adminBookings.test.ts` — blockRoomForMaintenance tests

- [ ] Task 7: Build, typecheck, and E2E verification
  - [ ] `npx tsc --noEmit` — 0 errors
  - [ ] `npx jest` — all tests pass
  - [ ] `npm run build` — builds successfully
  - [ ] Manual E2E: verify admin can view calendar, block room

## Dev Notes

- Reuse existing patterns from `adminBookings.ts` and admin pages
- Use `AdminBookingFilters` pattern for date range selection
- `rooms` table already has `status` field ('active', 'inactive', etc.)
- Consider using existing `AdminBookingTable` or creating specialized calendar view
- Booking display should include: room name, booking code, guest name, check-in/out dates
- Blocked dates should prevent new bookings in `createBooking` API
- Reuse `BookingStatusBadge` for status colors

### Project Structure Notes

- Calendar page at `/crm/admin/rooms` follows existing admin page pattern
- Reuse `AdminShell` layout from existing admin pages
- Follow same auth pattern as `AdminBookingsPage`

### References

- Story file: `_bmad-output/implementation-artifacts/11-8-admin-room-calendar.md`
- Previous story: `11-7-admin-booking-management.md` (done)
- Admin pattern: `src/app/crm/admin/bookings/page.tsx`
- Admin actions pattern: `src/actions/adminBookings.ts`
- Booking API: `src/app/api/bookings/create/route.ts`
- Room pricing: `src/lib/pricing/booking.ts`
- Permissions: `src/lib/admin/permissions.ts`

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
