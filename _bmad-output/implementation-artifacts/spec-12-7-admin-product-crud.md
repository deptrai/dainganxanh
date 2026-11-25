---
title: 'Story 12.7 — Admin Product CRUD'
type: 'feature'
created: '2026-10-08'
status: 'done'
baseline_revision: 'c98b96c9d72db13aba5f9239aed0380210caf1c3'
review_loop_iteration: 0
followup_review_recommended: true
context: []
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Store bán sản phẩm trầm hương đã có bảng `products`, bucket `product-images` và trang storefront, nhưng admin chưa có cách nào tạo/sửa sản phẩm trong UI — phải sửa DB tay.

**Approach:** Thêm `/crm/admin/products` (list + create/edit form) với server actions `src/actions/adminProducts.ts` theo golden pattern `src/actions/blog.ts` (verifyAdmin → validate → service client → revalidatePath), upload ảnh client-side compress WebP + thumbnail qua `imageProcessing.ts` vào bucket `product-images` rồi lưu URL vào `images` jsonb.

## Boundaries & Constraints

**Always:**
- Role gate: page + mọi server action chỉ cho `['admin','super_admin']` — pattern `verifyAdmin()` trong `src/actions/blog.ts:7` (redirect/`{success:false,error}` khi không phải admin). Lot-scoped admin KHÔNG được quyền sản phẩm.
- Server-side validate đủ: `name` required, `slug` regex `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` + unique (update: exclude chính record), `category_id` uuid tồn tại trong `product_categories`, `price` int >0, `compare_at_price` null hoặc int >0, `stock_quantity` int >=0, `sku` optional, `status` ∈ `active|inactive|out_of_stock`, `origin_type` ∈ 3 enum của CHECK constraint, `images` array string URL, `specifications` object.
- Upload ảnh qua server action `uploadProductImage(formData)` → service role `storage.from('product-images').upload` + `getPublicUrl` (pattern `uploadBlogImage` `src/actions/blog.ts:209-246`); whitelist jpg/jpeg/png/webp, <=5MB, filename `{slug-or-id}/{uuid}.webp`.
- Client nén WebP trước khi upload qua `compressImage`/`generateThumbnail` trong `src/lib/imageProcessing.ts` (đã có sẵn, output WebP) — thumbnail dùng cho preview trong form.
- `images` lưu mảng string URL (storefront đọc `images[0]` — `StoreClient.tsx:50`, `ProductDetailClient.tsx:44`); KHÔNG đổi shape jsonb.
- Sau create/update: `revalidatePath('/store')`, `revalidatePath('/crm/admin/products')`, `revalidatePath('/store/[slug]','page')` hoặc slug cụ thể.
- Trang list + form dùng Vietnamese labels; table giống phong cách `OrderTable.tsx`/`AdminBookingTable.tsx` (tailwind emerald/gray).
- Tests mock supabase + verifyAdmin như pattern test hiện có.

**Never:**
- Không sửa schema/`products` table/migrations/bucket — đã đầy đủ.
- Không delete product (AC chỉ create/edit; out-of-stock/inactive qua status).
- Không quản lý `product_categories` hay `lots` — chỉ select.
- Không đổi storefront components hay shape `images[]`.
- Không thêm search/filter/pagination trên list — ít sản phẩm, sort `created_at desc` đủ.
- Không dùng raw `<img>` mới — tái dùng `PhotoUploader` hoặc pattern preview sẵn có.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| CREATE_OK | Form đủ fields hợp lệ | Insert `products`, redirect `/crm/admin/products` | — |
| UPDATE_OK | Edit form submit | Update row, revalidate list+detail | — |
| AUTH_DENY | role ≠ admin/super_admin | Page redirect; action `{success:false,error}` | verifyAdmin từ chối |
| VALIDATION | slug không hợp lệ / slug trùng / price <=0 / thiếu category | `{success:false,error}` tiếng Việt, không ghi DB | return error object |
| SKU_DUP | sku trùng unique DB | `{success:false,error}` từ 23505 | catch constraint error |
| UPLOAD_OK | file jpg/png <=5MB | Compress WebP → upload → URL push vào images[] | — |
| UPLOAD_BAD | sai type hoặc >5MB | `{success:false,error}` — không upload | return error object |
| IMG_ARRAY | Thêm/xóa ảnh trong form | images[] cập nhật theo thứ tự; images[0] là ảnh chính | — |
| LIST | Mở `/crm/admin/products` | Table: ảnh, tên, slug, category, giá, tồn kho, trạng thái, featured, nút Sửa + "Thêm sản phẩm" | empty state khi chưa có product |
| SLUG_SUGGEST | Gõ name, slug trống | Client auto-điền slug (NFD strip dấu, lowercase, hyphen) | user vẫn sửa tay được |
| SPECS | Thêm key-value spec rows | `specifications` jsonb object lưu đúng | bỏ row key rỗng |

