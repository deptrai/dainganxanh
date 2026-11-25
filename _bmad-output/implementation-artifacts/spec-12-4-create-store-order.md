---
title: 'Story 12.4: Create Store Order'
type: 'feature'
created: '2026-10-08'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: false
baseline_revision: 'dc8729fc33e09f34e534d4a999b91527d55081df'
context:
  - 'dainganxanh-landing/src/app/api/store/orders/create/route.ts'
  - 'dainganxanh-landing/src/components/crm/StoreOrderStatusBadge.tsx'
warnings: ['oversized']
deferred:
  - summary: >-
      6 file `store-e2e-checkout-*.png` (artifact E2E của Story 12.3) nằm untracked ở repo root; nên đưa vào `.gitignore` hoặc thư mục artifacts.
    evidence: |-
      Pre-existing, không phải do change này tạo; đã loại khỏi commit Story 12.4.
    location: >-
      repo root
    severity: low
  - summary: >-
      `create/route.ts` không có try/catch bao quanh đoạn reserve→insert→items; một exception thrown (không phải `{error}` trả về) sẽ rò stock đã reserve — với COD (`expires_at: null`) cron không bao giờ thu hồi.
    evidence: |-
      Pre-existing pattern; supabase-js thường resolve `{error}` thay vì throw nên chưa chứng minh được path throw reachable. Cần xác nhận postgrest-js có reject trên network failure hay không.
    location: >-
      dainganxanh-landing/src/app/api/store/orders/create/route.ts:84-160
    severity: medium (unverified)
  - summary: >-
      DB check constraint `store_orders.status` cho phép `'refunded'` nhưng `StoreOrderStatus`/`STORE_ORDER_STATUS_CONFIG` thiếu giá trị này → badge/success page hiển thị raw "refunded".
    evidence: |-
      Omission có từ StoreOrderStatusBadge gốc (pre-existing); hiện không có code nào set status 'refunded' cho store_orders.
    location: >-
      dainganxanh-landing/src/lib/store-order-status.ts
    severity: low
  - summary: >-
      Test file create route định nghĩa local `createOrderSchema` thay vì import schema export từ route.ts → schema test chạy trên bản copy, không verify contract thật.
    evidence: |-
      Local schema tồn tại từ trước diff này (pre-existing); `createOrderSchema` đã được export tại route.ts:11 — fix chỉ cần thêm vào import hiện có.
    location: >-
      dainganxanh-landing/src/app/api/store/orders/create/__tests__/route.test.ts:57-67
    severity: medium
  - summary: >-
      Chưa có test cho các nhánh pre-existing: user_id attach khi authenticated, `reserve_product_stock` fail → 409, client total_amount tamper reject, `itemError` rollback (release + delete order).
    evidence: |-
      Các nhánh không đổi trong diff này; coverage gap tồn tại từ Epic 13.
    location: >-
      dainganxanh-landing/src/app/api/store/orders/create/route.ts
    severity: low
  - summary: >-
      Success page đọc `searchParams.total` ưu tiên hơn `order.total_amount` → có thể hiển thị số tiền giả mạo qua `?total=` query.
    evidence: |-
      Dòng pre-existing từ Story 12.3; chỉ ảnh hưởng hiển thị (không động vào thanh toán); client redirect vẫn truyền `&total=` nên cần chỉnh cả 2 đầu nếu bỏ param.
    location: >-
      dainganxanh-landing/src/app/(marketing)/store/checkout/success/page.tsx:26
    severity: low
  - summary: >-
      `generateStoreOrderCode` dùng `Math.random().toString(36)` + `padEnd('0')` → entropy không đều, clustering trailing zero; nên chuyển sang crypto RNG.
    evidence: |-
      Pre-existing từ Epic 13; không gian 36^6 ~2.2 tỷ + retry 23505 đã giảm rủi ro va chạm thực tế.
    location: >-
      dainganxanh-landing/src/app/api/store/orders/create/route.ts:24-27
    severity: low
  - summary: >-
      Test CRON_COD_SAFE chỉ regex-match text của migration file, không thực thi SQL — invariant "COD pending không bị cron hủy" chưa có regression protection ở mức behavior.
    evidence: |-
      Đã xác nhận trong verification-gap layer; unit env không chạy được Postgres function — cần Supabase local/staging integration test.
    location: >-
      dainganxanh-landing/src/app/api/cron/expire-pending/__tests__/route.test.ts
    severity: medium
