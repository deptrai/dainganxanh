---
stepsCompleted: [1,2,3,4,5,6]
inputDocuments: ['_bmad-output/planning-artifacts/research/i18n-survey-2026-09-21.md']
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Multi-language (i18n) architecture for Next.js 16 App Router + Supabase'
research_goals: 'Chốt stack + patterns để đa ngôn ngữ toàn bộ: UI (287 file), email templates + Edge Functions, contract/certificate, DB content, SEO routing'
user_name: 'Luis'
date: '2026-09-21'
web_research_enabled: true
source_verification: true
---

# Research Report: Technical — Multi-language (i18n) Architecture

**Date:** 2026-09-21
**Author:** Luis
**Research Type:** technical
**Input:** i18n-survey-2026-09-21.md (codebase survey)

---

## Research Overview

Chốt các quyết định kiến trúc đa ngôn ngữ cho nền tảng Đại Ngàn Xanh (Next.js 16 App Router + React 19 + Supabase Postgres/Edge Functions + Resend React Email + docx-templates + pdf-lib), phủ UI + email + contract + DB content + SEO + admin nhập liệu.

---

<!-- Content appended sequentially through research workflow steps -->

## Technical Research Scope Confirmation

**Research Topic:** Multi-language (i18n) architecture for Next.js 16 App Router + Supabase
**Research Goals:** Chốt stack + patterns để đa ngôn ngữ toàn bộ: UI (287 file), email templates + Edge Functions, contract/certificate, DB content, SEO routing, admin nhập liệu.

**Technical Research Scope:**

- Framework UI: next-intl vs react-i18next vs next-i18next (Next 16 + RSC + React 19)
- Routing/SEO: locale prefix `/vi`+`/en`, hreflang, sitemap, metadata, localePrefix mode
- Middleware: compose next-intl với Supabase auth + CSP hiện có
- DB content pattern: `*_translations` table vs JSONB `translations` vs `_vi`/`_en` columns
- Email/Contract: render React Email per `users.locale`; migrate Edge Fn inline HTML; docx per-locale; font Unicode certificate
- Admin nhập liệu: form tab VI/EN (TipTap), fallback
- Tests: chiến lược cập nhật ~124 test assert tiếng Việt

**Research Methodology:**
- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

**Scope Confirmed:** 2026-09-21

## Technology Stack Analysis

### Framework i18n cho Next.js 16 App Router + React 19 + RSC
**Quyết định: `next-intl`** ✅ *Verified trực tiếp từ next-intl.dev (Last updated Mar 2026)*

- `next-intl` là lựa chọn chuẩn cho App Router + React Server Components: hỗ trợ `getRequestConfig` (request-scoped), `NextIntlClientProvider`, `getTranslations` (async, RSC), `useTranslations` (client), `generateMetadata`, sitemap alternates, Route Handlers.
- Middleware `createMiddleware` xử lý locale negotiation, redirects/rewrites, **alternate links (hreflang) tự động**.
- React 19 + Next 16: next-intl theo kịp (docs ghi "was called `middleware` up until Next.js 16" → đã cập nhật cho 16).
- `react-i18next`: mạnh nhưng thiên client-side, cần cấu hình thủ công cho RSC; phù hợp SPA hơn App Router.
- `next-i18next`: **Pages Router-era, không còn phù hợp** App Router (maintenance chậm, không RSC-native).
- Source: https://next-intl.dev/docs/getting-started/app-router ; /docs/routing/middleware ; /docs/environments/actions-metadata-route-handlers
- Confidence: **HIGH** (official docs, current)

### Routing strategy
**Quyết định: Prefix-based `/vi` + `/en`, `localePrefix: 'as-needed'`**
- `vi` là default → URL `/` không đổi (backward-compat, giữ SEO hiện có); `en` → `/en/...`.
- Locale negotiation: prefix → cookie → `Accept-Language` → defaultLocale.
- Domain-based routing không cần (1 domain `dainganxanh.vn`).
- Source: next-intl middleware docs. Confidence: HIGH.

### Metadata & SEO
- `generateMetadata` + `getTranslations` cho title/description per-locale.
- Middleware tự inject `Link` header alternates; sitemap dùng `alternates` + `getPathname` cho hreflang.
- Blog CMS-driven slug per-locale → cần `getPathname` tùy biến.
- Source: next-intl environments docs. Confidence: HIGH.

