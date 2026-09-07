# Story 11.2: View Garden & Room Details

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a guest,
I want to see room photos, capacity, amenities, and availability,
So that I can decide.

## Acceptance Criteria

1. **Page route and SSR:**
   - `/eco-tourism/[lotId]` is a public, server-rendered Next.js App Router page.
   - Page uses `revalidate = 3600` (or similar) so stale content is regenerated when room inventory changes.
   - Metadata title/description in Vietnamese and OpenGraph canonical.
   - `page.tsx` is an async server component: `const { lotId } = await params` before fetching data and passing to `GardenDetailClient`.

2. **Garden detail section:**
   - Show image gallery (main + thumbnails) from `lots.images` and `rooms.images`.
   - Show garden `description` and map/location using `location_lat`/`location_lng`.
   - **Map**: Reuse existing `MiniMap` component from `src/components/admin/MiniMap.tsx` (uses `react-leaflet`). Wrap with `dynamic(() => import('./MiniMap'), { ssr: false })` since Leaflet cannot run server-side. If `location_lat`/`location_lng` is null, show "Chưa có vị trí" fallback.
   - Show garden name, region badge, and any short summary/description.

3. **Room cards:**
   - Grid of `RoomCard` components (2 columns mobile, 3 columns desktop).
   - Each `RoomCard` shows: image, room `name`, `capacity` (guests), `amenities` list, `price_per_night`, and `status` (`active`/`inactive`/`maintenance`).
   - **Only show rooms where `status = 'active'`** — `inactive` and `maintenance` rooms are hidden from guest view (internal states).
   - Room CTA links to `/eco-tourism/[lotId]/book?room_id={room.id}&check_in={checkIn}&check_out={checkOut}` — Story 11.3 will implement the book route; a stub "Coming soon" page should be created so links are valid.

4. **Date range picker:**
   - `<input type="date">` for check-in and check-out.
   - `min` = today, `max` = today + 30 days (per `room_bookings` check `check_out_date - check_in_date <= 30`).
   - Selecting dates disables rooms already booked in that range (see availability check below).

5. **Availability check:**
   - Query `room_bookings` for the selected `room_id` and overlapping date range.
   - Consider `confirmed`, `completed`, and `pending` with `expires_at > now()` as blocking — matching the `exclude_overlapping_bookings` GiST constraint which uses `daterange(check_in_date, check_out_date, '[)')` (half-open: `check_in` inclusive, `check_out` exclusive).
   - Date overlap logic: `check_in_date < checkOut && check_out_date > checkIn` (strict inequalities).
   - If a room is booked in the selected range, disable its CTA and show "Đã được đặt" badge.
   - If no dates are selected, do not show disabled state (all active rooms are selectable).

6. **Data contract and security:**
   - Use `createServiceRoleClient` to fetch `lots`, `rooms`, and `room_bookings` server-side.
   - Do NOT expose `total_trees`, `planted`, `admin_user_lots`, or internal admin fields.
   - Room cards should only expose `id`, `name`, `description`, `capacity`, `amenities`, `price_per_night`, `images`, `status`.
   - Only expose booking `check_in_date`/`check_out_date`/`status` needed to determine availability — do not expose guest info.

7. **Empty/404 states:**
   - If `lotId` does not exist or has no `active` rooms, show a 404-style message or "Không tìm thấy vườn" with link back to `/eco-tourism`.
   - If no rooms are available, show "Vườn này chưa có phòng trống".

8. **SEO / Structured data:**
   - Add JSON-LD `Place` or `LodgingBusiness` schema with garden name, images, address/description, and `hasOfferCatalog` for rooms.

## Tasks / Subtasks

