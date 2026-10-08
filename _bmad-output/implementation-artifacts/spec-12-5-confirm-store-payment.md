---
title: 'Story 12.5 — Confirm Store Payment'
type: 'feature'
created: '2026-10-08'
status: 'done'
baseline_revision: 'd92d5ca5bf473d637585e5e09555b05171103793'
review_loop_iteration: 1
followup_review_recommended: false
context: []
warnings: ['oversized']
deferred: |
  - [low] Reorder trên success page chỉ link tới sản phẩm đầu tiên của đơn nhiều item (ponytail comment trong page.tsx; multi-item cart re-pick thủ công).
  - [low] Đơn pending quá expires_at nhưng cron chưa flip vẫn giữ reserved_quantity → reorder ngay có thể fail reserve trong cửa sổ chờ cron (~1 chu kỳ).
  - [low] Detect hết hạn qua substring 'timeout' trong cancellation_reason — fragile nếu message cron đổi; nâng cấp = reason code riêng (schema change).
  - [low] Chưa revalidate `/crm/my-store-orders` sau confirm (trang customer dashboard, likely dynamic).
  - [medium] Execute permission của confirm_product_stock trên PostgREST production chưa verify — cần Supabase env thật.
  - [low] `(order as any)` cast cho relational join store_order_items(products) trên success page.
  - [low] Race edge: cron flip status giữa fetch-current và conditional update → silent ok:true (không alert) — cửa sổ cực nhỏ.
---

<intent-contract>

## Intent

**Problem:** Webhook Casso xác nhận đơn `ST…` đang gọi `release_product_stock` rồi `reserve_product_stock` (net-zero) nên `reserved_quantity` kẹt vĩnh viễn và không trừ kho thật; ngoài ra đơn hết hạn 15 phút hiển thị "Đơn hàng đã bị hủy" thay vì "Đơn hàng đã hết hạn" và không có nút đặt lại.

**Approach:** Thêm RPC `confirm_product_stock` (chỉ trừ `reserved_quantity`) và dùng nó trong `processStoreOrder`; phân biệt đơn hết hạn qua `cancellation_reason`/`expires_at` trên success page + polling client nhận `cancelled`; thêm nút "Đặt hàng lại".

## Boundaries & Constraints

**Always:**
- Trừ kho phải atomic qua RPC Postgres (row-level UPDATE), không update tách bảng từ app.
- `processStoreOrder` giữ nguyên idempotency 2 lớp (`casso_transactions` + `status !== 'pending'`) và check amount ±1.000đ.
- Migration mới đặt ở repo ROOT `supabase/migrations/` (KHÔNG phải `dainganxanh-landing/supabase/`).
- Success page (server component) chỉ import từ module thuần; label trạng thái qua `STORE_ORDER_STATUS_CONFIG` hiện có.
- Test mock service-role client theo golden pattern `src/app/api/cron/expire-pending/__tests__/route.test.ts`.

**Never:**
- Không thêm cột `paid_at` hay schema change nào khác ngoài RPC mới (AC chỉ yêu cầu `confirmed`; `payment_ref` đã ghi tx id).
- Không hỗ trợ resume QR `/store/checkout?code=ST…` (Option B) — surface "revisit link" là success page; giữ Option A.
- Không gọi `release_product_stock` khi confirm (release = hoàn kho, ngược nghiệp vụ đã bán).
- Không đổi format mã đơn, regex webhook `\b((?:DH|BK|ST)[A-Z0-9]{6})\b`, hay dispatcher 13.1.
- Không sửa COD flow, cron `expire_pending_store_orders`, hay `reserve/release_product_stock` đang dùng đúng chỗ khác.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| CONFIRM_OK | Webhook tx khớp đơn banking `pending` | `status='confirmed'`, `payment_ref=tx id`, `expires_at=null`; `reserved_quantity -= qty` (stock_quantity KHÔNG đổi) | — |
| CONFIRM_IDEMPOTENT | Webhook gọi lại đơn đã `confirmed` | Early return `ok`, không trừ kho lần 2 | skip im lặng |
| CONFIRM_MISMATCH | Amount lệch > ±1.000đ | `notifyPaymentMismatch`, return `ok:false`, không đụng stock/status | Telegram alert (sẵn có) |
| CONFIRM_STOCK_FAIL | RPC confirm lỗi | Log `captureError`/console.error; order vẫn `confirmed` (tiền đã về, không chặn xác nhận) | log + tiếp tục |
| CRON_EXPIRED | Cron hủy: `cancelled` + `cancellation_reason='Payment timeout (15 mins)'` | Success page → "Đơn hàng đã hết hạn" + nút Đặt hàng lại | — |
| PENDING_OVERDUE | `status='pending'` nhưng `expires_at < now()` (cron chưa chạy) | Success page cũng coi là hết hạn | — |
| CANCELLED_OTHER | `cancelled` không phải timeout | Giữ "Đơn hàng đã bị hủy", KHÔNG hiện nút reorder | — |
| POLL_CANCELLED | Polling nhận `status:'cancelled'` từ status API | `setExpired(true)`, dừng poll + timer (hiện chỉ bắt `'expired'`) | banner hết hạn sẵn có |

