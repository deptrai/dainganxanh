---
title: 'Story 14.1: i18n Foundation — Routing, Middleware, Locale Schema & Switcher'
type: 'feature'
created: '2026-10-09'
status: 'in-review'
review_loop_iteration: 0
baseline_revision: '966ce8698c5898f1febca1130ea6f6045b6b2150'
followup_review_recommended: false
context:
  - '_bmad-output/implementation-artifacts/epic-14-context.md'
warnings:
  - oversized
deferred: []
---

<intent-contract>

## Intent

**Problem:** Toàn bộ app hiện chỉ có tiếng Việt hardcode — chưa có nền tảng routing/schema nào để phục vụ song ngữ VI/EN, chặn mọi story i18n còn lại của Epic 14.

**Approach:** Dựng nền tảng `next-intl`: migrate App Router tree vào `src/app/[locale]/` (giữ URL VI không prefix, `/en` as-needed), compose middleware theo thứ tự next-intl → Supabase auth → CSP, thêm cột `locale` vào schema + ghi snapshot lúc tạo đơn, language switcher ghi cookie + `users.locale`, sitemap alternates cho static routes, và trang landing làm pilot dịch end-to-end.

## Boundaries & Constraints

**Always:**
- `localePrefix: 'as-needed'` — URL VI giữ nguyên không prefix (`/` = vi), `/en/...` cho English; backward-compat SEO.
- Tree move: `(marketing)/`, `crm/`, `page.tsx` + `layout.tsx` root → dưới `src/app/[locale]/`. Giữ NGUYÊN ngoài `[locale]`: `api/`, `(auth)/auth/callback` (OAuth redirect URI đã đăng ký Supabase), `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `icon*.png`.
- Middleware order: next-intl resolve locale + response → Supabase `getUser()` refresh + CRM guard → CSP/security headers. Guard regex `^/(?:[a-z]{2}/)?crm`; redirect login giữ locale (`/en/crm` → `/en/login?redirect=/en/crm` — giữ tên param `redirect` hiện có); matcher loại trừ `/api/`.
- Negotiation: prefix → cookie `NEXT_LOCALE` → default `vi`. `Accept-Language` KHÔNG tự đổi locale (tối đa hint sau này). Logged-in: `users.locale` (DB) override cookie.
- Schema: `users.locale`, `orders.locale`, `store_orders.locale`, `room_bookings.locale` — `text NOT NULL DEFAULT 'vi'` + CHECK `IN ('vi','en')`. Migration file mới theo pattern `YYYYMMDDHHMMSS_*.sql`.
- API routes nằm ngoài `[locale]` → lấy locale từ cookie `NEXT_LOCALE` (fallback `'vi'`), ghi vào insert/upsert đơn hàng.
- `[locale]/layout.tsx`: `<html lang={locale}>`, `generateStaticParams()` → `[{locale:'vi'},{locale:'en'}]`, `setRequestLocale`, `NextIntlClientProvider`. `next.config.js` (CommonJS) wrap `withNextIntl`.
- Key taxonomy `<domain>.<page>.<element>`; catalog `messages/{vi,en}/<domain>.json` (không monolithic). Story này chỉ tạo domain `common` (switcher, chrome) + `landing` (pilot).
- Switcher mọi UI mới phải dùng catalog key, zero hardcode. Dirty-form guard: `confirm` trước khi đổi ngôn ngữ khi trang có input đã nhập.
- Sau path migration: mọi test cập nhật import sang `app/[locale]/...`, `params` chứa `locale`, suite phải xanh.

**Never:**
- Không move `api/`, `auth/callback`, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, icons vào `[locale]`.
- Không dịch UI ngoài landing (marketing/store/CRM extraction là 14.2/14.3).
- Không đụng JSONB `translations`/`post_translations` content tables (14.4), không đụng email/contract/notification runtime (14.5).
- Không sitemap alternates cho blog/product dynamic routes (chưa có slug EN — 14.4).
- Không dùng `Accept-Language` để auto-switch; không đổi tên query param `redirect` của login flow.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| VI backward-compat | GET `/`, `/pricing`, `/crm` | Render VI, URL không prefix, status 200 | — |
| EN prefix | GET `/en`, `/en/pricing` | Render EN, `<html lang="en">` | — |
| Locale cookie | Cookie `NEXT_LOCALE=en`, GET `/` | `/` vẫn render VI (URL quyết định, cookie chỉ ảnh hưởng redirect/negotiation mặc định của next-intl khi không có prefix) | — |
| CRM guard EN | GET `/en/crm` chưa login | Redirect `/en/login?redirect=/en/crm` | — |
| CRM guard VI | GET `/crm` chưa login | Redirect `/login?redirect=/crm` (giữ hành vi hiện tại) | — |
| API bypass | POST `/api/webhooks/casso` | Middleware KHÔNG can thiệp (matcher exclude), webhook hoạt động | — |
| Switcher guest | User bấm EN trên `/store` | Navigate `/en/store`, cookie `NEXT_LOCALE=en` | — |
| Switcher logged-in | user.locale=vi, bấm EN | Cookie + `users.locale`='en' qua Server Action; lần login sau giữ EN | Action fail → cookie vẫn set, log lỗi |
| Switcher dirty form | Checkout form đã nhập, bấm đổi ngôn ngữ | `confirm()` cảnh báo trước khi navigate | Cancel → không đổi |
| Order snapshot | POST create store order, cookie `en` | `store_orders.locale='en'` | Cookie thiếu/invalid → `'vi'` |
| Invalid locale | GET `/fr/pricing` | next-intl not-found/redirect theo routing config | — |
| Landing pilot | GET `/en` | Landing render hoàn toàn tiếng Anh từ `messages/en/landing.json` | Key thiếu → fallback `vi` |

</intent-contract>

## Code Map

- `src/middleware.ts` — file compose chính; hiện Supabase auth refresh (L6-51) + CRM guard `pathname.startsWith('/crm')` (L59-67, lỗi: bỏ sót `/en/crm`) + CSP headers (L78-122); matcher L125-134 chưa exclude `/api/`. Wrap bằng `createMiddleware` của next-intl.
- `src/app/layout.tsx:68` — root layout, `<html lang="vi">` hardcode, load Lora/Raleway fonts, metadata + JSON-LD, KHÔNG có provider → move thành `[locale]/layout.tsx`.
- `src/app/page.tsx:16` — landing page server component (`force-dynamic`), render trực tiếp toàn bộ marketing sections → pilot translation.
- `src/app/(marketing)/` — 31 files/18 pages: `blog/`, `checkout/`, `eco-tourism/`, `login/`, `pricing/`, `quantity/`, `register/`, `store/`, `layout.tsx`.
- `src/app/(auth)/auth/callback/route.ts` — route handler OAuth, GIỮ ngoài `[locale]`.
- `src/app/crm/` — 47 files/35 pages: `admin/`, `dashboard/`, `my-bookings/`, `my-garden/`, `my-store-orders/`, `profile/`, `referrals/`, `layout.tsx`, `page.tsx`.
- `src/app/sitemap.ts:4` — static routes (`/`, `/pricing`, `/blog`) + dynamic `/blog/[slug]` từ Supabase; thêm `alternates.languages` CHỈ cho static entries.
- `src/app/robots.ts:3` — disallow `/crm/`, `/api/`; giữ ngoài `[locale]`, xem xét thêm `/en/crm/`.
- `src/components/layout/MarketingHeader.tsx:75-131` — client component, top bar có Login/`<UserHeader/>` → mount switcher ở top bar.
- `src/components/layout/CRMHeader.tsx:43-75` + `UserHeader.tsx:18` — client components → mount switcher cạnh UserHeader.
- `src/app/api/orders/pending/route.ts:153` — upsert `orders` → ghi `locale` từ cookie.
- `src/app/api/store/orders/create/route.ts:113` — insert `store_orders` → ghi `locale` từ cookie.
- `src/app/api/bookings/create/route.ts:129` — insert `room_bookings` → ghi `locale` từ cookie.
- `supabase/migrations/` — pattern `YYYYMMDDHHMMSS_name.sql`; latest `20261008030000_harden_stock_rpc_perms.sql`; `users` tạo ở `20260407000000_baseline_from_remote.sql:832`.
- `jest.config.ts` + `jest.setup.ts` (`setupFilesAfterEach`?) — `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']`; alias `@/*` → `./src/*`.
- `package.json` — next `^16.1.1`, react `^19.0.0`, next-intl CHƯA cài.
- ~30 test files dưới `src/app/**/__tests__/` import page modules → cập nhật path + `params`/`searchParams` thêm `locale`.
- `next.config.js` — CommonJS, đang wrap `withSentryConfig` → wrap thêm `withNextIntl` (innermost).

