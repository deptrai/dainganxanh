# Story 3.6: Tree Health Status Update

Status: ready-for-dev

## Story

As a **field operator**,
I want to **mark cây là healthy/sick/dead**,
so that **có action phù hợp**.

## Acceptance Criteria

1. **Given** reviewing tree lot  
   **When** update status = "Bệnh"  
   **Then** log treatment details

2. **When** status = "Chết"  
   **Then** auto-create task "Trồng cây thay thế"

3. **And** notify user với explanation

4. **When** status = "Khỏe"  
   **Then** no additional action

## Tasks / Subtasks

- [ ] Task 1: Tree Status Page (AC: 1, 4)
  - [ ] 1.1 Tạo `/src/app/crm/admin/trees/page.tsx`
  - [ ] 1.2 List trees by lot
  - [ ] 1.3 Filter by health status
  - [ ] 1.4 Bulk selection

- [ ] Task 2: Status Update Modal (AC: 1)
  - [ ] 2.1 Tạo `components/admin/TreeHealthModal.tsx`
  - [ ] 2.2 Status selector: Khỏe, Bệnh, Chết
  - [ ] 2.3 Notes field
  - [ ] 2.4 Treatment details (if sick)

- [ ] Task 3: Health Log (AC: 1)
  - [ ] 3.1 Insert into `tree_health_logs` table
  - [ ] 3.2 Track who made change
  - [ ] 3.3 History view

- [ ] Task 4: Dead Tree Handling (AC: 2)
  - [ ] 4.1 Tạo `replacement_tasks` table
  - [ ] 4.2 Auto-create task với tree_id
  - [ ] 4.3 Task queue for field operators

- [ ] Task 5: User Notification (AC: 3)
  - [ ] 5.1 Email template cho dead tree
  - [ ] 5.2 Include: explanation, replacement promise
  - [ ] 5.3 In-app notification

- [ ] Task 6: Sick Tree Follow-up (AC: 1)
  - [ ] 6.1 Schedule follow-up check in 30 days
  - [ ] 6.2 Reminder notification
  - [ ] 6.3 Track treatment progress

## Dev Notes

### Architecture Compliance
- **Route:** `/crm/admin/trees`
- **Tables:** `tree_health_logs`, `replacement_tasks`
- **Notifications:** Email + in-app

### Health Status Workflow
```
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Healthy │───▶│  Sick   │───▶│  Dead   │
└─────────┘    └────┬────┘    └────┬────┘
     ▲              │              │
     └──────────────┘              │
       (Recovery)                  │
                                   ▼
                          ┌──────────────┐
                          │ Replacement  │
                          │    Task      │
                          └──────────────┘
```

### Database Schema Addition
```sql
CREATE TABLE replacement_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dead_tree_id UUID NOT NULL REFERENCES trees(id),
  new_tree_id UUID REFERENCES trees(id), -- NULL until replaced
  status TEXT DEFAULT 'pending', -- pending, assigned, completed
  assigned_to UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### Notification Template (Dead Tree)
```
Subject: 📢 Thông báo về cây {tree_code}

Nội dung:
Xin chào {user_name},

Chúng tôi rất tiếc phải thông báo rằng cây {tree_code} của bạn 
đã không qua khỏi do [nguyên nhân].

Theo cam kết hợp đồng, chúng tôi sẽ trồng thay thế cây mới 
trong vòng 30 ngày. Bạn sẽ nhận được thông báo khi cây mới 
được trồng.

Trân trọng,
Đội ngũ Đại Ngàn Xanh
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Database-Schema]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.6]
- [Source: docs/prd.md#FR-18]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/app/crm/admin/trees/page.tsx
- src/components/admin/TreeHealthModal.tsx
- src/components/admin/TreeHealthHistory.tsx
- src/components/admin/ReplacementTaskList.tsx
- supabase/migrations/[timestamp]_create_replacement_tasks.sql
- email-templates/tree-dead-notification.html
