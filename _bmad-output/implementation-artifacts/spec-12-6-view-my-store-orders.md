---
title: 'Story 12.6 — View My Store Orders'
type: 'feature'
created: '2026-10-08'
status: 'done'
baseline_revision: 'dbcfa5351fee0f4955371dc3415ec08e8b4df29c'
review_loop_iteration: 0
followup_review_recommended: true
context: []
warnings: []
deferred:
  - summary: >-
      Layout-level auth redirect chặn trước page nên `?redirect=/crm/my-store-orders`
      bị mất với guest.
    evidence: |-
      `src/app/crm/layout.tsx:18` gọi `redirect('/login')` khi `getUser()` null — chạy
      trước page, nên branch `redirect('/login?redirect=...')` trong page.tsx không bao
      giờ đến được. Guest vẫn được chuyển về login (AC thỏa) nhưng sau login không quay
      lại đúng trang đơn hàng. Pre-existing từ scaffold epic-12, không do story này gây.
    location: >-
      dainganxanh-landing/src/app/crm/layout.tsx:18
    severity: low
---

<intent-contract>

## Intent

**Problem:** Trang `/crm/my-store-orders` và component `StoreOrdersList`/`StoreOrderStatusBadge` đã tồn tại từ scaffold epic-12, nhưng AC "click a row → xem products/địa chỉ/mã vận đơn" chưa có tương tác (mọi chi tiết hiện sẵn), trang không được link từ nav CRM/marketing, và đơn `pending` quá hạn hiển thị cũ vì list page chưa lazy-expire như status route/success page (đã thiết lập ở 12.5).

**Approach:** Chuyển mỗi order card thành row có thể expand/collapse (click header → mở chi tiết), thêm nav link "Đơn hàng" vào CRMHeader + MarketingHeader (auth-only), gọi `rpc('expire_pending_store_orders')` trước khi query list để trạng thái phản ánh thực tế, và bổ sung unit tests cho page + list component.

## Boundaries & Constraints

**Always:**
- Giữ server component `page.tsx` + `getScopedCrmClient()` (hỗ trợ impersonation); redirect `/login?redirect=/crm/my-store-orders` khi chưa đăng nhập — đã có sẵn.
- Badge dùng `STORE_ORDER_STATUS_CONFIG` từ `@/lib/store-order-status` (đã có); KHÔNG tự định nghĩa label màu.
- Expand/collapse phải accessible: `aria-expanded`, chevron rotate, click vùng header row (không phải nút riêng nhỏ).
- Lazy-expire: gọi `rpc('expire_pending_store_orders')` TRƯỚC query `store_orders` — pattern giống status route (`src/app/api/store/orders/status/route.ts`) và success page sau defer-resolution 12.5.
- Pagination 20/page giữ nguyên; query giữ `.eq('user_id', effectiveUserId)` + order `created_at desc`.
- Test page mock `getScopedCrmClient` (KHÔNG mock `createServiceRoleClient`/`getImpersonationContext` — page dùng scoped client).

**Never:**
- Không tạo trang chi tiết riêng `/crm/my-store-orders/[id]` — AC chỉ yêu cầu expand inline.
- Không đụng `store_orders` insert/update, payment, tracking mutation — story read-only.
- Không sửa `CRMHeader (1).tsx`/`MarketingHeader (1).tsx` (file copy lạc, không được import).
- Không thêm realtime subscription, search/filter UI, hay nút "Hủy đơn" — ngoài AC.
- Không đổi format `ST`+6 ký tự (không hyphen) — regex webhook phụ thuộc.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| LIST_OK | User login, có orders | Card row: code, badge, ngày, tổng; click → expand items+địa chỉ+tracking+payment | — |
| LIST_EMPTY | Không có order | Empty state "Bạn chưa có đơn hàng nào" + link "Mua sắm ngay" → `/store` | — |
| AUTH_REDIRECT | Chưa login | `redirect('/login?redirect=/crm/my-store-orders')` | — |
| EXPAND_TOGGLE | Click row đang collapsed | Mở chi tiết (`aria-expanded=true`); click lại → đóng | — |
| EXPAND_MULTI | Click order A rồi order B | Cả hai độc lập — B mở không đóng A | — |
| LAZY_EXPIRE | Order `pending` có `expires_at < now` | RPC expire chạy trước query → badge "Đã hủy" | RPC lỗi → log, vẫn render list |
| QUERY_ERROR | supabase trả error | Banner đỏ "Không thể tải danh sách đơn hàng" | captureError sẵn có |
| PAGINATION | >20 orders | Link Trước/Sau giữa các `?page=N`, disabled ở biên | — |
| ITEM_NO_IMAGE | product.images rỗng | Placeholder icon ShoppingBag | — |
| NO_TRACKING | tracking_number null | Không render dòng "Mã vận đơn" | — |