## Tasks & Acceptance

**Execution:**
- `package.json` + lockfile -- `npm install next-intl` -- dependency nền tảng.
- `src/i18n/routing.ts` + `src/i18n/request.ts` + `src/i18n/navigation.ts` -- `defineRouting` (locales vi/en, default vi, `localePrefix:'as-needed'`), `getRequestConfig` load/merge `messages/{locale}/*.json`, `createNavigation` exports Link/useRouter localized -- core next-intl wiring.
- `messages/vi/common.json`, `messages/en/common.json`, `messages/vi/landing.json`, `messages/en/landing.json` -- catalog domain `common` (switcher, chrome) + toàn bộ string landing -- taxonomy theo epic contract.
- `next.config.js` -- `withNextIntl('./src/i18n/request.ts')` wrap (innermost, ngoài cùng vẫn `withSentryConfig`) -- build-time integration.
- Move tree: `src/app/(marketing)` → `src/app/[locale]/(marketing)`, `src/app/crm` → `src/app/[locale]/crm`, `src/app/page.tsx` → `src/app/[locale]/page.tsx`; `src/app/layout.tsx` → `src/app/[locale]/layout.tsx` với `<html lang={locale}>`, `generateStaticParams`, `setRequestLocale`, `NextIntlClientProvider` (messages pass xuống client components); thêm root-level `not-found` handling theo next-intl pattern nếu cần cho invalid locale; `globals.css` import dời theo layout mới -- routing nền tảng.
- `src/middleware.ts` -- compose `createMiddleware(routing)` trước (lấy response từ intl), giữ nguyên Supabase refresh + sửa guard regex `^/(?:[a-z]{2}/)?crm`, redirect `/{locale?}/login?redirect={prefixedPath}`, CSP headers gắn lên response cuối; matcher thêm exclude `api/` -- auth+i18n+security trên một chain.
- `supabase/migrations/20261009010000_add_locale_columns.sql` -- `ALTER TABLE users/orders/store_orders/room_bookings ADD COLUMN locale text NOT NULL DEFAULT 'vi' CHECK (locale IN ('vi','en'))` -- locale persistence.
- `src/app/api/orders/pending/route.ts`, `src/app/api/store/orders/create/route.ts`, `src/app/api/bookings/create/route.ts` -- đọc `NEXT_LOCALE` cookie (`request.cookies.get('NEXT_LOCALE')`, validate ∈ {vi,en}, fallback 'vi'), truyền `locale` vào insert/upsert -- snapshot ngôn ngữ lúc tạo đơn.
- `src/components/LanguageSwitcher.tsx` (client) + `src/actions/userLocale.ts` -- dùng localized `useRouter`/`usePathname` từ `@/i18n/navigation` để navigate + set cookie; nếu `user` đăng nhập thì gọi Server Action update `users.locale`; dirty-form heuristic (input/textarea có value khác default) → `confirm()` trước khi đổi -- UX switcher theo AC.
- `src/components/layout/MarketingHeader.tsx`, `src/components/layout/CRMHeader.tsx` (hoặc `UserHeader.tsx`) -- mount `<LanguageSwitcher/>` -- surface switcher.
- `src/app/sitemap.ts` -- thêm `alternates.languages: { vi: <url>, en: <url-en-prefixed> }` cho 3 static entries; dynamic blog entries giữ nguyên (14.4) -- hreflang static only.
- `src/app/[locale]/page.tsx` + landing components -- extract toàn bộ string UI landing sang `getTranslations`/`useTranslations` + catalog `landing` -- pilot end-to-end.
- `src/app/[locale]/layout.tsx` metadata -- `generateMetadata({params:{locale}})` cho landing với `alternates.languages` -- SEO pilot.
- `jest.setup.ts` + ~30 test files dưới `src/app/**` + các test import module đã move -- cập nhật import path `app/[locale]/...`, `params` thêm `locale`, thêm `NextIntlClientProvider` (hoặc helper tối thiểu) cho component test dùng `useTranslations` -- suite xanh sau move.
- Unit tests mới: middleware locale resolution + CRM guard `/en/crm` + locale-preserving redirect + matcher `/api` bypass; `updateUserLocale` action; order-create route ghi `locale` từ cookie (thiếu/invalid → 'vi') -- cover I/O matrix.

