# BÁO CÁO REVIEW ĐỐI KHÁNG (ADVERSARIAL ARCHITECTURE REVIEW)
## ĐỐI TƯỢNG KIỂM TOÁN: EPIC 14 — MULTI-LANGUAGE (i18n)
**Tài liệu tham chiếu:** `_bmad-output/planning-artifacts/epics.md` (Dòng 1745–1861)  
**Ngày thực hiện:** 2026-10-09  
**Người thực hiện:** Senior Adversarial Reviewer  
**Phương pháp:** Tấn công giả lập 2 Dev-Agent độc lập (Dev A & Dev B) triển khai song song hoặc tuần tự theo đúng 100% văn bản Acceptance Criteria (AC), tìm kiếm các điểm phân kỳ (divergence holes), xung đột kiến trúc và rủi ro sập hệ thống (regression risks).

---

## 1. TỔNG QUAN & VERDICT

| Chỉ số | Đánh giá |
|---|---|
| **Trạng thái Epic 14** | **REQUEST_CHANGES (YÊU CẦU SỬA ĐỔI TOÀN DIỆN)** |
| **Mức độ rủi ro (Risk Level)** | **CRITICAL (Rất nghiêm trọng)** |
| **Tổng số lỗ hổng phân kỳ phát hiện** | **8 Lỗ hổng cốt lõi + 2 Lỗ hổng hạ tầng** |
| **Số lỗi chặn triển khai (Blockers)** | 4 lỗi P0 (Không thể build/run tích hợp thành công) |
| **Số lỗi suy thoái dữ liệu & SEO (Major)** | 4 lỗi P1 (Gãy SEO, crash runtime, Frankenstein UI) |
| **Số lỗi trải nghiệm & chuẩn hóa (Minor)** | 2 lỗi P2 (Inconsistent format, Edge Function limits) |

### Nhận định của Reviewer:
Epic 14 được soạn thảo dựa trên ý tưởng kiến trúc tốt (kế thừa từ nghiên cứu `next-intl` ngày 2026-09-21), nhưng **các Acceptance Criteria quá sơ sài, thiếu các hợp đồng giao diện dữ liệu (data contracts) và ranh giới trách nhiệm (boundary ownership) giữa các story**. Nếu giao cho các kỹ sư hoặc AI Dev-Agent độc lập làm việc theo đúng AC từng story, hệ thống chắc chắn sẽ bị phân mảnh, xuất hiện lỗi xung đột schema DB, sập tính năng thông báo và tụt hạng SEO nghiêm trọng.

---

## 2. CHI TIẾT CÁC LỖ HỔNG PHÂN KỲ (DIVERGENCE HOLES)

### 🔴 LỖ HỔNG BẬC 1: BLOCKERS (GÃY TÍCH HỢP & RUNTIME CRASH)

---

#### Hole 1 (Kịch bản 3): Ảo ảnh dữ liệu `order.locale` — Truy vấn cột không tồn tại
* **Vị trí AC:** Story 14.4 AC đối chiếu Story 14.1 AC & Schema Supabase hiện tại.
* **Nguyên nhân văn bản:**
  * Story 14.1 chỉ yêu cầu tạo cột `users.locale`: *"`users.locale` column exists (text NOT NULL DEFAULT 'vi') as source of truth for email/notification language"*.
  * Story 14.4 lại đặt điều kiện: *"Given a contract or certificate is generated Then docx template is selected per `order.locale` (`contract-template.vi.docx` / `.en.docx`)"*.
  * Trong schema thực tế (`orders` và `store_orders`), hoàn toàn **KHÔNG CÓ** cột `locale`.
