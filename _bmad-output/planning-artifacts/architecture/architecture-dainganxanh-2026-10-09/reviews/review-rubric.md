# Đánh Giá Kiến Trúc (Architecture Review): Epic 14 — Multi-Language (i18n)

**Ngày review:** 2026-10-09  
**Reviewer:** Independent Architecture Reviewer  
**Đối tượng review:** Epic 14: Multi-Language (i18n) (`_bmad-output/planning-artifacts/epics.md` dòng 1745–1861)  
**Tài liệu đối chiếu:**  
- PRD NFR-05 (Song ngữ Việt Nam mặc định + Tiếng Anh)  
- `_bmad-output/planning-artifacts/research/technical-i18n-multi-language-research-2026-09-21.md`  
- `_bmad-output/planning-artifacts/research/i18n-survey-2026-09-21.md`  
- Codebase hiện trạng: Next.js 16 App Router, Supabase Auth/Edge Functions, React Email, docx-templates, pdf-lib  

---

## 1. Kết Luận Chung (Verdict)

### **VERDICT: CONCERNS** (Yêu cầu tái cấu trúc trước khi triển khai)

**Tóm tắt thẩm định:**  
Epic 14 đã nắm bắt đúng các quyết định kiến trúc cốt lõi từ tài liệu research (`next-intl`, `users.locale`, JSONB `translations` kết hợp `post_translations` cho blog SEO, compose middleware). Tuy nhiên, việc **nén toàn bộ phạm vi 287 file mã nguồn và 124 file kiểm thử vào chỉ 4 stories** đã tạo ra những điểm nghẽn nghiêm trọng:
1. **Story 14.2 bị quá tải cực hạn (8 SP cho >411 files)**, vượt xa năng lực xử lý trong 1 context của AI dev agent và tạo rủi ro xung đột/lỗi hồi quy diện rộng.
2. **Nghịch lý thứ tự thực thi (Ordering inversion)**: Story 14.1 yêu cầu sitemap/hreflang đa ngôn ngữ khi DB content dịch chưa tồn tại; Story 14.2 trích xuất UI admin trước khi Story 14.3 tái cấu trúc form admin thành tab VI/EN.
3. **Khoảng trống nghiệp vụ & kỹ thuật (Coverage gaps)**: Bỏ sót cột `orders.locale` (dù Story 14.4 cần dùng), thiếu giải pháp cho Deno Edge Functions độc lập, thiếu định dạng số/ngày/tiền tệ (L10n), và bỏ quên logic đọc tiền thành chữ tiếng Anh trong hợp đồng pháp lý.

---

## 2. Bảng Tổng Hợp Findings (Tiered)

| ID | Mức độ | Tiêu chí Rubric | Vấn đề tóm tắt |
|---|---|---|---|
| **F-01** | **CRITICAL** | Story Sizing | Story 14.2 gán 8 SP cho 287 file UI + 124 file test — bất khả thi cho 1 dev agent, tràn context window, rủi ro vỡ build. |
| **F-02** | **CRITICAL** | Story Ordering | Phụ thuộc ngược giữa 14.1 (SEO sitemap alternates) và 14.3 (DB post_translations & per-locale slugs chưa tồn tại). |
| **F-03** | **HIGH** | Story Ordering & Churn | 14.2 trích xuất chuỗi tĩnh cho 37 file admin, sau đó 14.3 đập vào thêm tab VI/EN + TipTap song ngữ, gây lãng phí và xung đột mã nguồn lớn. |
| **F-04** | **HIGH** | Coverage & Schema | Story 14.4 yêu cầu chọn docx theo `order.locale`, nhưng không có migration nào tạo cột `locale` trên bảng `orders` (14.1 chỉ tạo trên `users`). |
| **F-05** | **HIGH** | Divergence Risk | Không chuẩn hóa catalog shape (monolithic vs namespaces), key convention, và cơ chế localized Zod validation cho Server Actions. |
| **F-06** | **MEDIUM** | AC Testability | Tiêu chí "no hardcoded Vietnamese string remains" và "migrated ~124 test files (render vi OR assert keys)" không thể đo lường tự động và mang tính nước đôi. |
| **F-07** | **MEDIUM** | Coverage (L10n) | Thiếu toàn bộ đặc tả cho Date, Time, Currency (VND formatting) và hàm chuyển số tiền thành chữ tiếng Anh trong hợp đồng pháp lý. |
| **F-08** | **MEDIUM** | Coverage (Runtime) | Edge Functions Deno độc lập không thể import `next-intl`; giải pháp chia sẻ từ điển và gửi email/thông báo đa ngôn ngữ chưa có đặc tả API cụ thể. |
| **F-09** | **LOW** | Accessibility & Security | Middleware compose chưa đặc tả xử lý đường dẫn `/en/crm` để tránh bypass guard hoặc redirect mất locale; thiếu kiểm tra `<html lang="...">` động cho WCAG 2.1 AA. |

