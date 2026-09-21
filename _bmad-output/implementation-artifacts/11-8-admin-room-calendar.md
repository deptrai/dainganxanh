# Story 11.8: Admin Room Calendar

Status: done

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

- [x] Task 1: Create admin room calendar page (AC: #1, #3)
  - [x] Create `src/app/crm/admin/rooms/page.tsx`
  - [x] Verify admin role via `verifyAdminRole()` from `src/actions/adminBookings.ts` or shared helper
  - [x] Add `robots: { index: false }` metadata
  - [x] Display `RoomCalendarClient` component

- [x] Task 2: Create calendar component (AC: #1, #4)
  - [x] Create `src/components/admin/RoomCalendar.tsx`
  - [x] Fetch lots → rooms → bookings and `room_blocks`
  - [x] Render month-based calendar with room rows
  - [x] Show booking bars with status colors and guest/room info
  - [x] Add month navigation (previous/next)
  - [x] Make booking entries clickable (link to `/crm/admin/bookings/[bookingId]`)

- [x] Task 3: Add room blocking server actions (AC: #2)
  - [x] Create `src/actions/adminRooms.ts`
  - [x] `blockRoomForMaintenance(roomId, startDate, endDate, reason)` — verify admin, insert `room_blocks` row
  - [x] `unblockRoom(blockId)` — delete `room_blocks` row
  - [x] All actions use `createServiceRoleClient` and `captureError`
  - [x] Validate `start_date < end_date` and no overlap with existing confirmed/pending bookings

- [x] Task 4: Extend schema for room blocking (AC: #2)
  - [x] Create migration `add_room_blocks.sql` with table:
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
  - [x] Add RLS/permissions for service role access
  - [x] Add index on `(room_id, start_date, end_date)`
  - [x] If `rooms` table already has `maintenance` in `status` enum, use it only for permanent room closure; `room_blocks` is for date-range blocking

- [x] Task 5: Update booking creation to respect room blocks (AC: #2)
  - [x] Modify `src/app/api/bookings/create/route.ts` to check `room_blocks` for overlap
  - [x] Return `409` with message "Phòng đang bảo trì trong khoảng thời gian này" if blocked
  - [x] Update `src/lib/pricing/booking.ts` or `calculateBookingPrice` to also check blocks (or rely on route-level check)

- [x] Task 6: Add admin navigation (AC: #1)
  - [x] Update `src/components/admin/AdminSidebar.tsx`
  - [x] Add "Lịch phòng" link to `/crm/admin/rooms` with `Calendar` icon

- [x] Task 7: Write tests
  - [x] `src/app/crm/admin/rooms/__tests__/page.test.tsx` — page render, auth redirect
  - [x] `src/components/admin/__tests__/RoomCalendar.test.tsx` — calendar render, month nav
  - [x] `src/actions/__tests__/adminRooms.test.ts` — block/unblock validation and overlap checks
  - [x] Update `src/app/api/bookings/create/__tests__/route.test.ts` — room block overlap case

- [x] Task 8: Build, typecheck, and E2E verification
  - [x] `npx tsc --noEmit` — 0 errors
  - [x] `npx jest` — all tests pass
  - [x] `npm run build` — builds successfully
  - [x] Manual E2E: verify admin can view calendar, block/unblock room, booking respects blocks

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
## Dev Agent Record

### Agent Model Used

claude-opus-5 (Opus 5)

### Debug Log References

- `src/actions/adminRooms.ts` — added server actions for room blocking
- `src/app/crm/admin/rooms/page.tsx` — admin page with auth gating
- `src/components/admin/RoomCalendarClient.tsx` — month calendar UI
- `src/app/api/bookings/create/route.ts` — added room_blocks overlap check
- `src/components/admin/AdminSidebar.tsx` — added "Lịch phòng" link
- `supabase/migrations/20260908000002_add_room_blocks.sql` — new table
- `src/actions/__tests__/adminRooms.test.ts` — 8 tests
- `src/app/crm/admin/rooms/__tests__/page.test.tsx` — 3 tests
- `src/components/admin/__tests__/RoomCalendar.test.tsx` — 4 tests
- `src/app/api/bookings/create/__tests__/route.test.ts` — added block overlap test
- `src/lib/pricing/__tests__/tampering-prevention.test.ts` — updated mock for room_blocks

### Completion Notes List

- Implemented full admin room calendar at /crm/admin/rooms with month navigation, room rows, booking bars (color-coded by status), and maintenance blocks.
- Added `room_blocks` table with RLS (admin + resort_manager scoped).
- Added `blockRoomForMaintenance`, `unblockRoom`, `fetchRoomCalendarData` server actions.
- Added room_blocks overlap check in booking create API returning 409 "Phòng đang bảo trì trong khoảng thời gian này".
- Added "Lịch phòng" to admin sidebar.
- All unit tests pass (15 new tests), typecheck clean, build successful.

### File List

- `dainganxanh-landing/supabase/migrations/20260908000002_add_room_blocks.sql`
- `dainganxanh-landing/src/actions/adminRooms.ts`
- `dainganxanh-landing/src/actions/__tests__/adminRooms.test.ts`
- `dainganxanh-landing/src/app/crm/admin/rooms/page.tsx`
- `dainganxanh-landing/src/app/crm/admin/rooms/__tests__/page.test.tsx`
- `dainganxanh-landing/src/components/admin/RoomCalendarClient.tsx`
- `dainganxanh-landing/src/components/admin/__tests__/RoomCalendar.test.tsx`
- `dainganxanh-landing/src/components/admin/AdminSidebar.tsx`
- `dainganxanh-landing/src/app/api/bookings/create/route.ts`
- `dainganxanh-landing/src/app/api/bookings/create/__tests__/route.test.ts`
- `dainganxanh-landing/src/lib/pricing/__tests__/tampering-prevention.test.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-09-08: Implemented story 11.8 Admin Room Calendar (tasks 1-8 complete)
- 2026-09-08: Code review applied 6 patches (removed dead code, added date validation, unblock confirm, guest name display, calculate-price block check, UUID validation). All tests pass (854), typecheck clean.

## Review Findings

- [x] [Review][Patch] Remove `useRouter` dead import — removed from `RoomCalendarClient.tsx`
- [x] [Review][Patch] Remove `DAYS_IN_WEEK` dead constant — removed from `RoomCalendarClient.tsx`
- [x] [Review][Patch] Add `aria-label` to "Khóa" button — added in `RoomCalendarClient.tsx:289`
- [x] [Review][Patch] Add `window.confirm` before `unblockRoom` — added in `RoomCalendarClient.tsx:122`
- [x] [Review][Patch] Fix `isEnd` for last day of month — fixed via `getMonthDateString` using `Date` constructor in `RoomCalendarClient.tsx:45`
- [x] [Review][Patch] Add date validation to `fetchRoomCalendarData` — added `isValidDateString` check in `adminRooms.ts:225`
- [x] [Review][Patch] Add semantic date validation to `blockRoomForMaintenance` — added `isValidDateString` in `adminRooms.ts:69`
- [x] [Review][Patch] Add UUID validation to `unblockRoom` — added `UUID_RE` check in `adminRooms.ts:166`
- [x] [Review][Patch] Display `guest_name` in booking bar — added visible `sublabel` in `RoomCalendarClient.tsx:332`
- [x] [Review][Patch] Add `room_blocks` check to `calculate-price` route — added overlap query in `calculate-price/route.ts:38`
- [x] [Review][Defer] `resort_manager` lot-scoped filtering — deferred to Epic 13 (pre-existing design)
- [x] [Review][Defer] `room_blocks` RLS missing authenticated read — deferred, `createServiceRoleClient` bypasses RLS
- [x] [Review][Dismiss] `page.tsx` EOF newline — cosmetic, already present

### Round 2 — Sub-Agent Review (Blind Hunter / Edge Case Hunter / Acceptance Auditor)

- [x] [Patch] Fix off-by-one: `.lt` → `.lte` in room_blocks overlap queries — applied to `route.ts` (create + calculate-price), `adminRooms.ts`
- [x] [Patch] Wire `getAssignedLotIds` and `resort_manager` lot-scoping into `blockRoomForMaintenance`, `unblockRoom`, `fetchRoomCalendarData` — `verifyAdminRole` now returns `{ role, assignedLotIds }`; scoping enforced
- [x] [Patch] `unblockRoom`: fetch block + lot via `rooms!inner(lot_id)` before delete; reject if outside assigned lots
- [x] [Patch] `blockRoomForMaintenance`: reject when `endDate <= today` ("Không thể khóa phòng cho ngày trong quá khứ")
- [x] [Patch] Add GiST exclusion constraint `room_blocks_no_overlap` to migration (TOCTOU protection)
- [x] [Patch] Add `update_room_blocks_updated_at` trigger to migration
- [x] [Patch] Add `public_read_room_blocks` SELECT policy for `anon, authenticated` — closes RLS gap that hid blocks from public availability
- [x] [Patch] Add `RoomBlock`, `isBlockOverlapping`, `getOverlappingBlocks`, `getBlockedRoomIds` helpers to `availability.ts`
- [x] [Patch] `GardenDetailClient`: `blocks` field added to `GardenDetail`; `bookedRoomIds` unions bookings + blocks
- [x] [Patch] `[lotId]/page.tsx`: fetch `room_blocks` for active rooms; pass `blocks` into `garden`
- [x] [Patch] `[lotId]/book/page.tsx`: check `room_blocks` overlap and render "Phòng đang bảo trì" unavailable screen
- [x] [Patch] `RoomCalendarClient`: booking bars always render label (removed `isStart` gate); block bars clickable with confirm + alert on error; AbortController prevents stale-month data races; grid uses inline `gridTemplateColumns` (`auto-fill` breaks layout <1300px)
- [x] [Patch] `RoomCalendarClient`: submit button disabled when `blockStart >= blockEnd`; client-side `validateDate` semantic check
- [x] [Patch] Remove dead `LotSection` interface + `startDay` destructure
- [x] [Patch] Tests: updated `adminRooms.test.ts` (UUIDs, unblockRoom select-before-delete chain, future dates); `calculate-price` test chain gains `.lte`/`.gt`; `tampering-prevention.test.ts` gains `room_blocks` `.lte` mock
- [x] [Dismiss] Cancelled/no_show bookings remain visible on calendar (per spec AC1 — color-code all statuses)

## E2E Verification

- File: `dainganxanh-landing/e2e/specs/admin-room-calendar.spec.ts`
- `npx playwright test e2e/specs/admin-room-calendar.spec.ts --project=chromium-admin --workers=1` passed 7/7
- Playwright version: 1.47
- E2E artifacts: `/tmp/e2e-story11-8/`
- DB migration `20260908000002_add_room_blocks.sql` applied to local Supabase
- Status: done