</intent-contract>

## Code Map

- `dainganxanh-landing/src/app/api/webhooks/casso/route.ts:415-430` — `processStoreOrder`: thay cặp `release_product_stock`+`reserve_product_stock` bằng 1 RPC `confirm_product_stock({ p_product_id, p_qty })` mỗi item.
- `supabase/migrations/20261008020000_confirm_product_stock.sql` — TẠO MỚI: `confirm_product_stock(p_product_id UUID, p_qty INT) RETURNS VOID` — `UPDATE products SET reserved_quantity = GREATEST(reserved_quantity - p_qty, 0) WHERE id = p_product_id` (stock_quantity đã trừ lúc reserve; confirm chỉ hạ reserved). Pattern giống `release_product_stock` tại `20260530000001_eco_tourism_schema.sql:261-269`.
- `dainganxanh-landing/src/app/api/store/orders/status/route.ts:39-46` — READ-ONLY: `pending`+`expires_at` quá hạn → trả `'expired'`; đơn đã cron-flip trả `'cancelled'` thô. Đây là lý do client phải bắt cả 2.
- `dainganxanh-landing/src/components/store/StoreCheckoutClient.tsx:191-196` — polling: thêm `data.status === 'cancelled'` vào nhánh `setExpired(true)` (banner "Đơn hàng đã hết hạn thanh toán" + link đặt lại đã có sẵn ở ~line 361-372).
- `dainganxanh-landing/src/app/(marketing)/store/checkout/success/page.tsx:20` — select thêm `cancellation_reason, expires_at` + `store_order_items(product_id, products(slug))` để có slug cho nút reorder.
- `dainganxanh-landing/src/app/(marketing)/store/checkout/success/page.tsx:29-36,78-92` — expired detection + heading + nút reorder; fallback slug → `/store`.
- `supabase/migrations/20260906000001_atomic_expire_pending_inventory.sql:313-321` — cron set `cancellation_reason='Payment timeout (15 mins)'`. READ-ONLY.
- `dainganxanh-landing/src/lib/store-order-status.ts` — label VN sẵn có; `cancelled` giữ nguyên. READ-ONLY.
- `dainganxanh-landing/src/app/api/webhooks/casso/__tests__/route.test.ts` — hiện chỉ test regex/helper; mở rộng cover `processStoreOrder`.
- `dainganxanh-landing/src/app/(marketing)/store/checkout/success/__tests__/page.test.tsx` — test suite success page từ 12.4; thêm case hết hạn.
- `dainganxanh-landing/src/components/store/__tests__/` — nếu chưa có file test cho StoreCheckoutClient thì tạo mới cover nhánh polling `cancelled`.

## Tasks & Acceptance