---

## 3. Đánh Giá Chi Tiết Theo 5 Tiêu Chí Rubric

### 3.1. Story Ordering — Phụ Thuộc Ngược & Trật Tự Logic (Rule: Standalone & Sequential)

#### ❌ Lỗi nghiêm trọng 1: SEO Alternates & Dynamic Slugs (14.1 vs 14.3)
- **Hiện trạng trong Epic 14:**  
  Story 14.1 (Foundation) yêu cầu: `generateMetadata, sitemap alternates, and hreflang cover both locales`.
- **Phân tích rủi ro:**  
  Trong Next.js App Router, sitemap cho trang tĩnh (landing, pricing, about) có thể sinh alternates ngay. Nhưng các thực thể động mang giá trị SEO lớn nhất của nền tảng — cụ thể là **Blog (`/blog/[slug]`)**, sản phẩm (`/store/[slug]`), phòng nghỉ (`/eco-stay/[id]`) — phụ thuộc hoàn toàn vào cấu trúc dữ liệu đa ngôn ngữ.  
  Đặc biệt, theo tài liệu research, bài viết blog yêu cầu bảng `post_translations` riêng với cột `slug UNIQUE` cho từng locale (ví dụ: `/blog/du-an-dai-ngan-xanh` và `/en/blog/green-canopy-project`). Bảng này và logic đa ngôn ngữ DB chỉ được tạo ở **Story 14.3**.  
  Nếu 14.1 tạo sitemap alternates cho dynamic routes trước khi có DB translations:
  1. Dev 14.1 sẽ phải hardcode hoặc bỏ qua dynamic sitemap.
  2. Đến 14.3 lại phải đập ra viết lại sitemap generator.
  3. Nếu sitemap xuất bản link `/en/blog/...` khi chưa có bản dịch hoặc slug tiếng Anh, Googlebot sẽ ghi nhận mã lỗi 404 hoặc phạt lỗi thẻ hreflang trỏ về trang chết.

#### ❌ Lỗi nghiêm trọng 2: Xung đột tái cấu trúc Admin Form (14.2 vs 14.3)
- **Hiện trạng trong Epic 14:**  
  - Story 14.2: Localize toàn bộ Admin UI (~37 files).
  - Story 14.3: Thêm tab nhập liệu VI/EN cho các form admin (sản phẩm, phòng, bài viết, TipTap editor).
- **Phân tích rủi ro:**  
  Dev làm 14.2 sẽ mất công trích xuất tất cả nhãn, nút bấm, placeholder của các form admin đơn ngữ hiện tại (`BlogEditor.tsx`, `RoomForm`, `ProductForm`).  
  Ngay story kế tiếp (14.3), một dev khác lại phải sửa chính các component form này để tách thành tab VI/EN, thêm state quản lý 2 ngôn ngữ, đổi schema submit. Việc này dẫn đến:
  - Công sức trích xuất ở 14.2 bị sửa đổi hoặc loại bỏ (wasted effort).
  - Xung đột merge conflict lớn nếu 2 dev chạy song song.
  - Trật tự đúng: Phải chuẩn bị schema DB & form structure trước, hoặc gom phần Admin UI Localization đi cùng với Multi-lang Form Entry.