* **Phân kỳ giữa 2 Dev:**
  * **Dev 14.1:** Chỉ tạo migration thêm `users.locale`. Không đụng vào bảng `orders`.
  * **Dev 14.2:** Khi localize form checkout, chỉ gửi payload đơn hàng như cũ, không thu thập hay lưu `locale` vào đơn hàng.
  * **Dev 14.4:** Đọc AC thấy `order.locale`, viết code truy vấn `const template = order.locale === 'en' ? enDocx : viDocx`. Khi chạy: TypeScript ném lỗi Type Mismatch, hoặc SQL runtime ném lỗi Postgres: `column orders.locale does not exist`!
  * *Hành vi tự biên tự diễn của Dev 14.4:* Nếu Dev 14.4 tự ý viết migration thêm `orders.locale`, thì cột này sẽ luôn mang giá trị `NULL` hoặc default `'vi'` vì Dev 14.2 không hề ghi nhận ngôn ngữ lúc tạo đơn. Khách hàng quốc tế đặt hàng tại `/en/store/checkout` nhưng hợp đồng pháp lý sinh ra vẫn là tiếng Việt!
* **Đề xuất ràng buộc bắt buộc (Constraint Fix):**
  1. Chuyển trách nhiệm schema: Bổ sung rõ ràng vào Story 14.1 hoặc Story 14.3: Thêm migration `ALTER TABLE orders ADD COLUMN locale text NOT NULL DEFAULT 'vi'` và `ALTER TABLE store_orders ADD COLUMN locale text NOT NULL DEFAULT 'vi'`.
  2. Bổ sung vào Story 14.2: Hành vi checkout Server Action **phải** đọc current locale từ request context và ghi rõ vào `orders.locale`.

---

#### Hole 2 (Kịch bản 5): Bẫy Not-Null & Crash Drawer thông báo cũ (Notification Migration Gap)
* **Vị trí AC:** Story 14.3 Technical Constraints đối chiếu Story 14.4 AC & Schema bảng `notifications`.
* **Nguyên nhân văn bản:**
  * Schema hiện tại của bảng `notifications`:
    * `title text NOT NULL`
    * `body text`
    * `data jsonb`
  * Story 14.3 yêu cầu: *"`notifications` store template key + params in `data` jsonb; render text at runtime by `user.locale`"*.
  * Story 14.4 yêu cầu: *"notifications render runtime text by template key + params"*.
  * Không có bất kỳ story nào quy định việc migration dữ liệu cũ hoặc xử lý constraint `NOT NULL` của cột `title`.
* **Phân kỳ giữa 2 Dev:**
  * **Dev 14.3 (Backend Insert):** Sửa các lệnh `insert` thông báo để chỉ đẩy `{ data: { templateKey: 'order_paid', params: { code: '...' } } }`. Bỏ không truyền `title`. Khi trigger chạy: Database văng lỗi `23502: null value in column "title" of relation "notifications" violates not-null constraint`. Toàn bộ luồng nghiệp vụ thanh toán / rút tiền / duyệt đơn bị rollback và crash!
  * **Dev 14.4 (Frontend Notification Center):** Viết component render runtime: `t(notification.data.templateKey, notification.data.params)`. 
  * Khi user cũ mở Notification drawer, hàng chục notification cũ có `data.templateKey = undefined`. Hàm `t(undefined)` ném Javascript Uncaught TypeError, làm trắng màn hình trang CRM (Crash React tree).
* **Đề xuất ràng buộc bắt buộc (Constraint Fix):**
  1. Trong Story 14.3: Viết migration `ALTER TABLE notifications ALTER COLUMN title DROP NOT NULL;`.
  2. Quy định cơ chế Backward-Compatible rendering trong Story 14.4: 
     `notification.data?.templateKey ? t(notification.data.templateKey, notification.data.params) : notification.title`.
  3. Bổ sung script migration dữ liệu thông báo cũ hoặc giữ nguyên `title` làm fallback.

---

#### Hole 3 (Kịch bản 4): Đứt gãy SEO Sitemap & Lỗi 404 Hreflang hàng loạt
* **Vị trí AC:** Story 14.1 AC đối chiếu Story 14.3 AC.
* **Nguyên nhân văn bản:**
  * Story 14.1 yêu cầu ngay lập tức: *"`generateMetadata`, sitemap `alternates`, and hreflang cover both locales"*.
  * Nhưng Story 14.3 mới tạo bảng `post_translations` để lưu slug tiếng Anh per-locale (`slug UNIQUE`).
