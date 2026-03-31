# Story 10.1: Thu thập thông tin pháp lý khách hàng tại Checkout

Status: done

## Story

As a **buyer**,
I want to **điền thông tin pháp lý (CCCD, ngày sinh, địa chỉ) tại bước checkout**,
so that **hợp đồng được tạo tự động với đầy đủ thông tin chính xác**.

## Acceptance Criteria

1. **Given** tôi ở trang checkout sau khi chọn số lượng cây
   **When** bước "Thông tin hợp đồng" hiển thị
   **Then** form gồm: Họ tên, Ngày sinh, Quốc tịch, Số CCCD, Ngày cấp, Nơi cấp, Địa chỉ, SĐT
   **And** Quốc tịch default "Việt Nam"

2. **Given** tôi điền form
   **When** submit
   **Then** validate: CCCD = 12 chữ số, ngày sinh/ngày cấp = valid date, tất cả required fields có giá trị
   **And** hiển thị inline error messages tiếng Việt

3. **Given** form hợp lệ
   **When** tôi click tiếp tục
   **Then** QR thanh toán mới hiển thị
   **And** thông tin được lưu vào order record

4. **Given** tôi đã login và có thông tin profile
   **When** form load
   **Then** pre-fill từ user profile (nếu có)

## Tasks / Subtasks

- [x] Task 1: DB Migration (AC: 3)
  - [x] 1.1 Thêm columns vào orders table: `dob` (date), `nationality` (text, default 'Việt Nam'), `id_number` (text), `id_issue_date` (date), `id_issue_place` (text), `address` (text), `phone` (text)
  - [x] 1.2 Apply migration via Supabase dashboard hoặc migration file

- [x] Task 2: Update API `/api/orders/pending` POST (AC: 3)
  - [x] 2.1 Thêm new fields vào request body validation (Zod)
  - [x] 2.2 Thêm new fields vào Supabase upsert call (2-step: upsert base + UPDATE identity)
  - [x] 2.3 Ensure backward compatibility — new fields optional nếu order tạo không qua contract flow

- [x] Task 3: Customer Identity Form Component (AC: 1, 2, 4)
  - [x] 3.1 Tạo `src/components/checkout/CustomerIdentityForm.tsx`
  - [x] 3.2 Fields: Họ tên (text), Ngày sinh (date input), Quốc tịch (text, default "Việt Nam"), Số CCCD (text, 12 digits), Ngày cấp (date), Nơi cấp (text), Địa chỉ (textarea), SĐT (tel)
  - [x] 3.3 Zod validation schema cho form (Zod v4 với `.issues` API)
  - [x] 3.4 Inline error messages tiếng Việt
  - [x] 3.5 Pre-fill từ user metadata nếu có (full_name, phone)

- [x] Task 4: Checkout Flow Integration (AC: 1, 3)
  - [x] 4.1 Thêm step "Thông tin hợp đồng" vào checkout page
  - [x] 4.2 Flow: Quantity → **Customer Identity Form** → Banking QR
  - [x] 4.3 Pass customer data khi gọi `/api/orders/pending` POST (với referral cookie lookup)
  - [x] 4.4 QR chỉ hiện sau khi form submit thành công

## Dev Notes

### Architecture Compliance

- **Framework:** Next.js 16.1.1, React 19, TypeScript
- **Database:** Supabase PostgreSQL (direct SDK queries, không Prisma)
- **Validation:** Zod 4.3.5 (đã có trong project)
- **Styling:** Tailwind CSS + class-variance-authority (existing pattern)
- **State:** React useState/useEffect (no external state management)

### Existing Code References

- **Checkout page:** `src/app/(marketing)/checkout/page.tsx` — dùng "use client", nhận quantity từ URL params
- **BankingPayment component:** `src/components/checkout/BankingPayment.tsx` — tạo pending order trong useEffect (lines 39-84), hiện QR sau khi order created
- **Pending API:** `src/app/api/orders/pending/route.ts` — POST handler upsert fields (lines 75-89), onConflict: 'code'
- **Supabase client:** `src/lib/supabase/server.ts` (server), `src/lib/supabase/client.ts` (client)

### CRITICAL: Checkout Flow Hiện Tại

Hiện tại `BankingPayment` component tự gọi `/api/orders/pending` POST khi mount (lines 39-84). Flow mới cần:

