# Story 3.5: Photo Upload với GPS Tagging

Status: ready-for-dev

## Story

As a **field operator**,
I want to **upload ảnh từ phone trực tiếp**,
so that **tree owners nhận updates real-time**.

## Acceptance Criteria

1. **Given** tôi ở field với mobile device  
   **When** mở Admin và click "Upload Photo"  
   **Then** select multiple photos từ camera roll

2. **When** upload  
   **Then** extract GPS từ EXIF

3. **And** auto-tag đến trees trong lô

4. **And** compress < 2MB

5. **And** notify users có cây trong lô

## Tasks / Subtasks

- [ ] Task 1: Photo Upload Page (AC: 1)
  - [ ] 1.1 Tạo `/src/app/crm/admin/photos/upload/page.tsx`
  - [ ] 1.2 Mobile-responsive design
  - [ ] 1.3 Lot selector
  - [ ] 1.4 Multi-file input

- [ ] Task 2: Photo Uploader Component (AC: 1, 4)
  - [ ] 2.1 Tạo `components/admin/PhotoUploader.tsx`
  - [ ] 2.2 Drag & drop hoặc camera roll
  - [ ] 2.3 Preview thumbnails
  - [ ] 2.4 Upload progress indicator

- [ ] Task 3: Image Processing (AC: 2, 4)
  - [ ] 3.1 Client-side compression với browser-image-compression
  - [ ] 3.2 Max size: 2MB, max dimension: 2000px
  - [ ] 3.3 Maintain EXIF data for GPS

- [ ] Task 4: GPS Extraction (AC: 2)
  - [ ] 4.1 Use exifr library để read EXIF
  - [ ] 4.2 Extract GPS coordinates
  - [ ] 4.3 Display on mini-map
  - [ ] 4.4 Manual GPS input nếu no EXIF

- [ ] Task 5: Tree Auto-Tagging (AC: 3)
  - [ ] 5.1 Fetch trees trong selected lot
  - [ ] 5.2 Create tree_photos records
  - [ ] 5.3 Link photos to multiple trees

- [ ] Task 6: Upload to Storage (AC: 4)
  - [ ] 6.1 Upload to Supabase Storage
  - [ ] 6.2 Generate thumbnail (300px)
  - [ ] 6.3 Store both URLs in database

- [ ] Task 7: User Notifications (AC: 5)
  - [ ] 7.1 Trigger `notify-tree-update` function
  - [ ] 7.2 Batch notifications by user
  - [ ] 7.3 Prevent duplicate notifications

## Dev Notes

### Architecture Compliance
- **Route:** `/crm/admin/photos/upload`
- **Storage:** Supabase Storage `tree-photos` bucket
- **Permissions:** field_operator+

### Image Processing Pipeline
```typescript
import imageCompression from 'browser-image-compression'
import { exifr } from 'exifr'

const processImage = async (file: File) => {
  // 1. Extract EXIF before compression (compression removes EXIF)
  const exif = await exifr.parse(file)
  const gps = exif?.latitude && exif?.longitude 
    ? { lat: exif.latitude, lng: exif.longitude }
    : null
  
  // 2. Compress
  const compressed = await imageCompression(file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 2000,
  })
  
  // 3. Generate thumbnail
  const thumbnail = await imageCompression(file, {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 300,
  })
  
  return { compressed, thumbnail, gps, capturedAt: exif?.DateTimeOriginal }
}
```

### Storage Path Structure
```
tree-photos/
  {lotId}/
    {date}/
      {photoId}.webp
      {photoId}_thumb.webp
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Supabase-Storage]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Field-Operations]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.5]
- [Source: docs/prd.md#FR-17]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/app/crm/admin/photos/upload/page.tsx
- src/components/admin/PhotoUploader.tsx
- src/components/admin/GPSPreview.tsx
- src/lib/imageProcessing.ts
- src/hooks/usePhotoUpload.ts
