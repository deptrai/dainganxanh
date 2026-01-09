# Story E2.2: Kết nối TreePhotoService với S3

**Epic:** E2 - Tree Tracking Integration  
**Story Points:** 5  
**Status:** ready-for-dev  
**Dependencies:** E1.4 (TreePhoto Object)

---

## User Story

**As a** developer,  
**I want** TreePhotoService upload ảnh lên S3,  
**So that** photos được lưu trữ và serve từ CDN.

---

## Acceptance Criteria

1. Upload photo lên S3 với key format:
   `trees/{treeCode}/{quarter}/{timestamp}-{filename}`

2. Extract GPS từ EXIF metadata:
   - Đọc GPS coordinates từ ảnh
   - Fallback nếu không có EXIF

3. Compress images:
   - Output < 2MB
   - Maintain quality >80%

4. Generate thumbnails:
   - Size: 300x300px
   - Format: WebP hoặc JPEG

---

## Technical Tasks

- [ ] Task 1: S3 Integration
  - [ ] Subtask 1.1: Configure AWS S3 client
  - [ ] Subtask 1.2: Implement uploadToS3 method
  - [ ] Subtask 1.3: Handle errors và retries

- [ ] Task 2: Image Processing
  - [ ] Subtask 2.1: EXIF extraction (exifr library)
  - [ ] Subtask 2.2: Image compression (sharp library)
  - [ ] Subtask 2.3: Thumbnail generation

- [ ] Task 3: TreePhoto CRUD
  - [ ] Subtask 3.1: Create record sau upload
  - [ ] Subtask 3.2: Update latestPhoto trong Tree

- [ ] Task 4: Testing
  - [ ] Subtask 4.1: Unit tests với mock S3
  - [ ] Subtask 4.2: Integration tests

---

## Notes

- CDN sẽ được configure ở infra level
- Photos được serve qua CloudFront hoặc tương tự
