<!-- markdownlint-disable MD033 MD032 MD060 MD022 -->
---
title: 'Story 12.2: View Product Detail'
type: 'feature'
created: '2026-10-08'
status: 'done'
review_loop_iteration: 1
followup_review_recommended: false
baseline_revision: '9da73aa8b077d6fbd5c5eb1eb918817638df8c5b'
context:
  - 'dainganxanh-landing/src/components/store/ProductDetailClient.tsx'
  - 'dainganxanh-landing/src/app/(marketing)/store/[slug]/page.tsx'
  - 'dainganxanh-landing/src/components/store/originLabels.ts'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Trang chi tiết sản phẩm `/store/[slug]` và component `ProductDetailClient.tsx` đã được tạo sẵn nhưng thiếu unit test RTL bảo vệ toàn bộ hành vi, `specifications` chưa có guard chống null gây nguy cơ crash runtime (`Object.keys(null)`), và nút "Mua ngay" cần được verify routing chính xác đến trang checkout.

**Approach:** Củng cố độ bền vững của `ProductDetailClient.tsx` (thêm null-guard cho `specifications`, type-safety cho related products), sau đó viết bộ unit test RTL toàn diện trong `src/components/store/__tests__/ProductDetailClient.test.tsx` bao phủ đầy đủ I/O Matrix và Acceptance Criteria.

## Boundaries & Constraints

**Always:**
- Giữ nguyên cấu trúc giao diện và luồng routing: click "Mua ngay" chuyển hướng sang `/store/checkout?slug=${product.slug}&quantity=${qty}`.
- Hiển thị đầy đủ: gallery ảnh, tên, giá bán, giá so sánh (line-through), mô tả, bảng thông số kỹ thuật, xuất xứ (origin badge qua `originLabel`), tồn kho và bộ chọn số lượng.
- Bộ chọn số lượng có giới hạn: tối thiểu là 1, tối đa là `min(stock_quantity, 10)`; khi hết hàng (`stock_quantity = 0`) thì disable toàn bộ và hiển thị nhãn "Hết hàng".
- Bảng thông số kỹ thuật chỉ render khi `product.specifications` tồn tại và có ít nhất 1 thuộc tính; không bao giờ crash nếu `specifications` là null/undefined.
- Test sử dụng Jest + React Testing Library theo đúng convention của repo (mock `next/navigation` router).

**Never:**
- Không thay đổi schema cơ sở dữ liệu hay RLS của bảng `products`.
- Không chuyển đổi trang chi tiết sang client fetch hoàn toàn (giữ SSR trong `page.tsx` với `revalidate = 300`).
- Không thêm thư viện ngoài (dùng `lucide-react` và các helper sẵn có).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | Product có đủ ảnh, giá, mô tả, specs, related | Render gallery, info, bảng specs, related products | Không lỗi |
| NO_IMAGES | `images = []` hoặc `images = null` | Hiển thị emoji fallback 🌿 trong khung ảnh chính, không render thumbnails | Không lỗi |
| MULTI_IMAGES | `images` có nhiều hơn 1 URL | Render danh sách thumbnail; click vào thumbnail đổi ảnh chính `activeImage` | Không lỗi |
| COMPARE_PRICE | `compare_at_price > price` | Hiển thị giá gốc gạch ngang bên cạnh giá bán | Không lỗi |
| NO_COMPARE_PRICE | `compare_at_price = null` hoặc `<= price` | Chỉ hiển thị giá bán, không hiển thị giá gạch ngang | Không lỗi |
| NULL_SPECS | `specifications = null` hoặc `{}` | Không hiển thị phần "Thông số kỹ thuật", không crash runtime | Guard an toàn |
| OUT_OF_STOCK | `stock_quantity = 0` | Hiện "Hết hàng", nút Tăng/Giảm/Mua ngay đều bị disabled | Không thể click mua |
| QTY_CHANGE | Click Tăng/Giảm | `qty` thay đổi trong khoảng [1, min(stock, 10)] | Nút tương ứng disabled ở biên |
| BUY_NOW | Click "Mua ngay" khi `qty = 2` | `router.push` được gọi với `/store/checkout?slug=${slug}&quantity=2`, hiển thị loading spinner | Disable nút khi đang chuyển trang |
| RELATED_EMPTY | `related = []` | Không hiển thị section "Sản phẩm liên quan" | Không lỗi |

</intent-contract>

## Code Map