</intent-contract>

## Code Map

- `dainganxanh-landing/src/app/crm/my-store-orders/page.tsx` — server component ĐÃ TỒN TẠI: scoped client, auth redirect, select join `store_order_items(... products(name, slug, images))`, pagination range, error banner, map sang `StoreOrder` props. Thêm: `await serviceClient.rpc('expire_pending_store_orders')` (best-effort try/catch) trước select.
- `dainganxanh-landing/src/components/crm/StoreOrdersList.tsx` — client component ĐÃ TỒN TẠI: empty state + cards + pagination. Refactor card: header row (code/badge/ngày/tổng/chevron) `button` toggles `expandedId` (`useState<string | null>`); vùng chi tiết (items, MapPin/Truck/CreditCard rows, footer ship+total) render khi `expandedId === order.id`.
- `dainganxanh-landing/src/components/crm/StoreOrderStatusBadge.tsx` — ĐÃ TỒN TẠI, đúng config chuẩn. READ-ONLY.
- `dainganxanh-landing/src/lib/store-order-status.ts` — `STORE_ORDER_STATUS_CONFIG` (pending/confirmed/processing/shipped/delivered/cancelled). READ-ONLY.
- `dainganxanh-landing/src/components/layout/CRMHeader.tsx:13-19` — `baseNavItems`: thêm `{ name: 'Đơn hàng', href: '/crm/my-store-orders', icon: ShoppingBag }` sau 'Lịch đặt' (ShoppingBag đã import sẵn line 6).
- `dainganxanh-landing/src/components/layout/MarketingHeader.tsx:27-29` — `authOnlyItems` (chỉ user đăng nhập): thêm `{ name: 'Đơn hàng', href: '/crm/my-store-orders', icon: Package }` (icon `Package`/`ShoppingBag` đã import).
- `dainganxanh-landing/src/app/api/store/orders/status/route.ts` — golden pattern lazy-expire `rpc('expire_pending_store_orders')`. READ-ONLY.
- `dainganxanh-landing/src/types/database.types.ts:1757` — `StoreOrderWithItems` type sẵn có. READ-ONLY.
- `dainganxanh-landing/src/app/crm/my-bookings/__tests__/page.test.tsx` — golden test pattern cho CRM page (mock next/navigation redirect throw, mock supabase chain) — nhưng 12.6 mock `getScopedCrmClient` thay vì impersonation+serviceClient.
- `dainganxanh-landing/src/components/crm/__tests__/` — golden dir cho component tests (BookingTable, TreeCard…).

## Tasks & Acceptance

**Execution:**
- `dainganxanh-landing/src/components/crm/StoreOrdersList.tsx` -- tách card thành header-row clickable (button full-width, `aria-expanded`, ChevronDown rotate) + vùng chi tiết có điều kiện -- đạt AC "click a row → see products, shipping address, tracking number".
- `dainganxanh-landing/src/app/crm/my-store-orders/page.tsx` -- thêm `rpc('expire_pending_store_orders')` best-effort trước select -- pending quá hạn hiển thị `cancelled` ngay, khớp lazy-expire 12.5.
- `dainganxanh-landing/src/components/layout/CRMHeader.tsx` + `MarketingHeader.tsx` -- thêm nav "Đơn hàng" (CRMHeader baseNavItems; MarketingHeader authOnlyItems) -- user tự tìm được trang không cần link từ success page.
- `dainganxanh-landing/src/components/crm/__tests__/StoreOrdersList.test.tsx` -- TẠO MỚI: empty state, render row fields, click toggle expand/collapse + aria-expanded, tracking chỉ hiện khi có, pagination links + disabled biên -- coverage LIST_OK/LIST_EMPTY/EXPAND_TOGGLE/EXPAND_MULTI/NO_TRACKING/PAGINATION/ITEM_NO_IMAGE.
- `dainganxanh-landing/src/app/crm/my-store-orders/__tests__/page.test.tsx` -- TẠO MỚI: mock `getScopedCrmClient` null → redirect login; có data → render list + map đúng fields; `rpc` được gọi; query error → banner đỏ; `?page=2` → range đúng -- coverage AUTH_REDIRECT/LAZY_EXPIRE/QUERY_ERROR.

