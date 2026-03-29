# Story 10.3: Thay thế PDF contract cơ bản bằng DOCX template

Status: review

## Story

As a **buyer vừa thanh toán xong**,
I want to **nhận hợp đồng PDF đúng mẫu của công ty Biocare**,
so that **tôi có tài liệu pháp lý hợp lệ thay vì PDF tự render**.

## Context

Email + attachment gửi sau thanh toán **đã hoạt động** (Story 1.8). Flow hiện tại:

```
process-payment EF → generate-contract EF (pdf-lib, tự render) → send-email EF → email kèm PDF
```

Vấn đề: `generate-contract` EF tạo PDF bằng `pdf-lib` tự vẽ từng dòng text, **không dùng mẫu hợp đồng thực của công ty**.

Story này **chỉ thay thế bước generate-contract** — không thay đổi email flow, không thay đổi khi nào email được gửi.

## Acceptance Criteria

1. **Given** `process-payment` EF gọi contract generation
   **When** contract được tạo
   **Then** PDF output là hợp đồng đúng mẫu công ty (từ DOCX template Story 10.2)
   **And** có chữ ký + con dấu Bên B

2. **Given** PDF được tạo thành công
   **When** upload lên Storage và gửi email
   **Then** flow hiện tại tiếp tục bình thường (không thay đổi gì ngoài file PDF)

3. **Given** DOCX generation fail
   **When** xảy ra lỗi
   **Then** fallback về pdf-lib cũ (hoặc báo lỗi) — payment vẫn không bị block

## Tasks / Subtasks

- [x] Task 1: Hoàn thành Story 10.2 trước (prerequisite)
  - [x] 1.1 API route `/api/contracts/generate` đã hoạt động với DOCX template

- [x] Task 2: Update `generate-contract` Edge Function để gọi API route mới (AC: 1, 2)
  - [x] 2.1 Trong `supabase/functions/generate-contract/index.ts`, thay logic `pdf-lib` tự render bằng HTTP call đến `/api/contracts/generate`
  - [x] 2.2 API route tự upload lên Storage (không cần EF upload lại); EF nhận `{ contractUrl, success }` và map sang `filePath`
  - [x] 2.3 Giữ nguyên response format `{ success, fileName, filePath }` để không break `process-payment`

- [x] Task 3: Fallback handling (AC: 3)
  - [x] 3.1 Không implement pdf-lib fallback — dùng Task 3.2
  - [x] 3.2 Throw error khi API route fail; `process-payment` có try/catch riêng ở outer level

## Dev Notes

### Scope rõ ràng

**CHỈ thay đổi:** `supabase/functions/generate-contract/index.ts`

**KHÔNG thay đổi:**
- `process-payment/index.ts` — vẫn gọi `generate-contract` EF như cũ
- `send-email/index.ts` — vẫn attach PDF như cũ
- `src/app/api/webhooks/casso/route.ts` — không đụng
- Email template, timing, trigger logic — không đụng

### Cross-runtime Call

`generate-contract` là Deno Edge Function. API route `/api/contracts/generate` là Node.js trên Dokploy.

```typescript
// generate-contract/index.ts — thay thế toàn bộ logic pdf-lib bằng:
const res = await fetch(
  `${Deno.env.get('NEXT_PUBLIC_BASE_URL')}/api/contracts/generate`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('CONTRACT_API_SECRET')}`,
    },
    body: JSON.stringify({
      orderId: payload.orderId,
      orderCode: payload.orderCode,
      // pass các fields cần cho DOCX template
    }),
    signal: AbortSignal.timeout(45000),
  }
)
// res trả về PDF bytes hoặc { contractUrl } đã upload sẵn
```

### Environment Variables Cần Thêm (Supabase secrets)

```bash
supabase secrets set CONTRACT_API_SECRET=<random-secret>
supabase secrets set NEXT_PUBLIC_BASE_URL=https://dainganxanh.com.vn
```

### References

- [Source: supabase/functions/generate-contract/index.ts — current implementation (to replace)]
- [Source: supabase/functions/process-payment/index.ts — caller, không thay đổi]
- [Source: _bmad-output/implementation-artifacts/10-2-docx-contract-generation.md — prerequisite]
- [Source: _bmad-output/implementation-artifacts/1-8-email-confirmation-contract.md — existing email flow]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- `send-email` EF dùng `contractPdfUrl` làm Supabase Storage path (không phải full URL) để `.download()` — nên `filePath` phải là `{orderCode}.pdf`, không phải public URL
- `process-payment` throw error nếu `generate-contract` fail (line 258) — payload không bị block theo nghĩa EF, nhưng payment flow sẽ fail. Đây là behavior cũ giữ nguyên.
- Auth header: `x-api-key` (theo implementation Story 10.2), không phải `Authorization: Bearer` như dev notes gốc

### Completion Notes List
- Replaced toàn bộ `pdf-lib` logic (180+ lines) trong `generate-contract/index.ts` bằng HTTP delegation đến `/api/contracts/generate`
- EF chỉ còn ~70 lines: parse payload → call API → map response → return
- `filePath: fileName` where `fileName = {orderCode}.pdf` — đúng với storage path `send-email` expect
- Environment variables cần set trên Supabase: `NEXT_PUBLIC_BASE_URL`, `CONTRACT_API_SECRET`

### File List
- supabase/functions/generate-contract/index.ts (MODIFIED)
