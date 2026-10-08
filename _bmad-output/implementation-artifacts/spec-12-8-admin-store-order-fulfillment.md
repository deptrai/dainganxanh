---
title: 'Story 12.8 — Admin Store Order Fulfillment'
type: 'feature'
created: '2026-10-09'
status: 'done'
baseline_revision: '3ac0bfcaf61001703e3c18bfaa57a9a5f1b40984'
review_loop_iteration: 1
followup_review_recommended: false
context: []
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Đơn hàng cửa hàng (`store_orders`) đã có đầy đủ lifecycle `pending → confirmed → processing → shipped → delivered` trong DB và khách đã theo dõi được (Story 12.6), nhưng admin/staff không có UI nào để xử lý đơn — phải UPDATE DB tay cho từng bước giao nhận và ghi mã vận đơn.

**Approach:** Thêm trang `/crm/admin/store-orders` (server component, pattern giống Story 12.7 `/crm/admin/products`) hiển thị bảng đơn hàng join `store_order_items`, hàng mở rộng xem chi tiết, và server action `updateStoreOrderStatus` ép chuyển trạng thái thuận chiều + hoàn/khấu trừ tồn kho qua RPC sẵn có.

## Boundaries & Constraints

**Always:**
- Role gate: page + mọi server action chỉ cho `['admin','super_admin']` — pattern `verifyAdmin()` trong `src/actions/adminProducts.ts` và role check qua `createServiceRoleClient()` như `src/app/crm/admin/products/page.tsx` (KHÔNG dùng user-scoped client cho role check).
- Trước khi query danh sách, gọi best-effort `serviceClient.rpc('expire_pending_store_orders')` (pattern `src/app/crm/my-store-orders/page.tsx`) để đơn banking quá hạn lật sang `cancelled` ngay; `captureError` trong catch.
- Chuyển trạng thái CHỈ thuận chiều đúng chuỗi `pending → confirmed → processing → shipped → delivered`. Mọi update dùng conditional `.eq('status', expectedCurrent)` (pattern webhook `casso/route.ts:438-440`) — 0 rows trả lỗi "trạng thái đã thay đổi", không silent overwrite.
- `pending → confirmed`: sau khi flip status thành công, gọi `confirm_product_stock(product_id, qty)` cho TỪNG item của đơn (semantics giống webhook `casso/route.ts:463` — COD confirm cũng khấu trừ reserved); log `captureError` nếu RPC fail nhưng không revert status.
- `→ shipped`: BẮT BUỘC `tracking_number` non-empty (AC), lưu cả `tracking_number` + `status` trong 1 update.
- Hủy đơn: CHỈ cho phép từ `pending` hoặc `confirmed` → `cancelled`, kèm `cancellation_reason` (mặc định 'Admin hủy đơn' nếu trống), sau đó `release_product_stock(product_id, qty)` cho từng item. An toàn cho cả confirmed vì RPC có `GREATEST(reserved_quantity - qty, 0)` clamp.
- Set `updated_at: new Date().toISOString()` trong mọi update (bảng `store_orders` KHÔNG có trigger tự cập nhật).
- `revalidatePath('/crm/admin/store-orders')` và `revalidatePath('/crm/my-store-orders')` sau mỗi action thành công.
- Bảng liệt kê: mã đơn, khách hàng (tên + SĐT), tóm tắt items, tổng tiền `formatVND`, địa chỉ rút gọn, `StoreOrderStatusBadge`, thời gian tạo. Lọc theo status qua `searchParams` (server-side). Sort `created_at desc`.
- Hàng mở rộng (accordion pattern `StoreOrdersList.tsx`, `aria-expanded`): chi tiết items (tên + số lượng + đơn giá), địa chỉ đầy đủ + tỉnh + ghi chú, payment method (`banking`/`COD`), `payment_ref`, `expires_at`, `tracking_number`.
- Vietnamese labels toàn bộ UI; style table giống `AdminProductsTable.tsx`.