**Acceptance Criteria:**
- Given request `/`, when locale resolve `vi`, then URL không prefix, render VI; request `/en/...` render EN (`as-needed`), `<html lang>` đúng locale.
- Given tree đã move, when build/chạy app, then `(marketing)`, `crm`, root page nằm dưới `[locale]`; `api/`, `(auth)/auth/callback`, `sitemap.ts`, `robots.ts`, `opengraph-image`, icons vẫn ngoài và hoạt động (`/auth/callback`, `/sitemap.xml`, `/robots.txt` không prefix, không 404).
- Given middleware chain, when request `/en/crm` chưa login, then redirect `/en/login?redirect=/en/crm`; request `/crm` → `/login?redirect=/crm`; session refresh + CSP giữ nguyên cả 2 locales; `/api/*` không bị middleware can thiệp.
- Given migration chạy, then `users`/`orders`/`store_orders`/`room_bookings` có `locale text NOT NULL DEFAULT 'vi'` CHECK IN (vi,en).
- Given checkout/create-order với cookie `NEXT_LOCALE=en`, then row mới có `locale='en'`; không cookie → `'vi'`.
- Given switcher, when guest bấm EN, then navigate `/en/...` + cookie set; when logged-in, then cookie + `users.locale` update; form dirty → `confirm()` trước khi navigate.
- Given sitemap/metadata, then `alternates`/hreflang cover cả 2 locales CHỈ cho static marketing routes (không trỏ URL EN chưa tồn tại).
- Given pilot, when GET `/en`, then landing render đầy đủ tiếng Anh; key thiếu → fallback `vi`; `GET /` không đổi.
- Given suite, when `npx jest` chạy, then toàn bộ test hiện có + mới đều xanh sau path migration.

