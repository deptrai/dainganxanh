---
title: 'Story 12.1: Browse Products'
type: 'feature'
created: '2026-10-07'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: true
baseline_revision: '96cfcdd806ae4fef9cb1d3b6bab778b094d9ceca'
context:
  - 'dainganxanh-landing/src/components/store/StoreClient.tsx'
  - 'dainganxanh-landing/src/components/store/ProductDetailClient.tsx'
  - 'dainganxanh-landing/src/app/(marketing)/store/page.tsx'
  - 'dainganxanh-landing/src/components/crm/__tests__/BookingTable.test.tsx'
warnings: []
deferred:
  - summary: >-
      Không có test nào cover query server-side của page.tsx (select columns) —
      gap coverage tồn tại từ trước, story này chỉ mở rộng select thêm 2 cột.
    evidence: |-
      page.tsx chưa bao giờ có test SSR (cần mock supabase server client);
      verification-gap layer xác nhận không có verification gap trong phạm vi spec.
      Test page-level sẽ guard select columns khỏi drift.
    location: >-
      dainganxanh-landing/src/app/(marketing)/store/page.tsx:21-27
    severity: low
---

<intent-contract>

## Intent

**Problem:** Trang `/store` đã được build sẵn ngoài BMAD flow nhưng thiếu 2 yêu cầu trong ACs của Story 12.1: ô search chưa bao phủ trường `description` và product card chưa hiển thị origin badge; toàn bộ UI store cũng chưa có unit test nào.

**Approach:** Vá 2 gap trong `StoreClient.tsx` (mở rộng điều kiện search sang `description`, thêm origin badge tái sử dụng mapping `ORIGIN_LABELS` đang nằm ở `ProductDetailClient.tsx`), rồi bổ sung unit test cho `StoreClient` bao phủ render/filter/search/card fields.

## Boundaries & Constraints

**Always:**
- Giữ nguyên SSR + `revalidate = 3600` và query hiện tại trong `page.tsx` (`products` với `status='active'`, order `is_featured DESC, created_at DESC`; `product_categories` order `sort_order`). File này là READ-ONLY.
- Search không phân biệt hoa thường và phải khớp `name` **hoặc** `description` (giữ nguyên điều kiện `category.name` đang có — superset vẫn thỏa AC).
- Card sản phẩm hiển thị đủ: image, name, price (+ `compare_at_price` nếu có), stock status ("Hết hàng"), và origin badge với nhãn `ORIGIN_LABELS` hiện dùng tại `ProductDetailClient.tsx:25-28`.
- Test dùng Jest + React Testing Library theo convention sẵn có của repo (xem `src/components/crm/__tests__/`).

**Never:**
- Không thêm pagination hay chuyển filter/search sang server-side (dataset nhỏ, client-side đủ).
- Không thêm dependency mới, không đổi schema/RLS, không đụng trang `[slug]` và checkout.
- Không viết lại toàn bộ `StoreClient` — chỉ vá tối thiểu.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | Load `/store` | Hero + category pills + featured section + grid tất cả products | Không lỗi |
| SEARCH_NAME | `search` khớp `name` | Grid chỉ còn sản phẩm khớp | Không lỗi |
| SEARCH_DESC | `search` khớp `description` nhưng không khớp `name` | Sản phẩm đó vẫn hiển thị | Không lỗi |
| SEARCH_EMPTY | `search` không khớp gì | Không hiển thị card nào (giữ behavior rỗng hiện tại) | Không lỗi |
| CATEGORY_FILTER | Click pill một category | Grid chỉ còn sản phẩm của category đó | Không lỗi |
| ORIGIN_BADGE | `origin_type='cooperative_farm'` | Card hiện badge "Hợp tác xã nông dân" | `origin_type` null/không map được → không render badge |
| OUT_OF_STOCK | `stock_quantity=0` | Badge "Hết hàng" hiện cùng lúc với origin badge | Không lỗi |
| FEATURED | `is_featured=true` | Card nằm trong featured section + badge "Nổi bật" | Không lỗi |

