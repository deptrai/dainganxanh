# Báo Cáo Kiểm Chứng Thực Tế Code (Reality Check) — Epic 14: Multi-Language (i18n)

**Ngày đánh giá:** 2026-10-09  
**Người đánh giá:** Independent Senior Code Reviewer  
**Đối tượng kiểm chứng:** Epic 14 (`_bmad-output/planning-artifacts/epics.md`, lines 1745–1861) đối chiếu với mã nguồn thực tế tại repo `dainganxanh` (`dainganxanh-landing/` & `supabase/`).

---

## 1. Tổng Quan Kết Quả (Executive Summary)

Epic 14 đề xuất giải pháp đa ngôn ngữ (i18n) cho nền tảng Đại Ngàn Xanh dựa trên Next.js App Router, `next-intl`, Supabase SSR, Resend và Supabase Edge Functions. Quá trình kiểm chứng thực tế mã nguồn cho thấy:
- **7/9 khẳng định kỹ thuật được VERIFIED hoàn toàn:** Thực trạng code phản ánh đúng các vấn đề kiến trúc mà Epic 14 muốn giải quyết (thiếu font Unicode trong `pdf-lib`, email HTML inline, hardcoded tiếng Việt diện rộng, cấu trúc bảng `notifications`, truy vấn slug của blog).
- **2/9 khẳng định được đánh giá là PARTIAL:** Liên quan đến các ngộ nhận nhỏ về cấu trúc thư mục thực tế (`crm/` là URL segment thật, không phải route group `(crm)`; trang chủ ở root `src/app/page.tsx` chứ không nằm trong `(marketing)`), và các điểm nghẽn kỹ thuật thực tế trong `middleware.ts` chưa được Epic 14 lường hết khi thực hiện chuỗi composition.

| STT | Khẳng định kỹ thuật trong Epic 14 | Kết luận | Mức độ rủi ro |
| :-- | :-------------------------------- | :------- | :------------ |
| 1 | Middleware chain (`next-intl` ∘ Supabase Auth ∘ CSP) | **PARTIAL** | Trung bình (Cần sửa logic path `/crm` & matcher) |
| 2 | Stack `package.json` & `next.config.js` | **VERIFIED** | Thấp (Next 16 + React 19, `next-intl` chưa cài) |
| 3 | App directory tree & chèn segment `[locale]` | **PARTIAL** | Trung bình (`crm/` là thư mục thật, không phải `(crm)`) |
| 4 | Hardcoded tiếng Việt trên UI & Bộ test | **VERIFIED** | Thấp (Đúng thực trạng trên diện rộng ~112 tests) |
| 5 | Thiếu cột `users.locale` trong DB | **VERIFIED** | Thấp (Chưa có trong schema, dễ migration) |
| 6 | Email React Email & Edge Functions inline HTML | **VERIFIED** | Thấp (HTML inline và copy tiếng Việt cứng 100%) |
| 7 | Hợp đồng DOCX & Chứng chỉ pdf-lib thiếu Unicode | **VERIFIED** | Cao (Chứng chỉ đang phải tẩy sạch dấu tiếng Việt) |
| 8 | Bảng `notifications` có `data` JSONB & render cứng | **VERIFIED** | Thấp (Có `data` jsonb, hiện render thẳng text) |
| 9 | Truy vấn Blog slug & kiến trúc `post_translations` | **VERIFIED** | Thấp (Blog hiện query `posts.slug` đơn lẻ) |

---

## 2. Chi Tiết Kiểm Chứng Từng Khẳng Định

---

### Khẳng định 1: `src/middleware.ts` tồn tại và khả năng compose với `next-intl`
- **Kết luận:** **PARTIAL**
- **Bằng chứng code thật:** `dainganxanh-landing/src/middleware.ts`
  - *Lines 8–52:* Khởi tạo Supabase SSR client qua `@supabase/ssr` (`createServerClient`), đọc/ghi cookies trên request/response và gọi `supabase.auth.getUser()`.
  - *Lines 59–67:* Route guard bảo vệ CRM:
    ```typescript
    if (request.nextUrl.pathname.startsWith('/crm')) {
        if (!user) {
            const redirectUrl = new URL('/login', request.url)
            redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
            return NextResponse.redirect(redirectUrl)
        }
    }
    ```
  - *Lines 69–122:* Thiết lập CSP headers, HSTS, X-Frame-Options, Permissions-Policy.
  - *Line 72:* Biến `const isApiRoute = request.nextUrl.pathname.startsWith('/api/')` được định nghĩa nhưng **không hề được sử dụng**.
  - *Lines 125–134:* Matcher loại trừ static files nhưng **không loại trừ** `/api/`.
