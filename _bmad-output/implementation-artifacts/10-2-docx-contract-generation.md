# Story 10.2: DOCX Template Contract Generation Pipeline

Status: ready-for-dev

## Story

As a **system**,
I want to **tự động điền thông tin khách hàng vào hợp đồng mẫu DOCX và convert sang PDF có chữ ký công ty**,
so that **hợp đồng có đúng format pháp lý của công ty Biocare**.

## Acceptance Criteria

1. **Given** DOCX template với placeholders `{ho_ten}`, `{ngay_sinh}`, `{so_cccd}`, etc.
   **When** contract generation được trigger với order data
   **Then** tất cả placeholders được thay thế bằng giá trị thực từ order

2. **Given** DOCX đã điền đủ thông tin
   **When** convert sang PDF
   **Then** PDF giữ nguyên format, font, bảng, căn lề từ DOCX gốc

3. **Given** PDF đã convert
   **When** overlay chữ ký
   **Then** ảnh chữ ký + con dấu Bên B xuất hiện ở vị trí ký trang cuối
   **And** không che nội dung khác

4. **Given** PDF hoàn chỉnh
   **When** upload lên storage
   **Then** lưu vào Supabase Storage bucket `contracts/`
   **And** update `orders.contract_url` với public URL

5. **Given** contract generation fail
   **When** bất kỳ bước nào lỗi
   **Then** log error chi tiết
   **And** không block payment flow

## Tasks / Subtasks

- [ ] Task 1: DOCX Template Preparation (AC: 1)
  - [ ] 1.1 Copy `HỢP ĐỒNG ĐẠI NGÀN XANH (MẪU).docx` vào `dainganxanh-landing/templates/`
  - [ ] 1.2 Thay tất cả dấu `. . . . .` bằng placeholders: `{ho_ten}`, `{ngay_sinh}`, `{quoc_tich}`, `{so_cccd}`, `{ngay_cap}`, `{noi_cap}`, `{dia_chi}`, `{dien_thoai}`, `{so_hop_dong}`, `{ngay_ky}`, `{so_luong_cay}`, `{tong_gia_tri}`, `{tong_gia_tri_chu}`
  - [ ] 1.3 Upload template lên Supabase Storage bucket `templates/` (hoặc bundle trong project)

- [ ] Task 2: Install Dependencies (AC: 1, 2)
  - [ ] 2.1 `npm install docx-templates` — fill DOCX placeholders (Node.js compatible)
  - [ ] 2.2 `npm install pdf-lib` — overlay signature on PDF
  - [ ] 2.3 Setup ConvertAPI account + add `CONVERTAPI_SECRET` env var (hoặc alternative: CloudConvert)

- [ ] Task 3: Contract Generation API Route (AC: 1, 2, 3, 4)
  - [ ] 3.1 Tạo `src/app/api/contracts/generate/route.ts`
  - [ ] 3.2 Input: `orderId` (query order + customer data từ Supabase)
  - [ ] 3.3 Step 1: Download DOCX template từ Storage
  - [ ] 3.4 Step 2: Fill placeholders với `docx-templates` — map order fields to template vars
  - [ ] 3.5 Step 3: Convert filled DOCX → PDF via ConvertAPI
  - [ ] 3.6 Step 4: Overlay chữ ký + con dấu PNG via `pdf-lib` lên trang cuối
  - [ ] 3.7 Step 5: Upload final PDF lên Supabase Storage `contracts/{orderCode}.pdf`
  - [ ] 3.8 Step 6: Update `orders.contract_url`
  - [ ] 3.9 Return: `{ contractUrl, success }`

- [ ] Task 4: Company Signature Assets (AC: 3)
  - [ ] 4.1 Scan chữ ký Tổng Giám Đốc (Cao Mạnh Hiếu) → PNG transparent background
  - [ ] 4.2 Scan con dấu công ty → PNG transparent background
  - [ ] 4.3 Upload lên Supabase Storage bucket `assets/` hoặc bundle trong project

- [ ] Task 5: Helper Utilities (AC: 1, 5)
  - [ ] 5.1 `formatVND(amount)` — format số tiền VNĐ (đã có trong project? check trước)
  - [ ] 5.2 `numberToVietnameseWords(amount)` — chuyển số thành chữ ("Hai triệu sáu trăm nghìn đồng")
  - [ ] 5.3 Error handling wrapper — log to console + return null (không throw)