## Spec Change Log

## Review Triage Log

| finding | verdict | route | note |
|---|---|---|---|
| Pilot AC fail: `[locale]/page.tsx` chưa dịch — 100% hardcode VI, `/en` render tiếng Việt | high | patch | intent_gap — worker chỉ tạo catalog, chưa wire `getTranslations`/`useTranslations` |
| Matcher loại `api` → middleware không chạy cho `/api/*`, mất toàn bộ security headers (regression so với trước) + `isExcludedFromIntl` thành dead code | high | patch | bỏ `api` khỏi matcher; nhánh exclude sớm vẫn `applySecurityHeaders` |
| 51 file dùng `next/link` thuần trong tree `[locale]` → click nav trên `/en` rớt về VI | high | patch | swap sang `Link` từ `@/i18n/navigation` (mechanical) |
| `users.locale` DB override cookie chưa implement | high | patch | chỉ query DB khi user auth + cookie `NEXT_LOCALE` vắng (new device) + URL không prefix → redirect `en` nếu DB=en; URL `/en` không bao giờ bị ép về vi (prefix = explicit choice). Trade-off ghi Design Notes |
| CRM redirect `NextResponse.redirect` mất cookies đã refresh + không security headers | high | patch | copy cookies + `applySecurityHeaders` lên redirect response |
| intl redirect (Location) return sớm thiếu security headers | medium | patch | wrap `applySecurityHeaders` |
| Guard regex khớp `/fr/crm` → redirect `/fr/login` không tồn tại | medium | patch | validate prefix ∈ `routing.locales` |
| LanguageSwitcher hardcode confirm + aria-label (vi phạm zero-hardcode) | high | patch | dùng `useTranslations('common.switcher')` |
| Switcher mất query params khi đổi ngôn ngữ | medium | patch | append `useSearchParams()` vào `router.replace` |
| `isAnyFormDirty` false-positive trên controlled input đã pre-fill + bỏ sót select/checkbox | medium | patch | đổi sang event-listener dirty flag (`input`/`change` capture) thay so sánh defaultValue |
| Cookie `NEXT_LOCALE` thiếu `Secure` attr | low | patch | thêm `; Secure` khi https |
| `database.types.ts` chưa có cột `locale` (4 bảng) | high | patch | thêm `locale: 'vi' \| 'en'` vào Row/Insert/Update |
| API routes chỉ đọc cookie, thiếu body `locale` fallback (spec: cookie ưu tiên, body là fallback) | medium | patch | cookie → body.locale → 'vi' |
| `request.ts` không merge fallback `vi` runtime — key en thiếu → lỗi thay vì fallback | medium | patch | deep-merge vi base + en override |
| Sitemap `/blog` index thiếu alternates; thiếu `x-default` | low | patch | thêm alternates + x-default cho static entries |
| ~30 page test truyền `params` thiếu `locale` | low | patch | thêm `locale: 'vi'` vào params object |
| `jest.config.ts` transformIgnorePatterns trùng (static + async override) | low | patch | bỏ static block |
| `robots.ts` chưa disallow `/en/crm` | low | patch | thêm `/en/crm/` |
| Catalog `crm.json`/`pricing.json` tạo sớm (spec: chỉ common+landing) | low | accepted deviation | giữ lại — 14.2/14.3 dùng ngay; eager import ~nhỏ |
| Cookie giá trị lạ (`NEXT_LOCALE=fr`) chưa có test | low | patch | thêm 1 test row invalid → 'vi' |
| `request.ts` fallback im lặng không cảnh báo dev | low | defer | DX polish |
| Root not-found/global-error sau khi xóa `app/layout.tsx` | low | defer | chưa có trước đây — status quo |
| File rác `CRMHeader (1).tsx`, `AdminSidebar (1).tsx` tồn tại sẵn | low | defer | pre-existing, ngoài scope — báo user |

