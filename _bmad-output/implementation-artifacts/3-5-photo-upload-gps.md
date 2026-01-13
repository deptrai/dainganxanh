# Story 3.5: Photo Upload với GPS Tagging

Status: done

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

- [x] Task 1: Photo Upload Page (AC: 1)
  - [x] 1.1 Tạo `/src/app/crm/admin/photos/upload/page.tsx`
  - [x] 1.2 Mobile-responsive design
  - [x] 1.3 Lot selector
  - [x] 1.4 Multi-file input

- [x] Task 2: Photo Uploader Component (AC: 1, 4)
  - [x] 2.1 Tạo `components/admin/PhotoUploader.tsx`
  - [x] 2.2 Drag & drop hoặc camera roll
  - [x] 2.3 Preview thumbnails
  - [x] 2.4 Upload progress indicator

- [x] Task 3: Image Processing (AC: 2, 4)
  - [x] 3.1 Client-side compression với browser-image-compression
  - [x] 3.2 Max size: 2MB, max dimension: 2000px
  - [x] 3.3 Maintain EXIF data for GPS (extracted BEFORE compression)

- [x] Task 4: GPS Extraction (AC: 2)
  - [x] 4.1 Use exifr library để read EXIF
  - [x] 4.2 Extract GPS coordinates
  - [x] 4.3 Display on mini-map (Leaflet.js integration)
  - [x] 4.4 Manual GPS input nếu no EXIF (GPSPreview component)

- [x] Task 5: Tree Auto-Tagging (AC: 3)
  - [x] 5.1 Fetch trees trong selected lot
  - [x] 5.2 Create tree_photos records
  - [x] 5.3 Link photos to individual trees (optional tree_id field)

- [x] Task 6: Upload to Storage (AC: 4)
  - [x] 6.1 Upload to Supabase Storage
  - [x] 6.2 Generate thumbnail (300px)
  - [x] 6.3 Store both URLs in database

- [x] Task 7: User Notifications (AC: 5)
  - [x] 7.1 Trigger `notify-tree-update` function (via Supabase webhook)
  - [x] 7.2 Batch notifications by user (handled by edge function)
  - [x] 7.3 Prevent duplicate notifications (handled by edge function)

## Dev Notes

### Architecture Compliance
- **Route:** `/crm/admin/photos/upload`
- **Storage:** Supabase Storage `tree-photos` bucket
- **Permissions:** field_operator+
- **Notifications:** Supabase Database Webhook on tree_photos INSERT

### Image Processing Pipeline
```typescript
import imageCompression from 'browser-image-compression'
import { parse as parseEXIF } from 'exifr'

// CRITICAL: Extract EXIF BEFORE compression (compression removes EXIF)
const { gps, capturedAt } = await extractEXIF(file)  // Step 1
const compressed = await compressImage(file)          // Step 2
const thumbnail = await generateThumbnail(file)       // Step 3
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
Claude Sonnet 4 / Gemini 2.5 Flash

### File List
- src/app/crm/admin/photos/upload/page.tsx (NEW)
- src/components/admin/PhotoUploader.tsx (NEW)
- src/components/admin/GPSPreview.tsx (MODIFIED - added MiniMap integration)
- src/components/admin/MiniMap.tsx (NEW - Leaflet map component)
- src/lib/imageProcessing.ts (NEW)
- src/lib/__tests__/imageProcessing.test.ts (NEW - 12/12 tests pass)
- src/actions/photoUpload.ts (NEW)
- supabase/migrations/20260113_add_gps_to_tree_photos.sql (NEW)
- supabase/migrations/20260113_add_tree_id_to_tree_photos.sql (NEW)
- package.json (MODIFIED - added browser-image-compression, exifr, leaflet, react-leaflet)
- pnpm-lock.yaml (MODIFIED)

### Change Log
| Date | Changes |
|------|---------|
| 2026-01-13 | Initial implementation: upload page, components, image processing |
| 2026-01-13 | Added GPS extraction with EXIF, compression to WebP |
| 2026-01-13 | Database migration for GPS fields |
| 2026-01-13 | Code review: Fixed JSX error, import error, verified notifications |
| 2026-01-13 | Implemented deferred tasks: Mini-map display (Leaflet) + Tree linking (tree_id) |

### Test Coverage
- Image Processing: 12/12 unit tests passing
- Components: Manual browser testing verified
- E2E: Webhook notification tested via existing test scripts
- Mini-Map: Leaflet integration tested, dynamically loaded on GPS data