</intent-contract>

## Code Map

- `dainganxanh-landing/src/app/(marketing)/store/page.tsx` — SSR + `revalidate = 3600` (dòng 5); query `product_categories` + `products` rồi render `<StoreClient />` (dòng 14–29); có metadata SEO (dòng 7–11). **AMENDED (xem Spec Change Log): select() được phép thêm `description, origin_type` — bắt buộc để search/badge hoạt động runtime; ngoài phần đó vẫn READ-ONLY.**
- `dainganxanh-landing/src/components/store/StoreClient.tsx` — **FILE CẦN SỬA.** `FilterBtn` category pills (dòng 28–40, 137–146); search input (dòng 126–134); `filtered` qua `useMemo` (dòng 86–100) hiện chỉ khớp `name`/`category.name`; `ProductCard` (dòng 42–80) hiển thị image/name/price/compare_at/stock — thiếu origin badge.
- `dainganxanh-landing/src/components/store/ProductDetailClient.tsx:25-28` — `ORIGIN_LABELS` mapping (`mature_partner_plantation`→'Vườn đối tác trưởng thành', `cooperative_farm`→'Hợp tác xã nông dân', `dainganxanh_harvest`→'Thu hoạch từ vườn Đại Ngàn Xanh'). Tách ra module chung để `ProductCard` tái sử dụng.
- `dainganxanh-landing/src/types/database.types.ts:1724` — alias `ProductRow` đã gen sẵn.
- `supabase/migrations/20260530000001_eco_tourism_schema.sql:131-152` — schema thật của `products` (cột `origin_type` TEXT, `images` JSONB array of URL strings, `status`, `is_featured`).
- `dainganxanh-landing/src/components/crm/__tests__/BookingTable.test.tsx` — convention test Jest+RTL của repo (mock pattern, render component, assert text).
- Ảnh: `product.images[0]` là URL string đầy đủ render thẳng vào `<img>`; fallback emoji 🌿 (`StoreClient.tsx:47-51`).

## Tasks & Acceptance

**Execution:**
- `dainganxanh-landing/src/components/store/originLabels.ts` — TẠO MỚI: export `ORIGIN_LABELS: Record<string, string>` (lấy nguyên mapping từ `ProductDetailClient.tsx:25-28`) — để `ProductCard` và `ProductDetailClient` dùng chung một nguồn.
- `dainganxanh-landing/src/components/store/ProductDetailClient.tsx` — đổi const cục bộ `ORIGIN_LABELS` thành import từ `./originLabels` (xóa block 25–28, giữ nguyên phần còn lại).
- `dainganxanh-landing/src/components/store/StoreClient.tsx` — trong `filtered` useMemo: thêm điều kiện `description?.toLowerCase().includes(q)`; trong `ProductCard`: render origin badge từ `ORIGIN_LABELS[p.origin_type]` (không render khi không map được).
- `dainganxanh-landing/src/components/store/__tests__/StoreClient.test.tsx` — TẠO MỚI: unit test toàn bộ scenario trong I/O Matrix (render sections, category filter, search name/description/empty, origin badge + null origin, out-of-stock, featured).

**Acceptance Criteria:**
- Given người dùng mở `/store`, When trang load xong, Then thấy hero, category pills, featured section và grid tất cả sản phẩm.
- Given danh sách sản phẩm, When gõ từ khóa chỉ khớp `description` (không khớp `name`), Then sản phẩm đó vẫn hiển thị trong grid.
- Given sản phẩm có `origin_type`, When card render, Then badge hiển thị đúng nhãn origin; khi `origin_type` không map được, Then không render badge.
- Given card `stock_quantity=0`, When render, Then badge "Hết hàng" và origin badge cùng hiển thị.
- Given bộ test mới, When chạy `npm test`, Then toàn bộ test StoreClient pass và không test nào khác hỏng.

