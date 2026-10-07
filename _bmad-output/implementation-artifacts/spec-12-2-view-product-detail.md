---
title: 'Story 12.2: View Product Detail'
type: 'feature'
created: '2026-10-08'
status: 'done'
review_loop_iteration: 0
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

| Finding | Severity | Recommendation | Action Taken |
|---------|----------|----------------|--------------|
| Missing re-entrancy guard in `handleBuyNow`: Rapid clicks before route navigation can trigger multiple `router.push` calls. | Medium | Thêm `if (outOfStock \|\| buying \|\| qty < 1) return` | Đã vá trong `ProductDetailClient.tsx:48` và bổ sung test |
| Quantity Minus/Plus buttons remain enabled during `buying` state. | Low | Thêm `buying` vào điều kiện disabled của nút Tăng/Giảm | Đã vá trong `ProductDetailClient.tsx:137,150` và bổ sung test |
| Brittle regex text assertion `queryByText(/line-through/)` queries CSS class name rather than element content. | Low | Sửa assertion thành `queryByText('line-through')` | Đã vá trong `ProductDetailClient.test.tsx` |

## Verification

**Commands:**
- `cd dainganxanh-landing && npm test -- src/components/store/__tests__/ProductDetailClient.test.tsx` -- expected: toàn bộ test suites pass
- `cd dainganxanh-landing && npm run lint` -- expected: tsc --noEmit không có lỗi type nào
