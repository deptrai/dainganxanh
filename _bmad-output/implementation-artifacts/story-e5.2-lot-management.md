# Story E5.2: Tree Lot Management View

**Epic:** E5 - Admin Dashboard  
**Story Points:** 5  
**Status:** done  
**Dependencies:** E1.2 (TreeLot Object), E5.1 (Order Management)

---

## User Story

**As an** admin,  
**I want** quản lý các lô cây,  
**So that** tôi có thể track capacity và assignments.

---

## Acceptance Criteria

1. ✅ Kanban view theo lot:
   - Columns = TreeLots
   - Cards = Trees
   - Visual capacity indicator

2. ✅ Drag & drop trees between lots:
   - Move trees to different lots
   - Validate lot capacity
   - Update tree.lot relation

3. ✅ View lot capacity và location:
   - Capacity bar (planted/total)
   - GPS location on mini-map (TreeLocationMap integrated)
   - Lot details panel

4. ✅ Assign operator:
   - ✅ Select from WorkspaceMembers (GraphQL)
   - ✅ Show current assignment
   - ✅ Notification to operator (logging-based, ready for notification service integration)

---

## Technical Tasks

- [x] Task 1: Lot Management Route
  - [x] Subtask 1.1: Admin route /admin/lots
  - [x] Subtask 1.2: Access control (JwtAuthGuard)

- [x] Task 2: Kanban Board
  - [x] Subtask 2.1: Kanban layout component
  - [x] Subtask 2.2: Lot column component
  - [x] Subtask 2.3: Tree card component

- [x] Task 3: Drag & Drop
  - [x] Subtask 3.1: DnD library integration (@dnd-kit)
  - [x] Subtask 3.2: API calls on drop
  - [x] Subtask 3.3: Refetch after reassign

- [x] Task 4: Lot Details
  - [x] Subtask 4.1: Capacity visualization
  - [x] Subtask 4.2: TreeLocationMap integration (lazy-loaded)
  - [x] Subtask 4.3: Operator assignment with notifications

- [x] Task 5: Testing
  - [x] Subtask 5.1: Unit tests (backend)
  - [x] Subtask 5.2: Integration tests (frontend)

---

## Dev Agent Record

### Implementation Summary
- **Backend**: Created `LotManagementModule` with `LotService` and `LotController`
- **Frontend**: Built Kanban UI with @dnd-kit, capacity visualization, operator assignment
- **Testing**: Unit tests (backend) and integration tests (frontend) passing
- **Gaps Implemented**: TreeLocationMap integration + operator notifications

### File List

**Backend:**
- `packages/twenty-server/src/modules/dainganxanh/dainganxanh.module.ts` - Registered LotManagementModule
- `packages/twenty-server/src/modules/dainganxanh/lot-management/lot-management.module.ts` - Module definition
- `packages/twenty-server/src/modules/dainganxanh/lot-management/services/lot.service.ts` - Business logic with notification support
- `packages/twenty-server/src/modules/dainganxanh/lot-management/services/lot.service.spec.ts` - Unit tests
- `packages/twenty-server/src/modules/dainganxanh/lot-management/controllers/lot.controller.ts` - REST endpoints
- `packages/twenty-server/src/modules/dainganxanh/lot-management/controllers/lot.controller.spec.ts` - Controller tests

**Frontend:**
- `packages/twenty-front/src/modules/dainganxanh/admin/types/lot-management.types.ts` - TypeScript type definitions
- `packages/twenty-front/src/modules/dainganxanh/admin/hooks/useAdminLots.ts` - Data fetching hook
- `packages/twenty-front/src/pages/admin/AdminLotsPage.tsx` - Main page component
- `packages/twenty-front/src/pages/admin/AdminLotsPage.integration.spec.tsx` - Integration tests (6 passing)
- `packages/twenty-front/src/pages/admin/components/KanbanBoard.tsx` - Kanban board with drag-drop
- `packages/twenty-front/src/pages/admin/components/LotColumn.tsx` - Lot column with capacity bar
- `packages/twenty-front/src/pages/admin/components/TreeCard.tsx` - Draggable tree card
- `packages/twenty-front/src/pages/admin/components/LotDetailsPanel.tsx` - Lot details with TreeLocationMap + operator assignment
- `packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx` - Route registration
- `packages/twenty-shared/src/types/AppPath.ts` - Path constant

**Dependencies:**
- `packages/twenty-front/package.json` - Added @dnd-kit/core, @dnd-kit/sortable

### Change Log

**2026-01-09 - Initial Implementation**
- Created backend API with lot management endpoints
- Built Kanban UI with drag-drop functionality
- Implemented capacity validation and operator assignment
- Added TypeScript type safety
- All tests passing (backend unit tests, frontend integration tests)

**Code Review Fixes (2026-01-09)**
- ✅ Registered LotManagementModule in DainganxanhModule
- ✅ Replaced hardcoded operators with GraphQL WorkspaceMembers query
- ✅ Added proper TypeScript types (TreeLot, Tree, WorkspaceMember)
- ✅ Removed console.error from production code
- ✅ Fixed Apollo Client mocking in tests

**Gap Implementation (2026-01-09)**
- ✅ **TreeLocationMap Integration**: Lazy-loaded TreeLocationMap component with GPS coordinate parsing
- ✅ **Operator Notifications**: Implemented `notifyOperatorAssignment()` method with:
  - Operator lookup from WorkspaceMember
  - Structured notification payload (type, title, message, metadata)
  - Logger-based notification (ready for notification service integration)
  - Graceful error handling (doesn't block assignment on notification failure)
  - TODO comments for future notification service integration

---

## Notes

- TreeLocationMap reused from E4.2 with lazy loading for performance
- Using @dnd-kit for drag-drop (modern, actively maintained)
- Operator notifications implemented with logging infrastructure
  - Ready for integration with Twenty CRM notification system
  - Notification payload includes: recipientId, type, title, message, metadata
  - Future enhancements: email, push notifications, in-app badges