---

### 3.2. Story Sizing & Agent Context Window — Khả Thi Triển Khai

#### ❌ Story 14.2 bị phình quá cỡ (Massive Scope Inversion)
- **Khảo sát thực tế trong mã nguồn (`i18n-survey-2026-09-21.md`):**
  - `src/components`: 134 files (admin 37, crm 42, eco-tourism 16, checkout 8, blog 5, marketing 5, auth 4, store 3)
  - `src/actions`: 35 files (Server actions — validation/toast)
  - `src/app/(marketing)`: 28 files
  - `src/app/crm`: 31 files
  - `src/app/api`: 27 files
  - `src/lib`: 19 files
  - `src/emails`: 5 files
  - **Tổng cộng: ~287 files UI + ~124 test files = 411 files!**
- **Đánh giá năng lực thực thi:**
  - Story 14.2 gán **8 Story Points** cho việc chuyển đổi 411 files. Đây là ước lượng phi thực tế.
  - Trong mô hình phát triển với AI Dev Agent, một story chỉ nên chạm từ **5 đến 15 files** trong một lượt chạy để đảm bảo context window không bị cạn, code diff nằm trong tầm kiểm soát, và các bài test được chạy xác minh liên tục.
  - Cố gắng đưa 287 file và 124 test file vào 1 story sẽ dẫn đến:
    - Agent bị tràn context, bắt đầu cắt xén code, bỏ sót key hoặc sinh code lỗi cú pháp.
    - Git diff khổng lồ (>15,000 dòng code), bất khả thi cho reviewer con người hoặc PR review.
    - Test suite 124 files gãy hàng loạt mà không thể cô lập nguyên nhân do module nào gây ra.
  - **Khuyến nghị bắt buộc:** Tách nhỏ Story 14.2 thành các story theo phân hệ nghiệp vụ độc lập như chính đề xuất ban đầu trong khảo sát kỹ thuật (Survey Section 5).

---

### 3.3. AC Testability — Tính Kiểm Chứng Của Tiêu Chí Chấp Nhận

#### ⚠️ Tiêu chí "no hardcoded Vietnamese string remains" mang tính cảm tính
- **Vấn đề:** Không đưa ra cơ chế kiểm chứng cụ thể (verification harness). Dev không thể rà soát bằng mắt 287 file, và QA cũng không thể click qua từng màn hình để tìm chữ sót.
- **Giải pháp chuẩn hóa:** Bổ sung AC kỹ thuật:
  - Tích hợp linter rule: `eslint-plugin-i18next` với cấu hình báo lỗi khi có raw string literals trong JSX components.
  - Hoặc xây dựng một script kiểm tra tự động (`scripts/check-hardcoded-vi.ts`) quét ký tự tiếng Việt có dấu trong các thư mục `src/app` và `src/components` (ngoại trừ file `messages/*.json`).
  - Lệnh kiểm chứng: `npm run lint:i18n` phải trả về exit code 0 trên CI pipeline.

#### ⚠️ Tiêu chí di chuyển ~124 test files mang tính nước đôi
- **Vấn đề:** AC ghi: `render with vi default locale OR assert message keys`. Từ khóa "OR" khiến hai lập trình viên sẽ làm theo hai trường phái đối nghịch:
  - Dev A bọc component với `NextIntlClientProvider` (locale `vi`) để giữ nguyên assertion tiếng Việt.
  - Dev B mock hook `useTranslations` để trả về key (`auth.login.submit`) và sửa toàn bộ assertion thành key.
- **Giải pháp chuẩn hóa:** Chốt rõ ràng một quy ước kiểm thử:
  - Xây dựng `renderWithIntl(ui, { locale = 'vi', ...options })` trong `src/testing/test-utils.tsx`.
  - Mọi unit/integration test giữ nguyên assertion chuỗi tiếng Việt mặc định (`vi`), giúp test chạy ổn định mà không cần viết lại toàn bộ logic kiểm tra.
  - Các test case kiểm tra đa ngôn ngữ chỉ cần assert bổ sung khi chuyển đổi locale sang `en`.

