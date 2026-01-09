# Story E4.3: Order History Page

**Epic:** E4 - User Portal  
**Story Points:** 3  
**Status:** ready-for-dev  
**Dependencies:** E3.3 (PDF Contracts), E4.1 (My Garden Dashboard)

---

## User Story

**As a** tree owner,  
**I want** xem lịch sử đơn hàng,  
**So that** tôi có thể track payments và contracts.

---

## Acceptance Criteria

1. List view với orders:
   - Sort by date (newest first)
   - Filter by status
   - Pagination

2. Order details:
   - Date: formatted Vietnamese
   - Quantity: số cây
   - Amount: formatted VND
   - Status badge: PENDING | PAID | COMPLETED

3. Download contract PDF:
   - Button download contract
   - Open in new tab

4. View assigned trees:
   - List tree codes
   - Link to Tree Detail page

---

## Technical Tasks

- [ ] Task 1: Order History Route
  - [ ] Subtask 1.1: Add /order-history route
  - [ ] Subtask 1.2: Create OrderHistoryPage component

- [ ] Task 2: Order List Component
  - [ ] Subtask 2.1: OrderCard component
  - [ ] Subtask 2.2: Status badges
  - [ ] Subtask 2.3: Pagination

- [ ] Task 3: Data Fetching
  - [ ] Subtask 3.1: useUserOrders hook
  - [ ] Subtask 3.2: Filter by current user

- [ ] Task 4: Order Detail View
  - [ ] Subtask 4.1: Expandable details
  - [ ] Subtask 4.2: Tree list links
  - [ ] Subtask 4.3: PDF download button

- [ ] Task 5: Testing
  - [ ] Subtask 5.1: Unit tests
  - [ ] Subtask 5.2: Browser tests

---

## Notes

- Design should match My Garden Dashboard style
- Consider adding order summary widget to My Garden
