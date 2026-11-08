# Spec — Story 14.2: UI Localization A — Marketing, Store & Shared Conventions

- **Epic:** 14 (Multi-Language i18n) — bối cảnh đầy đủ: `epic-14-context.md` (BẮT BUỘC đọc — chứa taxonomy, contracts, decisions đã khóa).
- **Depends on:** Story 14.1 (done — `ddc47241`, `cfb4626e`): next-intl routing/middleware, `messages/{vi,en}/{common,landing,crm,pricing}.json`, `src/i18n/*`, `LanguageSwitcher`, locale columns.
- **FR:** F-I18N-02 · **Priority:** P1 · **Points:** 8

## Baseline

- `git_revision`: commit `cfb4626e` — implementer MUST `git log` trước khi bắt đầu.

## Mục tiêu (AC từ epics.md 14.2)

1. Extract toàn bộ UI strings trong scope vào catalogs `vi`/`en` theo taxonomy `<domain>.<page>.<element>` (errors: `errors.<domain>.<code>`).
2. `formatCurrency(val, locale)` + `formatDate(val, locale)` helpers thay toàn bộ hardcode `Intl.NumberFormat('vi-VN')`/`toLocaleDateString('vi-VN')`/`toLocaleString` TRONG SCOPE.
3. Zero hardcoded Vietnamese strings trong scope JSX/UI logic.
4. `renderWithIntl` test helper dùng chung (jest setup load catalog `vi`); test files trong scope migrate theo helper — KHÔNG file nào tự invent wrapper.

## File Inventory (scope chính xác)

### Trong scope — extract strings + swap format helpers

**Pages (`src/app/[locale]/(marketing)/`):**
- `layout.tsx` (MarketingHeader/Footer nếu strings nằm ở đây)
- `page.tsx` ở root `[locale]` ĐÃ xong ở 14.1 — chỉ fix phần còn lại nếu sót.
- `blog/page.tsx`, `blog/[slug]/page.tsx`
- `checkout/page.tsx`, `checkout/success/page.tsx`, `checkout/waiting/page.tsx`
- `eco-tourism/page.tsx`, `eco-tourism/loading.tsx`, `eco-tourism/[lotId]/page.tsx`, `[lotId]/loading.tsx`, `[lotId]/book/page.tsx`, `[lotId]/book/BookingPageClient.tsx`, `[lotId]/book/success/page.tsx`, `eco-tourism/voucher/[code]/page.tsx`
- `login/page.tsx`, `register/page.tsx`, `pricing/page.tsx`, `quantity/page.tsx`
- `store/page.tsx`, `store/[slug]/page.tsx`, `store/checkout/page.tsx`, `store/checkout/success/page.tsx`

**Components (`src/components/`):** `layout/`, `checkout/` (QuantitySelector, BankingPayment, ShareCardPreview, PriceSummary), `eco-tourism/` (RoomCard, OrderSummary, VietQRDisplay, GardenCard), `store/` (StoreClient, ProductDetailClient, StoreCheckoutClient), `marketing/` (TreeCounter…), `blog/`, `auth/`, `shared/`, `AuthNavLink.tsx`, `ReferralTracker.tsx`, `MotionWrapper.tsx`.

**Libs/hooks trong scope:** `src/lib/date.ts` (refactor thành `formatDate` locale-aware), `src/hooks/usePriceCalculator.ts`, `src/lib/utils.ts` nếu có format VNĐ hardcode — kiểm `grep -rn "vi-VN\|toLocale" src/lib src/hooks`.

**Server Actions / API error messages trong scope** (chỉ user-facing messages → keys `errors.*`): `src/actions/` liên quan checkout/booking/store (`storeCheckout`? inventory); `src/app/api/store/orders/create`, `api/orders/pending`, `api/bookings/create`, `api/orders/status`-like routes phục vụ checkout. Áp Zod error map dùng chung.

### NGOÀI scope (CẤM đụng — 14.3/14.5)

- `src/app/[locale]/crm/**` (toàn bộ dashboard+admin)
- `src/components/crm/**`, `src/components/admin/**`
- `src/emails/**`, `src/app/api/contracts/**`, `src/app/api/webhooks/**`, `src/lib/utils/contract-helpers.ts`, `src/lib/utils/telegram.ts`, `src/lib/constants.ts` (constants giữ nguyên — data labels VI là content, không phải UI chrome; chỉ đổi nếu file UI trong scope import constant để hiển thị — khi đó map qua key messages)
- Migrations/schema mới — KHÔNG thêm.