## Design Notes

- Middleware compose pattern (next-intl + Supabase + CSP trên cùng response): gọi `intlMiddleware(request)` lấy `response` làm base, rồi chạy Supabase `getUser()` + guard + set security headers lên response đó — tránh tạo `NextResponse.next()` riêng mất cookie/rewrite của intl. Nếu Supabase client cần re-create response khi set cookie, merge headers/cookies sang response của intl.
- Cookie `NEXT_LOCALE` do next-intl tự set khi user vào URL prefix `/en`; switcher chỉ cần navigate qua `router.replace(pathname, {locale})` từ `@/i18n/navigation` — không tự set cookie tay.
- Dirty-form guard tối giản: query `input, textarea` trong DOM, nếu phần tử nào `value` khác `defaultValue` (hoặc checkbox/radio khác `defaultChecked`) thì coi như dirty → `window.confirm(messageFromCatalog)`.
- Root layout sau move: `app/[locale]/layout.tsx` giữ `<html><body>`; nếu Next đòi root `app/layout.tsx` cho global not-found, giữ một root layout tối thiểu pass-through theo pattern next-intl (không html/body ở đó nếu đã ở [locale] — theo doc version cài đặt).

## Verification

**Commands:**
- `cd dainganxanh-landing && npm run build` -- build pass, `[locale]` routes prerender/render đúng.
- `cd dainganxanh-landing && npx jest` -- toàn bộ suite xanh (113+ test files hiện có).
- `npx tsc --noEmit` -- không lỗi type sau move + params.locale.

**Manual checks:**
- Dev server: `/` VI, `/en` EN landing dịch, `/en/crm` chưa login → `/en/login?redirect=/en/crm`, `/api/health` (hoặc webhook) không đổi.
- Dev DB: migration apply, insert order với cookie en → `store_orders.locale='en'`.

## Auto Run Result — Story 14.1 (2026-10-09)

**Verdict:** PASS sau 1 patch round (19/19 patch findings applied).
**Files:** 117 files diff round 1; +20 files trong patch round (51 next/link swaps, landing.tsx localization, middleware fixes...).
**Verify:** tsc exit 0 | jest 117/117 suites · 1163 tests PASS | build 114 routes OK.
**New tests:** i18n-foundation, language-switcher, messages-parity, order-locale-snapshot, middleware-chain.
**Deviation chấp nhận:** crm.json + pricing.json catalogs tạo sớm (14.2/14.3 dùng).
**Defer:** silent-fallback warning, root not-found/global-error; file rác pre-existing CRMHeader (1).tsx + AdminSidebar (1).tsx (ngoài scope).
**users.locale override design:** chỉ áp khi authenticated + cookie NEXT_LOCALE vắng + URL không prefix → redirect /en nếu DB=en; không bao giờ ép rời URL /en explicit (prefix = explicit choice; switcher giữ cookie↔DB đồng bộ, tránh per-request query).

## Live E2E Verification (Browser Pilot, 2026-10-09)

- `/` VI render đầy đủ; `/en` render English đầy đủ; link giữ prefix `/en`.
- Switcher 2 chiều OK (`/`↔`/en`), cookie `NEXT_LOCALE` set; query params preserved.
- Guard: `/crm`→`/login?redirect=/crm`, `/en/crm`→`/en/login?redirect=/en/crm`, `/fr/crm`→`/login` (invalid prefix).
- `/api/*` giữ đủ CSP/HSTS/XFO/nosniff/Referrer/Permissions headers; robots disallow `/crm/`+`/en/crm/`; hreflang vi/en/x-default đúng cả head lẫn sitemap.
- **Bug bắt được qua live verify:** 45 key `landing.*` bị tham chiếu nhưng thiếu trong CẢ vi lẫn en catalog (parity test mù vì hai bên cùng thiếu) → đã điền đủ 45/45, jest 118/1189 pass. Console chỉ còn 404 `hero-video.mp4` (asset pre-existing, không liên quan i18n).