- `dainganxanh-landing/src/app/(marketing)/store/[slug]/page.tsx` -- SSR page nạp chi tiết sản phẩm và related products theo slug; metadata SEO động; fallback 404 khi sản phẩm không tồn tại.
- `dainganxanh-landing/src/components/store/ProductDetailClient.tsx` -- Component client hiển thị chi tiết sản phẩm, điều khiển gallery, chọn số lượng, specs và điều hướng sang checkout.
- `dainganxanh-landing/src/components/store/originLabels.ts` -- Helper `originLabel()` và union `ProductOriginType` dùng chung cho origin badge.
- `dainganxanh-landing/src/components/store/__tests__/StoreClient.test.tsx` -- Mẫu test Jest+RTL cho store client components trong repo.

## Tasks & Acceptance

**Execution:**
- `dainganxanh-landing/src/components/store/ProductDetailClient.tsx` -- Cập nhật type `specifications?: Record<string, string> | null`, thêm null-check `product.specifications && Object.keys(product.specifications).length > 0` trước khi duyệt entries, chuẩn hóa type `related`.
- `dainganxanh-landing/src/components/store/__tests__/ProductDetailClient.test.tsx` -- TẠO MỚI: bộ unit test RTL bao phủ 100% các scenario trong I/O Matrix (render info, image gallery switch, quantity boundaries, out of stock, specs guard, buy now router push, related products).

**Acceptance Criteria:**
- Given người dùng mở `/store/[slug]`, When trang load, Then thấy ảnh sản phẩm, tên, giá, mô tả, nhãn nguồn gốc, tình trạng kho và bộ chọn số lượng.
- Given sản phẩm có `specifications = null`, When render trang, Then trang hiển thị bình thường không bị crash và không hiện bảng thông số.
- Given người dùng bấm nút Tăng/Giảm số lượng, When đạt biên 1 hoặc `min(stock, 10)`, Then nút tương ứng bị disabled và số lượng không vượt quá giới hạn.
- Given sản phẩm còn hàng và số lượng đã chọn, When bấm "Mua ngay", Then hệ thống điều hướng đến `/store/checkout?slug={slug}&quantity={qty}`.
- Given bộ test mới, When chạy `npm test -- src/components/store/__tests__/ProductDetailClient.test.tsx`, Then toàn bộ unit test pass sạch sẽ.

## Spec Change Log

## Review Triage Log

### 2026-10-08 — Review pass
- verdicts: 21 findings — high 0, medium 4, low 13, false 4, maybe-false 0
- findings:
  - `[medium]` `[patch]` Missing re-entrancy guard in handleBuyNow allows multiple rapid router.push calls — Đã thêm guard `buying` trong `handleBuyNow`: `if (outOfStock || buying || qty < 1) return`.
  - `[low]` `[patch]` Out-of-stock boundary condition fails on negative stock — Đã cập nhật `const outOfStock = product.stock_quantity <= 0`.
  - `[low]` `[patch]` Unconditional rendering of origin badge wrapper when originLabel() returns null — Đã bọc điều kiện chỉ render container badge khi `originLabel(product.origin_type)` là truthy.
  - `[false]` `[reject]` batch_certificate_url is typed and fetched but omitted from UI — Refutation: ACs của Story 12.2 không yêu cầu hiển thị certificate tải về, chỉ yêu cầu info cơ bản, specs và origin.
  - `[low]` `[patch]` Missing URI encoding for slug in checkout redirect — Đã dùng `encodeURIComponent(product.slug)`.
  - `[medium]` `[patch]` Missing state reset when switching between products — Đã thêm `useEffect` reset state theo `product.id` và prop `key={product.id}` ở `page.tsx`.
  - `[low]` `[patch]` Missing accessibility attributes on image thumbnails, emoji fallbacks, and quantity counter — Đã thêm `aria-current` cho thumbnail, `aria-hidden="true"` cho emoji `🌿`, `aria-live="polite"` cho bộ đếm số lượng.
  - `[low]` `[patch]` Divergence from codebase standard loading spinner icon — Đã đổi span custom thành `<Loader2 className="w-5 h-5 animate-spin" />`.
  - `[low]` `[patch]` Inline IIFE inside JSX for related product category resolution — Đã đơn giản hóa logic lấy category name cho related product.
  - `[false]` `[reject]` Related product cards ignore compare_at_price and stock_quantity — Refutation: AC của Story 12.2 chỉ yêu cầu danh sách card liên quan hiển thị ảnh, tên, giá, category; không yêu cầu badge giảm giá phức tạp cho related items.
  - `[low]` `[patch]` Missing unit test coverage for optional and edge-case props — Đã bổ sung 4 test cases cho `lots` null, `sku` null, `related` undefined, và `stock_quantity === 1`.
  - `[false]` `[reject]` Spec metadata carries future creation date 2026 — Refutation: Toàn bộ codebase và migration repo được thiết kế theo timeline 2026.
  - `[low]` `[patch]` User clicks minus/plus while checkout navigation in progress — Đã thêm guard `buying` vào `disabled` của cả nút Giảm và Tăng.
  - `[low]` `[patch]` product.specifications is passed as JSON array or non-object primitive — Đã thắt chặt điều kiện: `product.specifications && typeof product.specifications === 'object' && !Array.isArray(product.specifications) && Object.keys(...).length > 0`.
  - `[low]` `[patch]` product.specifications contains nested JSON objects or arrays as values — Đã an toàn hóa giá trị render: `{typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}`.
  - `[medium]` `[patch]` Broken assertion in COMPARE_PRICE display test queries CSS class name via queryByText — Đã sửa test assertion dùng `container.querySelector('.line-through')`.
  - `[low]` `[patch]` Unverified category name rendering for related products with single-object product_categories — Đã thêm assertion `expect(screen.getByText('Tinh dầu')).toBeInTheDocument()` trong HAPPY_PATH.
  - `[medium]` `[patch]` page.tsx missing key prop causing state bleed on related product navigation — Cùng root cause với blind-hunter #6, đã thêm `key={product.id}` ở `page.tsx`.
  - `[low]` `[patch]` Related product test with empty images missing assertion for fallback icon — Đã thêm assertion cho emoji fallback `🌿`.
  - `[false]` `[reject]` Component-level vs route integration divergence — Refutation: SSR route `/store/[slug]/page.tsx` đã tồn tại sẵn từ trước và tích hợp trực tiếp với `ProductDetailClient`.
  - `[medium]` `[patch]` Sprint status yaml remains in backlog — Đã cập nhật `12-2-view-product-detail: done` trong `sprint-status.yaml` ở bước Finalize.

