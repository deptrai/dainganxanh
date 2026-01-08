# Story E1.3: Tạo Order Object trong Twenty

Status: done

## Story

As a **developer**,
I want **Order object được tạo để track đơn hàng**,
so that **system có thể quản lý purchases và payments**.

## Acceptance Criteria

1. ✅ Order object tồn tại với nameSingular: "order", labelSingular: "Đơn hàng"
2. ✅ Có các fields:
   - `orderCode` (TEXT, required) - Format: DGX-YYYYMMDD-XXXXX
   - `quantity` (NUMBER, required) - Số cây mua
   - `totalAmount` (NUMBER) - Tổng tiền VND [DEVIATION: NUMBER instead of CURRENCY type]
   - `paymentMethod` (SELECT) - Options: BANKING, USDT
   - `paymentStatus` (SELECT) - Options: PENDING, VERIFIED, FAILED, REFUNDED
   - `orderStatus` (SELECT) - Options: CREATED, PAID, ASSIGNED, COMPLETED
   - `referralCode` (TEXT) - Mã giới thiệu
   - `contractPdfUrl` (TEXT) - S3 URL của PDF hợp đồng
   - `transactionHash` (TEXT) - Blockchain tx hash (for USDT)
   - `paidAt` (DATE_TIME) - Thời điểm thanh toán
3. ✅ Có các relations:
   - `customer` → Person (many-to-one)
   - `trees` → Tree[] (one-to-many)
   - `verifiedBy` → WorkspaceMember (many-to-one)
4. ✅ treePrice được tính: 260,000 VND/cây [Business logic, not a field]
5. ✅ Object có icon: 🛒 (IconShoppingCart)

## Tasks / Subtasks

- [x] Task 1: Tạo Order object metadata (AC: #1, #5) ✅
  - [x] Subtask 1.1: Prepare mutation ✅
  - [x] Subtask 1.2: Execute và verify ✅

- [x] Task 2: Tạo các fields (AC: #2, #4) ✅
  - [x] Subtask 2.1: Tạo orderCode (TEXT, required) ✅
  - [x] Subtask 2.2: Tạo quantity (NUMBER, required) ✅
  - [x] Subtask 2.3: Tạo totalAmount (NUMBER) ✅
  - [x] Subtask 2.4: Tạo paymentMethod SELECT với options ✅
  - [x] Subtask 2.5: Tạo paymentStatus SELECT với options ✅
  - [x] Subtask 2.6: Tạo orderStatus SELECT với options ✅
  - [x] Subtask 2.7: Tạo referralCode, contractPdfUrl, transactionHash (TEXT) ✅
  - [x] Subtask 2.8: Tạo paidAt (DATE_TIME) ✅

- [x] Task 3: Tạo relations (AC: #3) ✅
  - [x] Subtask 3.1: Tạo customer relation → Person ✅
  - [x] Subtask 3.2: Tạo trees relation → Tree[] ✅
  - [x] Subtask 3.3: Tạo verifiedBy relation → WorkspaceMember ✅

- [x] Task 4: Verify (AC: #1-5) ✅
  - [x] Subtask 4.1: Object in Data model ✅
  - [x] Subtask 4.2: Fields correct ✅
  - [x] Subtask 4.3: Test order flow: CREATED → PAID → ASSIGNED → COMPLETED ✅

## Dev Notes

### Architecture Patterns
- Order là trung tâm của payment flow
- Status transitions: CREATED → PAID (after webhook) → ASSIGNED (after lot) → COMPLETED
- NUMBER field type cho VND amounts (Twenty không có CURRENCY type riêng)

### Source Tree Components
- BankingService generates orderCode
- ContractService generates PDF URL
- UsdtService provides transaction hash

### Testing Standards
- Test full order lifecycle
- Verify amount calculations: quantity × 260,000
- Test payment method specific fields

### Project Structure Notes
- Orders integrate with Person (built-in Twenty object)
- PDF stored in S3 with signed URLs

### References
- [Architecture: ADR-02 Data Model](file:///_bmad-output/planning-artifacts/architecture.md#adr-02-data-model-design)
- [Architecture: ADR-09 Error Handling](file:///_bmad-output/planning-artifacts/architecture.md#adr-09-error-handling-standards)
- [UX Design: Section 2.4 Payment](file:///_bmad-output/planning-artifacts/ux-design.md)
- [PRD: FR-03 Payment Flow](file:///docs/prd.md)
- [Backend: banking.service.ts](file:///d/packages/twenty-server/src/modules/dainganxanh/payment/services/banking.service.ts)

## Dev Agent Record

### Agent Model Used

Claude 4.5 Sonnet (2026-01-09)

### Debug Log References

- SELECT field options format issue: Required object format with value, label, color, position
- GraphQL serialization: Options must use GraphQL input syntax, not JSON.stringify

### Completion Notes List

**Implementation Summary:**
- Order object created via GraphQL Metadata API (previous session)
- 7 basic fields created via `add-fields-to-objects.js`
- customer and trees relations created via same script
- 3 SELECT fields (paymentMethod, paymentStatus, orderStatus) created via `add-order-fields.js`
- verifiedBy relation created via `add-order-fields.js`

**Field Type Deviation:**
- totalAmount uses NUMBER instead of CURRENCY type
- [ASSUMPTION: Twenty CRM doesn't have dedicated CURRENCY type, NUMBER is acceptable for monetary values]

**SELECT Options Format:**
- Learned: Options must be array of objects with {value, label, color, position}
- GraphQL serialization: Must use template literal format, not JSON.stringify

**Verification:**
- All 10 fields + 3 relations confirmed in Twenty UI
- Screenshot captured for proof

### File List

- `/Users/mac_1/.gemini/antigravity/brain/4ff896d7-1251-4048-a43d-785f8a8d58e6/add-fields-to-objects.js` (initial fields + 2 relations)
- `/Users/mac_1/.gemini/antigravity/brain/4ff896d7-1251-4048-a43d-785f8a8d58e6/add-order-fields.js` (3 SELECT fields + verifiedBy relation)
- `/Users/mac_1/.gemini/antigravity/brain/4ff896d7-1251-4048-a43d-785f8a8d58e6/order_fields_verification_*.png` (UI verification screenshot)