- **Phân tích đối chiếu Epic 14:**
  - Thứ tự compose mà Epic 14 đề xuất: `next-intl` (resolve locale + tạo base response) $\rightarrow$ Supabase auth refresh + `/crm` guard $\rightarrow$ gắn CSP headers vào response là **đúng chuẩn kỹ thuật** theo pattern của `next-intl` với Supabase SSR.
  - **3 điểm xung đột thực tế cần xử lý:**
    1. **Bỏ sót guard khi có prefix locale:** Nếu request là `/en/crm` hoặc `/en/crm/dashboard`, điều kiện `pathname.startsWith('/crm')` sẽ trả về `false`! Người dùng chưa đăng nhập sẽ bypass được middleware guard nếu không dùng regex `^/(?:en/)?crm` hoặc bóc tách locale trước khi check.
    2. **Mất locale khi redirect login:** Khi chưa đăng nhập, code hiện tại redirect về `/login` cố định, làm mất locale `/en/login`.
    3. **Matcher thiếu loại trừ API:** Hiện tại `/api/` không bị loại trừ. Khi bọc `next-intl` middleware, nếu không loại trừ `/api/` trong config matcher, các webhook nhạy cảm như `/api/webhooks/casso` và cron jobs `/api/cron/*` có thể bị lỗi rewrite hoặc can thiệp header không mong muốn.

---

### Khẳng định 2: Tương thích `package.json` và `next.config.js`
- **Kết luận:** **VERIFIED**
- **Bằng chứng code thật:**
  - `dainganxanh-landing/package.json`:
    - `next`: `^16.1.1` (Next.js 16.1.1)
    - `react`: `^19.0.0`, `react-dom`: `^19.0.0` (React 19)
    - `next-intl`: **CHƯA ĐƯỢC CÀI ĐẶT** (hoàn toàn không có trong `dependencies` hay `devDependencies`).
  - `dainganxanh-landing/next.config.js` (lines 1–52):
    - Sử dụng CommonJS: `const { withSentryConfig } = require('@sentry/nextjs')` và `module.exports = ...`.
- **Phân tích đối chiếu Epic 14:**
  - Khẳng định của Epic 14 về việc dùng `next-intl` trên App Router + RSC + React 19 là khả thi (`next-intl` v3.26+ hỗ trợ React 19).
  - Do dự án đang chạy Next.js 16 (`^16.1.1`), khi cài đặt `next-intl`, cần chọn phiên bản tương thích và bọc plugin theo cú pháp CommonJS:
    ```javascript
    const createNextIntlPlugin = require('next-intl/plugin')
    const withNextIntl = createNextIntlPlugin()
    module.exports = process.env.SENTRY_DSN
      ? withSentryConfig(withNextIntl(nextConfig), sentryOptions)
      : withNextIntl(nextConfig)
    ```

---

### Khẳng định 3: App Tree và việc chèn route segment `[locale]`
- **Kết luận:** **PARTIAL**
- **Bằng chứng code thật:** `dainganxanh-landing/src/app/`
  - Thư mục hiện có: `(auth)/`, `(marketing)/`, `api/`, `crm/`.
  - **Sai lệch so với mô tả:**
    1. Không có route group `(crm)`! Thư mục thực tế là `crm/` (URL path cụ thể `https://domain/crm/...`), chứa `admin/`, `dashboard/`, `my-garden/`, v.v.
    2. Trang landing page chính nằm ở `src/app/page.tsx` (ngay cấp root của `src/app/`), chứ không nằm trong `(marketing)/`.
    3. Tồn tại file thừa `src/app/page (1).tsx`.
  - Thư mục `api/` chứa 11 cụm route handlers (`api/admin/`, `api/bookings/`, `api/contracts/`, `api/cron/`, `api/webhooks/casso`, v.v.).