---

<intent-contract>

## Intent

**Problem:** Luồng tạo đơn store gần như đã hoàn chỉnh qua Story 12.3 + Epic 13 (Zod, rate-limit, server pricing, `reserve_product_stock`, RLS chặn anon insert, VietQR 15 phút, success page). Tuy nhiên `create/route.ts` đang tự động set COD → `confirmed` ngay khi tạo — **sai AC 12.4 và Epic Context** ("COD với trạng thái ban đầu là `pending`"; nghiệp vụ COD phải chờ telesale xác nhận trước khi `confirmed`). Ngoài ra `generateStoreOrderCode` không retry khi trùng mã (unique violation → 500 mất đơn), và success page render `order.status` thô (`capitalize` → "Pending" tiếng Anh).

**Approach:** Bỏ block auto-confirm COD (insert đã default `pending` + `expires_at: null` sẵn), bọc insert đơn trong retry loop tối đa 3 lần khi gặp `23505`, và map status sang nhãn tiếng Việt trên success page qua config dùng chung.

## Boundaries & Constraints

**Always:**
- COD order insert với `status: 'pending'`, `expires_at: null`; Banking giữ nguyên `pending` + `expires_at` +15 phút.
- Giữ định dạng mã đơn `ST` + 6 ký tự base-36 KHÔNG gạch (regex webhook Casso `\b((?:DH|BK|ST)[A-Z0-9]{6})\b`, status route `^ST[A-Z0-9]{6}$`, và dữ liệu đơn đã tồn tại đều dùng dạng này — đổi sang `ST-` sẽ phá webhook + tra cứu).
- Retry chỉ áp dụng cho unique violation (`23505`) trên insert `store_orders`; lỗi khác fail ngay. Vẫn `release_product_stock` khi thất bại cuối cùng.
- Mọi thao tác DB giữ nguyên `createServiceRoleClient()`; không mở policy INSERT anon.
- Success page map status qua `STORE_ORDER_STATUS_CONFIG` (label tiếng Việt), giữ fallback hiển thị raw khi status lạ.

**Never:**
- Không động webhook Casso (`processStoreOrder` — phạm vi Story 12.5), cron `expire-pending`, status route.
- Không thêm email xác nhận đơn — email store duy nhất là `store_dispatch` (Story 12.8).
- Không đổi `StoreCheckoutClient` step `cod-confirm` (copy "Chúng tôi sẽ liên hệ để xác nhận" đã đúng ngữ nghĩa pending).
- Không import `STORE_ORDER_STATUS_CONFIG` trực tiếp từ file `'use client'` vào server component (value crossing client boundary không usable) — phải tách sang module lib thuần.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | Guest submit form Banking hợp lệ | Đơn `pending` + `expires_at` +15m → step payment VietQR → poll status → success page | — |
| HAPPY_PATH | Guest submit form COD hợp lệ | Đơn insert `pending`, `expires_at: null`, KHÔNG có update call nào sau → step cod-confirm → success page hiển thị "Chờ xác nhận" | — |
| COLLISION_RETRY | Insert trả `code === '23505'` (trùng mã đơn) | Sinh mã mới, retry insert (tối đa 3 lần), thành công → 200 | — |
| COLLISION_EXHAUST | 23505 liên tiếp hết 3 lần | `release_product_stock` hoàn kho → 500 'Không thể tạo đơn hàng' | captureError |
| CRON_COD_SAFE | Đơn COD `pending` quá 15 phút | Cron `expire_pending_store_orders` KHÔNG hủy (filter `payment_method='banking' AND expires_at IS NOT NULL`) | — |
| STATUS_COD | `GET /api/store/orders/status?code=` đơn COD pending | 200 `status: 'pending'` (không derive expired vì `expires_at` null) | — |
| SUCCESS_LABEL | Success page đơn COD pending / đơn lạ status | Hiển thị "Chờ xác nhận" / fallback raw status | — |

