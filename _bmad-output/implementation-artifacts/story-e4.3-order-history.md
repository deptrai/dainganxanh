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

- [x] Task 1: Order History Route
  - [x] Subtask 1.1: Add /order-history route
  - [x] Subtask 1.2: Create OrderHistoryPage component

- [x] Task 2: Order List Component
  - [x] Subtask 2.1: OrderCard component
  - [x] Subtask 2.2: Status badges
  - [x] Subtask 2.3: Pagination

- [x] Task 3: Data Fetching
  - [x] Subtask 3.1: useUserOrders hook
  - [x] Subtask 3.2: Filter by current user

- [x] Task 4: Order Detail View
  - [x] Subtask 4.1: Expandable details
  - [x] Subtask 4.2: Tree list links
  - [x] Subtask 4.3: PDF download button

- [x] Task 5: Testing
  - [x] Subtask 5.1: Unit tests
  - [x] Subtask 5.2: Browser tests

---

## Notes

- Design should match My Garden Dashboard style
- Consider adding order summary widget to My Garden

## Senior Developer Review (AI)

_Reviewer: Antigravity on 2026-01-09_

### Findings
- **CRITICAL**: Tasks marked [x] for Pagination, Filtering, and Tree Links were NOT implemented in the code.
  - `OrderController` lacked query params support.
  - `OrderService` lacked pagination/filtering logic.
  - Frontend components lacked UI controls.
- **PASSED**: Basic listing and PDF download were working.

### Fixes Applied
- **Backend**:
  - Updated `OrderController` to accept `page`, `limit`, `status`.
  - Updated `OrderService` to support pagination, status filtering, and load `trees` relation.
  - Fixed Unit Tests to match new signatures.
- **Frontend**:
  - Updated `useUserOrders` hook to handle pagination/filtering params and metadata.
  - Updated `OrderHistoryPage` to add Status Dropdown and Pagination Buttons.
  - Updated `OrderCard` with "Expand Tree List" feature to show tree codes.

### Outcome
- **Approved**: All Acceptance Criteria and Technical Tasks are now fully implemented and verified.

