# Story 3.4: Field Operations Checklist

Status: ready-for-dev

## Story

As an **admin**,
I want to **theo dõi checklist trồng cây theo quý**,
so that **đảm bảo quy trình được thực hiện đúng**.

## Acceptance Criteria

1. **Given** quarterly period  
   **When** mở checklist  
   **Then** hiển thị tasks: visit garden, take photos, update status

2. **And** mark complete/incomplete cho mỗi task

3. **And** auto-reminder 7 ngày trước due date

4. **And** track completion % cho mỗi quý

## Tasks / Subtasks

- [ ] Task 1: Checklist Page (AC: 1, 2)
  - [ ] 1.1 Tạo `/src/app/crm/admin/checklist/page.tsx`
  - [ ] 1.2 Quarter selector (Q1, Q2, Q3, Q4)
  - [ ] 1.3 List of lots với checklist status

- [ ] Task 2: Checklist Template (AC: 1)
  - [ ] 2.1 Tạo `field_checklists` table
  - [ ] 2.2 Pre-defined checklist items:
        - Thăm vườn
        - Chụp ảnh
        - Kiểm tra sức khỏe
        - Upload ảnh
        - Cập nhật status

- [ ] Task 3: Checklist Item Component (AC: 2)
  - [ ] 3.1 Tạo `components/admin/ChecklistItem.tsx`
  - [ ] 3.2 Checkbox với toggle
  - [ ] 3.3 Notes field
  - [ ] 3.4 Completed by / timestamp

- [ ] Task 4: Progress Tracking (AC: 4)
  - [ ] 4.1 Tạo `components/admin/ChecklistProgress.tsx`
  - [ ] 4.2 Progress bar per lot
  - [ ] 4.3 Overall quarter completion %

- [ ] Task 5: Reminder System (AC: 3)
  - [ ] 5.1 Tạo `supabase/functions/checklist-reminder/index.ts`
  - [ ] 5.2 Cron: Run daily
  - [ ] 5.3 Email admin 7 days before due
  - [ ] 5.4 In-app notification

## Dev Notes

### Architecture Compliance
- **Route:** `/crm/admin/checklist`
- **Cron:** Daily check for upcoming deadlines
- **Permissions:** field_operator, admin, super_admin

### Database Schema Addition
```sql
CREATE TABLE field_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID NOT NULL REFERENCES lots(id),
  quarter TEXT NOT NULL, -- '2026-Q1', '2026-Q2', etc.
  checklist_items JSONB DEFAULT '[]',
  overall_status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example checklist_items structure:
-- [
--   { "id": "visit", "label": "Thăm vườn", "completed": false, "completed_by": null },
--   { "id": "photos", "label": "Chụp ảnh", "completed": true, "completed_by": "user-id" },
--   ...
-- ]
```

### Quarter Due Dates
```typescript
const QUARTER_DUE_DATES = {
  'Q1': '03-31', // End of March
  'Q2': '06-30', // End of June
  'Q3': '09-30', // End of September
  'Q4': '12-31', // End of December
}
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Database-Schema]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.4]
- [Source: docs/prd.md#FR-16]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/app/crm/admin/checklist/page.tsx
- src/components/admin/ChecklistItem.tsx
- src/components/admin/ChecklistProgress.tsx
- src/components/admin/QuarterSelector.tsx
- supabase/functions/checklist-reminder/index.ts
- supabase/migrations/[timestamp]_create_field_checklists.sql