**Never:**
- Không sửa schema/migrations/RPC — tái dùng `confirm_product_stock`, `release_product_stock`, `expire_pending_store_orders` y nguyên.
- Không cho chuyển ngược/nhảy cóc trạng thái; `delivered` và `cancelled` là terminal; `refunded` (có trong CHECK constraint) NGOÀI scope.
- Không hủy đơn từ `processing`/`shipped`/`delivered` (hàng đã xuất kho vật lý — cần flow hoàn hàng riêng).
- Không sửa thông tin khách/địa chỉ/items; không xử lý hoàn tiền.
- Không đụng `/crm/admin/orders` (đơn cây) hay `src/actions/adminOrders.ts` — đó là bảng `orders` khác.
- Không thêm email/notification khi đổi trạng thái — ngoài scope AC.
- Không phân trang/search phức tạp — status filter + `created_at desc` là đủ cho volume hiện tại.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| LIST | Admin mở `/crm/admin/store-orders` | Bảng đơn: code, khách, items, tổng, địa chỉ, badge status | empty state "Chưa có đơn hàng nào" |
| AUTH_DENY | role ∉ admin/super_admin | Page redirect `/crm` (hoặc notFound); action `{success:false,error}` | verifyAdmin từ chối |
| FWD_OK | pending→confirmed→processing→shipped→delivered | Mỗi bước conditional update thành công, badge/status mới | — |
| CONFIRM_STOCK | pending→confirmed, đơn có N items | `confirm_product_stock` gọi N lần đúng product_id/qty | RPC fail → `captureError`, status vẫn confirmed (giống webhook) |
| TRACK_REQ | →shipped mà tracking_number rỗng/blank | `{success:false,error}` 'Vui lòng nhập mã vận đơn', không update | return error object |
| SKIP_DENY | pending→processing (nhảy cóc) hoặc shipped→confirmed (lùi) | `{success:false,error}` transition không hợp lệ | return error object |
| RACE | status DB ≠ expected (webhook/expiry đã flip) | `.eq('status',...)` 0 rows → `{success:false,error}` 'đã thay đổi' | return error object |
| CANCEL_OK | pending/confirmed → cancelled + reason | status=cancelled, `cancellation_reason` set, `release_product_stock` per item | — |
| CANCEL_DENY | processing/shipped/delivered/cancelled → cancelled | `{success:false,error}` | return error object |
| FILTER | `?status=pending` | Chỉ đơn pending; tab "Tất cả" bỏ filter | status param lạ → hiển thị tất cả |

</intent-contract>

## Code Map

- `dainganxanh-landing/src/app/crm/admin/products/page.tsx` — GOLDEN admin list page: `createServerClient` getUser → `createServiceRoleClient` check `users.role` ∈ `['admin','super_admin']` → redirect `/crm` nếu fail; `robots:{index:false}` + `force-dynamic`. COPY PATTERN.
- `dainganxanh-landing/src/actions/adminProducts.ts` — `verifyAdmin()` golden (getUser → service client role check → `{success:false,error}`); `captureError` usage. COPY PATTERN.
- `dainganxanh-landing/src/app/crm/my-store-orders/page.tsx` — lazy-expire `rpc('expire_pending_store_orders')` best-effort + catch `captureError`; query `store_orders` join `store_order_items(product:products(...))` shape. COPY PATTERN.
- `dainganxanh-landing/src/components/crm/StoreOrdersList.tsx` — accordion expand (`Record<string,boolean>`, `aria-expanded`, chevron) + item detail layout + tracking display. COPY PATTERN cho expandable row.
- `dainganxanh-landing/src/components/crm/StoreOrderStatusBadge.tsx` + `src/lib/store-order-status.ts` — badge + `STORE_ORDER_STATUS_CONFIG` labels. REUSE.
- `dainganxanh-landing/src/components/admin/AdminProductsTable.tsx` — table style (thead gray-50, thumbnail, actions cell). STYLE REFERENCE.
- `dainganxanh-landing/src/app/api/webhooks/casso/route.ts:427-480` — conditional status flip `.eq('status','pending')` + `confirm_product_stock` per item + error handling semantics. READ-ONLY reference.
- `supabase/migrations/20260530000001_eco_tourism_schema.sql:162-181` — `store_orders` columns (code, customer_*, shipping_*, subtotal, shipping_fee, total_amount, payment_method, payment_ref, status CHECK 7 values incl. refunded, tracking_number, cancellation_reason, expires_at); `:245-270` `reserve_product_stock`/`release_product_stock` (GREATEST clamp → release an toàn sau confirm). READ-ONLY.
- `supabase/migrations/20261008020000_confirm_product_stock.sql` — `confirm_product_stock` chỉ trừ `reserved_quantity` (stock_quantity đã trừ lúc reserve). READ-ONLY.
- `supabase/migrations/20261008030000_harden_stock_rpc_perms.sql` — RPC chỉ GRANT service_role → phải gọi qua `createServiceRoleClient`, không gọi được từ user-scoped client. READ-ONLY.
- `dainganxanh-landing/src/components/admin/AdminSidebar.tsx:26-38` — thêm nav item "Đơn hàng shop" → `/crm/admin/store-orders` (icon `TruckIcon` từ `@heroicons/react/24/outline`), đặt sau "Sản phẩm". LƯU Ý: đã có "Đơn hàng" → `/crm/admin/orders` (đơn cây) nên label phải phân biệt.
- `dainganxanh-landing/src/lib/utils/formatters.ts` — `formatVND` re-export sẵn. REUSE.
- `dainganxanh-landing/src/types/database.types.ts` — types `store_orders`, `store_order_items` Row sẵn có.