</intent-contract>

## Code Map

- `dainganxanh-landing/src/actions/blog.ts` — golden: `verifyAdmin()`, slug check, service client insert/update, `uploadBlogImage` upload bucket + publicUrl, `revalidatePath`. COPY PATTERN.
- `dainganxanh-landing/src/actions/adminRooms.ts:30` — `verifyAdminRole()` trả `{userId,error}` variant. READ-ONLY tham khảo.
- `dainganxanh-landing/src/lib/imageProcessing.ts:67-101` — `compressImage` (WebP, 2MB, 2000px), `generateThumbnail` (300px WebP). REUSE.
- `dainganxanh-landing/src/components/admin/PhotoUploader.tsx` — multi-file picker + preview + remove, props `onPhotosSelected/onPhotoRemove/photos/maxFiles`. REUSE cho images field.
- `dainganxanh-landing/src/app/crm/admin/rooms/page.tsx` — golden admin list page: `createServerClient` getUser + service role `users.role` check → allowedRoles → render client component. Products chỉ cho `admin|super_admin`.
- `dainganxanh-landing/src/app/crm/admin/blog/new/page.tsx` + `src/components/admin/blog/BlogEditor.tsx` — golden create form page layout. READ-ONLY.
- `dainganxanh-landing/src/components/admin/AdminSidebar.tsx:26-37` — nav items; thêm "Sản phẩm" sau "Lịch phòng" (heroicons `ShoppingBagIcon` — kiểm tra imports hiện có của file).
- `supabase/migrations/20260530000001_eco_tourism_schema.sql:131-151` — `products` columns + CHECK enums (status, origin_type); `:458-509` bucket `product-images` public + `product_images_admin_upload` policy. READ-ONLY.
- `dainganxanh-landing/src/app/(marketing)/store/page.tsx:16-34` — select `product_categories` + products join (golden shape query).
- `dainganxanh-landing/src/types/database.types.ts` — `products` Row/Insert/Update types sẵn có.
- `dainganxanh-landing/src/lib/monitoring.ts` — `captureError` nếu cần log lỗi bất ngờ.

## Tasks & Acceptance

**Execution:**
- `dainganxanh-landing/src/actions/adminProducts.ts` -- TẠO MỚI server actions: `verifyAdmin()` (copy pattern blog), `uploadProductImage`, `createProduct`, `updateProduct(id)` -- validation + insert/update + upload bucket + revalidate.
- `dainganxanh-landing/src/app/crm/admin/products/page.tsx` -- TẠO MỚI list page (server): auth check → query products join `product_categories(name)` → table/empty-state -- AC list surface.
- `dainganxanh-landing/src/components/admin/AdminProductsTable.tsx` (hoặc inline nhỏ trong page nếu server-render đủ — chọn đơn giản hơn) -- render table rows + link Sửa -- theo style OrderTable.
- `dainganxanh-landing/src/app/crm/admin/products/new/page.tsx` -- TẠO MỚI: query `product_categories` → render `ProductForm` -- AC create surface.
- `dainganxanh-landing/src/app/crm/admin/products/[id]/edit/page.tsx` -- TẠO MỚI: query product + categories → `ProductForm` prefilled (notFound khi sai id) -- AC edit surface.
- `dainganxanh-landing/src/components/admin/ProductForm.tsx` -- TẠO MỚI client form: tất cả fields AC + PhotoUploader + compress WebP + slug auto-suggest từ name + spec key-value rows -- AC "set name, slug, category, price, stock, SKU, images, specs, origin".
- `dainganxanh-landing/src/components/admin/AdminSidebar.tsx` -- thêm nav "Sản phẩm" → `/crm/admin/products` -- discoverability.
- `dainganxanh-landing/src/actions/__tests__/adminProducts.test.ts` -- TẠO MỚI: cover AUTH_DENY/VALIDATION/SKU_DUP/UPLOAD_BAD/CREATE_OK/UPDATE_OK paths (mock supabase chains).
- `dainganxanh-landing/src/components/admin/__tests__/ProductForm.test.tsx` -- TẠO MỚI: SLUG_SUGGEST, IMG_ARRAY add/remove, SPECS row add/remove, submit gọi đúng action.