* **Phân kỳ giữa 2 Dev:**
  * **Dev 14.1:** Cấu hình sitemap động cho toàn bộ site theo schema hiện có (`posts` chỉ có 1 cột `slug` tiếng Việt). Dev 14.1 tự động sinh alternate:
    * VI: `https://dainganxanh.vn/blog/cay-thien-ngan`
    * EN: `https://dainganxanh.vn/en/blog/cay-thien-ngan`
  * **Dev 14.3:** Tạo bảng `post_translations` với slug EN riêng biệt: `https://dainganxanh.vn/en/blog/anthocephalus-cadamba`.
  * Vì Dev 14.3 chỉ nhận nhiệm vụ trong phạm vi Story 14.3 (DB & Admin form) nên không cập nhật lại sitemap của Story 14.1.
  * Hậu quả: Googlebot crawl sitemap từ 14.1, truy cập vào `/en/blog/cay-thien-ngan` → Trả về **HTTP 404 Not Found**. Google Search Console phạt lỗi hreflang no-return-tag và rớt chỉ mục toàn bộ blog.
* **Đề xuất ràng buộc bắt buộc (Constraint Fix):**
  1. Phạm vi Story 14.1: Chỉ áp dụng sitemap alternates cho **static marketing pages** (landing, about, contact).
  2. Chuyển sitemap blog động sang Story 14.3: Story 14.3 phải phụ trách việc query `post_translations` để sinh canonical & alternate links chuẩn xác cho từng bài viết.

---

#### Hole 4 (Kịch bản 7): Xung đột ma trận Source of Truth (Cookie vs Database vs Header vs URL)
* **Vị trí AC:** Story 14.1 Technical Constraints đối chiếu Story 14.4 & Luồng CRM.
* **Nguyên nhân văn bản:**
  * Story 14.1: *"Locale negotiation: prefix → cookie → `Accept-Language` → default `vi`"*.
  * Story 14.1 cũng ghi: *"`users.locale` column exists as source of truth for email/notification language And a language switcher exists in MarketingHeader + CRMHeader, persisting choice via cookie"*.
  * Không hề có cơ chế đồng bộ 2 chiều (Bidirectional Sync) giữa Cookie và `users.locale`.
* **Phân kỳ giữa 2 Dev:**
  * **Dev 14.1:** Tạo Switcher component ở Client-side. Khi người dùng đổi sang English, component chỉ ghi `document.cookie = "NEXT_LOCALE=en; path=/"` rồi reload trang. Hoàn toàn không gọi API update vào database `users.locale`.
  * **Dev 14.4:** Khi trigger gửi email đơn hàng, Dev 14.4 tuân thủ nghiêm ngặt AC 14.4: đọc `users.locale` trong DB.
  * **Hậu quả thực tế:** 
    * Một khách hàng người Mỹ đăng ký tài khoản, chuyển giao diện sang tiếng Anh để thanh toán khóa học hoặc mua cây.
    * Nhưng `users.locale` trong database vẫn giữ default `'vi'`!
    * Kết quả: Khách hàng thanh toán trên UI tiếng Anh, nhưng email hóa đơn, email hợp đồng gửi về hộp thư lại hoàn toàn bằng tiếng Việt!
    * Ngược lại, nếu user đổi `users.locale` trong trang Profile, middleware của 14.1 không đọc DB (để tối ưu latency) nên giao diện web vẫn giữ theo cookie cũ.
* **Đề xuất ràng buộc bắt buộc (Constraint Fix):**
  1. Quy định rõ thứ tự ưu tiên: 
     * Web UI context: URL prefix > Cookie > `users.locale` (nếu đã đăng nhập) > `Accept-Language` > `'vi'`.
  2. Bổ sung vào Story 14.1: Language switcher khi được kích hoạt bởi authenticated user **phải** đồng thời ghi cookie VÀ gọi Server Action cập nhật `users.locale`.

