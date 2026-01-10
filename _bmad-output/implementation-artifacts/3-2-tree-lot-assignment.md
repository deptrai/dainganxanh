# Story 3.2: Tree Lot Assignment

Status: ready-for-dev

## Story

As an **admin**,
I want to **gán verified orders vào lô cây cụ thể**,
so that **chúng tôi track được vị trí thực**.

## Acceptance Criteria

1. **Given** có verified orders  
   **When** click "Gán lô cây"  
   **Then** hiển thị list available lots với: tên lô, capacity X/Y

2. **When** select lot và confirm  
   **Then** generate tree codes TREE-2026-XXXXX

3. **And** assign to lot

4. **And** status = "Assigned"

5. **And** email notification cho user với tree codes

## Tasks / Subtasks

- [ ] Task 1: Lot Assignment Modal (AC: 1)
  - [ ] 1.1 Tạo `components/admin/LotAssignmentModal.tsx`
  - [ ] 1.2 List of available lots với capacity
  - [ ] 1.3 Visual capacity indicator (progress bar)
  - [ ] 1.4 Lot preview với GPS location

- [ ] Task 2: Lots Management Page (AC: 1)
  - [ ] 2.1 Tạo `/src/app/crm/admin/lots/page.tsx`
  - [ ] 2.2 List all lots với status
  - [ ] 2.3 Create new lot form
  - [ ] 2.4 Edit lot details

- [ ] Task 3: Tree Code Generation (AC: 2)
  - [ ] 3.1 Update `supabase/functions/process-payment/index.ts`
  - [ ] 3.2 Code format: `TREE-{year}-{prefix}{sequence}`
  - [ ] 3.3 Ensure uniqueness với database constraint

- [ ] Task 4: Assignment API (AC: 2, 3, 4)
  - [ ] 4.1 Tạo server action `assignOrderToLot`
  - [ ] 4.2 Create trees records với lot_id
  - [ ] 4.3 Update order status to 'assigned'
  - [ ] 4.4 Update lot planted count

- [ ] Task 5: User Notification (AC: 5)
  - [ ] 5.1 Trigger email với tree codes
  - [ ] 5.2 Include lot location info
  - [ ] 5.3 Dashboard link

- [ ] Task 6: Lot Capacity Validation (AC: 1)
  - [ ] 6.1 Check lot has enough capacity
  - [ ] 6.2 Error if over capacity
  - [ ] 6.3 Suggest splitting order across lots

## Dev Notes

### Architecture Compliance
- **Route:** `/crm/admin/lots` for lot management
- **Modal:** Used from order management page
- **Trigger:** Manual admin action

### Tree Code Generation Logic
```typescript
const generateTreeCode = async (orderId: string, sequence: number) => {
  const year = new Date().getFullYear()
  const prefix = orderId.slice(0, 5).toUpperCase()
  const seq = String(sequence).padStart(3, '0')
  return `TREE-${year}-${prefix}${seq}`
}

// Example: TREE-2026-ABC12001, TREE-2026-ABC12002, ...
```

### Lot Capacity Update
```sql
-- When assigning trees to lot
UPDATE lots 
SET planted = planted + :quantity
WHERE id = :lotId
AND planted + :quantity <= capacity
RETURNING *;

-- If no rows returned, lot is full
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Database-Schema]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Tree-Lot-Assignment]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.2]
- [Source: docs/prd.md#FR-14]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/app/crm/admin/lots/page.tsx
- src/components/admin/LotAssignmentModal.tsx
- src/components/admin/LotCard.tsx
- src/components/admin/CreateLotForm.tsx
- src/actions/assignOrderToLot.ts
