# Story E5.1: Order Management View

**Epic:** E5 - Admin Dashboard  
**Story Points:** 5  
**Status:** ready-for-dev  
**Dependencies:** E1.3 (Order Object), E3.1 (Banking Webhook)

---

## User Story

**As an** admin,  
**I want** quản lý đơn hàng mới,  
**So that** tôi có thể verify và assign trees.

---

## Acceptance Criteria

1. Table view với filters:
   - Status: PENDING | PAID | COMPLETED
   - Date range picker
   - Payment method: BANK | USDT

2. Verify payment action:
   - Manual verify button cho uncertain payments
   - Update status to PAID

3. Assign to lot action:
   - Select lot từ dropdown
   - Auto-generate tree codes
   - Assign operator

4. Bulk operations:
   - Select multiple orders
   - Bulk verify
   - Bulk assign to lot

---

## Technical Tasks

- [ ] Task 1: Order Management Route
  - [ ] Subtask 1.1: Admin route /admin/orders
  - [ ] Subtask 1.2: Access control (admin only)

- [ ] Task 2: Order Table
  - [ ] Subtask 2.1: DataTable component
  - [ ] Subtask 2.2: Filters panel
  - [ ] Subtask 2.3: Sort by columns

- [ ] Task 3: Actions
  - [ ] Subtask 3.1: Verify payment action
  - [ ] Subtask 3.2: Assign to lot modal
  - [ ] Subtask 3.3: View customer details

- [ ] Task 4: Bulk Operations
  - [ ] Subtask 4.1: Multi-select
  - [ ] Subtask 4.2: Bulk action buttons
  - [ ] Subtask 4.3: Confirmation dialogs

- [ ] Task 5: Testing
  - [ ] Subtask 5.1: Unit tests
  - [ ] Subtask 5.2: E2E tests

---

## Notes

- Consider using Twenty's built-in table components
- Integrate with existing Twenty admin patterns