## Tasks & Acceptance

**Execution:**
- `dainganxanh-landing/src/actions/adminStoreOrders.ts` -- TẠO MỚI: `verifyAdmin()` (copy pattern adminProducts) + `updateStoreOrderStatus(orderId, nextStatus, opts?: { trackingNumber?, cancellationReason? })` — validate transition map, conditional update `.eq('status', current)`, confirm→`confirm_product_stock` per item, shipped→require trackingNumber, cancel (pending/confirmed)→`release_product_stock` per item + `cancellation_reason`, set `updated_at`, `revalidatePath` 2 routes. Fetch items TRƯỚC flip khi cần stock ops (đọc `store_order_items` qua service client).
- `dainganxanh-landing/src/app/crm/admin/store-orders/page.tsx` -- TẠO MỚI server page: auth+role gate (golden products page) → best-effort `expire_pending_store_orders` → query `store_orders` join `store_order_items(product:products(id,name,slug))` + `.eq('status', param)` khi có filter hợp lệ → render `AdminStoreOrdersTable` -- AC list surface.
- `dainganxanh-landing/src/components/admin/AdminStoreOrdersTable.tsx` -- TẠO MỚI client component: bảng (code/khách/items/tổng/địa chỉ/status/ngày), status filter tabs (searchParams), accordion row chi tiết, action buttons theo status (`Xác nhận đơn`/`Bắt đầu xử lý`/`Giao hàng`+input mã vận đơn/`Hoàn tất`/`Hủy đơn`+lý do), gọi `updateStoreOrderStatus`, hiển thị lỗi trả về, `useTransition` pending state.
- `dainganxanh-landing/src/components/admin/AdminSidebar.tsx` -- thêm `{ name: 'Đơn hàng shop', href: '/crm/admin/store-orders', icon: TruckIcon }` sau "Sản phẩm" -- discoverability.
- `dainganxanh-landing/src/actions/__tests__/adminStoreOrders.test.ts` -- TẠO MỚI: mock supabase chains cover AUTH_DENY/FWD_OK/CONFIRM_STOCK/TRACK_REQ/SKIP_DENY/RACE/CANCEL_OK/CANCEL_DENY.
- `dainganxanh-landing/src/components/admin/__tests__/AdminStoreOrdersTable.test.tsx` -- TẠO MỚI: render bảng + badge, expand row hiển thị items/address/tracking, nút action đúng theo status, tracking input bắt buộc khi ship.