</intent-contract>

## Code Map

- `dainganxanh-landing/src/app/api/store/orders/create/route.ts:154-156` — XÓA block `if (data.payment_method === 'cod') { ...update status 'confirmed' }`; insert mặc định đã `pending`.
- `dainganxanh-landing/src/app/api/store/orders/create/route.ts:24-27,106-140` — `generateStoreOrderCode` + block insert `store_orders`: bọc retry loop ≤3 lần khi `orderError.code === '23505'`; giữ nguyên nhánh release stock + 500 khi hết lượt.
- `dainganxanh-landing/src/components/crm/StoreOrderStatusBadge.tsx:11-24` — export sẵn `STORE_ORDER_STATUS_CONFIG` (map status → label/className tiếng Việt) + type `StoreOrderStatus`; file `'use client'` nên cần tách config sang module lib.
- `dainganxanh-landing/src/app/(marketing)/store/checkout/success/page.tsx:52-55` — chỗ render `<span ... capitalize>{order.status}</span>`: đổi sang label tiếng Việt qua config.
- `dainganxanh-landing/src/components/store/StoreCheckoutClient.tsx:168-172,272-293` — response handling: cod → step `cod-confirm` (không đổi); banking → `payment` + polling.
- `supabase/migrations/20260906000001_atomic_expire_pending_inventory.sql:43-46` — cron chỉ hủy `payment_method='banking' AND expires_at < now()`: COD pending an toàn. READ-ONLY.
- `supabase/migrations/20260530000001_eco_tourism_schema.sql:163-183,401-429` — `code UNIQUE`, default `pending`, RLS chặn anon insert. READ-ONLY.
- `dainganxanh-landing/src/app/api/cron/expire-pending/__tests__/route.test.ts` — GOLDEN PATTERN mock `createServiceRoleClient` + RPC cho route handler test.
- `dainganxanh-landing/src/app/api/store/orders/create/__tests__/route.test.ts` — test hiện có chỉ cover schema/helper thuần; cần thêm handler-level tests.

## Tasks & Acceptance

**Execution:**
- `dainganxanh-landing/src/lib/store-order-status.ts` -- TẠO MỚI: move `StoreOrderStatus` type + `STORE_ORDER_STATUS_CONFIG` ra module thuần (không 'use client') -- server component dùng được.
- `dainganxanh-landing/src/components/crm/StoreOrderStatusBadge.tsx` -- import lại config/type từ `@/lib/store-order-status`, re-export để không vỡ callers hiện có -- điểm dùng chung duy nhất.
- `dainganxanh-landing/src/app/api/store/orders/create/route.ts` -- xóa block COD auto-`confirmed`; bọc insert `store_orders` trong retry ≤3 lần trên `23505` (regen code mỗi lần) -- đúng AC + chống mất đơn vì trùng mã.
- `dainganxanh-landing/src/app/(marketing)/store/checkout/success/page.tsx` -- render `STORE_ORDER_STATUS_CONFIG[order.status]?.label ?? order.status` thay raw capitalize -- AC "confirmation with status pending" hiển thị tiếng Việt.
- `dainganxanh-landing/src/app/api/store/orders/create/__tests__/route.test.ts` -- thêm describe POST handler (mock service client theo pattern cron test): COD insert `pending`+`expires_at:null` không gọi update; 23505→retry→200; 23505×3→500+release; banking vẫn `expires_at` +15m -- coverage I/O matrix.
- `dainganxanh-landing/src/app/(marketing)/store/checkout/success/__tests__/page.test.tsx` -- test page render "Chờ xác nhận" cho đơn COD pending, fallback raw cho status lạ -- coverage label.

**Acceptance Criteria:**
- Given checkout form COD hợp lệ, when submit, then `store_orders` có đơn `status='pending'`, `expires_at IS NULL`, stock đã reserve, và client hiển thị xác nhận + success page nhãn "Chờ xác nhận".
- Given checkout form Banking hợp lệ, when submit, then đơn `pending` với `expires_at` +15 phút và VietQR + countdown hiển thị (không đổi so với hiện tại).
- Given đơn COD `pending` tồn tại quá 15 phút, when cron expire-pending chạy, then đơn COD KHÔNG bị hủy.
- Given insert đơn gặp unique violation lần đầu, when route retry, then đơn được tạo với mã mới và trả 200; when 3 lần liên tiếp đều 23505, then trả 500 và `release_product_stock` được gọi.
- Given `npm test`, when chạy, then mọi test mới + suite hiện có xanh; `tsc --noEmit` sạch.

