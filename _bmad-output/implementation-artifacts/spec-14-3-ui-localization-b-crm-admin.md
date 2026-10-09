---
title: 'UI Localization B — CRM & Admin'
type: 'feature'
created: '2026-10-09'
status: 'in-review'
review_loop_iteration: 1
followup_review_recommended: false
context: []
warnings: ['oversized']
deferred: []
baseline_revision: '22c056a0'
---

<intent-contract>

## Intent

**Problem:** Toàn bộ UI CRM + admin (117 files: 40 routes `app/[locale]/crm/**`, 35 `components/crm/**`, 41 `components/admin/**`, `CRMHeader`) còn hardcode tiếng Việt — user `/en` thấy dashboard/admin tiếng Việt. 35 files dùng `next/navigation` nên `router.push`/`redirect` làm mất prefix `/en` và active-nav so sánh pathname sai. ~32 files format ngày/tiền `vi-VN` cứng. `messages/{vi,en}/crm.json` có 60 keys nhưng **0% được code dùng**.

**Approach:** Extract strings theo taxonomy `crm.<page>.<element>` + domain mới `admin.*` (catalog riêng `messages/{vi,en}/admin.json` — crm.json chỉ 60 keys, admin 0%); tái dùng `formatCurrency`/`formatDate`/`formatDateTime`/`formatNumber` từ `@/lib/format` + `useLocale()`; swap `useRouter`/`usePathname`/`redirect` sang `@/i18n/navigation`; `setRequestLocale(locale)` trên mọi server page; migrate ~26 test sang `renderWithIntl`; gỡ exemption `crm`/`admin` khỏi `messages-parity.test.ts`.

## Boundaries & Constraints

**Always:**
- VI catalog giữ NGUYÊN văn bản hiện tại (test assert VI phải pass sau khi đổi sang `renderWithIntl` — chỉ đổi wrapper, không đổi text).
- EN catalog dịch đầy đủ, brand giữ nguyên "Đại Ngàn Xanh" có dấu; `₫` giữ; ICU plural cho count labels.
- Status/role config maps (BOOKING_STATUS_CONFIG, TREE_STATUS_CONFIG, STORE_ORDER_STATUS_CONFIG, statusLabels) GIỮ nguyên object — component map `t('crm.status.<key>')`, không hardcode label.
- `date.ts` GIỮ adapter (re-export) — chỉ chuyển call-sites trong scope sang `format.ts` + locale.
- Server page: `params: Promise<{locale:string}>`, `setRequestLocale(locale)` đầu hàm, `getTranslations`.
- Giữ `next/navigation` cho `useSearchParams`/`useParams`/`notFound`.
- Parity test `keys-USED-exist` phải cover scope mới (gỡ exclude crm/admin).

**Never:**
- Không đụng DB/migrations, `emails/`, `api/contracts`, `api/webhooks` (14.5).
- Không refactor form validation sang zod/`zodErrorMap` — forms dùng `validateForm()` thủ công, errors → catalog keys `admin.forms.errors.*`/`crm.forms.errors.*`. Không revive `zodErrorMap.ts`.
- Không rewrite server actions/API error strings (16 actions + 13 routes trả VI) — DEFER 14.5; client hiển thị `res.error` như hiện tại, chỉ localize chrome quanh nó.
- Không tái cấu trúc field form product/post thành tab VI/EN (14.4) — story này CHỈ extract label/string tĩnh.
- Không localize payload notification/DB content (14.4/14.5) — chỉ chrome UI (`NotificationBell` timeAgo, empty state).
- Không đổi logic nghiệp vụ, không thêm dependency.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| User /en mở CRM | cookie/prefix en | Mọi label CRM + admin tiếng Anh, 0 leaked key | key thiếu → fallback vi qua deepMerge (đã có) |
| router.push/redirect trong CRM | locale en | URL giữ `/en/crm/...` | — |
| Active nav | pathname `/en/crm/my-garden` | tab "My Garden" active (pathname đã strip prefix) | — |
| formatCurrency en | 410000 | "410,000 ₫" (en-US) | string/NaN coerce như format.ts |
| formatDate en | timestamptz Supabase | date en-US, UTC-normalized (không hydration mismatch) | — |
| VI regression | locale vi | text y hệt trước story (test cũ pass) | — |
| Admin settings forms | locale vi | các form đang hardcode EN (SystemConfig/Profile/Password/NotificationToggles/EmailTemplates) → VI | — |