**Acceptance Criteria:**
- Given admin đăng nhập, when mở `/crm/admin/products`, then thấy bảng sản phẩm (tên, slug, category, giá, tồn, trạng thái) + nút thêm/sửa; sidebar có "Sản phẩm".
- Given form create/edit, when submit hợp lệ, then product được tạo/cập nhật với name, slug, category, price, stock, sku, images, specs, origin_type, status, is_featured.
- Given form chọn ảnh, when upload, then ảnh nén WebP client-side → upload bucket `product-images` → URL vào `images[]` (ảnh đầu là ảnh chính storefront hiển thị).
- Given user không phải admin, when gọi action/page, then bị từ chối/redirect.
- Given input không hợp lệ (slug trùng, price<=0, sku trùng, file sai type/>5MB), when submit, then nhận lỗi tiếng Việt, DB không đổi.
- `npm test` + `tsc --noEmit` xanh.

## Spec Change Log

## Review Triage Log

4 review layers (blind-hunter, edge-case, verification-gap, intent-alignment) trên `/tmp/spec-12-7-diff.diff` → 34 findings (BH×19, EC×9, VG×6, IA divergences — 0 defect).

- `[medium]` `[patch]` **23505 branch nuốt slug-collision** — `adminProducts.ts` create+update check `code==='23505' || msg.includes('sku')` trước nhánh slug → slug-dup trả nhầm 'Mã SKU đã tồn tại', nhánh slug là dead code. Fix: gate `code==='23505'` rồi inspect message (`slug`→slug msg, `sku`→sku msg, else 'Dữ liệu trùng lặp').
- `[medium]` `[patch]` **Role check 3 pages dùng user-scoped client** — `products/page.tsx`, `new/page.tsx`, `[id]/edit/page.tsx` query `users.role` qua `supabase` (RLS-dependent); golden `src/app/crm/admin/rooms/page.tsx:19-20` dùng `createServiceRoleClient()`. Fix: role check qua `serviceSupabase` (khai báo sớm, tái dùng cho query sau).
- `[low]` `[patch]` `.single()` → `.maybeSingle()` ×4 (category + slug checks create/update) — tránh PGRST116 noise trong logs.
- `[low]` `[patch]` Update non-existent id → `.single()` trả PGRST116 cryptic — thêm `!updateError && !updated` + map PGRST116 → 'Sản phẩm không tồn tại'.
- `[low]` `[patch]` Update revalidate `revalidatePath(\`/store/${slug}\`)` chỉ cover slug MỚI — đổi `revalidatePath('/store/[slug]', 'page')` (dynamic-route invalidation cover cả slug cũ; `/store/[slug]` `revalidate=300` → stale ≤5ph).
- `[low]` `[patch]` PhotoUploader `maxFiles={10}` bypass qua multi-batch (`uploaderPhotos` reset [] sau mỗi upload) — wrap `{images.length < 10 && (...)}` + `maxFiles={10 - images.length}`.
- `[low]` `[patch]` Upload hardcode `.webp` extension khi `compressImage` fail → file.type giữ nguyên png/jpg nhưng tên file .webp — ext theo mime (png/jpg/webp).
- `[low]` `[patch]` Thiếu `robots: { index: false }` trên 3 admin pages (convention `rooms/page.tsx:8`, `bookings/page.tsx:8`).
- `[low]` `[patch]` `PhotoIcon` unused import trong ProductForm.
- `[low]` `[patch]` `categoryName`: `pc[0]?.name` khi join trả array rỗng → undefined (thiếu ngoặc `|| 'Chưa phân loại'` chỉ áp nhánh phải).
- `[low]` `[patch]` `parseInput(null)` crash TypeError — `return input ?? {}`.
- `[low]` `[patch]` Tests: mock chain thêm `maybeSingle`; assert `.neq('id','prod-to-update')` cho slug-exclusion; +test update dup-slug; +test cover-reorder 'Đặt làm chính'.
- `[low]` `[reject]` `compare_at_price <= price` không validate — **đã có sẵn trong code** (`cap <= price` check ở cả create+update); reviewer đọc nhầm.
- `[low]` `[reject]` specs JSON parse nhận array — **đã có guard `!Array.isArray(parsed)`**; reviewer đọc nhầm.
- `[false]` `[reject]` coverImage `''` falsy → placeholder hiển thị đúng; upload error đã có fallback 'Lỗi upload ảnh (name)'; `String(v ?? '')` không ra "null".
- `[low]` `[reject]` int overflow 2^31 (lỗi PG vẫn surfaced); dup spec keys (dict semantics chấp nhận); lot_id FK (dropdown-limited); reserved_quantity không hiển thị (RPC semantics — stock đã trừ reserved); `setIsSubmitting` success-path (disabled-during-transition đúng UX, remount reset); thiếu `generateThumbnail` (compressImage đủ AC, thumbnail chỉ preview); `Partial<ProductInput>` overwrite footgun (caller duy nhất gửi full payload); coverage pages/table (generic ask).
- `[low]` `[defer]` `URL.createObjectURL` không revoke trong `PhotoUploader.tsx:43` — pre-existing shared component, ngoài scope story.
- `[low]` `[defer]` Orphan storage: ảnh xóa trong form / hủy form không cleanup bucket — deliberate scope, blog cũng vậy.
- `[low]` `[reject]` (intent-alignment) Divergences đọc theo Reading 2 (layered Next.js pattern) — mô tả, không defect; spec file sửa theo triage không cần thiết.