- [x] Task 1: Create `/eco-tourism/[lotId]` route (AC: #1, #8)
  - [x] Add `src/app/(marketing)/eco-tourism/[lotId]/page.tsx` with SSR and `revalidate`
  - [x] Add metadata + JSON-LD structured data
  - [x] Add `loading.tsx` for route
  - [x] Add stub `src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx` returning "Coming soon" (prevents dead CTA links)
- [x] Task 2: Implement garden data query (AC: #2, #6)
  - [x] Query `lots` by `id` with `images`, `name`, `region`, `description`, `location_lat`, `location_lng`
  - [x] Query `rooms` for `lot_id` with `id`, `name`, `capacity`, `amenities`, `price_per_night`, `images`, `status`
  - [x] Transform result to `GardenDetail` props
- [x] Task 3: Implement availability check (AC: #5)
  - [x] Query `room_bookings` for overlapping `pending`/`confirmed`/`completed` bookings
  - [x] Return list of `room_id` + date ranges that block booking
  - [x] Memoize with `useMemo` in client component
- [x] Task 4: Build UI components (AC: #2, #3, #4)
  - [x] Create `GardenDetailClient` client component (hydration-safe)
  - [x] Create `ImageGallery` component
  - [x] Create `RoomCard` component (image, name, capacity, amenities, price, status, CTA)
  - [x] Create `DateRangePicker` component (check-in/check-out inputs)
  - [x] Create disabled-state logic on `RoomCard`
  - [x] Create `MapSection` component (dynamic MiniMap)
- [x] Task 5: Empty/404 states (AC: #7)
  - [x] 404 handling for invalid `lotId`
  - [x] Empty state when no rooms exist
- [x] Task 6: Tests (AC: #2, #3, #5, #7)
  - [x] Unit test for `RoomCard` rendering
  - [x] Unit test for `DateRangePicker` logic
  - [x] Test availability check logic
  - [x] Page integration test for 404 / empty states

## Validation Findings

Status: **resolved** (all critical issues and warnings addressed)

### Critical Issues

| # | Issue | Resolution |
|---|-------|------------|
| C1 | Map implementation unspecified | **Resolved** — AC #2 now explicitly requires reusing `src/components/admin/MiniMap.tsx` via `dynamic(() => import('./MiniMap'), { ssr: false })`. |
| C2 | Date overlap uses wrong boundary semantics | **Resolved** — AC #5 and Dev Notes now use strict inequalities `check_in_date < checkOut && check_out_date > checkIn`, matching `daterange(..., '[)')` semantics. |
| C3 | CTA placeholder `/#` violates architecture | **Resolved** — AC #3 and Navigation section now specify `/eco-tourism/[lotId]/book?room_id={id}&check_in={date}&check_out={date}` and require a stub book page. |
| C4 | Room status display ambiguous | **Resolved** — AC #3 explicitly decides to hide `inactive`/`maintenance` rooms; only `active` rooms are shown. |
| C5 | Missing `use(params)` pattern | **Resolved** — AC #1 documents `const { lotId } = await params` in async server component. |
| C6 | Availability query not optimized | **Resolved** — Performance section now specifies a two-query approach: (1) `lots.select('..., rooms(...)').eq('id', lotId).single()`, (2) `room_bookings.select('...').in('room_id', roomIds).in('status', [...])` using service role to bypass RLS. |
| C7 | Missing `expires_at` handling | **Resolved** — AC #5 and Availability logic now filter `pending` bookings by `expires_at > now()`. |

### Warnings — all addressed

- W1: `nights_count` is generated — noted in Dev Notes.
- W2: `room_pricing_rules` deferred — documented in Database schema section.
- W3: Guest fields excluded — Security section limits select to `id, room_id, check_in_date, check_out_date, status, expires_at`.
- W4: `images` JSONB normalized with `Array.isArray` — documented in Image handling.
- W5: `maintenance` rooms hidden — decided in AC #3.
- W6: Null coordinates handled — AC #2 requires "Chưa có vị trí" fallback.
- W7: `daterange` overlap semantics — corrected in AC #5.
- W8: `revalidate` on dynamic segment — documented; applies to all `[lotId]` values via ISR.

### Validation Checklist

- [x] Schema references verified (rooms, room_bookings, lots)
- [x] DB columns verified against migrations
- [x] PRD acceptance criteria (US-ES-02) cross-checked
- [x] Map component specified (C1)
- [x] Date overlap semantics corrected (C2)
- [x] CTA link fixed (C3)
- [x] Room status display decided (C4)
- [x] `use(params)` pattern documented (C5)
- [x] Availability query optimized (C6)
- [x] `expires_at` handling added (C7)
- [x] Warnings documented (W1–W8)
- [x] Story text updated with accurate columns and assumptions

## Dev Notes

### Existing patterns to follow

- `src/app/(marketing)/eco-tourism/page.tsx` (Story 11.1) — reference for SSR + `revalidate = 3600` + `EcoTourismClient` pattern.
- `src/app/(marketing)/store/page.tsx` — public marketing catalog using `StoreClient`.
- `src/app/(marketing)/store/[slug]/page.tsx` — dynamic route example.
- Components in `src/components/eco-tourism/` (Story 11.1 created `GardenCard`, `EcoTourismClient`).
- `src/components/admin/MiniMap.tsx` — reuse for map display (requires `dynamic` import with `ssr: false`).
- `src/components/admin/GPSPreview.tsx` — alternative map pattern if `MiniMap` is not suitable.
- Tailwind classes use existing design tokens (`--brand-500`, `emerald-600`, `gray-900`).

### Database schema (verified)

- `lots` has `id`, `name`, `region`, `description`, `location_lat`, `location_lng`, `images` JSONB, `created_at`, `updated_at`.
- `rooms` has `id`, `lot_id`, `name`, `description`, `capacity`, `price_per_night`, `amenities` JSONB, `images` JSONB, `status` (`active`, `inactive`, `maintenance`), `created_at`, `updated_at`.
- `room_bookings` has `id`, `code`, `user_id`, `room_id`, `guest_name`, `guest_phone`, `guest_email`, `check_in_date`, `check_out_date`, `guests_count`, `nights_count`, `total_amount`, `payment_method`, `payment_ref`, `status` (`pending`, `confirmed`, `cancelled`, `completed`, `no_show`), `special_requests`, `cancellation_reason`, `expires_at`, `created_at`, `updated_at`. `nights_count` is generated.
- `room_pricing_rules` exists but is deferred — Story 11.2 uses `rooms.price_per_night` only (per Story 11.1 decision).

### Availability logic

- Use Supabase `.select('id, room_id, check_in_date, check_out_date, status, expires_at')` on `room_bookings` where `room_id IN (activeRoomIds)` and `status IN ('pending', 'confirmed', 'completed')`.
- **Date overlap semantics**: `room_bookings` uses `daterange(check_in_date, check_out_date, '[)')` — `check_in` inclusive, `check_out` exclusive. A booking with `check_out_date = 2026-09-10` frees the room starting that day. Overlap check: `check_in_date < checkOut && check_out_date > checkIn` (strict inequalities).
- **Pending expiry**: `pending` bookings block availability only if `expires_at > now()`. Filter client-side: `(status === 'confirmed' || status === 'completed') || (status === 'pending' && new Date(expiresAt) > new Date())`.
- Client-side: when check-in/check-out selected, disable rooms with overlapping bookings.

### Image handling

- `lots.images` and `rooms.images` are JSONB arrays. Normalize with `Array.isArray(x) ? x : []` before rendering.
- If `images` is empty, use placeholder emoji or a default gradient (consistent with `GardenCard`).

### Warnings / Notes

- `nights_count` is a **generated column** on `room_bookings` — do not compute manually; use DB value or `check_out - check_in`.
- `room_pricing_rules` exists but is deferred — `RoomCard` shows `rooms.price_per_night` only. Dynamic pricing will be applied in a future story.
- `room_bookings` guest fields (`guest_name`, `guest_phone`, `guest_email`, `user_id`) must NOT be exposed — only select `id, room_id, check_in_date, check_out_date, status, expires_at`.
- `maintenance` rooms are hidden from guest view (same as `inactive`).
- `location_lat`/`location_lng` may be `null` — map component must handle missing coordinates gracefully.
- `revalidate = 3600` on `[lotId]` page applies to all dynamic segment values — no need for `generateStaticParams` (ISR is sufficient).

### Date constraints

- `room_bookings` has `check_out_date > check_in_date` and `check_out_date - check_in_date <= 30` constraints.
- Enforce `check_in >= today` and `check_out <= today + 30` in UI.

### Security

- Use `createServiceRoleClient` server-side.
- Do not expose `user_id`, `guest_name`, `guest_phone`, `guest_email` from `room_bookings` — only `room_id`, `check_in_date`, `check_out_date`, `status` are needed.
- Do not expose `total_trees`, `planted`, `admin_user_lots`.

### Performance

- **Single query for lot + rooms**: `supabase.from('lots').select('id, name, region, description, location_lat, location_lng, images, rooms(id, name, capacity, amenities, price_per_night, images, status)').eq('id', lotId).single()`.
- **Second query for bookings**: `supabase.from('room_bookings').select('id, room_id, check_in_date, check_out_date, status, expires_at').in('room_id', roomIds).in('status', ['pending', 'confirmed', 'completed'])` — fetch all bookings for the lot's active rooms.
- Use `createServiceRoleClient` to bypass RLS on `room_bookings` (RLS `user_select` only exposes own bookings; service role sees all).
- Consider `revalidatePath('/eco-tourism/[lotId]')` when bookings change (Story 11.3/11.4 will handle).

### Navigation

- CTA links to `/eco-tourism/[lotId]/book?room_id={room.id}&check_in={checkIn}&check_out={checkOut}` — Story 11.3 will implement the book route. A stub `src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx` must be created returning "Coming soon" so links are valid.
- Use Next.js `Link` component.

## Dev Agent Record

### Agent Model Used

claude-opus-5

### Debug Log References

### Completion Notes List

- Implemented `/eco-tourism/[lotId]` with SSR, `revalidate = 3600`, Vietnamese metadata, OpenGraph canonical, and JSON-LD `LodgingBusiness`.
- Reused `MiniMap` via `next/dynamic` with `ssr: false`; handles missing `location_lat`/`location_lng`.
- Created `GardenDetailClient`, `ImageGallery`, `MapSection`, `DateRangePicker`, `RoomCard` components.
- `RoomCard` filters `active` rooms only; `inactive`/`maintenance` hidden. CTA links to `/eco-tourism/[lotId]/book?room_id={id}&check_in={date}&check_out={date}`.
- Availability check uses strict daterange overlap `check_in_date < checkOut && check_out_date > checkIn` and respects `expires_at` for `pending`.
- Stub `/eco-tourism/[lotId]/book` page returns "Sắp ra mắt" placeholder.
- Added unit tests for `availability`, `RoomCard`, `DateRangePicker`; integration test for page 404 / data render.
- Full test suite: 708 passed. TypeScript lint `tsc --noEmit` passed. Build succeeded.

### File List

- `dainganxanh-landing/src/app/(marketing)/eco-tourism/[lotId]/page.tsx`
- `dainganxanh-landing/src/app/(marketing)/eco-tourism/[lotId]/loading.tsx`
- `dainganxanh-landing/src/app/(marketing)/eco-tourism/[lotId]/book/page.tsx`
- `dainganxanh-landing/src/app/(marketing)/eco-tourism/[lotId]/__tests__/page.test.tsx`
- `dainganxanh-landing/src/components/eco-tourism/GardenDetailClient.tsx`
- `dainganxanh-landing/src/components/eco-tourism/ImageGallery.tsx`
- `dainganxanh-landing/src/components/eco-tourism/MapSection.tsx`
- `dainganxanh-landing/src/components/eco-tourism/DateRangePicker.tsx`
- `dainganxanh-landing/src/components/eco-tourism/RoomCard.tsx`
- `dainganxanh-landing/src/components/eco-tourism/__tests__/RoomCard.test.tsx`
- `dainganxanh-landing/src/components/eco-tourism/__tests__/DateRangePicker.test.tsx`
- `dainganxanh-landing/src/lib/eco-tourism/availability.ts`
- `dainganxanh-landing/src/lib/eco-tourism/__tests__/availability.test.ts`

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-11.2]
- [Source: docs/prd.md#US-ES-02]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Eco-Tourism]
- [Source: _bmad-output/planning-artifacts/architecture.md#Eco-Tourism-Store-Architecture]
- [Source: dainganxanh-landing/src/app/(marketing)/eco-tourism/page.tsx]
- [Source: dainganxanh-landing/src/app/(marketing)/store/page.tsx]
- [Source: dainganxanh-landing/src/app/(marketing)/store/[slug]/page.tsx]
- [Source: supabase/migrations/20260407000000_baseline_from_remote.sql (`lots` schema)]
- [Source: supabase/migrations/20260530000001_eco_tourism_schema.sql (`rooms`, `room_bookings` schema)]
- [Source: supabase/migrations/20260907000200_eco_tourism_lot_images_and_schema_fixes.sql (`lots.images`)]
