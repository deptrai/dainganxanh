---
title: 'Story 12.3: Store Checkout Form'
type: 'feature'
created: '2026-10-08'
status: 'done'
review_loop_iteration: 1
followup_review_recommended: false
baseline_revision: '06434808db0ed416c9889c92ef59817ed6982b11'
context:
  - 'dainganxanh-landing/src/lib/pricing/store.ts'
  - 'dainganxanh-landing/src/lib/rate-limit.ts'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Checkout store đã có skeleton nhưng dropdown tỉnh/thành chỉ hardcode 6 lựa chọn, không pre-fill thông tin khi người dùng đã đăng nhập, API `GET /api/store/orders/status` ép đăng nhập khiến luồng Banking của khách vãng lai bị lỗi 401 ngay tại bước thanh toán, và `StoreCheckoutClient` chưa hề có unit test.

**Approach:** Tạo helper hằng số 63 tỉnh/thành Việt Nam, truyền `prefill` (tên + email) từ `getEffectiveUser()` xuống client, mở endpoint status cho tra cứu công khai theo mã đơn `ST-` (rate-limited, PII-safe) theo đúng mẫu `/api/bookings/status`, rồi phủ unit test cho toàn bộ ma trận input của form.

## Boundaries & Constraints

**Always:**
- Giữ pattern form hiện có: pure `useState` + validation cục bộ, không thêm `react-hook-form`/`zod` ở client.
- Giá trị pre-fill chỉ lấy từ `getEffectiveUser()` (name + email); phone để trống vì không có nguồn đáng tin.
- Endpoint status phải: rate-limit (60 req/phút), validate định dạng mã `^ST[A-Z0-9]{6}$`, chỉ trả các cột không nhạy cảm, suy ra trạng thái `expired` khi `status='pending'` quá `expires_at` — giống hệt `/api/bookings/status`.
- `StoreCheckoutClient` vẫn hoạt động bình thường cho khách vãng lai (prefill optional).

**Never:**
- Không thay đổi `POST /api/store/orders/create` (Zod schema, giá server, reserve_product_stock đã đúng).
- Không động webhook Casso, cron, hay luồng xác nhận thanh toán (thuộc Story 12.5).
- Không query bảng `user_profiles` cho pre-fill — không có consumer hiện có; chỉ `getEffectiveUser()`.
- Không dùng thư viện dropdown/search provinces bên thứ ba.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | Guest điền đủ form hợp lệ, chọn Banking | Submit → POST create → step `payment` (VietQR + countdown) | — |
| HAPPY_PATH | Guest điền đủ form, chọn COD | Submit → POST create → step `cod-confirm` → `confirmed` | — |
| PREFILL | User đã login, `getEffectiveUser()` trả `{name,email}` | Input name/email điền sẵn, có thể chỉnh sửa; phone rỗng | — |
| PREFILL | `getEffectiveUser()` trả null (guest) | Form rỗng hoàn toàn, không crash | — |
| PROVINCES | Mở dropdown Tỉnh/Thành | Hiển thị đủ 63 tỉnh/thành theo Bắc→Nam | — |
| ERROR_CASE | SĐT không khớp `^0\d{9}$` | Hiển thị lỗi inline, không gọi API | Ngăn submit, focus/aria đúng |
| ERROR_CASE | Thiếu name/address/province | Hiển thị lỗi inline từng trường | Ngăn submit |
| ERROR_CASE | API trả 409 (hết kho) / 429 / 500 | Hiển thị thông báo lỗi, ở lại step `form` | Bắt lỗi fetch, không crash |
| STATUS_GUEST | `GET /api/store/orders/status?code=ST-ABC123` từ guest | 200 trả `{code,status,total_amount,payment_method,expires_at,tracking_number}` | — |
| STATUS_GUEST | Mã sai định dạng (`bk-123`, `xxx`) | 400 lỗi mã không hợp lệ | 400 |
| STATUS_GUEST | Mã đúng định dạng nhưng không tồn tại | 404 | 404 |
| STATUS_EXPIRED | Đơn `pending` quá `expires_at` | `status` trả về `'expired'` | — |
| STATUS_RATE | >60 request/phút/IP | 429 + `Retry-After` | 429 |

</intent-contract>

## Code Map