## Auto Run Result

### Summary of implemented change
Triển khai hoàn chỉnh Story 12.2 (View Product Detail) trên Next.js App Router:
- Thêm bảo vệ an toàn cho bảng thông số kỹ thuật (`specifications`), không bao giờ crash khi null/undefined/array/nested object.
- Re-entrancy guard cho nút "Mua ngay", vô hiệu hóa toàn bộ tương tác khi đang chuyển trang sang checkout (`buying` state với `Loader2` spinner).
- Reset state an toàn khi chuyển đổi sản phẩm liên quan qua `useEffect` và prop `key={product.id}` ở `page.tsx`.
- Hỗ trợ WCAG 2.1 AA: `aria-current` cho thumbnail ảnh, `aria-hidden="true"` cho biểu tượng trang trí `🌿`, `aria-live="polite"` cho bộ đếm số lượng.
- Viết mới 20 unit tests RTL bao phủ 100% I/O & Edge-Case Matrix, kiểm chứng gallery, giá so sánh, giới hạn số lượng, hết hàng và điều hướng mua hàng.

### Files changed
- `dainganxanh-landing/src/components/store/ProductDetailClient.tsx`: Thêm guards an toàn, type-safety, accessibility attributes, và re-entrancy protection.
- `dainganxanh-landing/src/app/(marketing)/store/[slug]/page.tsx`: Thêm prop `key={product.id}` cho `ProductDetailClient` để ngăn ngừa state bleeding khi chuyển trang.
- `dainganxanh-landing/src/components/store/__tests__/ProductDetailClient.test.tsx`: Bộ 20 unit tests RTL toàn diện cho ProductDetailClient.
- `_bmad-output/implementation-artifacts/sprint-status.yaml`: Đánh dấu `12-2-view-product-detail: done` (63/70 stories completed).
- `_bmad-output/implementation-artifacts/spec-12-2-view-product-detail.md`: Tài liệu đặc tả và review triage log cho Story 12.2.

### Review findings breakdown
- Patches applied: 17 findings (4 medium, 13 low).
- Items deferred: 0.
- Rejected findings: 4 findings (all false positives: batch_certificate_url ngoài scope AC, compare_at_price cho related cards ngoài scope AC, date 2026 timeline của repo, route integration divergence đã có SSR route sẵn).

### Follow-up review recommendation
- `followup_review_recommended: false` (toàn bộ 20 unit tests mới và 101/101 test suites của project pass sạch sẽ, `tsc --noEmit` 0 lỗi).