---

### 🟠 LỖ HỔNG BẬC 2: MAJORS (THOÁI HÓA CHẤT LƯỢNG & FRANKENSTEIN UI)

---

#### Hole 5 (Kịch bản 6): Thảm họa Frankenstein UI do phân kỳ Fallback (Field-level vs Row-level)
* **Vị trí AC:** Story 14.3 Technical Constraints & Story 14.2 UI fallback.
* **Nguyên nhân văn bản:**
  * Epic chỉ ghi vỏn vẹn: *"JSONB `translations` (`{"vi":{...},"en":{...}}`) for simple fields... fallback to `vi` when `en` is missing"*.
  * Không định nghĩa thuật toán giải quyết fallback khi một bản ghi chỉ được dịch dở dang (ví dụ: đã dịch tên nhưng chưa dịch nội dung).
* **Phân kỳ giữa 2 Dev:**
  * **Dev A (Phụ trách Content Helper / Data Access Layer):** Áp dụng **Row-level fallback**:
    ```ts
    const content = product.translations[locale] || product.translations['vi']
    ```
    Nếu admin nhập `translations.en = { name: "Forest Honey" }` (chưa nhập `description`), hàm trả về object `en`. Khi render ra trang, `description` bị `undefined`, trang web bị lủng một mảng trắng lớn.
  * **Dev B (Phụ trách Client Component):** Áp dụng **Field-level fallback**:
    ```ts
    const name = product.translations?.en?.name || product.translations?.vi?.name
    const description = product.translations?.en?.description || product.translations?.vi?.description
    ```
    Trang web render: Tên sản phẩm là "Forest Honey" (EN), nhưng ngay bên dưới phần giới thiệu và hướng dẫn sử dụng lại là một tràng tiếng Việt dài ngoằng "Mật ong rừng tự nhiên..."!
* **Đề xuất ràng buộc bắt buộc (Constraint Fix):**
  * Định nghĩa chuẩn hàm helper dùng chung bắt buộc: `getTranslatedField(record, field, locale, fallbackLocale = 'vi')`.
  * Cấm các dev tự viết logic fallback inline trong JSX.
  * Thêm chính sách hiển thị: Nếu thiếu trường quan trọng trong `en`, hệ thống hiển thị kèm badge cảnh báo ngôn ngữ hoặc xử lý nhất quán.

---

#### Hole 6 (Kịch bản 1): Phân mảnh Message Catalog Keys (Không có Namespace Convention)
* **Vị trí AC:** Story 14.2 AC.
* **Nguyên nhân văn bản:**
  * AC chỉ ghi chung chung: *"UI strings are extracted into `vi`/`en` message catalogs... all user-facing surfaces are covered: marketing (~28 files), CRM (~42 files), admin (~37 files), store/checkout"*.
  * Hoàn toàn thiếu tài liệu schema cho catalog keys.
* **Phân kỳ giữa 2 Dev:**
  * **Dev A (Làm Store/Checkout):** Đặt key theo domain phân cấp sâu:
    `messages/en.json` -> `{"store": {"checkout": {"title": "Checkout", "submit": "Pay Now"}}}`
  * **Dev B (Làm Shared Component/OrderSummary):** Đặt key phẳng theo component:
    `messages/en.json` -> `{"checkout.title": "Order Review", "OrderSummary.payButton": "Proceed"}`
  * Khi ráp nối: Component `OrderSummary` dùng `t('checkout.title')`, nhưng catalog chỉ có `store.checkout.title`.
  * Do `next-intl` khi thiếu key sẽ trả về chính key đó làm fallback, trên giao diện thanh toán production xuất hiện các đoạn text trơ trọi: `checkout.title`, `errors.INVALID_COUPON`!
