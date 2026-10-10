---
title: 'Story 14.4: Content Database i18n, Admin VI/EN Entry & Dynamic Sitemap'
type: 'feature'
created: '2026-10-10'
status: 'in-review'
review_loop_iteration: 0
followup_review_recommended: false
context: ['_bmad-output/implementation-artifacts/epic-14-context.md']
warnings: ['oversized']
deferred: []
baseline_revision: '3101fcd93b5b3c19953d42dcbb1d2550cf77ff47'
---

<intent-contract>

## Intent

**Problem:** Toàn bộ content DB (`products`, `product_categories`, `rooms`, `lots`, `notifications`, `email_templates`, `posts`) chỉ có 1 cột text tiếng Việt — route `/en` vẫn render VI; admin không có chỗ nhập bản EN; `sitemap.ts` thiếu `alternates`/hreflang cho blog post và chưa có route `/store`, `/eco-tourism`.

**Approach:** Migration thêm `translations` JSONB (mirror `vi`) cho 6 bảng + bảng `post_translations` (slug per-locale) cho `posts`; helper `getTranslatedField` resolve field-level fallback về `vi`; tab VI/EN trong `ProductForm`/`BlogEditor`/`LotForm` kèm translation status badge; sitemap mở rộng alternates cho blog/store/eco-tourism với slug đúng per-locale.

## Boundaries & Constraints

**Always:**
- VI canonical nằm ở cột chính hiện có (`name`, `title`...); `translations.vi` mirror các cột text (backfill + server action re-sync mỗi lần save); `translations.en` chỉ ghi khi admin nhập — **strip empty string** trước khi lưu để fallback hoạt động.
- Helper dùng chung `getTranslatedField(record, field, locale, fallbackLocale='vi')` — pure function, dùng được server/client/sitemap. Nghiêm cấm fallback tự phát trong JSX.
- Mọi UI string mới (tabs, badge, labels) qua catalog keys `admin.*` — zero hardcode; VI catalog giữ văn bản hiện có.
- Migration đặt CẢ hai nơi: `supabase/migrations/` và `dainganxanh-landing/supabase/migrations/` (convention mirror từ story 14.1), naming `YYYYMMDDHHMMSS_*.sql`.
- `posts.slug` VI giữ canonical; `post_translations.slug` UNIQUE per `(locale, slug)` + UNIQUE `(post_id, locale)`; `locale TEXT CHECK (locale IN ('vi','en'))` theo precedent `20261009010000_add_locale_columns.sql`.
- Server actions giữ pattern hiện tại: `verifyAdmin()`, validate thủ công (KHÔNG thêm zod), `revalidatePath` sau mutate.
- Test mới dùng `renderWithIntl`; assert theo catalog keys, không hardcode EN string trong test VI.

