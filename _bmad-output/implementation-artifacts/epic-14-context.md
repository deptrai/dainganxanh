# Epic 14 Context: Multi-Language (i18n)

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal
Toàn bộ nền tảng phục vụ song ngữ — tiếng Việt (mặc định) và tiếng Anh — trên UI, content database, email, hợp đồng, chứng nhận và SEO. Kiến trúc đảm bảo backward-compatibility: URL tiếng Việt giữ nguyên không prefix, `/en` là prefix as-needed, bảo toàn SEO hiện có và fallback về tiếng Việt ở mọi tầng khi thiếu bản dịch.

## Stories
- Story 14.1: i18n Foundation — Routing, Middleware, Locale Schema & Switcher
- Story 14.2: UI Localization A — Marketing, Store & Shared Conventions
- Story 14.3: UI Localization B — CRM & Admin
- Story 14.4: Content Database i18n, Admin VI/EN Entry & Dynamic Sitemap
- Story 14.5: Transactional Localization — Email, Contract, Certificate & Notifications

## Requirements & Constraints
- **NFR-05 & Locale Hierarchy:** Tiếng Việt là ngôn ngữ chính, tiếng Anh là thứ cấp. `users.locale` (DB) là source of truth cho user đăng nhập; guest dùng cookie `NEXT_LOCALE`. Language switcher bắt buộc vừa set cookie vừa gọi Server Action update DB. `Accept-Language` chỉ dùng làm hint hiển thị banner đề xuất, tuyệt đối không tự ý đổi ngôn ngữ.
- **Key Taxonomy:** Phân cấp `<domain>.<page>.<element>` cho UI (ví dụ: `store.checkout.title`), catalog lỗi Server Action/API dùng `errors.<domain>.<code>`. Catalog tổ chức theo file domain tại `messages/{vi,en}/<domain>.json`, không dùng monolithic file.
- **Zero-Hardcode Rule:** Áp dụng triệt để cho toàn bộ UI hiện hữu lẫn mọi UI component mới (VI/EN tabs, switcher, status badges).
- **Data Contracts & Fallback:** Field-level JSONB fallback bắt buộc qua helper dùng chung `getTranslatedField(record, field, locale, fallbackLocale='vi')`, nghiêm cấm fallback row-level tự phát trong JSX. `orders.locale` và `store_orders.locale` snapshot locale tại thời điểm checkout/tạo đơn phục vụ tài liệu pháp lý.
- **Formatting & Plurals:** Chuẩn hóa toàn bộ hiển thị tiền tệ và ngày tháng qua `formatCurrency(val, locale)` và `formatDate(val, locale)`, xóa bỏ hardcode `'vi-VN'`. Số tiền bằng chữ dùng `numberToVietnameseWords` (VI) và `numberToEnglishWords` (EN). Sử dụng ICU pluralization cho các message biến thiên theo số lượng.
- **Testing Standard:** Mọi test file trong phạm vi assert qua catalog keys hoặc render với locale mặc định `vi` thông qua helper chuẩn `renderWithIntl` (tích hợp catalog `vi` vào Jest setup), không tự chế wrapper riêng lẻ.

## Technical Decisions
- **Framework & Config:** Sử dụng `next-intl` hỗ trợ App Router, RSC và React 19 (`getRequestConfig`, `NextIntlClientProvider`, `getTranslations`, `useTranslations`). Wrap file CommonJS `next.config.js` bằng `withNextIntl`.
- **Tree Migration & Routing:** Di chuyển `(marketing)`, root `page.tsx`, và URL thật `crm/` vào `src/app/[locale]/`. Giữ nguyên bên ngoài: `api/`, `(auth)/auth/callback` (giữ nguyên OAuth redirect URI gốc), metadata routes (`sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, icons). `[locale]/layout.tsx` khai báo `generateStaticParams()` trả `[{locale:'vi'}, {locale:'en'}]` kết hợp `setRequestLocale()` phục vụ static rendering.
- **Middleware Chain:** Thứ tự compose: `next-intl` (resolve locale, response) → Supabase auth `getUser()` session refresh + CRM guard → CSP/security headers. Matcher middleware loại trừ hoàn toàn `/api/` (bảo toàn webhook Casso/cron). CRM guard dùng regex `^/(?:[a-z]{2}/)?crm`, redirect login bảo toàn locale (ví dụ: `/en/crm` → `/en/login?next=...`).
- **Database Schema:** Cột `translations` dạng JSONB cho các bảng nội dung tĩnh (`products`, `product_categories`, `rooms`, `lots`, `notifications`, `email_templates`) backfill sẵn tiếng Việt. Riêng `posts` dùng bảng `post_translations` (post_id, locale, slug UNIQUE, title, excerpt, content, meta_*) để tối ưu SEO slug theo locale. Chuyển `notifications.title` và `body` sang nullable; notification runtime render theo cơ chế `data?.templateKey ? t(key, params) : title`.
- **Transactional Localization:** React Email template render theo `users.locale` qua prop dictionary tĩnh (không dùng RSC hooks). Mẫu hợp đồng docx chọn file theo snapshot `orders.locale` (`contract-template.vi.docx` / `.en.docx`). Chứng nhận PDF dùng `pdf-lib` nhúng Unicode font qua `@pdf-lib/fontkit` (Noto Sans/Roboto), loại bỏ helper `removeAccents`.

## Cross-Story Dependencies
- **14.2 ← 14.1:** Story 14.2 phụ thuộc vào foundation routing, middleware, message catalogs và cấu trúc `[locale]` từ Story 14.1.
- **14.3 ← 14.2:** Story 14.3 kế thừa conventions trích xuất UI, helper formatting (`formatCurrency`, `formatDate`), Zod error map và `renderWithIntl` từ Story 14.2.
- **14.4 ← 14.3:** Story 14.4 nâng cấp các form quản trị admin (đã extract label tĩnh ở Story 14.3) thành giao diện tabs VI/EN, TipTap rich text và translation badges.
- **14.5 ← 14.1, 14.4:** Story 14.5 phụ thuộc vào `orders.locale`/`users.locale` từ Story 14.1 để render văn bản pháp lý/email, và phụ thuộc schema nullable title kèm templateKey của `notifications` từ Story 14.4.