### Baseline contracts (đã có từ 14.1 — KHÔNG viết lại)

`src/i18n/routing.ts` (`vi`/`en`, `as-needed`, `localeDetection:false`), `request.ts` (deep-merge vi base + override), `navigation.ts` (Link/redirect/useRouter/usePathname localized), `LanguageSwitcher` + `common.switcher.*` keys, `messages/{vi,en}/{common,landing,crm,pricing}.json`.

## Kế hoạch kỹ thuật

### B1 — Shared format helpers (viết TRƯỚC, mọi file dùng lại)

`src/lib/format.ts` (mới):
```ts
// server+client safe, không import next-intl server APIs
export function formatCurrency(val: number, locale: string): string
// vi → Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}) hoặc giữ nguyên format hiện tại của codebase
// en → 'en-US' VND (giữ ₫ để khớp giá hiển thị hiện tại)
export function formatDate(val: Date|string, locale: string, opts?): string
```
- Tham chiếu `src/lib/date.ts` hiện có — GỘP vào đây hoặc re-export; caller trong scope đổi sang `formatDate(x, locale)` / `formatCurrency`.
- Component client: lấy locale qua `useLocale()` (next-intl); server component: `getLocale()`/`getTranslations` param.
- Giữ nguyên style hiển thị tiền hiện tại (vd `410.000₫`) — KHÔNG đổi format VNĐ trên UI vi; en có thể dùng `en-US` grouping.

### B2 — Zod error map + errors.* keys

- Tạo `src/lib/zodErrorMap.ts`: map ZodIssue → key `errors.<domain>.<code>`; export helper `zodIntlErrorMap(t)` hoặc resolver trả về message key + params.
- Actions/API trong scope trả `{ error: '<key>' }` hoặc localized string — THEO PATTERN HIỆN CÓ của codebase (đọc `src/actions/storeCheckout.ts`/`api/store/orders/create/route.ts` trước; không phá response shape → client map key→`t(key)`).

### B3 — renderWithIntl test helper

- `src/test-utils/renderWithIntl.tsx` (hoặc `jest.setup` register): `renderWithIntl(ui, { locale='vi', messages? })` — wrap `NextIntlClientProvider` với catalog `vi` (merge `messages/vi/*.json`), đồng thời cung cấp `messages.en` để test en render.
- jest.setup hiện tại mock gì liên quan next-intl? Đọc `jest.setup.ts` trước — nếu đã có mock `useTranslations`, phải unify (hoặc bỏ mock global, chuyển test sang helper).
- Migrate test files trong scope sang helper (ít nhất các file assert string VI hardcode — grep `'`+tiếng Việt có dấu trong `__tests__` thuộc scope).

### B4 — Extract strings từng page/component

- Catalog domains mới (nếu cần): `messages/{vi,en}/store.json`, `checkout.json`, `eco.json`, `blog.json`, `auth.json` — hoặc gom vào `common.json` nếu shared nhỏ. Quyết định theo taxonomy epic: `<domain>.<page>.<element>` — domain = file catalog.
- `pricing.json` đã tồn tại — pricing page extract vào đó.
- vi catalog = text gốc VI (giữ nguyên wording). en = bản dịch (địa danh/brand giữ nguyên: Đại Ngàn Xanh, Dó Đen, Ba Vì…).
- ICU: apostrophe trong en phải escape `''`. Biến động dùng `{name}`; plurals dùng ICU select/plural.
- Server component: `getTranslations('domain')`; client: `useTranslations('domain')` + thêm domain vào `request.ts` load list nếu chưa có.
- Anchor/hash links, aria-labels, alt text, placeholders, toasts — TẤT CẢ phải qua keys.

### B5 — Verify & tests

- `npx tsc --noEmit` exit 0 · `npx jest` toàn bộ green · `npm run build` OK.
- Thêm/cập nhật test: ít nhất 1 test assert `renderWithIntl` en render đúng; parity test vi↔en cho catalog mới (mở rộng `messages-parity.test.ts` hiện có — nó quét `messages/` nên tự cover file mới).
- Smoke grep: `grep -rn "vi-VN" src --include='*.tsx' | grep -vE "crm/|admin/|emails|contract|telegram|__tests__"` → phải trống trong scope.