* **Đề xuất ràng buộc bắt buộc (Constraint Fix):**
  * Ghim chặt quy ước đặt key (Catalog Key Taxonomy):
    * Cấu trúc lồng 3 cấp chuẩn: `<domain>.<page_or_feature>.<element>` (ví dụ: `store.checkout.page_title`).
    * Server Action / API errors: `errors.<domain>.<ERROR_CODE>` (ví dụ: `errors.auth.USER_NOT_FOUND`).
    * Shared UI: `common.<category>.<element>` (ví dụ: `common.buttons.save`).

---

#### Hole 7 (Kịch bản 2): Xung đột thứ tự bàn giao — Dev 14.3 phá vỡ cam kết "Zero Hardcoded VI" của Dev 14.2
* **Vị trí AC:** Thứ tự phụ thuộc giữa Story 14.2 và Story 14.3.
* **Nguyên nhân văn bản:**
  * Story 14.2 có điều kiện nghiệm thu: *"no hardcoded Vietnamese string remains in JSX or UI logic And ~124 test files asserting Vietnamese text are migrated"*.
  * Story 14.3 (làm sau hoặc song song): Thêm tab VI/EN vào ~37 admin forms.
* **Phân kỳ giữa 2 Dev:**
  * Dev 14.2 hoàn thành việc rà soát và chuyển đổi toàn bộ 37 form admin sang `t(...)`. Test suite pass 100%. PR của 14.2 được merge.
  * Dev 14.3 vào sửa form để thêm tab nhập liệu song ngữ TipTap. Dev 14.3 code giao diện tab:
    ```tsx
    <TabsList>
      <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
      <TabsTrigger value="en">Tiếng Anh</TabsTrigger>
    </TabsList>
    ```
    Kèm các label: "Tiêu đề tiếng Anh", "Nội dung tóm tắt tiếng Anh". Dev 14.3 hardcode các chuỗi này trực tiếp vào file TSX vì AC 14.3 không nhắc lại việc trích xuất key vào `messages/*.json`.
  * Khi chuyển ngôn ngữ admin sang English, các tab này vẫn hiện tiếng Việt, đồng thời phá vỡ các linter rule / test assert về i18n vừa được thiết lập ở 14.2.
* **Đề xuất ràng buộc bắt buộc (Constraint Fix):**
  * Bổ sung ràng buộc vào Story 14.3: Mọi thành phần UI mới được thêm vào form admin (Tab header, form label, validation helper) **bắt buộc phải tuân thủ catalog của Story 14.2** và trích xuất vào namespace `admin.content_entry.*`.

---

#### Hole 8 (Kịch bản 8): Bỏ quên hoàn toàn chuẩn hóa Formatting (Tiền tệ, Ngày tháng, Số học)
* **Vị trí AC:** Toàn bộ Epic 14 (từ 14.1 đến 14.4).
* **Nguyên nhân văn bản:**
  * Toàn bộ Epic không có bất kỳ tiêu chí nghiệm thu nào về định dạng số, tiền tệ và ngày tháng per-locale.
  * Hiện tại codebase đang hardcode hơn 40 vị trí với `Intl.NumberFormat('vi-VN')`, `amount + 'đ'`, `toLocaleDateString('vi-VN')`.
* **Phân kỳ giữa 2 Dev:**
  * **Dev 14.2:** Chỉ coi việc trích xuất string tĩnh là xong việc. Bỏ qua các hàm format số và ngày tháng. Người dùng chuyển sang `/en`, giá tiền vẫn hiển thị `1.500.000đ` và ngày tháng vẫn là `ngày 15 tháng 10 năm 2026`.
  * **Dev 14.4 (Docx & Email):** Khi render `contract-template.en.docx`, template có biến `tong_gia_tri_chu` (vốn đang chạy hàm `numberToVietnameseWords` trong `lib/utils/contract-helpers.ts`). Vì không có yêu cầu, Dev 14.4 để nguyên tiếng Việt vào hợp đồng tiếng Anh: "Total: 100,000,000 VND (Một trăm triệu đồng chẵn)"!