---

### 3.4. Coverage Gaps — Các Điểm Trắng Kỹ Thuật So Với PRD & Research

#### ❌ Gap 1: Thiếu hoàn toàn cột `orders.locale` trong Database Migration
- Story 14.4 quy định: `docx template is selected per order.locale`.
- Tuy nhiên, trong Story 14.1 chỉ có migration tạo `users.locale`. Story 14.3 chỉ tạo `translations` cho content tables và `post_translations`.
- **Rủi ro nghiệp vụ:** Khi người dùng nước ngoài đặt hàng, đơn hàng và hợp đồng pháp lý tương ứng phải được đóng băng (freeze) theo ngôn ngữ tại thời điểm giao dịch. Nếu dựa vào `users.locale`, khi người dùng sau này đổi ngôn ngữ tài khoản sang tiếng Việt, hợp đồng cũ sẽ bị render sai ngôn ngữ ban đầu.
- **Khắc phục:** Phải bổ sung `orders.locale TEXT NOT NULL DEFAULT 'vi'` vào migration của DB.

#### ❌ Gap 2: Định dạng Số, Ngày Tháng và Tiền Tệ (L10n)
- Nền tảng có giao dịch mua bán cây gỗ lớn, đặt phòng sinh thái, thanh toán đơn hàng.
- Tiếng Việt hiển thị: `15.000.000 ₫`, `30/04/2026`.
- Tiếng Anh hiển thị: `15,000,000 VND` (hoặc tiền tệ quy đổi nếu có), `Apr 30, 2026`.
- Không có bất kỳ dòng nào trong Epic 14 nhắc đến việc cấu hình `next-intl` formatting (`format.dateTime`, `format.number`) hay xử lý định dạng tiền tệ nhất quán trên các trang checkout, my-garden, invoice.

#### ❌ Gap 3: Logic Đọc Số Tiền Thành Chữ Trong Hợp Đồng Pháp Lý
- Route sinh hợp đồng (`src/app/api/contracts/generate/route.ts`) hiện đang sử dụng helper:
  `numberToVietnameseWords(order.total_amount)` (ví dụ: *"Một trăm triệu đồng chẵn"*).
- Khi sinh hợp đồng tiếng Anh (`contract-template.en.docx`), nếu không có helper `numberToEnglishWords`, trường số tiền thành chữ trong hợp đồng tiếng Anh sẽ xuất hiện dòng chữ tiếng Việt hoặc bị lỗi. Đây là thiếu sót trực tiếp trong Story 14.4.

#### ❌ Gap 4: Môi trường Deno Edge Functions
- Supabase Edge Functions chạy trên nền tảng Deno, tách biệt hoàn toàn với Next.js runtime. Chúng không thể import thư viện hay catalog của `next-intl`.
- Story 14.4 yêu cầu migrate Edge Functions nhưng không quy định:
  - Các Edge Function gửi email/thông báo độc lập (như cron `checklist-reminder`, `process-sellback`) sẽ lấy bản dịch từ đâu?
  - Sẽ gọi qua API nội bộ của Next.js (`POST /api/internal/email/send` kèm locale), hay Edge Functions sẽ đọc chung file JSON từ điển lưu trong Supabase Storage / Database?

---

### 3.5. Divergence Risk — Nguy Cơ Phân Kỳ Kiến Trúc Khi Thực Thi

#### ⚠️ Nguy cơ 1: Cấu trúc Message Catalogs không thống nhất
- Epic không quy định tổ chức thư mục từ điển:
  - Phương án A: Một file khổng lồ `messages/vi.json` và `messages/en.json` (dễ conflict khi nhiều dev cùng sửa).
  - Phương án B: Chia nhỏ theo namespaces (`messages/vi/common.json`, `auth.json`, `admin.json`, `crm.json`).
- Không có quy ước đặt tên key (dot notation, camelCase hay snake_case).