## Design Notes

- EN translations: giữ nguyên địa danh & brand (Đại Ngàn Xanh, Dó Đen, Bình Phước, Đắk Lắk, Cần Thơ); dịch UI chrome; tone lịch sự, rõ.
- Giá: giữ ₫ cả en (đúng sản phẩm), chỉ đổi grouping separator.
- Date format en: `en-US` (MM/DD/YYYY) — chấp nhận khác vi `DD/MM/YYYY`.
- Metadata `generateMetadata` trong scope: localized qua `getTranslations` (đã có pattern từ 14.1 `[locale]/layout.tsx`).
- Silent fallback vi đã có ở request.ts — missing key render key name; đảm bảo 0 missing trước khi commit (live check `/en/<page>` không console MISSING_MESSAGE).
- VietQR/bank transfer text trong `VietQRDisplay`/`BankingPayment`: extract như UI thường (không phải email → không chờ 14.5).
- `lib/constants.ts` giữ nguyên; nếu page hiển thị constant VI trực tiếp → map id→key trong page, không sửa constant.

## Auto Run Result — Story 14.2 (2026-10-09)

- **Status:** done · baseline_revision: cfb4626e
- **Implement:** 63 files (48 sửa + 15 mới). Catalogs mới `store/checkout/eco/blog/auth/errors` ×vi+en; `src/lib/format.ts` (formatCurrency/formatDate/formatDateTime/formatNumber); `src/test-utils/renderWithIntl.tsx`; `jest.setup` mock next-intl; `date.ts`→adapter re-export.
- **Review (4 layers):** REQUEST_CHANGES ×3 + COMMENT ×1. Patched: P1 `next/navigation`→`@/i18n/navigation` (14 files, locale prefix loss); P2 `setRequestLocale` 12 pages; P3 xóa `zodErrorMap.ts` dead code (routes không dùng zod) + `useAuth` trả error keys; P4 sót hardcode VI (ImageGallery, StoreCheckoutClient placeholder, CTAButton default, login/register placeholder, blog ternary, auth/callback locale redirect); P5 canonical `/vi/` redirect-loop fix + JSON-LD localize; P6 format.ts edge (string coerce, UTC normalize) + format.test.ts; P7 ICU plurals en; P8 jest.setup prefetch/has/JEST_LOCALE; P9 parity test +keys-USED-exist + EN render test; P10 brand diacritics nhất quán EN + nationality locale.
- **Verify:** tsc 0 · jest **120 suites / 1229 tests** · build 114 routes.
- **Deferred:** banking strings ×3 domains → `common.banking.*` (14.5); `date.ts` adapter + crm/admin format migration (14.3); zod error map đầy đủ (14.3); renderWithIntl chỉ client components.

## Live E2E Verification (Browser Pilot, 2026-10-09)

Dev server `:3050`. Audit per-page: leaked i18n keys = 0 on every page.

- `/en` landing: EN render, lang=en, viChars=24 (brand "Đại Ngàn Xanh" only — by design).
- `/en/store`, `/en/pricing`, `/en/eco-tourism`, `/en/blog`, `/en/login`, `/en/register`, `/en/checkout`: all EN; canonical `/en/...` correct (P5 verified live); register shows "1 tree"/"410,000 ₫" (en-US + ICU plural).
- **P1 verified:** "Buy now" → `/en/store/checkout?slug=…&quantity=1` (prefix kept through `router.push`); nav click Blog → `/en/blog`; header links all `/en/*`; active nav "Store" emerald on `/en/store` (usePathname fix works).
- Checkout EN: labels + `John Doe` placeholder (P4); province names VI (proper nouns, expected).
- Switcher `/en/store`→`/store` + `NEXT_LOCALE=vi`; VI page canonical `…/store` + hreflang vi/en/x-default correct.
- DB content VI on EN pages (product names/categories, price breakdown "Gói Trồng Cây Dó Đen") — **by design, Story 14.4 scope**.
- Console errors benign: product image 404s (pre-existing assets), 401 unauthenticated APIs.
- eco-tourism EN empty-state renders ("No gardens have open rooms yet").
