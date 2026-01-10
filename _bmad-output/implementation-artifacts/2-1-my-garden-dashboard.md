# Story 2.1: My Garden Dashboard

Status: ready-for-dev

## Story

As a **tree owner**,
I want to **xem tất cả cây của mình trong một dashboard**,
so that **tôi dễ dàng theo dõi tiến trình**.

## Acceptance Criteria

1. **Given** tôi đã đăng nhập  
   **When** navigate đến /crm/my-garden  
   **Then** hiển thị grid tất cả cây của tôi

2. **And** mỗi tree card có: ảnh (placeholder nếu < 9 tháng), status, ngày trồng, CO2

3. **And** có thể sort theo date hoặc status

4. **And** Dashboard load time < 2 giây

5. **And** Empty state nếu chưa có cây: "Bạn chưa có cây nào. Trồng cây ngay!"

## Tasks / Subtasks

- [ ] Task 1: Dashboard Page (AC: 1, 4)
  - [ ] 1.1 Tạo route `/src/app/crm/my-garden/page.tsx`
  - [ ] 1.2 Protected route (đã có middleware từ Story 1.5)
  - [ ] 1.3 Fetch trees từ Supabase với RLS

- [ ] Task 2: Tree Card Component (AC: 2)
  - [ ] 2.1 Tạo `components/crm/TreeCard.tsx`
  - [ ] 2.2 Display: thumbnail, tree_code, status badge, planted_at, co2_absorbed
  - [ ] 2.3 Placeholder image nếu tree < 9 tháng
  - [ ] 2.4 Click navigates to tree detail

- [ ] Task 3: Tree Grid Layout (AC: 1, 2)
  - [ ] 3.1 Tạo `components/crm/TreeGrid.tsx`
  - [ ] 3.2 Responsive grid: 1 col mobile, 2 tablet, 3-4 desktop
  - [ ] 3.3 Loading skeleton state

- [ ] Task 4: Sort & Filter (AC: 3)
  - [ ] 4.1 Tạo `components/crm/TreeSortFilter.tsx`
  - [ ] 4.2 Sort options: Ngày trồng (mới/cũ), Status, CO2
  - [ ] 4.3 Filter by status (optional)

- [ ] Task 5: Empty State (AC: 5)
  - [ ] 5.1 Tạo `components/crm/EmptyGarden.tsx`
  - [ ] 5.2 Illustration + CTA "Trồng cây ngay" → `/crm/checkout`

- [ ] Task 6: Data Fetching Hook (AC: 1, 4)
  - [ ] 6.1 Tạo `hooks/useTrees.ts`
  - [ ] 6.2 React Query integration
  - [ ] 6.3 Caching và optimistic updates

## Dev Notes

### Architecture Compliance
- **Route:** `/crm/my-garden` - protected by middleware
- **Data:** Supabase RLS - users can only see their own trees
- **Caching:** React Query với 5 phút stale time

### Database Query
```sql
SELECT trees.*, 
       tree_photos.photo_url as latest_photo
FROM trees
JOIN orders ON trees.order_id = orders.id
LEFT JOIN LATERAL (
  SELECT photo_url FROM tree_photos 
  WHERE tree_id = trees.id 
  ORDER BY captured_at DESC LIMIT 1
) tree_photos ON true
WHERE orders.user_id = auth.uid()
ORDER BY trees.created_at DESC
```

### Status Badge Colors
- `seedling` → 🌱 Green
- `planted` → 🌿 Light Green
- `growing` → 🌲 Forest Green
- `mature` → 🎋 Gold
- `harvested` → ✨ Purple
- `dead` → ⚫ Gray

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Route-Structure]
- [Source: _bmad-output/planning-artifacts/wireframes.md#My-Garden-Dashboard]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Dashboard-Layout]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.1]
- [Source: docs/prd.md#FR-08]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/app/crm/my-garden/page.tsx
- src/components/crm/TreeCard.tsx
- src/components/crm/TreeGrid.tsx
- src/components/crm/TreeSortFilter.tsx
- src/components/crm/EmptyGarden.tsx
- src/hooks/useTrees.ts