- **Phân tích đối chiếu Epic 14:**
  - Khẳng định `api/` phải nằm ngoài `[locale]` là **chính xác**. Đường dẫn gọi API từ client (`fetch('/api/...')`) sẽ không bị ảnh hưởng bởi locale segment.
  - Tuy nhiên, việc chuyển đổi cấu trúc folder sang `[locale]` sẽ đòi hỏi di chuyển:
    - `src/app/page.tsx` $\rightarrow$ `src/app/[locale]/page.tsx`
    - `src/app/(marketing)/` $\rightarrow$ `src/app/[locale]/(marketing)/`
    - `src/app/(auth)/` $\rightarrow$ `src/app/[locale]/(auth)/`
    - `src/app/crm/` $\rightarrow$ `src/app/[locale]/crm/`
    - Tách layout: `src/app/layout.tsx` giữ lại cấu trúc vỏ hoặc đưa `<html><body>` vào `src/app/[locale]/layout.tsx` theo chuẩn `next-intl`.
  - Các metadata files (`sitemap.ts`, `robots.ts`, `apple-icon.png`, `icon.png`, `opengraph-image.tsx`) phải tiếp tục ở lại root `src/app/`.

---

### Khẳng định 4: Hardcoded tiếng Việt trong UI và kiểm thử
- **Kết luận:** **VERIFIED**
- **Bằng chứng code thật:**
  - `dainganxanh-landing/src/components/layout/MarketingHeader.tsx`:
    - Lines 14–31: Khai báo tĩnh toàn bộ nhãn menu: `'Trang chủ'`, `'Mua cây'`, `'Cửa hàng'`, `'Du lịch & Tour'`, `'Blog'`, `'Vườn của tôi'`, `'Giới thiệu'`, `'Đơn hàng'`, `'Hồ sơ'`.
    - Line 75: `alt="Đại Ngàn Xanh"`, text thương hiệu `"Đại Ngàn Xanh"`.
    - Line 83: Nút `"Đăng nhập"`.
  - `dainganxanh-landing/src/app/page.tsx`:
    - Lines 57–80: Menu và nút bấm cứng: `'Câu Chuyện'`, `'Dó Đen Việt'`, `'Du Lịch & Tour'`, `'Cửa Hàng Trầm'`, `'Trồng Ngay'`.
  - `dainganxanh-landing/src/components/crm/NotificationBell.tsx`:
    - Lines 177, 182, 202: Text cứng `'Thông báo'`, `'Đánh dấu tất cả đã đọc'`, `'Chưa có thông báo mới'`.
  - **Khối lượng kiểm thử:**
    - Có ~112 file test (`*.test.tsx`, `*.test.ts`) trong `dainganxanh-landing/src/` đang assert trực tiếp các chuỗi tiếng Việt (gần như trùng khớp với ước lượng ~124 file của Story 14.2).

---

### Khẳng định 5: Cột `users.locale` trong DB migrations và types
- **Kết luận:** **VERIFIED**
- **Bằng chứng code thật:**
  - `supabase/migrations/20260407000000_baseline_from_remote.sql` (lines 832–845):
    - Bảng `public.users` chỉ có các cột: `id`, `phone`, `email`, `full_name`, `referral_code`, `created_at`, `updated_at`, `role`, `referred_by_user_id`, `id_number`, `date_of_birth`.
  - `dainganxanh-landing/src/types/database.types.ts` (lines 1426–1460):
    - Kiểu dữ liệu sinh tự động của bảng `users` hoàn toàn không có thuộc tính `locale`.
  - Tìm kiếm toàn bộ thư mục `supabase/migrations/`: Từ khóa `locale` không xuất hiện ở bất cứ file migration nào.
- **Phân tích đối chiếu Epic 14:**
  - Cần tạo migration mới theo quy ước của repo (`YYYYMMDDHHMMSS_<desc>.sql`):
    ```sql
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'vi';
    COMMENT ON COLUMN public.users.locale IS 'User preferred language (vi, en)';
    ```
  - Khẳng định `users.locale` là source-of-truth cho email/notification là hoàn toàn chính xác.

---