**Acceptance Criteria:**
- Given admin đăng nhập, when mở `/crm/admin/store-orders`, then thấy bảng: mã đơn, khách hàng, items, tổng tiền, địa chỉ, trạng thái + filter status + nút mở rộng chi tiết.
- Given đơn `pending`, when admin bấm "Xác nhận đơn", then status → `confirmed` và `confirm_product_stock` chạy cho từng item (COD và banking đều đúng).
- Given đơn `confirmed`/`processing`, when admin bấm bước tiếp, then status → `processing`/`shipped`; riêng `shipped` bắt buộc nhập mã vận đơn trước khi lưu.
- Given đơn `shipped`, when admin bấm "Hoàn tất", then status → `delivered`.
- Given đơn `pending`/`confirmed`, when admin hủy với lý do, then status → `cancelled`, `cancellation_reason` lưu, `release_product_stock` hoàn kho từng item; đơn `processing`+ không có nút hủy.
- Given user không phải admin hoặc transition không hợp lệ/trạng thái đã đổi, when gọi action, then nhận `{success:false,error}` tiếng Việt và DB không đổi.
- Given khách mở `/crm/my-store-orders`, then badge status và mã vận đơn mới hiển thị (đã có sẵn từ 12.6, chỉ cần revalidate).
- `npm test` + `tsc --noEmit` xanh.

## Spec Change Log

- Review wave 1 (4 layers, 31 findings → 5 medium + 22 low accepted): dựng lại `AdminStoreOrdersTable` thành bảng semantic (9 `<td>` thật + `<tr>` accordion riêng) thay flex-hack lệch header; `handleUpdateStatus` bọc try/catch; modal hủy chỉ đóng khi action success + thêm Escape/backdrop/htmlFor/autoFocus; tracking input thêm aria-label/disabled/Enter; `window.confirm` trước khi confirm đơn banking `pending`; auth error trả tiếng Việt 'Bạn không có quyền thực hiện thao tác này'; `expires_at` hiển thị `formatDateTimeVN` (giờ:phút); detail pane thêm Tạm tính/Phí vận chuyển + customer_email; `page.tsx` banner generic tiếng Việt + không render table khi `ordersError`; thumbnail item → `next/image` + `ShoppingBagIcon` fallback theo convention `AdminProductsTable`.
- Rejected 4: pagination (spec cấm), sửa tracking sau shipped (ngoài intent), prefill tracking (input chỉ hiện khi chưa set), 3 intent-divergence (cancel COD giải phóng reserved + unit test là chuẩn repo — quyết định spec có chủ đích).
- Tests mới: ERR branches trong `adminStoreOrders.test.ts` (itemsError/updateError/release-RPC-fail→captureError), invalid status param + ordersError trong `page.test.tsx`, banking window.confirm + cancel rỗng/modal-fail trong `AdminStoreOrdersTable.test.tsx`.

## Review Triage Log

- Wave 1 — 31 findings (blind-hunter 15, edge-case 7, verification-gap 6, intent-alignment 3): 5 medium + 22 low patched; 4 rejected (lý do ở Spec Change Log); 0 deferred. Kết quả: 113 suites / 1142 tests pass, `tsc --noEmit` clean.

## Design Notes

- **Vì sao cho phép cancel từ `confirmed`:** AC chỉ nói chuỗi forward, nhưng COD `pending` không bao giờ expire (`expires_at` null) — không có nút hủy thì đơn COD ảo khóa `reserved_quantity` vĩnh viễn, đâm thẳng vào metric epic "gian lận COD < 3%". `release_product_stock` có clamp `GREATEST(reserved-qty,0)` nên cancel sau confirm vẫn đúng: `stock_quantity += qty`, `reserved` giữ 0. Cancel từ `processing`+ bị cấm vì hàng đã rời kho vật lý.
- **Single action thay vì 3 action riêng:** transition map `current→allowed[]` tập trung 1 chỗ dễ test và audit hơn `advance/ship/cancel` rời — UI chỉ truyền `nextStatus` + opts.
- **Fetch items trước flip:** nếu flip thành công nhưng items fetch sau fail thì status đã đổi mà stock chưa confirm — đọc items trước (read-only, không race) rồi mới flip + gọi RPC.
- **Filter qua searchParams thay vì client state:** page là server component — filter server-side giữ URL shareable, không cần thêm client fetch layer.

## Verification

**Commands:**
- `cd dainganxanh-landing && npx jest --runTestsByPath "src/actions/__tests__/adminStoreOrders.test.ts" "src/components/admin/__tests__/AdminStoreOrdersTable.test.tsx"` -- expected: tests mới pass
- `cd dainganxanh-landing && npm test && npx tsc --noEmit` -- expected: toàn bộ suite xanh, 0 lỗi type