</intent-contract>

## Code Map

- `dainganxanh-landing/src/i18n/{routing,request,navigation}.ts` -- nền 14.1; `request.ts` deepMerge — THÊM domain `admin` vào merge list (hiện 10 domains).
- `dainganxanh-landing/src/lib/format.ts` -- formatCurrency/formatDate/formatDateTime/formatNumber(val, locale) — tái dùng, KHÔNG sửa logic (đã vá edge cases 14.2).
- `dainganxanh-landing/src/lib/date.ts` -- adapter giữ `formatDateVN`/`formatVND`; 7 file scope import trực tiếp: `components/crm/{BookingDetail,BookingTable,CheckInInstructions,StoreOrdersList}.tsx`, `components/admin/{AdminBookingTable,AdminStoreOrdersTable}.tsx`, test `BookingTable.test.tsx` → chuyển call-site sang format.ts.
- `dainganxanh-landing/src/test-utils/renderWithIntl.tsx` -- wrapper test client; ~26 test crm/admin đang assert text VI bằng `render()` thường → đổi wrapper.
- `dainganxanh-landing/src/__tests__/messages-parity.test.ts` -- ~L105-115 exclude `crm`+`admin` khỏi keys-USED-exist scan → gỡ exclude khi xong.
- `dainganxanh-landing/messages/{vi,en}/crm.json` -- 60 keys (sidebar/dashboard/myGarden/referrals/bookings/storeOrders/profile), CHƯA code nào dùng — mở rộng.
- `dainganxanh-landing/src/components/layout/CRMHeader.tsx:4` -- `usePathname` từ next/navigation → active state hỏng ở /en; swap + i18n labels.
- `dainganxanh-landing/src/components/admin/AdminSidebar.tsx:4`, `src/components/crm/CRMSidebar.tsx:4` -- cùng bug active-nav + labels.
- `dainganxanh-landing/src/components/crm/NotificationBell.tsx:40-47` -- `formatTimeAgo` hardcode VI ('vừa xong'/'phút trước'…).
- Config maps giữ nguyên, label qua t(): `BOOKING_STATUS_CONFIG`, `TREE_STATUS_CONFIG` (`@/lib/constants`), `STORE_ORDER_STATUS_CONFIG` (`@/lib/store-order-status`), `statusLabels` trong `OrderTable.tsx`, `statusConfig` trong `AdminProductsTable.tsx`, `ROLE_LABELS` trong `UserTable.tsx`.
- Forms validate thủ công (KHÔNG zod): `ProductForm.tsx` (~75 chuỗi), `WithdrawalForm.tsx`, `CustomerIdentityForm.tsx`, `RoomFormModal.tsx`, `CreateLotForm.tsx`, `PasswordChangeForm.tsx` — errors → catalog keys.
- Nhóm admin settings đang hardcode EN: `SystemConfigForm.tsx`, `ProfileSettings.tsx`, `PasswordChangeForm.tsx`, `NotificationToggles.tsx`, `EmailTemplatesList.tsx`.
- Surface lớn nhất: `AdminStoreOrdersTable.tsx` (~65), `OrderTable.tsx` (~55), `BlogEditor.tsx` (~52), `WithdrawalsList.tsx` (~50), `RoomCalendarClient.tsx` (~45), `AdminBookingTable.tsx` (~42), `UserTable.tsx` (~40), `WithdrawalForm.tsx`/`ProductForm.tsx` (~38/75).
- 26 server pages `app/[locale]/crm/**/page.tsx` dùng `redirect` từ next/navigation — swap + setRequestLocale. Client pages: `referrals/page.tsx`, `profile/page.tsx`, `casso/CassoClient.tsx`, `orders/[id]/OrderDetailClient.tsx`.
- `src/app/crm/` KHÔNG tồn tại — mọi thứ dưới `[locale]/crm/`. `useAuth.ts` KHÔNG được CRM dùng (auth qua supabase trực tiếp).

## Tasks & Acceptance

**Execution:**