**Execution:**
- `supabase/migrations/20261008020000_confirm_product_stock.sql` -- TẠO MỚI hàm `confirm_product_stock` theo spec trên -- trừ kho atomic đúng nghiệp vụ đã-bán.
- `dainganxanh-landing/src/app/api/webhooks/casso/route.ts` -- `processStoreOrder`: xóa cặp release+reserve, gọi `confirm_product_stock` mỗi item; lỗi RPC chỉ log, không chặn update `confirmed` -- sửa bug reserved kẹt vĩnh viễn.
- `dainganxanh-landing/src/components/store/StoreCheckoutClient.tsx` -- thêm `data.status === 'cancelled'` vào điều kiện `setExpired(true)` -- dừng poll ngay khi cron hủy thay vì chờ countdown.
- `dainganxanh-landing/src/app/(marketing)/store/checkout/success/page.tsx` -- select thêm `cancellation_reason, expires_at, store_order_items(product_id, products(slug))`; tính `isExpired = (status==='cancelled' && cancellation_reason?.includes('timeout')) || (status==='pending' && expires_at && expires_at < now)`; expired → heading "Đơn hàng đã hết hạn" + nút "Đặt hàng lại" → `/store/{slug}` (fallback `/store`) -- đúng AC revisit link.
- `dainganxanh-landing/src/app/api/webhooks/casso/__tests__/route.test.ts` -- thêm describe `processStoreOrder` (mock service client): confirm gọi `confirm_product_stock` với đúng product_id/qty, KHÔNG gọi release/reserve; idempotent skip khi `status!=='pending'`; mismatch → không chạm stock -- coverage CONFIRM_OK/IDEMPOTENT/MISMATCH/STOCK_FAIL.
- `dainganxanh-landing/src/app/(marketing)/store/checkout/success/__tests__/page.test.tsx` -- thêm: cancelled+timeout → "Đơn hàng đã hết hạn" + link reorder đúng slug; pending+expires_at quá hạn → hết hạn; cancelled khác → "Đơn hàng đã bị hủy" không reorder -- coverage CRON_EXPIRED/PENDING_OVERDUE/CANCELLED_OTHER.
- `dainganxanh-landing/src/components/store/__tests__/StoreCheckoutClient.test.tsx` -- (tạo nếu chưa có) test polling nhận `status:'cancelled'` → expired state, clearInterval -- coverage POLL_CANCELLED.

**Acceptance Criteria:**
- Given đơn banking `ST…` pending + webhook Casso tiền về đúng, when dispatcher gọi `processStoreOrder`, then đơn `confirmed` + `payment_ref` ghi nhận + `reserved_quantity` giảm đúng qty qua `confirm_product_stock` (không qua release+reserve), và user tới success page thấy mã đơn + tổng tiền.
- Given đơn hết hạn (cancelled + reason timeout, hoặc pending quá `expires_at`), when user mở lại `/store/checkout/success?code=…`, then thấy "Đơn hàng đã hết hạn" + nút Đặt hàng lại.
- Given đơn bị cron hủy trong lúc checkout đang polling, when status API trả `cancelled`, then client hiện banner hết hạn ngay, không poll tới hết countdown.
- Given `npm test`, when chạy, then mọi test mới + suite hiện có xanh; `tsc --noEmit` sạch.

## Spec Change Log

## Review Triage Log

Iteration 1 — 4 layers (blind-hunter N=5→13 findings, edge-case-hunter `[]`, verification-gap 2 gaps, intent-alignment descriptive Reading B@C):

**PATCHED (8):**
- `processStoreOrder` restructure: update `confirmed` TRƯỚC với `.eq('status','pending')` + `.select('id')` guard — chỉ delivery thắng transition mới confirm stock (fix double-decrement trên concurrent/retry; đổi hướng failure từ phantom-stock → reserved-leak đã alert).
- Đơn `cancelled` nhận tiền muộn: captureError + notifyWebhookError (Telegram ops) thay vì silent ok:true — refund/manual xử lý.
- stockError → thêm notifyWebhookError cho ops (trước chỉ captureError).
- revalidate thêm `revalidatePath('/store/[slug]', 'page')`.
- Migration: thêm guard `p_qty <= 0 → RETURN` + `SET search_path = public`.
- page.tsx: cancelled check trước cod trong heading (fix cancelled COD hiện "Đặt hàng thành công!"); icon XCircle đỏ + status chip theo config cho bad state; label 'Hết hạn' khi expired; ẩn shipping copy khi cancelled/expired; bỏ `total` query param untrusted (dùng order.total_amount).
- StoreCheckoutClient: ẩn QR + bank details + đổi h2 khi expiredNow — tránh khách vẫn ck cho đơn hết hạn.
- Tests: +CONFIRM_UPDATE_FAIL, +CONFIRM_RACE_LOST, +CONFIRM_CANCELLED_LATE_PAYMENT, +revalidatePath assert, +cancelled-COD heading, +'Hết hạn' chip, +QR-hidden assert trong expired test.