- `dainganxanh-landing/src/app/(marketing)/store/checkout/page.tsx:9-49` — SSR page, đọc `slug`/`quantity`, query product, stock guard; thêm `getEffectiveUser()` và truyền `prefill={{name,email}}` xuống client.
- `dainganxanh-landing/src/components/store/StoreCheckoutClient.tsx:36-490` — form + order summary + VietQR step; đổi select tỉnh/thành (L381-388) dùng helper mới; nhận prop `prefill` optional làm initial state.
- `dainganxanh-landing/src/lib/constants/provinces.ts` — TẠO MỚI: export `VN_PROVINCES: readonly string[]` 63 tỉnh/thành sắp theo Bắc→Nam.
- `dainganxanh-landing/src/app/api/store/orders/status/route.ts:1-30` — hiện ép 401; viết lại theo mẫu bookings: bỏ `getEffectiveUser`, thêm `rateLimit`, validate `^ST[A-Z0-9]{6}$`, select tối thiểu, suy `expired`.
- `dainganxanh-landing/src/app/api/bookings/status/route.ts:1-45` — GOLDEN REFERENCE cho pattern status endpoint công khai.
- `dainganxanh-landing/src/lib/getEffectiveUser.ts:5-12` — `EffectiveUser{userId,email,name}`; nguồn pre-fill duy nhất.
- `dainganxanh-landing/src/app/api/store/orders/create/route.ts:12-36` — schema/contract response (`code`, `expires_at`) mà client/status phải khớp; READ-ONLY.
- `dainganxanh-landing/src/lib/pricing/store.ts` — `FREE_SHIPPING_THRESHOLD=500000`, `STANDARD_SHIPPING_FEE=30000`; đảm bảo order summary khớp. READ-ONLY.
- `dainganxanh-landing/src/app/api/bookings/status/route.test.ts` hoặc `src/app/api/store/orders/create/__tests__/route.test.ts` — mẫu test route handler hiện có.

## Tasks & Acceptance

**Execution:**
- `dainganxanh-landing/src/lib/constants/provinces.ts` -- tạo file export `VN_PROVINCES` (63 tỉnh/thành, Bắc→Nam) -- nguồn dữ liệu dùng chung.
- `dainganxanh-landing/src/components/store/StoreCheckoutClient.tsx` -- nhận prop `prefill?: { name?: string; email?: string }` làm initial state; select tỉnh/thành render từ `VN_PROVINCES`; đảm bảo phone regex `^0\d{9}$` chặn submit với lỗi inline -- hoàn thiện AC form.
- `dainganxanh-landing/src/app/(marketing)/store/checkout/page.tsx` -- gọi `getEffectiveUser().catch(() => null)`, truyền `prefill` khi có user -- nối nguồn pre-fill.
- `dainganxanh-landing/src/app/api/store/orders/status/route.ts` -- viết lại theo mẫu `/api/bookings/status` (rate-limit, validate `ST` code, select tối thiểu, suy `expired`) -- cho phép guest polling tại bước Banking.
- `dainganxanh-landing/src/components/store/__tests__/StoreCheckoutClient.test.tsx` -- unit test I/O matrix: render, prefill, provinces count, phone validation chặn submit, Banking→payment step, COD→confirm, lỗi API 409/500, giá summary khớp ngưỡng freeship -- coverage bắt buộc.
- `dainganxanh-landing/src/app/api/store/orders/status/__tests__/route.test.ts` -- test guest 200, 400 mã sai, 404 không tìm thấy, expired derivation, rate-limit 429 -- coverage endpoint mới.

**Acceptance Criteria:**
- Given người dùng đã đăng nhập, when mở `/store/checkout?slug=X&quantity=N`, then tên và email được điền sẵn còn SĐT trống.
- Given khách vãng lai, when mở dropdown Tỉnh/Thành, then thấy đủ 63 lựa chọn; khi nhập SĐT sai định dạng và bấm Đặt hàng, then lỗi inline hiển thị và không có request nào được gửi.
- Given đơn Banking vừa tạo, when client (kể cả guest) poll `GET /api/store/orders/status?code=<ST-XXXXXX>`, then nhận 200 kèm status; khi `expires_at` đã qua mà `status='pending'`, then nhận `status='expired'`.
- Given `StoreCheckoutClient`, when chạy `npm test`, then toàn bộ I/O matrix có test pass; `tsc --noEmit` sạch.

## Spec Change Log

## Review Triage Log

## Design Notes