1. Checkout page render CustomerIdentityForm trước
2. Sau khi form submit OK → render BankingPayment
3. BankingPayment nhận thêm customer data props để truyền vào pending order API
4. **HOẶC** refactor: tách logic create order ra khỏi BankingPayment, checkout page gọi API trước rồi mới render BankingPayment

**Đề xuất:** Approach 2 — checkout page quản lý state `orderCreated`, gọi API create order với đủ customer data, sau đó render BankingPayment chỉ để hiển thị QR + polling.

### DB Migration SQL

```sql
-- Migration: add customer identity fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'Việt Nam';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS id_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS id_issue_date date;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS id_issue_place text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone text;
```

### Validation Schema

```typescript
import { z } from 'zod';

const customerIdentitySchema = z.object({
  full_name: z.string().min(1, 'Vui lòng nhập họ tên'),
  dob: z.string().min(1, 'Vui lòng nhập ngày sinh'),
  nationality: z.string().default('Việt Nam'),
  id_number: z.string().regex(/^\d{12}$/, 'Số CCCD phải có 12 chữ số'),
  id_issue_date: z.string().min(1, 'Vui lòng nhập ngày cấp'),
  id_issue_place: z.string().min(1, 'Vui lòng nhập nơi cấp'),
  address: z.string().min(1, 'Vui lòng nhập địa chỉ'),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ'),
});
```

### UX Notes

- Form nên gọn, mobile-first (single column)
- Date inputs dùng native `<input type="date">` cho mobile UX
- CCCD field có `inputMode="numeric"` và `maxLength={12}`
- "Quốc tịch" field có thể là text input thay vì dropdown (đa số KH là VN)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-10.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Technology-Stack]
- [Source: docs/prd.md#FR-32]
- [Source: src/app/api/orders/pending/route.ts — POST handler lines 75-89]
- [Source: src/components/checkout/BankingPayment.tsx — order creation lines 39-84]

### Review Findings

- [x] [Review][Patch] Silent identity update failure — API returns success even when identity data fails to save, causing data loss [route.ts:122-125]
- [x] [Review][Patch] JSX duplication — Order Summary ~50 lines copy-pasted between identity and payment steps [checkout/page.tsx:223-271,293-341]
- [x] [Review][Patch] Missing server-side identity validation — API does not validate identity fields (id_number format, required fields) with Zod [route.ts:59-76]
- [x] [Review][Patch] No back navigation from payment step — User cannot go back to edit identity info after submitting form [checkout/page.tsx:275]
- [x] [Review][Defer] Hardcoded referral code `DNG895075` [checkout/page.tsx:81] — deferred, pre-existing
- [x] [Review][Defer] No DB indexes on identity columns [migration SQL] — deferred, pre-existing
- [x] [Review][Defer] No uniqueness constraint on `id_number` — deferred, business decision needed

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Zod v4 dùng `.issues` thay vì `.errors` — fixed validation error extraction
- Pre-fill useEffect async gây double name trong test — fixed bằng cách wait cho pre-fill trước
- Date inputs jsdom không hỗ trợ `userEvent.type` — fixed bằng `fireEvent.change`
- `BankingPayment` removed order creation useEffect — polling starts immediately khi nhận `orderCode`

### Completion Notes List
- Task 1: Tạo migration SQL `20260328_add_customer_identity_to_orders.sql` với 7 columns
- Task 2: API updated với 2-step approach: upsert base order (ignoreDuplicates=true) + UPDATE identity fields (chỉ khi status='pending'). GET endpoint cũng trả về identity fields để checkout page skip form nếu đã có data.
- Task 3: `CustomerIdentityForm.tsx` với Zod v4 schema, 8 fields, inline Vietnamese errors, pre-fill from user metadata. 7/7 tests pass.
- Task 4: Checkout page refactored với `CheckoutStep` state ('loading' | 'identity' | 'payment'). BankingPayment order creation removed — checkout page handles it. Skip identity form nếu existing order already has `id_number`.

### File List
- supabase/migrations/20260328_add_customer_identity_to_orders.sql (NEW)
- dainganxanh-landing/src/app/api/orders/pending/route.ts (MODIFIED)
- dainganxanh-landing/src/components/checkout/CustomerIdentityForm.tsx (NEW)
- dainganxanh-landing/src/components/checkout/__tests__/CustomerIdentityForm.test.tsx (NEW)
- dainganxanh-landing/src/app/(marketing)/checkout/page.tsx (MODIFIED)
- dainganxanh-landing/src/components/checkout/BankingPayment.tsx (MODIFIED)
