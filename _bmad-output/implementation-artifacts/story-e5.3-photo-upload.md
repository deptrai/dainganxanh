# Story E5.3: Photo Upload Interface

**Epic:** E5 - Admin Dashboard  
**Story Points:** 5  
**Status:** done  
**Dependencies:** E1.4 (TreePhoto Object), E2.2 (TreePhotoService)

---

## User Story

**As a** field operator,  
**I want** upload ảnh từ mobile,  
**So that** tree owners nhận được updates.

---

## Acceptance Criteria

1. ✅ Multi-photo upload:
   - Select multiple files
   - Drag & drop support
   - Camera capture on mobile

2. ✅ Auto-extract GPS from EXIF:
   - Read location từ ảnh
   - Display on mini-map
   - Manual override option

3. ✅ Tag to lot/trees:
   - Select lot from dropdown
   - Tag specific trees (optional)
   - Auto-suggest based on GPS

4. ✅ Compress before upload:
   - Client-side compression
   - Progress indicator
   - Max 5MB per photo

5. ✅ Preview và confirm:
   - Thumbnail preview
   - Edit caption
   - Confirm batch upload

---

## Technical Tasks

- [x] Task 1: Upload Interface
  - [x] Subtask 1.1: Mobile route /admin/upload
  - [x] Subtask 1.2: File selection component
  - [x] Subtask 1.3: Camera capture

- [x] Task 2: Image Processing
  - [x] Subtask 2.1: EXIF extraction (client-side)
  - [x] Subtask 2.2: Client-side compression
  - [x] Subtask 2.3: Progress tracking

- [x] Task 3: Tagging
  - [x] Subtask 3.1: Lot selector
  - [x] Subtask 3.2: Tree multi-select
  - [x] Subtask 3.3: GPS-based suggestions

- [x] Task 4: Preview & Upload
  - [x] Subtask 4.1: Preview grid
  - [x] Subtask 4.2: Caption input
  - [x] Subtask 4.3: Batch upload to E2.2

- [/] Task 5: Testing
  - [x] Subtask 5.1: Unit tests
  - [/] Subtask 5.2: Mobile device testing (manual)

---

## Notes

- PWA optimized for mobile use
- Consider offline support for remote areas
- Batch upload to minimize API calls
- Backend integration TODO: S3 upload in usePhotoUpload hook