**DEFERRED (7):** xem `deferred:` frontmatter.

**REJECTED (2):** intent-alignment claim "migration omitted from diff" — sai (migration được append vào diff file); Reading-A prescriptive (live deploy/webhook thật) — ngoài surface của pipeline, E2E manual sau run.

## Design Notes

- **Vì sao `confirm_product_stock` chỉ trừ `reserved_quantity`:** `reserve_product_stock` đã trừ `stock_quantity` lúc tạo đơn (`20260530000001_eco_tourism_schema.sql:245-258`). Confirm = hàng đã bán chắc → chỉ hạ `reserved_quantity`. Release (+stock −reserved) là cho hủy/hết hạn — code hiện gọi sai release rồi reserve lại = net-zero.
- **Detect hết hạn bằng `cancellation_reason` chứ không chỉ `cancelled`:** Story 12.8 sau này cho admin hủy COD/banking vì lý do khác — check reason `includes('timeout')` (case-insensitive) tránh nhầm đơn admin-hủy thành hết hạn.
- **Option A cho "revisit payment link":** URL checkout không chứa mã đơn (`?slug=&quantity=`), link duy nhất user có là `success?code=…` → success page là surface duy nhất cần xử lý expired; không build resume-QR (Option B) — ngoài AC quan sát được.
- **Lỗi RPC confirm không chặn `confirmed`:** tiền đã về tài khoản, chặn update sẽ làm webhook retry vô hạn + đơn treo; log lỗi để ops xử lý thủ công (giữ nguyên tinh thần code hiện tại).

## Verification

**Commands:**
- `cd dainganxanh-landing && npx jest --runTestsByPath "src/app/api/webhooks/casso/__tests__/route.test.ts"` -- expected: processStoreOrder tests pass
- `cd dainganxanh-landing && npx jest --runTestsByPath "src/app/(marketing)/store/checkout/success/__tests__/page.test.tsx"` -- expected: expired/reorder tests pass
- `cd dainganxanh-landing && npm test && npx tsc --noEmit` -- expected: toàn bộ suite xanh, 0 lỗi type

**Manual checks (if no CLI):**
- Apply migration mới lên Supabase dev rồi gọi `confirm_product_stock` thử 1 product: `reserved_quantity` giảm, `stock_quantity` không đổi.

## Auto Run Result

- Story: 12.5 Confirm Store Payment — done.
- Branch: production. Baseline: d92d5ca5.
- Implement: 8 files — migration `supabase/migrations/20261008020000_confirm_product_stock.sql` (RPC trừ reserved_quantity, guard p_qty>0, SET search_path); `route.ts` processStoreOrder dùng confirm_product_stock + conditional update-first + late-cancelled-payment alert; `StoreCheckoutClient` nhận cancelled/expired khi polling + ẩn QR khi hết hạn; success page heading/icon/chip theo state + nút Đặt hàng lại; `database.types.ts` RPC type; 3 test files.
- Review: iteration 1 — blind-hunter 13 findings, edge-case `[]`, verification-gap 2, intent-alignment descriptive. 8 patched, 7 deferred, 2 rejected.
- Verify: targeted 41/41 pass; full suite 104/105 suites — 1038/1039 pass, 1 flake (CustomerIdentityForm, pass isolated); `tsc --noEmit` sạch.
- Deferred: 7 items ở frontmatter `deferred:` (reorder multi-item, cron-lag window, timeout-substring detection, my-store-orders revalidate, PostgREST exec perms, join cast, race edge).
- followup_review_recommended: false.