## Dev Notes

### Architecture Compliance

- **API Route** (Next.js): `src/app/api/contracts/generate/route.ts` — serverless function trên Vercel
- **Vercel timeout:** 60s cho Hobby, 300s cho Pro — ConvertAPI call cần < 30s
- **Storage:** Supabase Storage (đã có bucket `contracts/` từ Story 1.8)
- **No Edge Function change:** Giữ nguyên `generate-contract` Edge Function cũ làm fallback, API route mới là primary

### CRITICAL: Thay thế vs Bổ sung

Story 1.8 đã implement `generate-contract` Edge Function dùng `pdf-lib` tạo PDF cơ bản (không dùng template DOCX). Story này **THAY THẾ** logic đó bằng pipeline mới:

```
DOCX template → docx-templates (fill) → ConvertAPI (to PDF) → pdf-lib (sign) → Storage
```

**Không sửa Edge Function cũ** — tạo API route mới. Story 10.3 sẽ update `process-payment` để gọi API route mới thay vì Edge Function cũ.

### Template Placeholders Map

| Placeholder | Source Field | Format |
|-------------|-------------|--------|
| `{so_hop_dong}` | Auto-generate: `orders.code` | `DHNLN-{code}/2026` |
| `{ngay_ky}` | `orders.created_at` hoặc payment date | `DD tháng MM năm YYYY` |
| `{ho_ten}` | `orders.user_name` | As-is |
| `{ngay_sinh}` | `orders.dob` | `DD/MM/YYYY` |
| `{quoc_tich}` | `orders.nationality` | As-is (default "Việt Nam") |
| `{so_cccd}` | `orders.id_number` | As-is (12 digits) |
| `{ngay_cap}` | `orders.id_issue_date` | `DD/MM/YYYY` |
| `{noi_cap}` | `orders.id_issue_place` | As-is |
| `{dia_chi}` | `orders.address` | As-is |
| `{dien_thoai}` | `orders.phone` | As-is |
| `{so_luong_cay}` | `orders.quantity` | Number with comma separator |
| `{tong_gia_tri}` | `orders.total_amount` | `XXX.XXX.XXXđ` |
| `{tong_gia_tri_chu}` | Derived | Vietnamese words |

### ConvertAPI Integration

```typescript
// ConvertAPI — DOCX to PDF (REST API)
// Free tier: 250 conversions/month
// POST https://v2.convertapi.com/convert/docx/to/pdf
// Header: Authorization: Bearer {CONVERTAPI_SECRET}
// Body: multipart/form-data with file
```

**Alternative nếu ConvertAPI không phù hợp:** CloudConvert (25 free/day) hoặc tự host Gotenberg Docker container.

### Signature Overlay Logic

```typescript
// pdf-lib overlay approach
import { PDFDocument } from 'pdf-lib';

// Load generated PDF
const pdfDoc = await PDFDocument.load(pdfBytes);
const pages = pdfDoc.getPages();
const lastPage = pages[pages.length - 1];

// Embed signature + stamp images
const sigImage = await pdfDoc.embedPng(signatureBytes);
const stampImage = await pdfDoc.embedPng(stampBytes);

// Draw on last page — position: Bên B signature area (right side, bottom)
lastPage.drawImage(sigImage, { x: 380, y: 80, width: 120, height: 50 });
lastPage.drawImage(stampImage, { x: 370, y: 60, width: 80, height: 80 });
```

**CRITICAL:** Tọa độ x/y cần test với PDF thực tế — trang cuối có "BÊN A" bên trái và "BÊN B" bên phải.

### Environment Variables Mới

```
CONVERTAPI_SECRET=xxx    # từ https://www.convertapi.com/
```

### Existing Code to REUSE

- Supabase Storage upload: pattern từ `generate-contract` Edge Function
- `orders.contract_url` update: pattern từ Story 1.8/3.3
- Supabase client: `src/lib/supabase/server.ts` (createServiceRoleClient)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-10.2]
- [Source: docs/prd.md#FR-33]
- [Source: _bmad-output/implementation-artifacts/1-8-email-confirmation-contract.md — PDF generation approach]
- [Source: _bmad-output/implementation-artifacts/3-3-contract-printing.md — reuse patterns]
- [Source: supabase/functions/generate-contract/index.ts — current PDF generation (to be replaced)]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