* **Đề xuất ràng buộc bắt buộc (Constraint Fix):**
  1. Thêm AC vào Story 14.2: Chuẩn hóa toàn bộ helper format (`formatCurrency`, `formatDate`) nhận param `locale`. Khi `locale=en`, tiền tệ hiển thị định dạng chuẩn quốc tế `100,000 VND` (hoặc cấu hình tiền tệ tương ứng) và ngày tháng chuẩn `MM/DD/YYYY`.
  2. Thêm vào Story 14.4: Bổ sung helper `numberToEnglishWords` hoặc quy định chuẩn thể hiện giá trị bằng chữ trong hợp đồng tiếng Anh.

---

### 🟡 LỖ HỔNG BẬC 3: HẠ TẦNG & TÀI NGUYÊN (EDGE RUNTIME & CERTIFICATES)

---

#### Hole 9: Giới hạn kích thước Unicode Font trong Edge Functions (Story 14.4)
* **Vị trí AC:** Story 14.4 AC (*"the pdf-lib certificate embeds a Unicode font (Noto Sans/Roboto) rendering both accented Vietnamese and English"*).
* **Nguyên nhân & Rủi ro:**
  * File `supabase/functions/generate-certificate/index.ts` hiện đang chạy trên **Deno Deploy / Supabase Edge Functions** và đang dùng `StandardFonts.Helvetica` (bằng cách xóa toàn bộ dấu tiếng Việt qua hàm `removeAccents`).
  * Font Noto Sans đầy đủ glyph tiếng Việt và ký tự đặc biệt có dung lượng từ 5MB đến 20MB. Giới hạn bộ nhớ và bundle size của Edge Function có thể dẫn đến CPU limit / Memory limit khi đọc và parse font binary qua `pdfDoc.embedFont()`.
  * Ngoài ra, trong `generate-certificate/index.ts`, toàn bộ label của chứng chỉ đang hardcode tiếng Việt ("CHUNG CHI SO HUU CAY XANH", "THONG TIN CHU SO HUU"). Story 14.4 chỉ bảo embed font Unicode nhưng không yêu cầu truyền `locale` vào certificate API payload, khiến chứng chỉ vẫn 100% tiếng Việt dù khách hàng chọn tiếng Anh!
* **Đề xuất ràng buộc bắt buộc (Constraint Fix):**
  * Tối ưu font (Subsetting TTF) chỉ chứa dải ký tự Latin và tiếng Việt mở rộng (< 500KB).
  * Bổ sung field `locale` vào `CertificateRequest` interface và tạo catalog nhãn chứng chỉ song ngữ.

---

#### Hole 10: Xung đột Middleware Matcher & Caching trên Next.js 16
* **Vị trí AC:** Story 14.1 Technical Constraints (*"Middleware order: next-intl resolves locale + creates response → Supabase getUser() refresh + /crm guard → CSP/security headers on the response"*).
* **Nguyên nhân & Rủi ro:**
  * Next.js 16 và `next-intl` khi dùng chế độ `localePrefix: 'as-needed'` cần xử lý rất khắt khe giữa static assets, route handlers `/api/*` và Supabase auth cookie.
  * Nếu middleware tạo response mới (`NextResponse.redirect` hoặc `rewrite`), các header thiết lập bởi Supabase Auth (set-cookie refresh token) rất dễ bị nuốt mất (dropped headers) nếu không được copy thủ công qua response cuối cùng.
* **Đề xuất ràng buộc bắt buộc (Constraint Fix):**
  * Story 14.1 phải cung cấp unit test & integration test cụ thể cho middleware composition chain, đảm bảo refresh token cookie của Supabase không bị mất khi next-intl thực hiện rewrite/redirect.

---

## 3. BẢNG MA TRẬN PHÂN KỲ & GIẢI PHÁP ĐỒNG BỘ