#### ⚠️ Nguy cơ 2: Cấu trúc trường trong JSONB `translations`
- Story 14.3 chỉ ghi định dạng chung: `{"vi": {...}, "en": {...}}`.
- Nếu không định nghĩa TypeScript type rõ ràng cho từng bảng:
  - Dev A lưu `products.translations`: `{"en": {"name": "Pine", "description": "Highland pine"}}`
  - Dev B lưu `rooms.translations`: `{"en": {"title": "Deluxe", "amenities": ["Wifi"]}}` (dùng `title` thay vì `name`)
  - Dev C khi viết hàm helper query không biết key nào là bắt buộc, dẫn đến undefined runtime.

#### ⚠️ Nguy cơ 3: Bản địa hóa Zod Validation & Server Action Errors
- Có 35 file Server Actions trong `src/actions` trả về lỗi toast/validation.
- Epic không thống nhất:
  - Trả về mã lỗi (code/key) để client tự gọi `t(error)`?
  - Hay gọi `getTranslations()` ngay trong Server Action để trả về chuỗi đã dịch?
  - Nếu không thống nhất, hệ thống thông báo Toast sẽ hiển thị lộn xộn giữa key thô và chuỗi đã dịch.

---

## 4. Đề Xuất Tái Cấu Trúc Epic 14 (Proposed Re-Breakdown)

Để đảm bảo tính khả thi, phân tách trách nhiệm rõ ràng, và mỗi story nằm trọn vẹn trong context 1 dev agent (<= 8 SP, <= 30 files sửa đổi), kiến nghị tái cấu trúc Epic 14 thành **8 stories có thứ tự phụ thuộc chuẩn xác**:

```
[14.1 Foundation & Routing]
       │
       ├─────────────────────────────────────────┐
       ▼                                         ▼
[14.2 DB Schema & Locale Migrations]      [14.4 Extract Marketing & Public UI]
       │                                         │
       ├───────────────────┐                     ▼
       ▼                   ▼              [14.5 Extract CRM & Customer Portal]
[14.3 Multi-lang CMS    [14.7 Emails, Contracts  │
 & Admin Entry Forms]    & Notifications]        ▼
       │                   │              [14.6 Extract Admin UI & Actions]
       └─────────┬─────────┘                     │
                 ▼                               ▼
       [14.8 Full SEO, Alternates & Test Suite Hardening]
```

### Chi tiết các Stories đề xuất:

#### **Story 14.1: i18n Core Foundation & Middleware Integration (5 SP, P0)**
- Cài đặt `next-intl` (App Router + RSC + React 19).
- Cấu hình Middleware Compose: `next-intl` (locale resolution, `as-needed` prefix) ∘ Supabase Auth (bảo vệ `/crm` và `/en/crm`, giữ redirect params) ∘ CSP headers.
- Tạo cấu trúc thư mục message catalogs có phân chia namespace (`common`, `auth`, `nav`, `errors`).
- Tạo helper `renderWithIntl` cho test suite.
- Thêm `LanguageSwitcher` trên Header và cập nhật `<html lang="...">` động.
- Pilot: Chuyển đổi hoàn chỉnh trang Landing Page.

#### **Story 14.2: Database Localization Schema & Backfill (5 SP, P0)**
- Migration thêm `users.locale TEXT NOT NULL DEFAULT 'vi'`.
- Migration thêm `orders.locale TEXT NOT NULL DEFAULT 'vi'` (cố định ngôn ngữ giao dịch).
- Migration thêm JSONB `translations` vào các bảng: `products`, `product_categories`, `rooms`, `lots`, `notifications`, `email_templates`. Backfill toàn bộ dữ liệu `vi` hiện tại.
- Tạo bảng `post_translations (id, post_id, locale, slug UNIQUE, title, excerpt, content, meta_title, meta_description)`.
- Định nghĩa TypeScript interfaces & Zod schemas cho translation payloads của từng bảng; viết helper truy vấn `getLocalizedContent(entity, locale)`.

