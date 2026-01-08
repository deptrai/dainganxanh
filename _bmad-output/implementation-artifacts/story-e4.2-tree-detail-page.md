# Story E4.2: Tree Detail Page

Status: ready-for-dev

## Story

As a **tree owner**,
I want **click vào cây để xem chi tiết**,
so that **tôi biết vị trí, lịch sử và impact của cây**.

## Acceptance Criteria

1. Page accessible tại `/trees/{treeCode}` hoặc `/my-garden/{treeCode}`
2. Hero section với:
   - Large latest photo (16:9)
   - Tree code và plant name
   - Status badge
   - Quick stats: CO2, age, health score
3. Timeline milestones với photos:
   - Quarterly updates với date
   - Photo carousel per quarter
   - Status change events
   - Health log entries
4. GPS location hiển thị trên map:
   - Leaflet/Mapbox map view
   - Pin at tree location
   - Zoom controls
5. CO2 Impact section:
   - Total absorbed to date
   - Yearly rate
   - Equivalents (km driving, bottles recycled)
   - Visual progress bar
6. Health history timeline
7. Actions:
   - Download quarterly report (PDF)
   - Share to social media
   - Contact support

## Tasks / Subtasks

- [ ] Task 1: Setup page route (AC: #1)
  - [ ] Subtask 1.1: Dynamic route /trees/[treeCode]
  - [ ] Subtask 1.2: Fetch tree data by code
  - [ ] Subtask 1.3: 404 handling

- [ ] Task 2: Hero section (AC: #2)
  - [ ] Subtask 2.1: Photo display với fallback
  - [ ] Subtask 2.2: Tree info header
  - [ ] Subtask 2.3: Quick stats cards

- [ ] Task 3: Timeline component (AC: #3)
  - [ ] Subtask 3.1: Vertical timeline UI
  - [ ] Subtask 3.2: Fetch TreePhoto records by quarter
  - [ ] Subtask 3.3: Photo carousel per milestone
  - [ ] Subtask 3.4: Health events integration

- [ ] Task 4: Map component (AC: #4)
  - [ ] Subtask 4.1: Integrate Leaflet/Mapbox
  - [ ] Subtask 4.2: Display tree pin
  - [ ] Subtask 4.3: Lot boundary overlay (optional)
  - [ ] Subtask 4.4: Link to full map

- [ ] Task 5: CO2 Impact section (AC: #5)
  - [ ] Subtask 5.1: Call CarbonCalculatorService
  - [ ] Subtask 5.2: Display total và yearly rate
  - [ ] Subtask 5.3: Equivalents với icons
  - [ ] Subtask 5.4: Animated progress bar

- [ ] Task 6: Actions (AC: #7)
  - [ ] Subtask 6.1: Download PDF button
  - [ ] Subtask 6.2: Share button → ShareCardModule
  - [ ] Subtask 6.3: Support contact link

- [ ] Task 7: Mobile responsive (AC: #1-7)
  - [ ] Subtask 7.1: Single column layout
  - [ ] Subtask 7.2: Collapsible sections
  - [ ] Subtask 7.3: Map full-width

## Dev Notes

### Architecture Patterns
- Server components cho initial data load
- Client components cho interactive elements (map, carousel)
- Use Twenty record show page as reference

### Source Tree Components
- Route: `packages/twenty-front/src/pages/trees/`
- Map: Recommend leaflet or @react-google-maps/api
- Carousel: Use Embla or Swiper

### Design Reference (UX Design 3.2)
- Wireframe: See UX Design Section 3.2 Tree Detail Page
- Hero: Large photo (16:9), tree code, status badge
- CO2 Impact: Progress bar, equivalents (km driving, bottles)
- Timeline: Vertical with quarterly photos
- Map: Leaflet/Mapbox with GPS pin
- Design tokens: `--dgnx-gradient-forest`
- Animations: Section expand (0.3s ease)

### Testing Standards
- Test với various tree ages (1 month, 1 year, 5 years)
- Test map rendering
- Test share functionality
- Mobile responsive tests

### References
- [Architecture: ADR-04 Frontend](file:///_bmad-output/planning-artifacts/architecture.md#adr-04-frontend-architecture)
- [UX Design: Section 3.2 Tree Detail Page](file:///_bmad-output/planning-artifacts/ux-design.md)
- [PRD: FR-09 Tree Detail View](file:///docs/prd.md)
- [Backend: carbon-calculator.service.ts](file:///d/packages/twenty-server/src/modules/dainganxanh/tree-tracking/services/carbon-calculator.service.ts)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
