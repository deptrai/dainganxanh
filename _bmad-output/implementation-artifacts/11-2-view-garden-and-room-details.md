# Story 11.2: View Garden & Room Details

Status: ready-for-dev

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

2. **Garden detail section:**
   - Show image gallery (main + thumbnails) from `lots.images` and `rooms.images`.
   - Show garden `description` and map/location using `location_lat`/`location_lng`.
   - Show a static map image or embedded map (e.g., Leaflet, Google Maps iframe) — choose one consistent with the existing UI (check `src/components` for existing map usage).
   - Show garden name, region badge, and any short summary/description.

3. **Room cards:**
   - Grid of `RoomCard` components (2 columns mobile, 3 columns desktop).
   - Each `RoomCard` shows: image, room `name`, `capacity` (guests), `amenities` list, `price_per_night`, and `status` (`active`/`inactive`/`maintenance`).
   - Only show rooms where `status = 'active'` for booking; show `inactive`/`maintenance` as disabled/greyed out or hide them depending on UX decision.
   - Room CTA should eventually link to `/eco-tourism/[lotId]/book` (Story 11.3).

4. **Date range picker:**
   - `<input type="date">` for check-in and check-out.
   - `min` = today, `max` = today + 30 days (per `room_bookings` check `check_out_date - check_in_date <= 30`).
   - Selecting dates disables rooms already booked in that range (see availability check below).

5. **Availability check:**
   - Query `room_bookings` for the selected `room_id` and overlapping date range.
   - Consider `pending`, `confirmed`, `completed` as blocking (per `exclude_overlapping_bookings` GiST constraint).
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

- [ ] Task 1: Create `/eco-tourism/[lotId]` route (AC: #1, #8)
  - [ ] Add `src/app/(marketing)/eco-tourism/[lotId]/page.tsx` with SSR and `revalidate`
  - [ ] Add metadata + JSON-LD structured data
  - [ ] Add `loading.tsx` for route
- [ ] Task 2: Implement garden data query (AC: #2, #6)
  - [ ] Query `lots` by `id` with `images`, `name`, `region`, `description`, `location_lat`, `location_lng`
  - [ ] Query `rooms` for `lot_id` with `id`, `name`, `capacity`, `amenities`, `price_per_night`, `images`, `status`
  - [ ] Transform result to `GardenDetail` props
- [ ] Task 3: Implement availability check (AC: #5)
  - [ ] Query `room_bookings` for overlapping `pending`/`confirmed`/`completed` bookings
  - [ ] Return list of `room_id` + date ranges that block booking
  - [ ] Memoize or cache to avoid repeated queries on filter change
- [ ] Task 4: Build UI components (AC: #2, #3, #4)
  - [ ] Create `GardenDetailClient` client component (hydration-safe)
  - [ ] Create `ImageGallery` component
  - [ ] Create `RoomCard` component (image, name, capacity, amenities, price, status, CTA)
  - [ ] Create `DateRangePicker` component (check-in/check-out inputs)
  - [ ] Create `AvailabilityBadge` or disabled-state logic on `RoomCard`
  - [ ] Create `MapSection` component (static image or iframe)
- [ ] Task 5: Empty/404 states (AC: #7)
  - [ ] 404 handling for invalid `lotId`
  - [ ] Empty state when no rooms exist
- [ ] Task 6: Tests (AC: #2, #3, #5, #7)
  - [ ] Unit test for `RoomCard` rendering
  - [ ] Unit test for `DateRangePicker` logic
  - [ ] Test availability check logic with mocked Supabase
  - [ ] Page integration test for 404 / empty states

## Dev Notes

### Existing patterns to follow

- `src/app/(marketing)/eco-tourism/page.tsx` (Story 11.1) — reference for SSR + `revalidate = 3600` + `EcoTourismClient` pattern.
- `src/app/(marketing)/store/page.tsx` — public marketing catalog using `StoreClient`.
- `src/app/(marketing)/store/[slug]/page.tsx` — dynamic route example.
- Components in `src/components/eco-tourism/` (Story 11.1 created `GardenCard`, `EcoTourismClient`).
- Tailwind classes use existing design tokens (`--brand-500`, `emerald-600`, `gray-900`).

### Database schema (verified)

- `lots` has `id`, `name`, `region`, `description`, `location_lat`, `location_lng`, `images` JSONB, `created_at`, `updated_at`.
- `rooms` has `id`, `lot_id`, `name`, `description`, `capacity`, `price_per_night`, `amenities` JSONB, `images` JSONB, `status` (`active`, `inactive`, `maintenance`), `created_at`, `updated_at`.
- `room_bookings` has `id`, `code`, `user_id`, `room_id`, `guest_name`, `guest_phone`, `guest_email`, `check_in_date`, `check_out_date`, `guests_count`, `nights_count`, `total_amount`, `payment_method`, `payment_ref`, `status` (`pending`, `confirmed`, `cancelled`, `completed`, `no_show`), `special_requests`, `cancellation_reason`, `expires_at`, `created_at`, `updated_at`. `nights_count` is generated.
- `room_pricing_rules` exists but is deferred — Story 11.2 uses `rooms.price_per_night` only (per Story 11.1 decision).

### Availability logic

- Use Supabase `.select('id, room_id, check_in_date, check_out_date, status')` on `room_bookings` where `status IN ('pending', 'confirmed', 'completed')`.
- Date overlap: `check_in_date <= checkOut && check_out_date >= checkIn` (assuming `check_in_date` is inclusive, `check_out_date` is exclusive per daterange `[)` semantics used in the GiST constraint).
- Client-side: when check-in/check-out selected, disable rooms with overlapping bookings.

### Image handling

- `lots.images` and `rooms.images` are JSONB arrays. Normalize with `Array.isArray(x) ? x : []` before rendering.
- If `images` is empty, use placeholder emoji or a default gradient (consistent with `GardenCard`).

### Date constraints

- `room_bookings` has `check_out_date > check_in_date` and `check_out_date - check_in_date <= 30` constraints.
- Enforce `check_in >= today` and `check_out <= today + 30` in UI.

### Security

- Use `createServiceRoleClient` server-side.
- Do not expose `user_id`, `guest_name`, `guest_phone`, `guest_email` from `room_bookings` — only `room_id`, `check_in_date`, `check_out_date`, `status` are needed.
- Do not expose `total_trees`, `planted`, `admin_user_lots`.

### Performance

- Fetch `lot`, `rooms`, and `room_bookings` in parallel or single query where possible.
- Consider `revalidatePath('/eco-tourism/[lotId]')` when bookings change (Story 11.3/11.4 will handle).

### Navigation

- CTA should link to `/eco-tourism/[lotId]/book` (Story 11.3) — for now, can use `/#` or `?book` placeholder, but document that Story 11.3 will implement the actual route.
- Use Next.js `Link` component.

## Dev Agent Record

### Agent Model Used

claude-opus-5

### Debug Log References

### Completion Notes List

### File List

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
