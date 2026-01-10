# Story 2.5: Year 5 Harvest Notification

Status: ready-for-dev

## Story

As a **long-term tree owner**,
I want to **được thông báo khi cây sẵn sàng thu hoạch**,
so that **tôi có thể quyết định bước tiếp theo**.

## Acceptance Criteria

1. **Given** cây 60 tháng tuổi  
   **When** monthly cron job chạy  
   **Then** nhận email "Cây của bạn sẵn sàng thu hoạch"

2. **And** email chứa link đến harvest options page

3. **And** In-app notification với badge "Sẵn sàng thu hoạch"

4. **And** Dashboard tree card hiện harvest indicator

## Tasks / Subtasks

- [ ] Task 1: Cron Job Setup (AC: 1)
  - [ ] 1.1 Tạo `supabase/functions/check-harvest-ready/index.ts`
  - [ ] 1.2 Query trees WHERE age >= 60 months AND status != 'harvested'
  - [ ] 1.3 Schedule: Monthly (1st of each month)

- [ ] Task 2: Harvest Email (AC: 1, 2)
  - [ ] 2.1 Create `email-templates/harvest-ready.html`
  - [ ] 2.2 Content: Congratulations, 3 options preview, CTA button
  - [ ] 2.3 Link to `/crm/my-garden/[treeId]/harvest`

- [ ] Task 3: In-App Notification (AC: 3)
  - [ ] 3.1 Insert notification với type='harvest_ready'
  - [ ] 3.2 Update NotificationBell với harvest badge
  - [ ] 3.3 Special styling cho harvest notifications

- [ ] Task 4: Dashboard Indicator (AC: 4)
  - [ ] 4.1 Update TreeCard component
  - [ ] 4.2 Show "🌟 Sẵn sàng thu hoạch" badge
  - [ ] 4.3 Highlight card với gold border

- [ ] Task 5: Harvest Page Route (AC: 2)
  - [ ] 5.1 Tạo route `/src/app/crm/my-garden/[treeId]/harvest/page.tsx`
  - [ ] 5.2 Show 3 harvest options (Stories 2.6, 2.7, 2.8)

## Dev Notes

### Architecture Compliance
- **Cron:** Supabase scheduled functions
- **Email:** SendGrid (existing infrastructure)
- **Route:** New harvest options page

### Cron Configuration (Supabase Dashboard)
```
Function: check-harvest-ready
Schedule: 0 9 1 * * // 9 AM on 1st of each month
```

### Age Calculation Query
```sql
SELECT trees.*, 
       EXTRACT(MONTH FROM AGE(NOW(), trees.planted_at)) as age_months,
       orders.user_id,
       users.email
FROM trees
JOIN orders ON trees.order_id = orders.id
JOIN users ON orders.user_id = users.id
WHERE trees.status IN ('growing', 'mature')
AND EXTRACT(MONTH FROM AGE(NOW(), trees.planted_at)) >= 60
AND NOT EXISTS (
  SELECT 1 FROM notifications 
  WHERE notifications.user_id = users.id 
  AND notifications.type = 'harvest_ready'
  AND notifications.data->>'treeId' = trees.id::text
)
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Supabase-Edge-Functions]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.5]
- [Source: docs/prd.md#FR-12]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- supabase/functions/check-harvest-ready/index.ts
- src/app/crm/my-garden/[treeId]/harvest/page.tsx
- src/components/crm/HarvestBadge.tsx
- email-templates/harvest-ready.html
