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

## Validation Findings

Status: **resolved** (schema assumptions corrected and story updated)

### Verified Assumptions

| # | Assumption | Verified? | Evidence |
|---|------------|-----------|----------|
| A1 | `public.rooms` table exists with `lot_id`, `status`, `price_per_night` | **Yes** | `supabase/migrations/20260530000001_eco_tourism_schema.sql` lines 17–35: `CREATE TABLE public.rooms` includes `lot_id`, `name`, `capacity`, `price_per_night`, `images`, `status` (`active`/`inactive`/`maintenance`). |
| A2 | `rooms.status` allows `active` | **Yes** | Schema has `CHECK (status IN ('active', 'inactive', 'maintenance'))` and default `'active'`. |
| A3 | `price_from` can be `MIN(rooms.price_per_night)` | **Yes** | `price_per_night` is `BIGINT NOT NULL`. |
| A4 | `lots` table has `id`, `name`, `region`, `created_at` | **Yes** | `supabase/migrations/20260407000000_baseline_from_remote.sql` lines 470–480. |
| A5 | Public RLS `SELECT` on `lots` is allowed | **Partially** | The baseline migration creates `lots`; RLS status must be confirmed at runtime, but public catalog listing is intended. |

### Critical Issues

| # | Issue | Risk | Suggested Fix |
|---|-------|------|---------------|
| C1 | **No `images` column on `lots`**. Story Dev Notes and AC #2 assume `images` or `lot_images` table, but `lots` only has `id`, `name`, `region`, `description`, `location_lat`, `location_lng`, `total_trees`, `created_at`, `updated_at`, `planted`. | Garden cards cannot display a cover image with the current schema. | Add `images JSONB DEFAULT '[]'::jsonb` to `public.lots`, OR create a separate `lot_images` table, OR use `rooms.images[0]` as fallback. Recommend adding `images` JSONB to `lots` for simplicity and aligning with `rooms.images`/`products.images`. |
| C2 | **`total_trees` vs `capacity` mismatch between architecture and code**. `architecture.md` lists `lots.capacity`; actual schema and `src/actions/lots.ts` use `total_trees` and `planted`. | Confusion for new stories referencing architecture. | Update `architecture.md` to match reality (`total_trees`, `planted`) or migrate `total_trees`/`planted` to `capacity`. Code already uses `total_trees`/`planted`, so update architecture. |
| C3 | **Story assumes region filter is client-side only, but page is SSR with `revalidate = 3600`**. Tabs only hide/show pre-rendered cards; no server-side filter. This is acceptable but must be documented to avoid future expectation of query-string region filter. | SEO/searchability may not include filtered pages. | Add a note that `/eco-tourism` always renders all active lots and filtering is client-side. Optional: support `?region=` query param for shareable filtered views in a future story. |
| C4 | **Query in Dev Notes uses `.select(\'id, name, region, images, rooms!inner(...)\')` but `images` does not exist** and `!inner` syntax is correct for Supabase postgREST. | Build will fail or return 400. | Remove `images` from the query until schema is added, or add schema first. |
| C5 | **`room_pricing_rules` exists but `price_from` ignores it**. Story asks for `MIN(price_per_night)` only, not effective seasonal price. | Revenue/pricing accuracy risk during peak seasons. | For MVP this is acceptable per PRD cross-cutting requirement CC-25, but add a deferred note that dynamic pricing will be handled in a future story. |

### Warnings

| # | Warning | Recommended Action |
|---|---------|--------------------|
| W1 | Landing migration directory `dainganxanh-landing/supabase/migrations/` has no `rooms` or `lots` table creation. The actual schema is in the top-level `supabase/migrations/20260530000001_eco_tourism_schema.sql` and the baseline migration. | Document this dependency in the story, or consolidate migrations before starting dev. |
| W2 | `total_trees` and `planted` are returned by `fetchLots()` admin action but story AC #4 says do NOT expose `total_trees` on public listing. | Ensure `/eco-tourism` page only selects `id, name, region, images` (once images exists) and `rooms.price_per_night`. |
| W3 | Route is `src/app/(marketing)/eco-tourism/page.tsx` but existing store uses `src/app/(marketing)/store/page.tsx` with `StoreClient`. Pattern is known and correct. | Follow `StoreClient` hydration-safe pattern. |

### Validation Checklist

- [x] Schema references verified
- [x] DB columns verified against migrations
- [x] PRD acceptance criteria (US-ES-01) cross-checked
- [x] Schema conflicts resolved (C1, C2)
- [x] Story text updated with accurate columns and assumptions
- [x] Dependency on `rooms` migration documented

## Dev Notes

### Existing patterns to follow

- `src/app/(marketing)/store/page.tsx` is the reference for a public marketing catalog page using service role SSR, `revalidate = 3600`, `StoreClient` pattern, and metadata.
- `src/app/(marketing)/pricing/page.tsx` shows JSON-LD metadata pattern.
- Components live in `src/components/marketing/` or `src/components/eco-tourism/` (new folder).
- Tailwind classes use existing design tokens from `globals.css` (`--brand-500`, `emerald-600`, `gray-900`).

### Database assumptions

- `public.lots` table exists with `id`, `name`, `region`, `created_at`, `images` JSONB (added by `supabase/migrations/20260907000200_eco_tourism_lot_images_and_schema_fixes.sql`).
- `public.rooms` table exists with `lot_id`, `status` (`active`/`inactive`/`maintenance`), `price_per_night` BIGINT, `name`, `capacity`, `images` JSONB. Defined in `supabase/migrations/20260530000001_eco_tourism_schema.sql`.
- Migrations live in the root `supabase/migrations/` directory. Landing migration dir `dainganxanh-landing/supabase/migrations/` does NOT contain `lots` or `rooms` schema. Dev and deploy must run migrations from root Supabase config.
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

- Query lots with active rooms in a single Supabase query using `.select('id, name, region, images, rooms!inner(status, price_per_night)')  -- images now exists on lots` and `.eq('rooms.status', 'active')`.
- Alternatively, query lots then compute `price_from` in a second query — but prefer single query.
- **Deferred**: `room_pricing_rules` already exists but Story 11.1 intentionally uses `MIN(rooms.price_per_night)` only. Seasonal/peak pricing will be applied when rendering availability in Story 11.2 (`/eco-tourism/[lotId]`) or a dedicated pricing story.

### Security

- Do not accept client-side region or price values.
- Do not expose room-level details on the listing page beyond the minimum price.
- Public listing should use `createServiceRoleClient` to bypass RLS on first iteration, but `public_read_lots` policy in the new migration makes direct client/supabase SSR reads acceptable as well.

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
- [Source: supabase/migrations/20260407000000_baseline_from_remote.sql (`lots` schema)]
- [Source: supabase/migrations/20260530000001_eco_tourism_schema.sql (`rooms` schema)]
- [Source: supabase/migrations/20260907000200_eco_tourism_lot_images_and_schema_fixes.sql (`lots.images` + public RLS)]
