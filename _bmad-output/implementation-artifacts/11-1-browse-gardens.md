# Story 11.1: Browse Gardens

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a guest,
I want to see gardens with bookable rooms and filter by region,
So that I can choose a location.

## Acceptance Criteria

1. **Page route and SSR:**
   - The route `/eco-tourism` is a public, server-rendered Next.js App Router page.
   - Page should use `revalidate = 3600` (or similar) so stale content is regenerated when room inventory changes.
   - Metadata title/description in Vietnamese and OpenGraph canonical.

2. **Garden listing:**
   - Display garden cards in a responsive grid: 2 columns mobile, 3 columns desktop.
   - Each card shows: cover image, garden name, region badge, "Giá từ" price, and a "Xem phòng" CTA linking to `/eco-tourism/[lotId]`.
   - Only lots that have at least one active room (`rooms.status = 'active'`) are shown.
   - Lots are ordered by `created_at` or `name` (deterministic and stable).

3. **Region filter:**
   - Filter tabs visible: Tất cả | Miền Bắc | Miền Trung | Miền Nam.
   - Active tab is highlighted.
   - Selecting a region filters the visible cards to lots whose `region` matches the selected region (case-insensitive exact match).
   - Default selected tab is "Tất cả".

4. **Data contract and security:**
   - Use service role client (`createServiceRoleClient`) to fetch lots/rooms server-side, bypassing RLS for public read.
   - Public RLS on `lots` already allows `SELECT` to anon/authenticated (see migration).
   - Do NOT expose internal lot fields (`total_trees`, `planted`, `location_lat`, `location_lng`, `description` beyond a short summary if needed).

5. **Empty and loading states:**
   - If no lot has active rooms, show an empty state message (e.g., "Chưa có vườn nào mở phòng. Vui lòng quay lại sau.")
   - SSR does not require client loading skeleton, but optional `loading.tsx` can be added.

6. **SEO / Structured data:**
   - Add JSON-LD `ItemList` or collection schema with list of gardens and their `@id` canonical URLs.

## Tasks / Subtasks

- [ ] Task 1: Create `/eco-tourism` route (AC: #1, #6)
  - [ ] Add `src/app/(marketing)/eco-tourism/page.tsx` with SSR and `revalidate`
  - [ ] Add OpenGraph / canonical metadata
  - [ ] Add JSON-LD structured data
- [ ] Task 2: Implement garden data query (AC: #2)
  - [ ] Query `lots` joined with at least one active `rooms` row
  - [ ] Compute `price_from` as `MIN(rooms.price_per_night)` per lot
  - [ ] Transform result to `GardenCard` props
- [ ] Task 3: Build UI components (AC: #2, #3)
  - [ ] Create `GardenCard` component (image, name, region badge, price, CTA)
  - [ ] Create `RegionFilter` component (tabs for Tất cả / Miền Bắc / Miền Trung / Miền Nam)
  - [ ] Create `EcoTourismClient` for client-side filter state (hydration-safe)
- [ ] Task 4: Empty/loading states (AC: #5)
  - [ ] Empty state when no active lots
  - [ ] Optional `loading.tsx` for route
- [ ] Task 5: Tests (AC: #2, #3, #5)
  - [ ] Add unit test for `GardenCard` rendering
  - [ ] Add test for region filter logic
  - [ ] Add Next.js route integration test (optional) mocking Supabase

## Dev Notes

### Existing patterns to follow

- `src/app/(marketing)/store/page.tsx` is the reference for a public marketing catalog page using service role SSR, `revalidate = 3600`, `StoreClient` pattern, and metadata.
- `src/app/(marketing)/pricing/page.tsx` shows JSON-LD metadata pattern.
- Components live in `src/components/marketing/` or `src/components/eco-tourism/` (new folder).
- Tailwind classes use existing design tokens from `globals.css` (`--brand-500`, `emerald-600`, `gray-900`).

### Database assumptions

- `public.lots` table exists with `id`, `name`, `region`, `created_at`, cover image URL in `images` or a separate `lot_images` table.
- `public.rooms` table exists with `lot_id`, `status` (`active`/`inactive`), `price_per_night`, `name`, `capacity`, `images`.
- If `rooms` table does not exist yet, this story must create the minimal schema needed (`rooms` table with `lot_id`, `status`, `price_per_night`) or the story is blocked. Per architecture, `rooms` is part of Eco-Stay foundation.

### Region values

- Region values are expected to be: `Miền Bắc`, `Miền Trung`, `Miền Nam` (as used in `lots.region`).
- Filter matching should be exact and case-insensitive. Normalize if `region` values may contain trailing spaces.

### Price computation

- `price_from` = `MIN(price_per_night)` of active rooms for the lot.
- Display as `new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)`.

### Navigation

- CTA links to `/eco-tourism/[lotId]`. Use lot `id` (UUID) as route param, consistent with architecture (`/eco-tourism/[lotId]`).
- Use Next.js `Link` component.

### Revalidation

- Use `revalidatePath('/eco-tourism')` when rooms are created/updated in future admin stories (11.7, 11.8).
- For this story, hardcoded `revalidate = 3600` is sufficient.

### Performance

- Query lots with active rooms in a single Supabase query using `.select('id, name, region, images, rooms!inner(status, price_per_night)')` and `.eq('rooms.status', 'active')`.
- Alternatively, query lots then compute `price_from` in a second query — but prefer single query.

### Security

- Do not accept client-side region or price values.
- Do not expose room-level details on the listing page beyond the minimum price.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-11.1]
- [Source: docs/prd.md#US-ES-01]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Eco-Tourism]
- [Source: _bmad-output/planning-artifacts/architecture.md#Eco-Tourism-Store-Architecture]
- [Source: dainganxanh-landing/src/app/(marketing)/store/page.tsx]
- [Source: dainganxanh-landing/src/app/(marketing)/pricing/page.tsx]