| ID | Vấn đề phân kỳ | Dev A (Story X) | Dev B (Story Y) | Hậu quả thực tế | Ràng buộc kỹ thuật cần chốt lại |
|---|---|---|---|---|---|
| **H-01** | `order.locale` | Dev 14.1 không tạo cột `orders.locale` | Dev 14.4 select `order.locale` | Crash SQL hoặc hợp đồng luôn ra tiếng Việt | Thêm migration `orders.locale` vào 14.1; 14.2 checkout lưu locale vào order |
| **H-02** | Notification Migration | Dev 14.3 không truyền `title` vào DB | Dev 14.4 render runtime `t(templateKey)` | Crash NOT NULL khi insert; crash React khi đọc notif cũ | Drop NOT NULL cột `title`; code fallback `notif.data?.key ? t(...) : notif.title` |
| **H-03** | SEO Sitemap Slug | Dev 14.1 sinh sitemap EN dùng slug cũ | Dev 14.3 tạo slug EN riêng ở `post_translations` | Googlebot nhận hàng loạt lỗi 404 Hreflang | 14.1 chỉ làm sitemap static; 14.3 chịu trách nhiệm sitemap blog |
| **H-04** | Source of Truth Sync | Dev 14.1 chỉ lưu locale vào cookie | Dev 14.4 chỉ đọc locale từ DB `users` | Web hiện tiếng Anh nhưng email nhận tiếng Việt | Switcher bắt buộc sync 2 chiều: Cookie + DB Server Action |
| **H-05** | Fallback JSONB | Dev A làm Row-level fallback | Dev B làm Field-level fallback | Mất nội dung (trắng trang) hoặc UI "nửa nạc nửa mỡ" | Viết hàm helper chuẩn `getTranslatedField` dùng chung toàn dự án |
| **H-06** | Key Naming | Dev A: `store.checkout.title` | Dev B: `checkout.title` | Không tìm thấy key, UI hiện raw text mã lỗi | Định nghĩa cấu trúc phân cấp Catalog Key Taxonomy chuẩn |
| **H-07** | Admin UI Tabs | Dev 14.2 gỡ hết hardcode VI | Dev 14.3 hardcode VI vào tab TipTap mới | Vi phạm AC 14.2, vỡ giao diện admin tiếng Anh | Bổ sung quy định 14.3 phải dùng message catalog cho mọi tab mới |
| **H-08** | Currency / Date | Dev 14.2 bỏ qua các hàm format số | Dev 14.4 dịch tiền tệ bằng chữ sai ngôn ngữ | Tiền tệ và ngày tháng hiển thị lộn xộn | Chuẩn hóa `formatCurrency` và `formatDate` theo locale |

---

## 4. KẾT LUẬN & KIẾN NGHỊ HÀNH ĐỘNG

Epic 14 hiện tại **CHƯA ĐỦ ĐIỀU KIỆN SẴN SÀNG TRIỂN KHAI (NOT READY FOR IMPLEMENTATION)**.

### Các hành động bắt buộc trước khi phát hành Epic 14:
1. **Cập nhật lại AC của Story 14.1:** Bổ sung việc tạo cột `orders.locale` và `store_orders.locale`. Quy định rõ trách nhiệm của Language Switcher đối với cả Cookie và Database.
2. **Cập nhật AC của Story 14.2:** Bắt buộc Server Action checkout phải ghi nhận ngôn ngữ mua hàng; ghim chặt tài liệu Catalog Key Taxonomy; chuẩn hóa các hàm format số và ngày tháng.
3. **Cập nhật AC của Story 14.3:** Điều chỉnh ràng buộc bảng `notifications` (drop NOT NULL `title`); chuyển việc sinh sitemap bài viết blog sang story này; bắt buộc giao diện tab VI/EN phải trích xuất catalog key.
4. **Cập nhật AC của Story 14.4:** Bổ sung cơ chế fallback render notification cho dữ liệu cũ; định nghĩa rõ luồng dịch số tiền thành chữ trong hợp đồng tiếng Anh; bổ sung tham số `locale` vào Edge Function chứng chỉ.
