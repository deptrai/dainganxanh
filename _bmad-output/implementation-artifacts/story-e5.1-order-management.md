# Story E5.1: Order Management View

**Epic:** E5 - Admin Dashboard  
**Story Points:** 5  
**Status:** in-progress  
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

- [x] Task 1: Order Management Route
  - [x] Subtask 1.1: Admin route /admin/orders
  - [x] Subtask 1.2: Access control (admin only)

- [x] Task 2: Order Table
  - [x] Subtask 2.1: DataTable component
  - [x] Subtask 2.2: Filters panel
  - [x] Subtask 2.3: Sort by columns

- [x] Task 3: Actions
  - [x] Subtask 3.1: Verify payment action
  - [x] Subtask 3.2: Assign to lot modal
  - [x] Subtask 3.3: View customer details

- [x] Task 4: Bulk Operations
  - [x] Subtask 4.1: Multi-select
  - [x] Subtask 4.2: Bulk action buttons
  - [x] Subtask 4.3: Confirmation dialogs

- [x] Task 5: Testing
  - [x] Subtask 5.1: Unit tests
  - [x] Subtask 5.2: E2E tests

## Status
**Done**

---

## Notes

- Consider using Twenty's built-in table components
- Integrate with existing Twenty admin patterns

## File List

- packages/twenty-shared/src/types/AppPath.ts
- packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx
- packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.spec.tsx
- packages/twenty-front/src/pages/admin/AdminOrdersPage.tsx
- packages/twenty-front/src/pages/admin/AdminOrdersPage.integration.spec.tsx
- packages/twenty-front/src/pages/admin/components/AdminOrderTable.tsx
- packages/twenty-front/src/pages/admin/components/AdminOrderTable.spec.tsx
- packages/twenty-front/src/pages/admin/components/AssignLotModal.tsx
- packages/twenty-front/src/pages/admin/components/ViewOrderModal.tsx
- packages/twenty-front/src/modules/dainganxanh/admin/hooks/useAdminOrders.ts
- packages/twenty-server/src/modules/dainganxanh/order-management/services/order.service.ts
- packages/twenty-server/src/modules/dainganxanh/order-management/controllers/order.controller.ts
- packages/twenty-server/src/modules/dainganxanh/order-management/controllers/order.controller.spec.ts

