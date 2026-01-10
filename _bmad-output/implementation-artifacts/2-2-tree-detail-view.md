# Story 2.2: Tree Detail View với GPS

Status: ready-for-dev

## Story

As a **tree owner**,
I want to **click vào cây để xem chi tiết**,
so that **tôi biết vị trí và lịch sử phát triển**.

## Acceptance Criteria

1. **Given** tôi ở dashboard  
   **When** click vào tree card  
   **Then** hiển thị detail page

2. **And** detail page có:
   - Timeline milestones
   - Ảnh mới nhất
   - GPS trên map
   - Growth metrics (chiều cao, CO2)

3. **And** section "Quarterly Reports" với download links

4. **And** Back button để quay lại dashboard

## Tasks / Subtasks

- [ ] Task 1: Tree Detail Page (AC: 1, 4)
  - [ ] 1.1 Tạo route `/src/app/crm/my-garden/[treeId]/page.tsx`
  - [ ] 1.2 Fetch tree detail với photos và reports
  - [ ] 1.3 Verify ownership (RLS)

- [ ] Task 2: Tree Info Header (AC: 2)
  - [ ] 2.1 Tạo `components/crm/TreeDetailHeader.tsx`
  - [ ] 2.2 Display: tree_code, status, planted_at, lot name
  - [ ] 2.3 Hero image (latest photo hoặc placeholder)

- [ ] Task 3: GPS Map (AC: 2)
  - [ ] 3.1 Tạo `components/crm/TreeMap.tsx`
  - [ ] 3.2 Google Maps embed với marker
  - [ ] 3.3 Show lot polygon nếu có
  - [ ] 3.4 Fallback: Static image nếu no GPS

- [ ] Task 4: Growth Timeline (AC: 2)
  - [ ] 4.1 Tạo `components/crm/GrowthTimeline.tsx`
  - [ ] 4.2 Vertical timeline với milestones
  - [ ] 4.3 Each milestone: date, status change, photo thumbnail

- [ ] Task 5: Photo Gallery (AC: 2)
  - [ ] 5.1 Tạo `components/crm/PhotoGallery.tsx`
  - [ ] 5.2 Grid of all photos
  - [ ] 5.3 Lightbox on click
  - [ ] 5.4 Show capture date và GPS

- [ ] Task 6: Quarterly Reports Section (AC: 3)
  - [ ] 6.1 Tạo `components/crm/QuarterlyReports.tsx`
  - [ ] 6.2 List of available reports
  - [ ] 6.3 Download PDF button

- [ ] Task 7: Growth Metrics (AC: 2)
  - [ ] 7.1 Tạo `components/crm/GrowthMetrics.tsx`
  - [ ] 7.2 Cards: CO2 absorbed, Age, Estimated value
  - [ ] 7.3 Progress towards harvest (60 months)

## Dev Notes

### Architecture Compliance
- **Route:** `/crm/my-garden/[treeId]` - dynamic route
- **Map:** Google Maps JavaScript API
- **Images:** Supabase Storage với signed URLs

### Google Maps Setup
```typescript
// Required env vars
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx

// Component usage
import { GoogleMap, Marker } from '@react-google-maps/api'
```

### Data Fetching
```sql
SELECT trees.*, 
       lots.name as lot_name, lots.gps_polygon,
       json_agg(tree_photos.*) as photos
FROM trees
LEFT JOIN lots ON trees.lot_id = lots.id
LEFT JOIN tree_photos ON tree_photos.tree_id = trees.id
WHERE trees.id = :treeId
GROUP BY trees.id, lots.id
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Route-Structure]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Tree-Detail-View]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Detail-View-Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.2]
- [Source: docs/prd.md#FR-09]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/app/crm/my-garden/[treeId]/page.tsx
- src/components/crm/TreeDetailHeader.tsx
- src/components/crm/TreeMap.tsx
- src/components/crm/GrowthTimeline.tsx
- src/components/crm/PhotoGallery.tsx
- src/components/crm/QuarterlyReports.tsx
- src/components/crm/GrowthMetrics.tsx