**Acceptance Criteria:**
- Given user đã đăng nhập, when mở `/crm/my-store-orders`, then thấy list mã đơn, trạng thái (badge), ngày, tổng tiền; và nav CRM/marketing có mục "Đơn hàng" dẫn tới trang.
- Given list hiển thị, when click vào một row, then expand hiện products (tên+số lượng+giá), địa chỉ giao hàng, mã vận đơn (nếu có); click lại thu gọn; `aria-expanded` đổi đúng.
- Given đơn `pending` có `expires_at` quá hạn, when mở trang, then `expire_pending_store_orders` chạy và đơn hiển thị `Đã hủy` thay vì `Chờ thanh toán`.
- Given chưa đăng nhập, when mở `/crm/my-store-orders`, then redirect `/login?redirect=/crm/my-store-orders`.
- Given `npm test`, when chạy, then test mới + suite hiện có xanh; `tsc --noEmit` sạch.

## Spec Change Log

## Review Triage Log

### 2026-10-08 — Review pass
- verdicts: 18 findings — high 0, medium 2, low 13, false 3, maybe-false 0
- findings:
  - `[medium]` `[patch]` Pagination `<Link>` dùng `aria-disabled` không chặn click — click "Sau"/"Trước" ở biên vẫn điều hướng tới `?page=0`/vượt trang — thêm `pointer-events-none` vào class disabled ở `StoreOrdersList.tsx`.
  - `[medium]` `[patch]` Empty-state trap: `?page` vượt biên (reachable qua lỗi trên) → `orders.length===0` render "Bạn chưa có đơn hàng nào" mất pagination quay lại — đổi điều kiện thành `orders.length === 0 && totalCount === 0` để vẫn render pagination khi có orders ở trang khác.
  - `[low]` `[reject]` Spec Code Map mô tả `expandedId` (single) lệch impl `Record` (multi-expand) — fix yêu cầu sửa chính spec → reject theo rule; multi-expand khớp I/O matrix EXPAND_MULTI.
  - `[low]` `[reject]` Thiếu `aria-controls`/`role="region"` trên accordion — spec chỉ yêu cầu `aria-expanded` + chevron (đã có); không harm cụ thể cho screen-reader pattern phổ biến.
  - `[low]` `[patch]` catch block của lazy-expire chỉ `console.error`, thiếu `captureError` — thêm `captureError(err instanceof Error ? err : new Error(String(err)), {...})` cho đồng nhất nhánh error-response.
  - `[low]` `[reject]` Tests thiếu case rpc-throw và `?page` invalid — `parseInt(...)||1` + `Math.max(1,...)` đã xử lý NaN/âm đúng; matrix LAZY_EXPIRE đã cover error-response, hành vi giống hệt.
  - `[low]` `[patch]` Icon "Đơn hàng" trùng `ShoppingBag` (Cửa hàng) trong CRMHeader và `Package` (Mua cây) trong MarketingHeader — đổi cả hai sang `PackageCheck` + dọn unused import `User`.
  - `[low]` `[reject]` `paymentMethod` undefined fallback sang "Chuyển khoản ngân hàng" — `payment_method` non-null trong schema và page luôn truyền giá trị.
  - `[low]` `[patch]` `next-env.d.ts` (generated) bị stage — đã unstage + restore về HEAD.
  - `[low]` `[patch]` Product `slug=''` (product bị xóa) render `<Link href="/store/">` hỏng — conditional: có slug mới wrap `Link`, không thì plain `<span>`.
  - `[low]` `[reject]` Footer lặp `totalAmount` thiếu dòng subtotal — cosmetic, ngoài AC; fix thêm markup không cần thiết.
  - `[low]` `[defer]` `crm/layout.tsx:18` redirect('/login') chặn trước page → `?redirect=` mất với guest — pre-existing layout guard, guest vẫn redirect login (AC thỏa); ghi deferred.
  - `[false]` `[reject]` (intent-alignment) Unit-mock vs integration: diff chỉ verify ở jsdom/mock — đây là chuẩn verification của pipeline; AC thỏa ở code level; cơ chế lazy-expire đã verify live bằng E2E 12.5.
  - `[false]` `[reject]` (intent-alignment) Lazy-expire mutation trên DB thật không được exercise trong test — mock RPC chỉ assert call; RPC `expire_pending_store_orders` đã được E2E verify trên dev Supabase ở phiên 12.5.
  - `[false]` `[reject]` (intent-alignment) Auth redirect không test ở HTTP/middleware level — nhánh `!scoped → redirect` có unit test; layout guard đã tồn tại từ scaffold.
  - `[low]` `[reject]` (intent-alignment) Header nav không có test — pre-existing pattern: không header nào có test; thay đổi chỉ là static array entry.
  - `[low]` `[reject]` (intent-alignment) Spec code-map vs matrix lệch interaction model — dup finding reject ở trên (fix = sửa spec).
  - `[low]` `[patch]` (intent-alignment) `next-env.d.ts` trong diff — dup finding patch ở trên (đã unstage).