## Spec Change Log

## Review Triage Log

### 2026-10-08 — Review pass
- verdicts: 15 findings — high 0, medium 4, low 9, false 1, maybe-false 1
- findings:
  - `[low]` `[defer]` 6 PNG artifact `store-e2e-checkout-*.png` lọt vào diff ở repo root — pre-existing untracked artifacts của Story 12.3 E2E; đã loại khỏi commit, ghi deferred.
  - `[maybe-false]` `[defer]` Thiếu try/catch quanh reserve→insert → exception thrown rò reserved stock vĩnh viễn với COD — không chứng minh được supabase-js reject trên path này; nếu đúng thì medium. Pre-existing.
  - `[low]` `[defer]` `StoreOrderStatus` thiếu `'refunded'` trong DB enum — pre-existing omission; chưa có code set 'refunded' nên chỉ ảnh hưởng fallback label.
  - `[medium]` `[defer]` Test định nghĩa local `createOrderSchema` thay vì import từ route.ts — schema tests verify bản copy, drift không bị bắt. Pre-existing; fix = thêm vào import sẵn có.
  - `[low]` `[defer]` Thiếu coverage nhánh user_id/reserve-fail/tamper/itemError — các nhánh pre-existing không nằm trong diff.
  - `[low]` `[patch]` Cron guard test `indexOf('expire_pending_store_orders')` match nhầm dòng `DROP FUNCTION` — đã sửa slice từ `CREATE OR REPLACE FUNCTION public.expire_pending_store_orders`.
  - `[low]` `[defer]` `searchParams.total` override `order.total_amount` → hiển thị số tiền giả — pre-existing từ 12.3, chỉ ảnh hưởng display.
  - `[medium]` `[patch]` Header "Thanh toán thành công!" hiển thị cho đơn banking pending/cancelled — reachable qua nút "Xem đơn hàng" khi pending; đã sửa heading theo status (cod→Đặt hàng, confirmed→Thanh toán, cancelled→Đã hủy, còn lại→Chờ thanh toán) + 2 test mới.
  - `[low]` `[patch]` page.test.tsx thiếu assert formatted amount — đã thêm `500.000đ` assertion vào test COD.
  - `[low]` `[reject]` Spec frontmatter context thiếu file mới / logs trống — fix nằm ở spec file của chính build này; reject theo quy tắc.
  - `[low]` `[defer]` `generateStoreOrderCode` dùng Math.random + padEnd zero → entropy bias — pre-existing; retry 23505 đã xử lý va chạm.
  - `[low]` `[patch]` `captureError(orderError)` truyền PostgREST object → `String(err)` = "[object Object]" mất message — đã wrap `new Error(orderError?.message)` tại call site mới trong retry loop.
  - `[medium]` `[patch]` (verification-gap) Retry test không assert `firstCode !== secondCode` → regression hoisted codegen không bị bắt — đã thêm `expect(firstCode).not.toBe(secondCode)`.
  - `[medium]` `[defer]` (verification-gap) Cron COD-safe chỉ verify static SQL text — cần môi trường Supabase integration để test behavior thật; deferred.
  - `[false]` `[reject]` (intent-alignment) Divergence `ST-` hyphen so với văn bản epics — quyết định có chủ đích: webhook Casso regex `\b((?:DH|BK|ST)[A-Z0-9]{6})\b`, status route `^ST[A-Z0-9]{6}$`, dữ liệu đơn tồn tại; đổi format sẽ phá 3 surface. Intent-alignment xác nhận diff implement đúng Reading 2 (brownfield delta remediation).

## Auto Run Result

