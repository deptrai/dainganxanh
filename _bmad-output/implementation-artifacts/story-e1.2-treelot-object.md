# Story E1.2: Tạo TreeLot Object trong Twenty

Status: done

## Story

As a **developer**,
I want **TreeLot object được tạo để nhóm các cây theo lô**,
so that **admin có thể quản lý cây theo vùng địa lý**.

## Acceptance Criteria

1. ✅ TreeLot object tồn tại với nameSingular: "treeLot", labelSingular: "Lô cây"
2. ✅ Có các fields:
   - `lotCode` (TEXT, required) - Format: LOT-XXX
   - `lotName` (TEXT, required) - Tên lô [DEVIATION: Changed from 'name' due to reserved field conflict]
   - `location` (TEXT) - Địa chỉ chi tiết
   - `capacity` (NUMBER) - Sức chứa tối đa
   - `plantedCount` (NUMBER) - Số cây đã trồng
   - `gpsCenter` (TEXT) - GPS center point của lô
3. ✅ Có relation one-to-many với Tree (`trees`)
4. ✅ Có relation với WorkspaceMember (`assignedOperator`)
5. ✅ Object có icon: 📍 (IconMapPin)

## Tasks / Subtasks

- [x] Task 1: Tạo TreeLot object metadata (AC: #1, #5) ✅
  - [x] Subtask 1.1: Prepare createObjectMetadata mutation ✅
  - [x] Subtask 1.2: Execute và verify ✅

- [x] Task 2: Tạo các fields (AC: #2) ✅
  - [x] Subtask 2.1: Tạo lotCode field (TEXT, required) ✅
  - [x] Subtask 2.2: Tạo lotName field (TEXT, required) ✅ [Changed from 'name']
  - [x] Subtask 2.3: Tạo location field (TEXT) ✅
  - [x] Subtask 2.4: Tạo capacity và plantedCount fields (NUMBER) ✅
  - [x] Subtask 2.5: Tạo gpsCenter field (TEXT) ✅

- [x] Task 3: Tạo relations (AC: #3, #4) ✅
  - [x] Subtask 3.1: Tạo trees relation → Tree[] (ONE_TO_MANY) ✅
  - [x] Subtask 3.2: Tạo assignedOperator relation → WorkspaceMember ✅

- [x] Task 4: Verify trong Twenty UI (AC: #1-5) ✅
  - [x] Subtask 4.1: Object appears in Data model ✅
  - [x] Subtask 4.2: All fields correct ✅
  - [x] Subtask 4.3: Test CRUD ✅

## Dev Notes

### Architecture Patterns
- TreeLot là parent của Tree (one-to-many)
- Sử dụng WorkspaceMember cho operator assignment
- GPS dùng TEXT field với format "lat,lng"

### Source Tree Components
- Same as E1.1: metadata-modules
- WorkspaceMember là built-in object trong Twenty

### Testing Standards
- Create sample lots via UI
- Verify tree assignment works correctly
- Check capacity calculation

### Project Structure Notes
- Lots sẽ được seeded từ initial data (see Architecture: Data Migration Strategy)
- Production sẽ có ~10-20 lots
- Initial seed data: LOT-001 (Đắk Nông - Lô A), LOT-002 (Đắk Nông - Lô B), LOT-003 (Lâm Đồng - C)

### References
- [Architecture: ADR-02 Data Model](file:///_bmad-output/planning-artifacts/architecture.md#adr-02-data-model-design)
- [Architecture: Data Migration - Seed Data](file:///_bmad-output/planning-artifacts/architecture.md#data-migration-strategy)
- [UX Design: Section 4.2 Lot Management](file:///_bmad-output/planning-artifacts/ux-design.md)
- [PRD: Operational Requirements](file:///docs/prd.md)

## Dev Agent Record

### Agent Model Used

Claude 4.5 Sonnet (2026-01-09)

### Debug Log References

- API query pagination issue discovered (fields exist but not returned in query)
- Resolved via UI verification

### Completion Notes List

**Implementation Summary:**
- TreeLot object created via GraphQL Metadata API
- All 6 custom fields created via `add-fields-to-objects.js` script
- trees relation (ONE_TO_MANY) created via same script
- assignedOperator relation (MANY_TO_ONE to WorkspaceMember) created via `add-treelot-operator.js`

**Field Name Deviation:**
- Story specified `name` field but changed to `lotName` due to Twenty's reserved field name conflict
- [ASSUMPTION: This is acceptable as the label still reads "Tên lô" in UI]

**Verification:**
- All fields confirmed visible in Twenty UI (screenshot captured)
- Object icon: IconMapPin ✅

### File List

- `/Users/mac_1/.gemini/antigravity/brain/4ff896d7-1251-4048-a43d-785f8a8d58e6/add-fields-to-objects.js` (fields + trees relation)
- `/Users/mac_1/.gemini/antigravity/brain/4ff896d7-1251-4048-a43d-785f8a8d58e6/add-treelot-operator.js` (assignedOperator relation)
- `/Users/mac_1/.gemini/antigravity/brain/4ff896d7-1251-4048-a43d-785f8a8d58e6/treelot_fields_ui_*.png` (UI verification screenshot)
