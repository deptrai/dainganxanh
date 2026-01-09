# Story E1.5: Tạo TreeHealthLog Object

**Epic:** E1 - Custom Objects Setup  
**Story Points:** 2  
**Status:** ready-for-dev  
**Dependencies:** E1.1 (Tree Object)

---

## User Story

**As a** developer,  
**I want** TreeHealthLog object để track lịch sử sức khỏe cây,  
**So that** admin có thể monitor và xử lý khi cây có vấn đề.

---

## Acceptance Criteria

1. TreeHealthLog object với fields:
   - `status` (enum) - HEALTHY | SICK | DEAD | REPLANTED
   - `notes` (text) - Ghi chú chi tiết
   - `treatment` (text) - Biện pháp xử lý (nếu có)
   - `loggedAt` (datetime) - Thời điểm ghi log

2. Có relations:
   - `tree` (Tree) - Cây liên quan
   - `loggedBy` (WorkspaceMember) - Admin/operator ghi log

3. Status transitions được validate:
   - HEALTHY → SICK | DEAD
   - SICK → HEALTHY | DEAD | REPLANTED
   - DEAD → REPLANTED
   - REPLANTED → HEALTHY | SICK

---

## Technical Tasks

- [ ] Task 1: Define TreeHealthLog schema
  - [ ] Subtask 1.1: Create entity file
  - [ ] Subtask 1.2: Define status enum
  - [ ] Subtask 1.3: Add relations

- [ ] Task 2: Status validation
  - [ ] Subtask 2.1: Implement transition rules
  - [ ] Subtask 2.2: Throw error on invalid transitions

- [ ] Task 3: Testing
  - [ ] Subtask 3.1: Unit tests for validations
  - [ ] Subtask 3.2: Integration tests

---

## Notes

- Health logs hiển thị trong E4.2 (Tree Detail Page) timeline
- E5.3 (Photo Upload) sẽ kết hợp với health logging
