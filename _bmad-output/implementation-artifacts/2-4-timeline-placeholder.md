# Story 2.4: Timeline với Placeholder/Real Photos

Status: ready-for-dev

## Story

As a **tree owner với cây còn nhỏ**,
I want to **xem visual timeline ngay cả khi chưa có ảnh thực**,
so that **tôi hiểu process và kiên nhẫn chờ đợi**.

## Acceptance Criteria

1. **Given** cây < 9 tháng tuổi  
   **When** xem tree detail  
   **Then** timeline hiển thị:
   - Month 0-3: placeholder "Đang ươm giống" 🌱
   - Month 4-9: placeholder "Chuẩn bị trồng" 🌿

2. **Given** cây ≥ 9 tháng  
   **Then** timeline hiển thị actual photos từ field

3. **And** Timeline có estimated milestones:
   - Year 1: Trồng xong
   - Year 2: Bắt đầu phát triển
   - Year 3-4: Trưởng thành
   - Year 5: Thu hoạch

4. **And** Current position indicator trên timeline

## Tasks / Subtasks

- [ ] Task 1: Timeline Component (AC: 1, 2, 3, 4)
  - [ ] 1.1 Tạo `components/crm/TreeTimeline.tsx`
  - [ ] 1.2 Vertical timeline với stages
  - [ ] 1.3 Dynamic content based on tree age

- [ ] Task 2: Placeholder Stages (AC: 1)
  - [ ] 2.1 Define placeholder images cho mỗi stage
  - [ ] 2.2 Stage descriptions: "Đang ươm giống", "Chuẩn bị trồng"
  - [ ] 2.3 Animated icons/illustrations

- [ ] Task 3: Real Photo Integration (AC: 2)
  - [ ] 3.1 Replace placeholder với actual photos khi available
  - [ ] 3.2 Photo dates từ tree_photos table
  - [ ] 3.3 Multiple photos per stage (carousel)

- [ ] Task 4: Progress Indicator (AC: 4)
  - [ ] 4.1 Calculate current position (months since planted)
  - [ ] 4.2 Highlight current stage
  - [ ] 4.3 "Bạn đang ở đây" marker

- [ ] Task 5: Future Milestones (AC: 3)
  - [ ] 5.1 Show grayed-out future stages
  - [ ] 5.2 Estimated dates for each milestone
  - [ ] 5.3 "Dự kiến: Tháng X/20XX"

## Dev Notes

### Architecture Compliance
- **Component:** Pure UI component, receives tree data as props
- **Images:** Placeholder từ `/public/images/placeholders/`

### Timeline Stages Definition
```typescript
const TIMELINE_STAGES = [
  { month: 0, label: 'Đặt hàng thành công', icon: '✅' },
  { month: 1, label: 'Đang ươm giống', icon: '🌱', placeholder: true },
  { month: 3, label: 'Cây giống sẵn sàng', icon: '🌿', placeholder: true },
  { month: 6, label: 'Trồng xuống đất', icon: '🌲' },
  { month: 12, label: 'Năm 1: Bám rễ', icon: '🌳' },
  { month: 24, label: 'Năm 2: Phát triển', icon: '🌳' },
  { month: 36, label: 'Năm 3: Trưởng thành', icon: '🎋' },
  { month: 48, label: 'Năm 4: Sắp thu hoạch', icon: '🎋' },
  { month: 60, label: 'Năm 5: Thu hoạch', icon: '✨' },
]
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Component-Patterns]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Timeline-Section]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Timeline-Visualization]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.4]
- [Source: docs/prd.md#FR-11]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/components/crm/TreeTimeline.tsx
- src/components/crm/TimelineStage.tsx
- src/components/crm/TimelineProgress.tsx
- public/images/placeholders/seedling.svg
- public/images/placeholders/preparing.svg
