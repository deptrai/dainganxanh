# Story E1.4: Tạo TreePhoto Object

**Epic:** E1 - Custom Objects Setup  
**Story Points:** 2  
**Status:** done  
**Dependencies:** E1.1 (Tree Object)

---

## User Story

**As a** developer,  
**I want** TreePhoto object để lưu ảnh cập nhật cây,  
**So that** users có thể xem tiến độ cây qua thời gian.

---

## Acceptance Criteria

1. TreePhoto object với fields:
   - `photoUrl` (text) - URL ảnh gốc trên S3
   - `thumbnailUrl` (text) - URL thumbnail
   - `capturedAt` (datetime) - Thời điểm chụp ảnh
   - `gpsLat` (number) - Vĩ độ từ EXIF
   - `gpsLng` (number) - Kinh độ từ EXIF
   - `quarter` (text) - Format: Q1-2026
   - `isPlaceholder` (boolean) - Ảnh placeholder khi chưa có ảnh thật
   - `caption` (text) - Mô tả ảnh (optional)

2. Có relations:
   - `tree` (Tree) - Cây liên quan
   - `uploadedBy` (WorkspaceMember) - Người upload

3. Quarter format validation: Q[1-4]-YYYY

---

## Technical Tasks

- [ ] Task 1: Define TreePhoto schema
  - [ ] Subtask 1.1: Create entity file in twenty-server
  - [ ] Subtask 1.2: Add all fields với đúng types
  - [ ] Subtask 1.3: Add relations

- [ ] Task 2: Database migration
  - [ ] Subtask 2.1: Generate migration file
  - [ ] Subtask 2.2: Run migration

- [ ] Task 3: Validation
  - [ ] Subtask 3.1: Quarter format regex
  - [ ] Subtask 3.2: Unit tests

---

## Notes

- Photos sẽ được upload qua E2.2 (TreePhotoService)
- Quarterly reports trong E4.2 sẽ hiển thị photos theo quarter