- **Tóm tắt:** Story 12.4 là brownfield remediation — phần lớn luồng tạo đơn đã có từ Story 12.3 + Epic 13. Change sửa 3 lệch nghiệp vụ: (1) COD không còn auto-`confirmed`, insert `pending` + `expires_at: null` đúng nghiệp vụ chờ telesale; (2) insert `store_orders` retry tối đa 3 lần khi `23505` (regen mã mỗi lần, release stock khi hết lượt); (3) success page hiển thị label tiếng Việt qua `STORE_ORDER_STATUS_CONFIG` tách sang lib thuần + heading theo status.
- **Files changed:**
  - `dainganxanh-landing/src/lib/store-order-status.ts` — MỚI: `StoreOrderStatus` + `STORE_ORDER_STATUS_CONFIG` (module thuần, server component dùng được).
  - `dainganxanh-landing/src/components/crm/StoreOrderStatusBadge.tsx` — import + re-export từ lib mới.
  - `dainganxanh-landing/src/app/api/store/orders/create/route.ts` — xóa COD auto-confirm, retry 23505 ≤3, captureError dùng Error instance.
  - `dainganxanh-landing/src/app/(marketing)/store/checkout/success/page.tsx` — statusLabel VN + heading theo status.
  - `dainganxanh-landing/src/app/api/store/orders/create/__tests__/route.test.ts` — thêm handler tests (COD pending, banking expires, retry, exhaustion, non-23505, not.toBe code assert).
  - `dainganxanh-landing/src/app/(marketing)/store/checkout/success/__tests__/page.test.tsx` — MỚI: label VN, fallback raw, heading pending/cancelled/confirmed, formatted amount.
  - `dainganxanh-landing/src/app/api/cron/expire-pending/__tests__/route.test.ts` — thêm CRON_COD_SAFE guard test (WHERE clause migration).
- **Review findings:** 15 findings — 5 patched (2 medium: heading theo status, retry not.toBe assert; 3 low), 8 deferred, 2 rejected.
- **Follow-up review:** `false` — 2 medium patched nhưng không còn risk chưa verify nào đáng kể (mọi patch có test xanh + tsc sạch).
- **Verification:** `npm test` 105 suites / 1027 tests PASS; `tsc --noEmit` 0 lỗi; matrix audit đầy đủ sau khi bổ sung guard test CRON_COD_SAFE.
- **Residual risks:** Cron COD-safe chỉ được guard ở mức static text (cần integration env); các nhánh pre-existing (user_id attach, reserve-fail 409, itemError rollback, searchParams.total) chưa có test — xem `deferred`.

## Design Notes

- **Vì sao phần lớn AC đã done trước story này:** Epic 13 (secure order API, atomic inventory, server price) được build trước làm hạ tầng dùng chung, nên `create` route đã đạt AC server-calc/ST-code/VietQR từ Story 12.3. Story 12.4 còn lại là vá lệch nghiệp vụ COD + hardening nhỏ — đây là brownfield gap-remediation, không phải greenfield.
- **COD `pending` không bị cron hủy nhầm:** `expire_pending_store_orders()` lọc kép `payment_method='banking' AND expires_at IS NOT NULL`; COD có `expires_at=null` nên miễn nhiễm. Stock vẫn `reserved_quantity` tới khi admin xác nhận/hủy (Story 12.8).
- **23505 retry:** không gian 36^6 ≈ 2.2 tỷ; rủi ro thấp nhưng mất đơn +1 lần reload tồn kho là đủ lý do cho loop 3 lần. Chỉ retry trên `error.code === '23505'`, không retry lỗi khác.
- **`'use client'` boundary:** server component import value (không phải component) từ module `'use client'` nhận về client reference, không dùng được như data — vì vậy config phải nằm ở lib thuần, badge chỉ re-export.

## Verification

**Commands:**
- `cd dainganxanh-landing && npm test -- src/app/api/store/orders/create/__tests__/route.test.ts` -- expected: COD pending, retry 23505, banking expires đều pass
- `cd dainganxanh-landing && npm test -- src/app/\(marketing\)/store/checkout/success/__tests__/page.test.tsx` -- expected: label tiếng Việt pass
- `cd dainganxanh-landing && npm test` -- expected: toàn bộ suite xanh, không regression
- `cd dainganxanh-landing && npm run lint` -- expected: `tsc --noEmit` 0 lỗi