- `messages/{vi,en}/crm.json` -- mở rộng cover toàn bộ user-CRM chrome (my-garden + harvest* + tree timeline + referrals/QR/withdrawal + bookings detail + store orders detail + profile + notifications timeAgo + casso client + order detail) -- VI verbatim từ code hiện tại, EN dịch.
- `messages/{vi,en}/admin.json` (MỚI) + `src/i18n/request.ts` -- domain admin: sidebar, tables (orders/products/store-orders/users/bookings/withdrawals), forms (product/lot/room/blog/tree-health), settings (system/profile/password/notifications/email-templates), modals -- thêm vào deepMerge.
- `src/components/layout/CRMHeader.tsx`, `src/components/{crm/CRMSidebar,admin/AdminSidebar}.tsx` -- swap `@/i18n/navigation` + labels qua t(); active-nav dùng pathname đã strip locale.
- 26 server pages `src/app/[locale]/crm/**/page.tsx` -- `setRequestLocale` + `redirect` từ `@/i18n/navigation` + title/heading qua `getTranslations`.
- 4 client route files (`referrals/page.tsx`, `profile/page.tsx`, `casso/CassoClient.tsx`, `orders/[id]/OrderDetailClient.tsx`) -- `useRouter`/`usePathname` swap + `useTranslations` + format helpers.
- 35 `src/components/crm/**` + 41 `src/components/admin/**` -- extract strings, status labels qua `t()`, inline `vi-VN` format → `format.ts` + `useLocale()`; `NotificationBell` timeAgo → keys `crm.notifications.timeAgo.*`.
- 7 call-sites `date.ts` trong scope -- chuyển sang `format.ts` (giữ `date.ts` adapter cho ngoài scope).
- ~26 test files crm/admin -- `render` → `renderWithIntl` (locale vi mặc định, text assert giữ nguyên); thêm ≥2 test locale `en` (vd `CRMSidebar`, `AdminSidebar`).
- `src/__tests__/messages-parity.test.ts` -- gỡ exclude `crm`/`admin` khỏi keys-USED-exist scan.

**Acceptance Criteria:**

- Given `/en/crm` (và mọi sub-route + admin), when render, then 0 hardcoded VI trong chrome UI và 0 leaked key; router.push/redirect giữ prefix `/en`.
- Given `/crm` (vi), when render, then text giống hệt trước story (test suite cũ pass).
- Given `npm test`, when chạy, then toàn bộ suites green; parity test fail nếu code dùng key catalog không có.

## Spec Change Log

## Review Triage Log

## Design Notes

- **Tách `admin.json` riêng** thay vì nhồi `crm.json`: admin ~40 component chưa có key nào, gộp 1 file sẽ >1000 keys khó review. Taxonomy: `crm.*` = user CRM, `admin.*` = admin panel. Shared (status labels dùng cả 2 nơi, vd booking status) đặt ở `crm.status.*` và admin import cùng key — KHÔNG nhân đôi.
- **Status config pattern** (giữ object, map label):
  ```tsx
  const t = useTranslations('crm.status');
  <span>{t(BOOKING_STATUS_CONFIG[status].key)}</span>
  ```
  Config giữ `key` slug ổn định (`pending`, `confirmed`…) — thêm field `key` nếu hiện chỉ có `label` VI.
- **formatTimeAgo** (`NotificationBell`): dùng `Intl.RelativeTimeFormat(locale)` nếu cover đủ ('vừa xong' < 1 phút giữ key riêng `crm.notifications.timeAgo.justNow`), tránh tự viết plural — en cần "1 minute ago" vs "2 minutes ago".
- Server actions/API error strings VI: GIỮ NGUYÊN (deferred 14.5) — ghi rõ trong code comment nơi nào trả raw `res.error` để 14.5 lần ra.

## Verification

**Commands:**
- `cd dainganxanh-landing && npx tsc --noEmit` -- expected: exit 0
- `cd dainganxanh-landing && npx jest` -- expected: all suites green (baseline 120/1229)
- `cd dainganxanh-landing && npm run build` -- expected: build OK

**Manual checks (if no CLI):**
- Grep scope `app/[locale]/crm`, `components/{crm,admin}`, `layout/CRMHeader.tsx`: không còn `useRouter|usePathname|redirect` từ `next/navigation` (chỉ còn useSearchParams/useParams/notFound); không còn `toLocaleString('vi-VN')`/`toLocaleDateString('vi-VN')`.