## Auto Run Result

- **Tóm tắt:** Hoàn thiện Story 12.6 trên nền scaffold epic-12 — order card expand/collapse (aria-expanded, chevron, multi-expand độc lập), nav "Đơn hàng" vào CRMHeader + MarketingHeader (authOnly), lazy-expire RPC trước query, pagination sửa disabled-link + out-of-bounds trap.
- **Files changed:**
  - `dainganxanh-landing/src/components/crm/StoreOrdersList.tsx` — card thành button-toggle expand; conditional Link theo slug; fix pagination.
  - `dainganxanh-landing/src/app/crm/my-store-orders/page.tsx` — `rpc('expire_pending_store_orders')` best-effort + captureError đầy đủ cả nhánh throw.
  - `dainganxanh-landing/src/components/layout/CRMHeader.tsx`, `MarketingHeader.tsx` — nav "Đơn hàng" icon `PackageCheck`.
  - 3 test files mới: `StoreOrdersList.test.tsx`, `StoreOrderStatusBadge.test.tsx`, `my-store-orders/__tests__/page.test.tsx`.
- **Review findings:** 18 findings — 2 medium + 4 low patched (pagination nav, empty-state trap, captureError, icon, next-env, slug-link — F9/IA-F gộp); 1 deferred (layout redirect mất `?redirect` — pre-existing); 11 rejected (3 false intent-alignment vì pipeline chuẩn là unit-mock + E2E 12.5 đã verify mechanism, còn lại low không đáng sửa hoặc fix-yêu-cầu-sửa-spec).
- **Follow-up review recommendation:** `true` — 2 medium patched; rủi ro chưa verify: interaction expand + pagination bound trong browser thật chỉ cover bằng jsdom unit tests.
- **Verification:** `npx jest --runTestsByPath` 3 file mới → 22 pass; `npm test` → 108 suites/1061 pass; `npx tsc --noEmit` → 0 lỗi.
- **Residual risks:** chưa E2E live trên `/crm/my-store-orders` (cần user login + orders thật); `expire_pending_store_orders` chưa verify perms trên remote (đã có từ defer 12.5).

## Design Notes
## Design Notes

- **Vì sao expand-inline thay vì trang chi tiết:** AC viết "click a row → I see products, shipping address, tracking number" — toàn bộ fields đích nằm ngay trong list card; tách trang detail thêm route + query thừa không cần thiết (ponytail).
- **Lazy-expire trong server component:** `expire_pending_store_orders` idempotent, chỉ flip pending-quá-hạn → cancelled + release stock; gọi trước select cho mỗi page load — rẻ (1 RPC) và thống nhất với quyết định defer-resolution của 12.5. Lỗi RPC không chặn render.
- **Nav placement:** MarketingHeader `authOnlyItems` (không phải `sharedNavItems`) vì trang yêu cầu login — guest click sẽ redirect login vô nghĩa; CRMHeader là auth context nên vào `baseNavItems`.

## Verification

**Commands:**
- `cd dainganxanh-landing && npx jest --runTestsByPath "src/components/crm/__tests__/StoreOrdersList.test.tsx" "src/app/crm/my-store-orders/__tests__/page.test.tsx"` -- expected: tests mới pass
- `cd dainganxanh-landing && npm test && npx tsc --noEmit` -- expected: toàn bộ suite xanh, 0 lỗi type