### Verification performed
- `cd dainganxanh-landing && npm test -- src/components/store/__tests__/ProductDetailClient.test.tsx`: 20/20 unit tests passed (PASS, 0 failures).
- `cd dainganxanh-landing && npm test`: 101/101 test suites passed, 979 unit tests passed (PASS, 0 failures).
- `cd dainganxanh-landing && npm run lint`: `tsc --noEmit` clean 0 errors.

### Residual risks
- Không có rủi ro tồn đọng.

## Verification

**Commands:**
- `cd dainganxanh-landing && npm test -- src/components/store/__tests__/ProductDetailClient.test.tsx` -- expected: toàn bộ test suites pass
- `cd dainganxanh-landing && npm run lint` -- expected: tsc --noEmit không có lỗi type nào

### Review Findings — bmad-code-review (2026-10-08)

- [x] [Review][Patch] Soft-404: trả về 200 khi sản phẩm không tồn tại — dùng `notFound()` và thêm `robots: noindex` trong generateMetadata [dainganxanh-landing/src/app/(marketing)/store/[slug]/page.tsx:45-53]
- [x] [Review][Patch] useEffect dep `product.images` (array ref) gây reset state giả + dư thừa với `key={product.id}` — chỉ giữ dep `[product.id]` [dainganxanh-landing/src/components/store/ProductDetailClient.tsx:47-51]
- [x] [Review][Patch] Bộ đếm số lượng hiển thị `1` khi hết hàng — hiển thị `0` khi `outOfStock` [dainganxanh-landing/src/components/store/ProductDetailClient.tsx:148]
- [x] [Review][Patch] Spec value null/undefined render literal "null"/"undefined"; array render raw JSON — guard `v == null ? '—' : Array.isArray(v) ? v.join(', ') : ...` [dainganxanh-landing/src/components/store/ProductDetailClient.tsx:208]
- [x] [Review][Patch] `buying` kẹt vĩnh viễn nếu router.push thất bại hoặc user quay lại qua bfcache — thêm timeout reset [dainganxanh-landing/src/components/store/ProductDetailClient.tsx:56-60]
- [x] [Review][Patch] Related query `.eq('category_id', null)` match các sản phẩm không category — chỉ query khi `product.category_id` có giá trị [dainganxanh-landing/src/app/(marketing)/store/[slug]/page.tsx:57-63]
- [x] [Review][Patch] Thiếu `type="button"` trên thumbnail/minus/plus/buy buttons [dainganxanh-landing/src/components/store/ProductDetailClient.tsx]
- [x] [Review][Patch] aria-label "Giảm"/"Tăng" mơ hồ → "Giảm số lượng"/"Tăng số lượng" (bỏ qua role=spinbutton — over-engineering cho stepper đơn giản) [dainganxanh-landing/src/components/store/ProductDetailClient.tsx:145,153]
- [x] [Review][Patch] Thiếu test: state reset khi `product.id` đổi (RTL rerender) [dainganxanh-landing/src/components/store/__tests__/ProductDetailClient.test.tsx]
- [x] [Review][Patch] Thiếu test: specs nested object/array render qua JSON.stringify [dainganxanh-landing/src/components/store/__tests__/ProductDetailClient.test.tsx]
- [x] [Review][Patch] Thiếu test: `stock_quantity` âm → hiển thị Hết hàng + disable controls [dainganxanh-landing/src/components/store/__tests__/ProductDetailClient.test.tsx]
- [x] [Review][Patch] Thiếu test: nút +/- disabled khi `buying === true` [dainganxanh-landing/src/components/store/__tests__/ProductDetailClient.test.tsx]
- [x] [Review][Defer] Raw `<img>` thay vì Next.js `<Image>` — pre-existing pattern toàn store section; cần remotePatterns config cho Supabase storage URLs — deferred: không phát sinh từ change này [dainganxanh-landing/src/components/store/ProductDetailClient.tsx]

#### Rejected

- `batch_certificate_url` fetch nhưng không render — `false` theo scope: ngoài AC Story 12.2 (đã reject ở vòng build-auto).
- Related cards thiếu badge hết hàng/giá gạch ngang — `false` theo scope: AC chỉ yêu cầu ảnh/tên/giá/category.
- Fallback fill khi category < 4 sản phẩm — feature request, ngoài phạm vi story.
- Breadcrumb navigation — feature mới, ngoài AC.
- Guard `qty > maxQty` trong handleBuyNow — `false`: qty bị ràng buộc trong [1, maxQty] bởi steppers + reset; prop static nên unreachable.