- **Vì sao fix endpoint status trong story này:** bước `payment` của `StoreCheckoutClient` (VietQR + polling) vốn nằm trong form checkout 12.3 — endpoint 401 khiến luồng Banking của guest chết ngay tại story này, không thể đợi 12.5. Story 12.5 chỉ còn việc hook Casso webhook → cập nhật status server-side.
- **Pattern status endpoint:** copy nguyên cấu trúc `/api/bookings/status`: rate-limit trước, normalize `code.trim().toUpperCase()`, regex strict, `maybeSingle()`, select chỉ cột không PII (không trả `customer_phone`/`shipping_address`), suy `expired` phía server. Mã `ST` + 6 ký tự ngẫu nhiên (~2.2 tỷ tổ hợp) + rate-limit chống enumeration đủ cho tra cứu công khai.
- **Pre-fill:** server page render `prefill` object; client dùng làm `useState` initial — KHÔNG dùng `useEffect` fetch sau mount (flash rỗng + double render). Guest → prop `undefined` → form rỗng.
- **Provinces:** mảng `readonly` plain string, không map code/id — cột `shipping_province` là TEXT free-form, select chỉ cần giá trị hiển thị.

## Verification

**Commands:**
- `cd dainganxanh-landing && npm test -- src/components/store/__tests__/StoreCheckoutClient.test.tsx` -- expected: toàn bộ tests pass
- `cd dainganxanh-landing && npm test -- src/app/api/store/orders/status/__tests__/route.test.ts` -- expected: guest/rate-limit/validation tests pass
- `cd dainganxanh-landing && npm test` -- expected: không test nào hỏng, suite hiện có vẫn xanh
- `cd dainganxanh-landing && npm run lint` -- expected: `tsc --noEmit` 0 lỗi

## Review Triage Log

Review loop 1 — 4 layers song song (blind-hunter N=8, edge-case-hunter, verification-gap, intent-alignment). Tổng 21 findings.

### Patched (17)
- **M** Trim toàn bộ field trước khi submit (phone/name/email/address/note) — client pass, server Zod 400.
- **M** `customer_email` thêm vào fieldErrors + regex validate + aria-invalid/describedby + inline error.
- **M** `pollStatus` xử lý `status==='expired'` → UI "Đơn hàng đã hết hạn" + link đặt lại, dừng poll ngay.
- **M** Countdown `(còn X phút Y giây)` derive từ `order.expiresAt` thay elapsed count-up (đúng spec).
- **M** Import `FREE_SHIPPING_THRESHOLD`/`STANDARD_SHIPPING_FEE` từ `@/lib/pricing/store` — bỏ duplicate constants.
- **M** Status route: DB error → 500 + `console.error` (trước đây trả 404 giả); test cập nhật 404→500.
- **L** Redirect `setTimeout` → `redirectRef`, cleanup chỉ khi unmount (bug thật: cleanup theo step hủy redirect).
- **L** Payment effect guard thêm `!expired` — chặn interval re-register sau khi poll dừng.
- **L** `VN_PROVINCES` bỏ annotation `readonly string[]` (giữ literal inference) + export `VnProvince`.
- **L** `generateStoreOrderCode` `padEnd(6,'0')` — base-36 có thể <6 ký tự, status route sẽ từ chối vĩnh viễn.
- **L** `setError('')` khi validation fail — xóa error banner cũ.
- **L** Guard `!data.orderCode` ngoài `res.ok` — tránh step payment với QR hỏng.
- **L** Focus field lỗi đầu tiên qua `fieldRefs` (a11y).
- **Test** mới: POLLING describe (confirmed→redirect, expired→stop, countdown), email invalid + focus, trim submit; `checkout/page.test.tsx` SSR prefill (authed/guest/reject); status route DB-error→500.
- **Chỉnh test** `route.test.ts` tách 404 not-found / 500 db-error.

### Rejected (4)
- Email local-part fallback trong `getEffectiveUser` — convention toàn app cho display name, không phải bug; đổi sẽ ảnh hưởng order flows khác.
- `prefill` name bằng local-part email — field cho user sửa, không khóa.
- Response casing snake_case (status) vs camelCase (create) — chỉ 1 consumer nội bộ; defer, thống nhất khi API surface lớn hơn.
- Missing E2E checkout — đã có trong danh sách Playwright E2E; unit tests đủ cho story scope.

### Intent-alignment
Diff implement "Reading 2" (brownfield gap-remediation): 63 tỉnh, prefill SSR, guest status polling, unit matrix — đúng intent-contract. SSR page surface nay có `page.test.tsx` cover prefill prop. Polling integration surface nay có POLLING tests với fake timers.

## Auto Run Result

- Triển khai: `src/lib/constants/provinces.ts`, `checkout/page.tsx`, `StoreCheckoutClient.tsx`, `api/store/orders/status/route.ts`, `api/store/orders/create/route.ts`.
- Tests: 1014 pass / 104 suites; `tsc --noEmit` 0 lỗi.
- Review: 21 findings → 17 patch + 4 reject; 2 bug thật trong patch review được test mới bắt và fix (redirect cleanup hủy redirect; interval re-register sau expired).
- Commit: `aa253d28`. followup_review_recommended=false.