## Integration Patterns

### Middleware composition (auth + CSP + i18n)
- `createMiddleware` trả về function → **compose**: chạy next-intl middleware trước để resolve locale + tạo response, rồi lớp Supabase `getUser()` refresh + redirect `/crm`, rồi set CSP/security headers lên response.
- Matcher: next-intl khuyến nghị loại static + api; **giữ CSP cho cả API** → cần 2 lớp matcher hoặc compose có chọn lọc.
- Source: next-intl middleware "Composing other middlewares". Confidence: HIGH.

### Server Actions / Route Handlers / API
- `getTranslations` dùng được trong Server Actions & Route Handlers → localize validation/toast/error messages (35 file `src/actions`, 27 file `src/api`).
- Source: next-intl environments docs. Confidence: HIGH.

### Email
- React Email render theo `users.locale`: `renderEmail(<Template locale={user.locale}/>)`; mỗi template nhận `locale` prop + message catalog riêng (không dùng RSC hook trong email → truyền dict trực tiếp).
- Edge Functions inline HTML (`lang="vi"`) → migrate sang shared per-locale template hoặc gọi lại `send-email` với `locale`.
- Confidence: MEDIUM-HIGH (pattern quen thuộc; cụ thể cần prototype).

### Contract & Certificate
- `docx-templates`: giữ 1 template song ngữ hoặc 2 template `contract-template.vi.docx` / `.en.docx`, chọn theo `order.locale`.
- `generate-certificate` (pdf-lib): hiện remove dấu vì Helvetica ASCII → **embed font Unicode (Noto Sans/Roboto)** để render tiếng Việt + tiếng Anh.
- Confidence: MEDIUM.

## Architectural Patterns

### DB content đa ngôn ngữ
**Quyết định: JSONB `translations` per row** cho phần lớn + bảng phụ cho blog SEO
- Bảng cần dịch: posts, products, product_categories, rooms, lots, notifications, email_templates.
- **JSONB `translations` (`{"vi":{...},"en":{...}}`)**: đơn giản, 1 query, admin nhập inline; phù hợp fields ít (name/description/amenities).
- **`posts` (blog) là ngoại lệ**: slug + meta_title + meta_desc + content per-locale + SEO → cân nhắc `post_translations` (post_id, locale, slug UNIQUE, title, excerpt, content, meta_*) để index slug per-locale và query SEO sạch.
- Lý do: JSONB khó UNIQUE/slug index per-locale; blog cần SEO URL riêng.
- `notifications.title/body`: render runtime theo `user.locale` (template key + params trong `data jsonb`) thay vì lưu text.
- `users.locale` text NOT NULL DEFAULT 'vi' — nguồn truth cho email/notification.
- Confidence: MEDIUM-HIGH (best-practice; cần quyết trong Architecture).

### Fallback chiến lược
- UI message: next-intl fallback về `vi` khi thiếu key.
- DB content: fallback `vi` khi `en` translation thiếu.
- Email: fallback `vi`.

## Implementation Research (ước lượng)
- Foundation: next-intl setup + `[locale]` segment + middleware compose + `users.locale` migration + messages vi/en.
- Extract UI: 287 file — theo module (components/admin 37, crm 42, marketing 28…), extract incremental, giữ `vi` làm source.
- DB: migration thêm `translations`/`post_translations` + `users.locale` + backfill.
- Email/Edge Fn: refactor per-locale.
- Tests: ~124 file assert tiếng Việt → chiến lược: render với `vi` default locale trong test, hoặc assert message key.
- Risk lớn nhất: middleware composition (auth+CSP+i18n) và DB pattern cho SEO slug blog.

## Research Synthesis — Khuyến nghị cuối
| Quyết định | Chọn | Confidence |
|---|---|---|
| Framework | next-intl | HIGH (docs) |
| Routing | `/vi`(default no-prefix)+`/en`, `as-needed` | HIGH |
| Middleware | next-intl ∘ auth ∘ CSP compose | HIGH |
| DB pattern | JSONB `translations` + `post_translations` (blog SEO) | MED-HIGH |
| Email | React Email per `users.locale` + migrate Edge Fn | MED-HIGH |
| Contract/Cert | docx per-locale + Unicode font | MED |
| Locale source | `users.locale` (default `vi`) | HIGH |
| Fallback | về `vi` mọi tầng | HIGH |
