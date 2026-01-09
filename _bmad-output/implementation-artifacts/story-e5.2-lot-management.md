# Story E5.2: Tree Lot Management View

**Epic:** E5 - Admin Dashboard  
**Story Points:** 5  
**Status:** ready-for-dev  
**Dependencies:** E1.2 (TreeLot Object), E5.1 (Order Management)

---

## User Story

**As an** admin,  
**I want** quản lý các lô cây,  
**So that** tôi có thể track capacity và assignments.

---

## Acceptance Criteria

1. Kanban view theo lot:
   - Columns = TreeLots
   - Cards = Trees
   - Visual capacity indicator

2. Drag & drop trees between lots:
   - Move trees to different lots
   - Validate lot capacity
   - Update tree.lot relation

3. View lot capacity và location:
   - Capacity bar (planted/total)
   - GPS location on mini-map
   - Lot details panel

4. Assign operator:
   - Select from WorkspaceMembers
   - Show current assignment
   - Notification to operator

---

## Technical Tasks

- [ ] Task 1: Lot Management Route
  - [ ] Subtask 1.1: Admin route /admin/lots
  - [ ] Subtask 1.2: Access control

- [ ] Task 2: Kanban Board
  - [ ] Subtask 2.1: Kanban layout component
  - [ ] Subtask 2.2: Lot column component
  - [ ] Subtask 2.3: Tree card component

- [ ] Task 3: Drag & Drop
  - [ ] Subtask 3.1: DnD library integration
  - [ ] Subtask 3.2: API calls on drop
  - [ ] Subtask 3.3: Optimistic updates

- [ ] Task 4: Lot Details
  - [ ] Subtask 4.1: Capacity visualization
  - [ ] Subtask 4.2: Mini-map component
  - [ ] Subtask 4.3: Operator assignment

- [ ] Task 5: Testing
  - [ ] Subtask 5.1: Unit tests
  - [ ] Subtask 5.2: DnD interaction tests

---

## Notes

- Can reuse TreeLocationMap from E4.2 for mini-maps
- Consider react-beautiful-dnd or @dnd-kit