### Khẳng định 6: Transactional Emails & Supabase Edge Functions
- **Kết luận:** **VERIFIED**
- **Bằng chứng code thật:**
  - **React Email templates:**
    - `dainganxanh-landing/src/emails/TreeContractEmail.tsx` (lines 20–110): Hardcoded copy tiếng Việt toàn bộ: `'Xác nhận hợp đồng đầu tư cây...'`, `'Kính chào Quý khách {userName}! 🎉'`, `'Chi tiết hợp đồng đầu tư'`, `'Mã đơn hàng:'`, `'Số lượng cây:'`, v.v.
    - Được render bởi `@react-email/render` thông qua `dainganxanh-landing/src/lib/email/render.ts` và gửi qua Resend (`src/lib/email/mailer.ts`).
  - **Supabase Edge Functions với Inline HTML:**
    - `supabase/functions/send-withdrawal-email/index.ts`:
      - Lines 75–98: Chuỗi HTML inline Deno: `subject = 'Yêu cầu rút tiền mới - Đại Ngàn Xanh'`, `<h2>Yêu cầu rút tiền mới</h2>`, `<p>Có một yêu cầu rút tiền mới từ...</p>`.
      - Lines 101–120: `subject = 'Yêu cầu rút tiền đã được duyệt - Đại Ngàn Xanh'`.
    - `supabase/functions/send-tree-assignment-email/index.ts`:
      - Lines 24–65: Template HTML nối chuỗi inline: `'🌳 Đại Ngàn Xanh'`, `'Gieo Hạt Lành, Gặt Phước Báu'`, `'Xin chào {{user_name}}! 🎉'`, `'Mã cây của bạn'`, `'Thông tin lô cây'`, v.v.
    - `supabase/functions/notify-tree-health/index.ts`:
      - Lines 52–57: Tạo notification với text cứng: `title: 'Cây ${tree.code} đã chết'`, `message: 'Cây ... của bạn đã được đánh dấu là chết...'`.
- **Phân tích đối chiếu Epic 14:**
  - Khẳng định các Edge Function đang dùng inline HTML tiếng Việt và cần migrate về template đa ngữ / truyền locale là hoàn toàn đúng với thực tế.

---

### Khẳng định 7: Hợp đồng DOCX và Chứng chỉ `pdf-lib` thiếu Font Unicode
- **Kết luận:** **VERIFIED**
- **Bằng chứng code thật:**
  - **Tạo hợp đồng (DOCX $\rightarrow$ PDF):**
    - `dainganxanh-landing/src/app/api/contracts/generate/route.ts`:
      - Line 74: `const templateBuffer = await readTemplateAsset('contract-template.docx')`
      - Lines 76–90: Sử dụng thư viện `docx-templates` điền dữ liệu tiếng Việt.
      - Lines 98–120: Chuyển đổi DOCX sang PDF bằng LibreOffice headless (`soffice --headless --convert-to pdf`).
    - File template hiện tại: `dainganxanh-landing/templates/contract-template.docx` (chỉ có 1 file duy nhất bằng tiếng Việt).
  - **Tạo chứng chỉ (pdf-lib):**
    - `supabase/functions/generate-certificate/index.ts`:
      - Line 3: `import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1'`
      - Lines 22–33: Định nghĩa hàm `removeAccents(str)` để **tẩy sạch dấu tiếng Việt**:
        ```typescript
        const removeAccents = (str: string): string => {
            return str
                .replace(/Đ/g, 'D').replace(/đ/g, 'd')
                .replace(/Ơ/g, 'O').replace(/ơ/g, 'o')
                .replace(/Ư/g, 'U').replace(/ư/g, 'u')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
        }
        ```
      - Lines 42–44: Nhúng font chuẩn Helvetica (chỉ hỗ trợ mã WinAnsi 8-bit):
        ```typescript
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        ```
      - Lines 97–108: Vẽ text không dấu:
        ```typescript
        drawText('CHUNG CHI SO HUU CAY XANH', 24, true, brandColor, true)
        drawText('THONG TIN CHU SO HUU', 14, true)
        drawText(`Ho va ten: ${removeAccents(payload.userName)}`, 12)
        ```
- **Phân tích đối chiếu Epic 14:**
  - Khẳng định của Epic 14 là **cực kỳ chính xác và chỉ ra đúng điểm nghẽn nghiêm trọng**: Chứng chỉ hiện tại đang phải gỡ bỏ hoàn toàn dấu tiếng Việt để không bị lỗi font khi dùng `StandardFonts.Helvetica` của `pdf-lib`. Để phục vụ song ngữ chuẩn xác, bắt buộc phải nhúng font Unicode (Roboto / Noto Sans) thông qua `pdf-lib` + `@pdf-lib/fontkit`.

---