#### **Story 14.3: Admin Multi-Language Entry & TipTap Tabs (5 SP, P1)**
*(Phụ thuộc: 14.2)*
- Tái cấu trúc các form admin: Blog (`BlogEditor.tsx`), Store Products, Eco-stay Rooms, Lots.
- Thêm tab chuyển đổi VI/EN trực quan; tích hợp TipTap editor hỗ trợ nhập nội dung rich-text độc lập cho cả 2 ngôn ngữ.
- Cập nhật Server Actions tạo/sửa sản phẩm và bài viết để lưu đúng cấu trúc `translations` và `post_translations`.

#### **Story 14.4: UI Localization — Marketing & Public Storefront (5 SP, P1)**
*(Phụ thuộc: 14.1)*
- Phạm vi: ~28 files trong `src/app/(marketing)` và các components dùng chung (Footer, Navigation, Pricing, Public Blog, Public Store).
- Chuẩn hóa Date/Time và Currency formatter (`useFormatter`) cho hiển thị giá cây, giá phòng, ngày phát hành.

#### **Story 14.5: UI Localization — CRM & Customer Dashboard (5 SP, P1)**
*(Phụ thuộc: 14.1)*
- Phạm vi: ~42 files trong `src/app/crm`, `src/components/crm`, My Garden, Bookings, Orders.
- Bản địa hóa toàn bộ nhãn trạng thái đơn hàng (`StoreOrderStatusBadge`), lịch sử chăm sóc cây, thông tin tài khoản.

#### **Story 14.6: UI Localization — Admin Portal & Server Actions (5 SP, P1)**
*(Phụ thuộc: 14.1, 14.3)*
- Phạm vi: ~37 files giao diện Admin quản trị (`src/components/admin`, bảng biểu, bộ lọc).
- Bản địa hóa 35 file Server Actions (`src/actions`) và 27 file API (`src/app/api`): Chuẩn hóa cơ chế trả về mã lỗi toast/validation bằng Zod.

#### **Story 14.7: Transactional Email, Docx Contract & PDF Certificate (5 SP, P1)**
*(Phụ thuộc: 14.2)*
- React Email: Cập nhật 5 templates trong `src/emails` nhận `locale` prop lấy từ `users.locale`.
- Docx Contracts: Tạo `contract-template.en.docx` song song với template tiếng Việt hiện có; chọn template theo `order.locale`. Bổ sung helper `numberToEnglishWords` cho số tiền hợp đồng tiếng Anh.
- PDF Certificate: Embed font Unicode (Roboto/Noto Sans) trong Edge Function `generate-certificate` để hiển thị tiếng Việt có dấu và tiếng Anh chuẩn xác.
- Edge Functions & Notifications: Chuẩn hóa cơ chế gọi template email qua API nội bộ có truyền `locale`.

#### **Story 14.8: Dynamic SEO Sitemap, Hreflang & Test Suite Hardening (5 SP, P2)**
*(Phụ thuộc: 14.2, 14.3, 14.4, 14.5, 14.6)*
- Tích hợp sitemap `alternates` và `generateMetadata` cho toàn bộ các trang động (Blog lấy slug per-locale từ `post_translations`, Products, Rooms).
- Cài đặt linter check tự động phát hiện chuỗi hardcode tiếng Việt trong CI.
- Di chuyển và hoàn thiện ~124 file kiểm thử đảm bảo 100% test pass với cơ chế `renderWithIntl`.

---

## 5. Khuyến Nghị Hành Động Ngay (Action Items)

1. **Cập nhật `epics.md`**: Thay thế 4 stories hiện tại của Epic 14 bằng cấu trúc 8 stories như đã đề xuất ở Mục 4.
2. **Bổ sung Type Defs**: Tạo sẵn file `src/types/i18n.ts` quy định cấu trúc `Locale = 'vi' | 'en'` và định dạng JSONB translations cho từng bảng trước khi dev bắt đầu story 14.2.
3. **Chốt Convention Zod Validation**: Thống nhất quy ước: Server Actions trả về error key (ví dụ: `{ success: false, errorKey: 'errors.lot_not_found' }`) để Client component tự dịch qua `t(errorKey)`.