## Auto Run Result

- **Tóm tắt:** Story 12.7 hoàn chỉnh — admin product CRUD tại `/crm/admin/products` (list + new + edit), server actions `verifyAdmin` → validate VN → service client → revalidate, upload ảnh WebP qua bucket `product-images`, slug auto-suggest client + unique check server (create + update exclude-self), specs key-value editor, cover-image reorder.
- **Files changed:**
  - `dainganxanh-landing/src/actions/adminProducts.ts` — createProduct/updateProduct/uploadProductImage + verifyAdmin (fallback service khi user-scope fail); 23505 phân biệt slug/sku; maybeSingle; PGRST116 → 'Sản phẩm không tồn tại'; revalidate `/store/[slug]` page-level.
  - `dainganxanh-landing/src/components/admin/ProductForm.tsx` — form create/edit, slug suggest, specs rows, images array + cover reorder + PhotoUploader guard ≤10.
  - `dainganxanh-landing/src/components/admin/AdminProductsTable.tsx` — table list (thumb next/image, categoryName join array|object, stock màu ngưỡng).
  - `dainganxanh-landing/src/app/crm/admin/products/{page,new/page,[id]/edit/page}.tsx` — role gate `createServiceRoleClient` + `robots:{index:false}` + `force-dynamic`.
  - `dainganxanh-landing/src/lib/utils/formatters.ts` — re-export `formatVND` + `generateSlug`; `AdminSidebar.tsx` +menu item.
  - Tests: `src/actions/__tests__/adminProducts.test.ts` (26 tests), `src/components/admin/__tests__/ProductForm.test.tsx` (8 tests).
- **Review findings:** 34 — 2 medium + 12 low patched; 11 rejected (2 false-positive 'đã có sẵn', 9 low/không-đáng-sửa); 2 deferred (objectURL revoke pre-existing, orphan storage cleanup); 0 intent_gap/bad_spec → route toàn patch+defer.
- **Follow-up review recommendation:** `true` — 2 medium patched; rủi ro chưa verify: flow CRUD + upload ảnh trên browser/Supabase thật chỉ cover bằng jsdom unit tests (cần login admin).
- **Verification:** `npx tsc --noEmit` → 0 lỗi; `npx jest --runTestsByPath` 2 file → 34 pass; `npm test` → 110 suites / 1095 tests pass.
- **Residual risks:** chưa E2E live CRUD/upload trên dev Supabase; RLS `product_images_admin_upload` chưa verify live; product images `/images/products/*.jpg` 404 (pre-existing storefront issue).

## Review Triage Log (archive placeholder, kept for template parity)

## Design Notes

- **Vì sao copy pattern `blog.ts` thay vì refactor shared verifyAdmin:** 4 file actions đã có bản verify riêng — thêm bản thứ 5 khớp convention, refactor chung là việc khác.
- **Thumbnail chỉ preview:** `images[]` là `string[]` URL và storefront đọc `images[0]` — không có chỗ lưu thumb URL riêng; generate thumbnail phục vụ preview trong form (AC "thumbnail optimization"), không upload file thừa.
- **Không delete:** AC chỉ có create/edit; xóa/ngừng bán qua `status='inactive'|'out_of_stock'` — an toàn hơn vì `store_order_items` join products.
- **Slug auto-suggest client-only:** server vẫn validate regex + unique — gợi ý chỉ là UX.

## Verification

**Commands:**
- `cd dainganxanh-landing && npx jest --runTestsByPath "src/actions/__tests__/adminProducts.test.ts" "src/components/admin/__tests__/ProductForm.test.tsx"` -- expected: tests mới pass
- `cd dainganxanh-landing && npm test && npx tsc --noEmit` -- expected: toàn bộ suite xanh, 0 lỗi type