**Never:**
- KHÔNG drop/rename cột chính; KHÔNG đổi URL canonical VI hay public route structure.
- KHÔNG implement notification render bằng `data.templateKey` (đó là Story 14.5) — story này chỉ `ALTER COLUMN title DROP NOT NULL` + null-guard render.
- KHÔNG dựng admin UI nhập liệu mới cho `rooms`, `product_categories`, `notifications`, `email_templates` (không có form hiện tại — chỉ DB column + badge nơi list đã tồn tại).
- KHÔNG tạo per-locale slug cho products/categories/rooms/lots — slug share giữa 2 locale (AC chỉ định `post_translations.slug` cho posts).
- KHÔNG dịch `products.specifications` (JSONB key-value, chủ yếu số/đơn vị) — VI-only story này.
- KHÔNG thêm dependency mới — TipTap v3 đã có sẵn (`package.json:28-32`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | `GET /en/store/<slug>` product có `translations.en.name` | Render name/description EN; VI route không đổi | — |
| FALLBACK | `GET /en/store/<slug>` product chưa có EN | Render VI content, không crash, không trống field | — |
| BLOG_EN_SLUG | `GET /en/blog/<en-slug>` có row `post_translations(en)` | Render EN title/excerpt/content/meta | — |
| BLOG_VI_FALLBACK | `GET /en/blog/<vi-slug>` post chưa có EN row | Render VI content; metadata canonical đúng | 404 nếu slug không khớp cả 2 |
| SAVE_EMPTY_EN | Admin save EN tab toàn empty string | Strip hết → `translations.en` không được ghi; badge "VI only" | — |
| PARTIAL_EN_ROW | `post_translations` en thiếu `title` hoặc `slug` | Action reject, trả error rõ | Validation error trước khi insert |
| NOTIF_NULL | `notifications.title = null` | `NotificationBell` render an toàn (guard), không crash | — |
| HELPER_EDGE | `getTranslatedField` với `translations` null / locale thiếu / field thiếu / en empty-string | Fallback chain `translations[locale] → translations[vi] → record[field]` | Không throw |
| MIGRATION | Bảng đã có data | Backfill `translations.vi` mirror các cột text hiện tại | Idempotent (`IF NOT EXISTS`/`ON CONFLICT`) |

</intent-contract>

## Code Map

- `supabase/migrations/` + `dainganxanh-landing/supabase/migrations/` -- 2 nơi đặt migration; precedent `20261009010000_add_locale_columns.sql` (locale TEXT CHECK IN ('vi','en')).
- `supabase/migrations/20260530000001_eco_tourism_schema.sql:32,108,131` -- schema `rooms`(name,description), `product_categories`(name,slug,description,image_url), `products`(name,slug,description,specifications JSONB); seed 4 categories L121-127: `nuoc-hoa`, `tinh-dau`, `huong-lieu`, `thu-cong` → backfill `translations.en` inline.
- `supabase/migrations/20260407000000_baseline_from_remote.sql:409,470,492,585` -- `email_templates`(template_key,subject,html_body), `lots`(name,region,description), `notifications`(title NOT NULL,body nullable,data JSONB), `posts`(title,slug,content,excerpt,meta_title,meta_desc,tags).
- `dainganxanh-landing/src/lib/supabase/server.ts:5-52` -- `createServerClient()` (auth) / `createServiceRoleClient()` (public pages + admin actions bypass RLS).
- `dainganxanh-landing/src/types/database.types.ts` -- generated types; cập nhật `translations` + `post_translations` (regen nếu có tooling, else sửa tay theo format sẵn có).
- `dainganxanh-landing/src/lib/translations.ts` (MỚI) -- `getTranslatedField` + `hasEnTranslation(record)` cho badge.
- `dainganxanh-landing/src/actions/adminProducts.ts:142-260,262-370` -- `createProduct`/`updateProduct`; merge `translations` vào payload.
- `dainganxanh-landing/src/actions/blog.ts:24-95,97-175` -- `createPost`/`updatePost`; upsert/delete row `post_translations` locale 'en'.
- `dainganxanh-landing/src/actions/lots.ts:68-135` -- `createLot`/`updateLot`; merge `translations`.
- `dainganxanh-landing/src/components/admin/LocaleTabs.tsx` (MỚI) -- tab VI (default) / EN shared component, labels qua `useTranslations('admin.translation')`.
- `dainganxanh-landing/src/components/admin/ProductForm.tsx:42-65,268,400` -- name/description → tab EN counterpart; specifications giữ VI-only.
- `dainganxanh-landing/src/components/admin/blog/BlogEditor.tsx:41-50,163,340-439` -- TipTap `useEditor`; EN tab: title, slug, excerpt, content (serialize/swap HTML khi đổi tab), meta_title, meta_desc.
- `dainganxanh-landing/src/components/admin/CreateLotForm.tsx:14-22` + `EditLotForm.tsx:24-33` -- EN tab: name, description, region.
- `dainganxanh-landing/src/components/admin/TranslationBadge.tsx` (MỚI) -- "VI only" / "VI + EN"; chèn tại `AdminProductsTable.tsx:123-132`, `app/[locale]/crm/admin/blog/page.tsx:78-83`, `app/[locale]/crm/admin/lots/page.tsx:260-264`, `RoomCalendarClient.tsx:581-585`.
- `dainganxanh-landing/src/app/[locale]/(marketing)/store/page.tsx:31-43` + `store/[slug]/page.tsx:10-85` -- select thêm `translations`, apply `getTranslatedField` (name, description, category name).
- `dainganxanh-landing/src/app/[locale]/(marketing)/blog/page.tsx:47-90` + `blog/[slug]/page.tsx:22-105` -- en: join `post_translations` theo slug, fallback `posts.slug`; `generateStaticParams`/`generateMetadata` cover cả 2 locale.
- `dainganxanh-landing/src/app/[locale]/(marketing)/eco-tourism/page.tsx:61-125` + `[lotId]/page.tsx:108-160` -- apply helper cho `lots.name/description`, `rooms.name/description`.
- `dainganxanh-landing/src/app/sitemap.ts:5-70` -- static entries đã có alternates; thêm `/store`, `/store/[slug]` (products active), `/eco-tourism`, `/eco-tourism/[lotId]`; blog `blogPages` gắn alternates vi/en/x-default với slug per-locale.
- `dainganxanh-landing/src/lib/supabase/realtime.ts:13-24` -- `Notification` interface: `title`/`body` → nullable.
- `dainganxanh-landing/src/components/crm/NotificationBell.tsx:53-56,229-234` -- null-guard title/body (giữ hành vi hiện tại khi non-null; browser `new Notification` chỉ khi title non-null).
- `dainganxanh-landing/src/i18n/request.ts:23-45` -- domain `admin` đã đăng ký DOMAINS + deepMerge — chỉ thêm keys vào `messages/{vi,en}/admin.json`.
- `dainganxanh-landing/src/test-utils/renderWithIntl.tsx:50` -- test wrapper chuẩn.

## Tasks & Acceptance

**Execution:**

- `supabase/migrations/20261010HHMMSS_content_i18n.sql` + mirror `dainganxanh-landing/supabase/migrations/` -- `ALTER TABLE` 6 bảng thêm `translations JSONB NOT NULL DEFAULT '{}'`; backfill `translations = jsonb_build_object('vi', jsonb_build_object(<mỗi cột text>))`; `ALTER TABLE notifications ALTER COLUMN title DROP NOT NULL`; `CREATE TABLE post_translations` (id uuid pk, post_id REFERENCES posts ON DELETE CASCADE, locale CHECK IN ('vi','en'), slug, title, excerpt, content, meta_title, meta_desc — `UNIQUE(locale, slug)`, `UNIQUE(post_id, locale)`, index `(post_id)`); RLS: `public read` join posts published, `admin all` `is_admin()` — clone pattern `posts`; UPDATE `translations.en` cho 4 category seed (`nuoc-hoa`→"Agarwood Perfume", `tinh-dau`→"Agarwood Essential Oil", `huong-lieu`→"Incense & Agarwood Sticks", `thu-cong`→"Handicrafts").
- `src/lib/translations.ts` (MỚI) -- `getTranslatedField<T>(record: {translations?: JsonMap|null} & Record<string,unknown>, field: string, locale: string, fallbackLocale='vi')` + `hasEnTranslation(record, fields[]): boolean` — strip/empty-string semantics theo I/O matrix.
- `src/types/database.types.ts` -- thêm `translations: Json` vào 6 bảng Row/Insert/Update + table `post_translations` (hoặc regenerate nếu repo có script gen types — kiểm `package.json` scripts).
- `src/lib/supabase/realtime.ts` + `src/components/crm/NotificationBell.tsx` -- `title: string | null`; guard render + `new Notification` chỉ khi title non-null.
- `src/actions/adminProducts.ts` -- `ProductInput` + `translationsEn?: {name?, description?}`; payload `translations` = `{vi: mirror từ cột chính, ...(en non-empty ? {en} : {})}` — merge không đọc lại row (vi luôn derive từ payload).
- `src/actions/lots.ts` -- cùng pattern: `name`, `description`, `region` en.
- `src/actions/blog.ts` -- `createPost`/`updatePost` nhận `en?: {slug,title,excerpt,content,meta_title,meta_desc}`; all-empty → không insert / delete row en hiện có; validate slug+title bắt buộc nếu có bất kỳ en field nào; slug format check theo `SLUG_REGEX` sẵn có.
- `src/components/admin/LocaleTabs.tsx` (MỚI) -- controlled tabs `vi|en`, vi default, dot indicator khi en có content; labels qua `t('admin.translation.*')`.
- `src/components/admin/ProductForm.tsx` -- VI tab = fields hiện tại; EN tab = name, description; truyền `translationsEn` vào submit payload.
- `src/components/admin/blog/BlogEditor.tsx` -- EN tab: title, slug, excerpt, content (TipTap instance thứ 2 hoặc swap `editor.commands.setContent` khi đổi tab — serialize HTML vi trước khi switch), meta_title, meta_desc.
- `src/components/admin/CreateLotForm.tsx` + `EditLotForm.tsx` -- EN tab: name, description, region.
- `src/components/admin/TranslationBadge.tsx` (MỚI) -- prop `hasEn: boolean`; keys `admin.translation.badge.viOnly`/`viEn`; chèn 4 chỗ trong Code Map — list pages select thêm `translations` / `post_translations` flag từ server, KHÔNG fetch riêng client.
- `src/app/[locale]/(marketing)/store/page.tsx` + `store/[slug]/page.tsx` -- select `translations`; render name/description/category qua `getTranslatedField(field, locale)`; metadata cũng localized.
- `src/app/[locale]/(marketing)/blog/page.tsx` + `blog/[slug]/page.tsx` -- `[slug]` resolve: thử `post_translations(locale=current, slug)` → miss thì `posts.slug` (VI fallback); `generateStaticParams` yield cả vi slugs (posts) lẫn en slugs (post_translations); index en overlay `title/excerpt` từ `post_translations` theo `post_id`.
- `src/app/[locale]/(marketing)/eco-tourism/page.tsx` + `[lotId]/page.tsx` -- apply helper cho `lots.name/description`, `rooms.name/description`.
- `src/app/sitemap.ts` -- thêm entries `/store`, `/eco-tourism` static; per-product `/store/[slug]` và per-lot `/eco-tourism/[lotId]`; blog posts: alternates `{vi: /blog/<vi-slug>, en: /en/blog/<en-slug ?? vi-slug>, 'x-default': /blog/<vi-slug>}` — không trỏ slug chưa tồn tại (en slug chỉ khi có row).
- `messages/{vi,en}/admin.json` -- namespace `admin.translation.*`: `tabVi`("Tiếng Việt"/"Vietnamese"), `tabEn`, `badge.viOnly`("Chỉ có VI"/"VI only"), `badge.viEn`("VI + EN"), labels cho EN fields ("Tên (EN)"/"Name (EN)"...), BlogEditor en-section labels.
- Tests: `src/lib/__tests__/translations.test.ts` (MỚI — cover toàn bộ I/O matrix helper edge cases); `LocaleTabs`/`TranslationBadge` test qua `renderWithIntl`; cập nhật `ProductForm`/`BlogEditor` test nếu assert bị vỡ; `messages-parity.test.ts` phải pass với keys mới.

**Acceptance Criteria:**

- Given migration đã apply, when inspect DB, then `products`/`product_categories`/`rooms`/`lots`/`notifications`/`email_templates` có `translations` JSONB chứa `vi` mirror; `post_translations` tồn tại với `UNIQUE(locale,slug)`; `notifications.title` nullable.
- Given admin edit product, when mở form, then thấy tab VI (mặc định)/EN — nhập EN name+description, save, `GET /en/store/<slug>` render EN; `/store/<slug>` (vi) vẫn render VI.
- Given post có bản EN, when `GET /en/blog/<en-slug>`, then render EN content + meta; when `GET /en/blog/<vi-slug>` post chưa có EN, then render VI fallback — không 404 trừ khi slug không tồn tại cả 2 nơi.
- Given product/post chưa dịch, when xem admin list (products table, blog list, lots, room calendar), then badge "VI only"; sau khi thêm EN → "VI + EN".
- Given `sitemap.xml`, when fetch, then blog posts có `alternates` vi/en/x-default với slug đúng per-locale; có entries cho `/store`, `/store/<slug>` mỗi product active, `/eco-tourism`, `/eco-tourism/<lotId>` mỗi lot — không URL nào trỏ slug chưa tồn tại.
- Given `cd dainganxanh-landing && npx tsc --noEmit && npx jest`, when chạy, then exit 0 và all suites green.

## Spec Change Log

## Review Triage Log

## Design Notes

- **`translations.vi` mirror + sync-on-write:** AC yêu cầu "backfilled with vi content" — mirror giữ helper đồng nhất (`translations[locale]?.[field] ?? translations[fallback]?.[field] ?? record[field]`, fallback `'vi'`). Server action re-sync `translations.vi` từ payload cột chính mỗi lần save → không cần read-merge, không stale. `translations.en` strip empty-string trước khi ghi.
- **`post_translations` chỉ chứa non-VI:** `posts` là VI canonical (slug, title, content...). EN row tồn tại ⇔ post có bản dịch. `/en/blog/<slug>` resolve: `post_translations(en).slug` trước, miss → `posts.slug` render VI fallback (theo "fallback về vi ở mọi tầng" của epic). `generateStaticParams` cần union cả 2 nguồn slug.
- **Slug share cho products/categories/rooms/lots:** AC chỉ định slug per-locale qua `post_translations`; JSONB `translations` không có slug → `/en/store/<slug>` dùng chung slug VI. "Slug đúng per-locale" trong AC sitemap áp cho posts; products/lots dùng slug share (URL tồn tại cho cả 2 locale).
- **Badge data flow:** list page (server) select thêm `translations`/`post_translations` rồi truyền `hasEn` boolean xuống badge — tránh N+1 query và client fetch riêng. Posts list: `posts` join `post_translations` (locale='en') hoặc RPC exists.
- **Notifications nullable:** chỉ `title` cần `DROP NOT NULL` (`body` đã nullable). Producers hiện tại vẫn ghi title/body VI → runtime không đổi; `templateKey` render là scope Story 14.5, story này chỉ null-guard Bell để an toàn type.
- **TipTap EN content:** BlogEditor giữ 1 editor + serialize `getHTML()` của locale đang edit vào state trước khi đổi tab, `setContent` khi switch — tránh 2 instance TipTap đồng thời (nhẹ hơn, ít state bug hơn).

## Verification

**Commands:**
- `cd dainganxanh-landing && npx tsc --noEmit` -- expected: exit 0
- `cd dainganxanh-landing && npx jest` -- expected: all suites green (kể cả `messages-parity`, tests mới)
- `cd dainganxanh-landing && npm run build` -- expected: build OK, `generateStaticParams` không throw

**Manual checks (if no CLI):**
- Apply migration trên Supabase staging/local: `select translations from products limit 1` → `{"vi": {...}}`; `select * from post_translations` → schema đúng; `notifications.title` accepts NULL.
- Mở `/en/store/<slug>` (product có EN) → text EN; product chưa dịch → VI fallback; `view-source` kiểm `alternates` trong metadata + `sitemap.xml` entries.
