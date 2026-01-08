# Story E4.1: My Garden Dashboard Page

Status: ready-for-dev

## Story

As a **tree owner**,
I want **xem dashboard hiển thị tất cả cây của tôi**,
so that **tôi có thể theo dõi tiến độ dễ dàng**.

## Acceptance Criteria

1. Dashboard page accessible tại `/dashboard` hoặc `/my-garden`
2. Grid view hiển thị tree cards (responsive: 1 col mobile, 2 col tablet, 3-4 col desktop)
3. Mỗi card hiển thị:
   - Latest photo (hoặc placeholder)
   - Tree code
   - Status badge (color-coded)
   - CO2 absorbed với icon
   - Planting date
   - Days until next milestone
4. Sort options: by planting date, by status, by name
5. Filter by status: All, Seedling, Growing, Mature, Harvested
6. Pagination hoặc infinite scroll (max 50 trees per load)
7. Empty state khi user chưa có cây
8. Loading skeleton trong khi fetch
9. Link to Tree Detail page khi click card

## Tasks / Subtasks

- [ ] Task 1: Setup page route và layout (AC: #1)
  - [ ] Subtask 1.1: Create /dashboard route trong Twenty frontend
  - [ ] Subtask 1.2: Add to navigation menu
  - [ ] Subtask 1.3: Setup page layout với header

- [ ] Task 2: Implement TreeCard component (AC: #3)
  - [ ] Subtask 2.1: Design card layout với photo placeholder
  - [ ] Subtask 2.2: Add status badge với color (green/yellow/red)
  - [ ] Subtask 2.3: Display CO2 với 🌍 icon
  - [ ] Subtask 2.4: Show planting date và milestone countdown

- [ ] Task 3: Implement grid layout (AC: #2)
  - [ ] Subtask 3.1: Responsive grid: 1/2/3/4 columns
  - [ ] Subtask 3.2: Card hover effects
  - [ ] Subtask 3.3: Mobile-first approach

- [ ] Task 4: Implement sort và filter (AC: #4, #5)
  - [ ] Subtask 4.1: Sort dropdown UI
  - [ ] Subtask 4.2: Filter tabs/buttons
  - [ ] Subtask 4.3: Persist filter state in URL

- [ ] Task 5: Data fetching với Twenty GraphQL (AC: #6)
  - [ ] Subtask 5.1: Query trees for current user
  - [ ] Subtask 5.2: Implement cursor pagination
  - [ ] Subtask 5.3: Cache với React Query/SWR

- [ ] Task 6: UI states (AC: #7, #8, #9)
  - [ ] Subtask 6.1: Empty state illustration + CTA
  - [ ] Subtask 6.2: Loading skeleton cards
  - [ ] Subtask 6.3: Error state với retry

- [ ] Task 7: Navigation (AC: #9)
  - [ ] Subtask 7.1: Click card → TreeDetailPage
  - [ ] Subtask 7.2: Add breadcrumb navigation

## Dev Notes

### Architecture Patterns
- Use Twenty's Record components as base
- Follow Twenty UI patterns (Emotion, Recoil)
- GraphQL query với filter + pagination

### Source Tree Components
- Frontend: `packages/twenty-front/src/pages/`
- Record components: `packages/twenty-front/src/modules/object-record/`
- UI kit: `packages/twenty-ui/`

### Design Reference (UX Design 3.1)
- Wireframe: See UX Design Section 3.1 My Garden Dashboard
- Summary bar: Total trees, CO2/year, average age
- TreeCard component: Photo, code, status badge, CO2, date
- Responsive grid: 1 col (mobile) → 4 col (desktop)
- Design tokens: `--dgnx-primary: #2D5016`, `--dgnx-secondary: #8BC34A`

### Caching (ADR-08)
- Cache `user:{id}:trees` with TTL 5m
- Invalidate on new tree purchase

### Testing Standards
- Component tests với React Testing Library
- Mock GraphQL responses
- Test responsive breakpoints
- Accessibility check

### References
- [Architecture: ADR-04 Frontend](file:///_bmad-output/planning-artifacts/architecture.md#adr-04-frontend-architecture)
- [Architecture: ADR-08 Caching](file:///_bmad-output/planning-artifacts/architecture.md#adr-08-caching-strategy)
- [UX Design: Section 3.1 My Garden Dashboard](file:///_bmad-output/planning-artifacts/ux-design.md)
- [PRD: FR-08 My Garden Dashboard](file:///docs/prd.md)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