### Khẳng định 8: Cấu trúc bảng `notifications` và cơ chế render
- **Kết luận:** **VERIFIED**
- **Bằng chứng code thật:**
  - `supabase/migrations/20260407000000_baseline_from_remote.sql` (lines 492–501):
    - Cấu trúc bảng: `id` (uuid), `user_id` (uuid), `type` (text), `title` (text), `body` (text), `data` (jsonb), `read` (boolean), `created_at` (timestamptz).
    - Cột `data` dạng `jsonb` **có tồn tại**.
  - `dainganxanh-landing/src/components/crm/NotificationBell.tsx` (lines 218–224):
    - Render trực tiếp: `<p className="text-sm font-medium">{notification.title}</p>` và `<p className="text-sm text-gray-600">{notification.body}</p>`.
  - Phía phát sinh thông báo:
    - Ví dụ trong `notify-tree-health/index.ts:54-55`, text được chèn vào dạng chuỗi tiếng Việt đã định dạng sẵn (`title: 'Cây ... đã chết'`).
- **Phân tích đối chiếu Epic 14:**
  - Đúng như Epic 14 phân tích: DB đã có sẵn cột `data` jsonb. Cần chuyển từ việc ghi text tiếng Việt tĩnh vào `title`/`body` sang việc ghi `template_key` + params trong `data`, để UI client render tại thời điểm hiển thị theo ngôn ngữ của user (`user.locale`).

---

### Khẳng định 9: Truy vấn Blog / Store và kiến trúc bảng `post_translations`
- **Kết luận:** **VERIFIED**
- **Bằng chứng code thật:**
  - Blog post query: `dainganxanh-landing/src/app/(marketing)/blog/[slug]/page.tsx`
    - Lines 22–30 (`generateStaticParams`): Query trực tiếp `posts`: `.from('posts').select('slug')...`
    - Lines 39–44 (`generateMetadata`): `.from('posts').select(...).eq('slug', slug)...`
    - Lines 73–80 (`PostPage`): `.from('posts').select(...).eq('slug', slug).single()`
  - Store product query: `dainganxanh-landing/src/app/(marketing)/store/[slug]/page.tsx`
    - Lines 14–20 & 32–44: Query trực tiếp `products`: `.from('products').select(...).eq('slug', slug)`
- **Phân tích đối chiếu Epic 14:**
  - **Blog:** Do mỗi bài viết cần có slug chuẩn SEO riêng biệt theo ngôn ngữ (ví dụ: tiếng Việt `/blog/loi-ich-cay-do-den`, tiếng Anh `/en/blog/benefits-of-aquilaria-tree`), việc dùng bảng riêng `post_translations` chứa `(post_id, locale, slug UNIQUE, title, excerpt, content, meta_*)` là thiết kế kiến trúc chuẩn mực để lập chỉ mục tìm kiếm và ràng buộc unique slug trên từng locale.
  - **Store:** Sản phẩm giữ nguyên slug định danh kỹ thuật và dùng cột JSONB `translations` cho tên và mô tả, giúp tránh việc phải nhân bản bảng và quan hệ với kho/đơn hàng.
  - Nhận định và phân tầng giải pháp giữa Blog và Store trong Epic 14 hoàn toàn chuẩn xác.

---

## 3. Khuyến Nghị & Hành Động Cần Thiết (Recommendations)

1. **Cập nhật đặc tả Story 14.1 cho `src/middleware.ts`:**
   - Bổ sung yêu cầu chuẩn hóa đường dẫn trước khi kiểm tra bảo mật: Match regex `^/(?:[a-z]{2}/)?crm` hoặc bóc tách segment ngôn ngữ để đảm bảo route `/en/crm` luôn yêu cầu authentication.
   - Redirect login phải giữ nguyên locale: `/en/login?redirect=...`.
   - Cấu hình matcher phải bổ sung điều kiện loại trừ: `api|trpc|_next|_vercel|.*\\..*`.
2. **Cập nhật tài liệu cấu trúc thư mục App Router:**
   - Đính chính trong tài liệu kiến trúc: `crm/` là URL segment thông thường, không phải route group `(crm)`.
   - Lưu ý dời `src/app/page.tsx` vào `src/app/[locale]/page.tsx` cùng với việc dọn dẹp file rác `src/app/page (1).tsx`.
3. **Ưu tiên kỹ thuật cho Chứng chỉ (`pdf-lib`):**
   - Bổ sung dependency `@pdf-lib/fontkit` và nhúng file font TTF/OTF hỗ trợ Unicode đầy đủ (như Roboto-Regular hoặc NotoSans-Regular) vào Edge Function `generate-certificate`.
   - Loại bỏ hàm tạm `removeAccents()` để chứng chỉ in ra tiếng Việt có dấu đầy đủ, trang trọng.