## Spec Change Log

## Review Triage Log

### 2026-10-07 — Review pass
- verdicts: 16 findings — high 0, medium 6, low 9, false 1, maybe-false 0
- findings:
  - `[medium]` `[bad_spec]` Spec READ-ONLY page.tsx mâu thuẫn diff (blind-hunter #1 + edge-case-hunter #1 + intent-alignment divergence 4, cùng root cause) — code sửa select() là bắt buộc để AC hoạt động; spec over-constraint. Amendment đã ghi trong Spec Change Log, code conforms spec đã sửa — không loopback (re-derivation là no-op).
  - `[medium]` `[patch]` Search input thiếu accessible name, vi phạm WCAG 2.1 AA (blind-hunter #2) — đã thêm `aria-label="Tìm kiếm sản phẩm"` vào input (StoreClient.tsx:140).
  - `[low]` `[patch]` Spec Verification baseline 945 stale (blind-hunter #3) — đã cập nhật 958 tests / 100 suites.
  - `[low]` `[patch]` Dead render không assert trong test unmapped-origin (blind-hunter #4) — đã xóa render/unmount vô nghĩa, giữ case unmapped với cast `as never`.
  - `[medium]` `[patch]` originLabels.ts `Record<string, string>` bỏ type-safety, guard luôn truthy-by-construction (blind-hunter #5) — đã type `Record<ProductOriginType, string>` + export union; ProductDetailClient.origin_type và StoreClient.origin_type dùng union.
  - `[low]` `[patch]` renderStore fixtures `unknown[]` + `as never` tắt type-check (blind-hunter #6) — đã type `Product[]`.
  - `[low]` `[patch]` Featured product render 2 section chưa test (blind-hunter #7) — thêm test `getAllByText(...)).toHaveLength(2)`.
  - `[low]` `[patch]` Search theo category.name được bảo giữ nhưng không có regression test (blind-hunter #8) — thêm test 'matches product by category name'.
  - `[low]` `[reject]` Origin badge + Nổi bật badge cùng render chưa test vị trí không chồng (blind-hunter #9) — CSS class tĩnh trong JSX, không logic; test sẽ assert styling constants (brittle, giá trị thấp; unlikely users meet defect).
  - `[low]` `[patch]` Double blank line residue ở ProductDetailClient (blind-hunter #10) — đã dọn.
  - `[low]` `[patch]` originLabels.ts indent 2-space lệch convention 4-space (blind-hunter #11) — đã chuẩn hóa.
  - `[medium]` `[bad_spec]` page.tsx READ-ONLY violation (edge-case-hunter #1) — cùng root cause với row 1, chung amendment.
  - `[medium]` `[patch]` sprint-status.yaml vẫn backlog cho 12-1 dù story done (intent-alignment divergence 1) — đã update `12-1-browse-products: done` tại finalize.
  - `[false]` Diff là gap-fix không phải greenfield (intent-alignment divergence 2) — refutation: spec định nghĩa rõ story là gap-fill (store đã build sẵn ngoài BMAD, ACs nhắm đúng 2 gap); không có bad outcome.
  - `[low]` `[defer]` Query server-side page.tsx không được test (intent-alignment divergence 3) — pre-existing gap (page chưa từng có test), story chỉ thêm 2 cột; xem frontmatter `deferred`.
  - `[medium]` `[patch]` (intent-alignment divergence 4) — trùng root cause row 1, chung amendment.

## Auto Run Result

**Summary:** Gap-fill Story 12.1 Browse Products — mở rộng search `/store` sang `description`, thêm origin badge trên product card (tái sử dụng ORIGIN_LABELS), extract shared module `originLabels.ts` type chặt, thêm `description, origin_type` vào select() của page.tsx (amended), bổ sung 13 unit tests StoreClient.

**Files changed:**
- `dainganxanh-landing/src/components/store/originLabels.ts` — mới: shared ORIGIN_LABELS + union ProductOriginType.
- `dainganxanh-landing/src/components/store/StoreClient.tsx` — search thêm description; origin badge; aria-label; Product type mở rộng.
- `dainganxanh-landing/src/components/store/ProductDetailClient.tsx` — import ORIGIN_LABELS/ProductOriginType từ module chung; dọn residue.
- `dainganxanh-landing/src/app/(marketing)/store/page.tsx` — select() thêm description, origin_type (amendment).
- `dainganxanh-landing/src/components/store/__tests__/StoreClient.test.tsx` — mới: 13 tests cover toàn bộ I/O Matrix.
- `_bmad-output/implementation-artifacts/epic-12-context.md` — mới: epic context (step-01).
- `_bmad-output/implementation-artifacts/spec-12-1-browse-products.md` — spec + triage log.

**Review findings breakdown:** 16 findings — 9 patch áp dụng (aria-label, type union, fixtures type, dead render, 2 test mới, 2 style nits, baseline doc), 1 bad_spec amendment (page.tsx READ-ONLY → authorize select columns, đã log Change Log), 1 defer (page-level test gap, frontmatter), 1 reject (badge CSS test — brittle), 1 false (gap-fix scope — by design), 3 rows trùng root cause READ-ONLY.

**Follow-up review recommendation:** true — rủi ro chưa verify: union `ProductOriginType` hardcode 3 giá trị khớp DB CHECK constraint; nếu schema thêm origin_type mới, badge im lặng ẩn (guard `&&` che luôn). Cân nhắc test integration hoặc derive type từ `ProductRow['origin_type']` khi chạm Epic 12 story sau.

**Verification:** `npm run lint` (tsc --noEmit) 0 lỗi; `npm test` 958/958 pass, 100/100 suites; lens_diagnostics full trên các file sửa — 0 diagnostics; matrix audit 8/8 rows có test cover và pass.

**Residual risks:** (1) union origin_type drift với DB CHECK (xem follow-up); (2) page.tsx query chưa có test (deferred); (3) badge overlay CSS chưa test vị trí (rejected, cosmetic).

- **Amendment (step-04 review):** Constraint READ-ONLY trên `page.tsx` là over-constraint của planning — query `select()` thiếu `description, origin_type` khiến search-by-description và origin badge no-op runtime. Đã authorize thêm 2 cột vào `select()` (dòng 21–27); mọi phần khác của file vẫn không đổi.
- **Review fixes (step-04):** `originLabels.ts` type chặt `Record<ProductOriginType, string>` + export union `ProductOriginType`; `StoreClient.Product.origin_type` dùng union thay `string`; search input thêm `aria-label="Tìm kiếm sản phẩm"` (WCAG 2.1 AA); test fixtures type theo `Product` (bỏ `unknown[]` + `as never`); xóa dead render trong test unmapped-origin; thêm 2 test: featured dual-render (2 section) + search theo `category.name`.
- **Baseline cập nhật:** suite hiện 958 tests / 100 suites (945 ban đầu + 13 tests StoreClient).

## Review Triage Log

## Design Notes

- Vá gap tối thiểu thay vì viết lại: page/component đã đúng AC phần lớn; chỉ search-scope và origin badge còn thiếu.
- `ORIGIN_LABELS` extract sang `originLabels.ts` để tránh duplicate mapping giữa card và detail (2 consumer = đủ lý do tách module nhỏ).
- Stock badge hiện render `Hết hàng` khi `stock_quantity === 0` (`StoreClient.tsx:57-61`) — giữ nguyên.

## Verification

**Commands:**
- `cd dainganxanh-landing && npm run lint` -- expected: `tsc --noEmit` 0 lỗi.
- `cd dainganxanh-landing && npm test -- StoreClient` -- expected: test mới pass.
- `cd dainganxanh-landing && npm test` -- expected: toàn bộ suite pass (958 tests / 100 suites).
