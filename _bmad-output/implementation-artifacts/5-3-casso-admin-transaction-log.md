# Story 5.3: Casso Admin Transaction Log

Status: review

## Story

As a admin,
I want xem lịch sử tất cả giao dịch Casso (kể cả không khớp),
so that tôi có thể xử lý thủ công các trường hợp lỗi và audit trail thanh toán.

## Acceptance Criteria

1. **AC1 — Route:** Trang `/crm/admin/casso` hiển thị danh sách `casso_transactions` mới nhất trước
2. **AC2 — Columns:** Hiển thị: thời gian, số tiền, nội dung CK, orderCode (nếu parse được), status badge, note
3. **AC3 — Status badges:** Badge màu theo status: `processed`=xanh, `processing`=vàng, `no_match`=xám, `order_not_found`=cam, `amount_mismatch`=đỏ, `function_error`=đỏ đậm
4. **AC4 — Filter:** Filter theo status (dropdown) và date range
5. **AC5 — Manual process:** Với các transaction `status='order_not_found'` hoặc `amount_mismatch` — admin có thể nhập `orderCode` và force-process
6. **AC6 — Admin only:** Route protected bởi `AdminLayout` hiện có (`/crm/admin/layout.tsx`)
7. **AC7 — Pagination:** 20 records/page

## Prerequisite

- Story 5.1 và 5.2 phải hoàn thành trước

## Tasks / Subtasks

- [ ] Task 1: Tạo page `/crm/admin/casso/page.tsx` (AC: #1 → #4, #6, #7)
  - [ ] Server Component — fetch từ Supabase với `createServerClient()`
  - [ ] Tận dụng `AdminLayout` hiện có (không cần thêm auth check)
  - [ ] Table với columns: `created_at, amount, description, orderCode (parsed), status, note`
  - [ ] Status badge component
  - [ ] Filter UI (client-side filter hoặc URL search params)

- [ ] Task 2: Tạo Server Action `manualProcessTransaction` (AC: #5)
  - [ ] Tạo `src/actions/casso.ts`
  - [ ] Input: `transactionId`, `orderCode`
  - [ ] Lookup order → invoke `process-payment`
  - [ ] Update `casso_transactions.status` và `order_id`

- [ ] Task 3: Thêm link vào AdminSidebar (AC: #6)
  - [ ] File: `src/components/admin/AdminSidebar.tsx`
  - [ ] Thêm item "Casso Logs" với icon phù hợp

## Dev Notes

### Admin Route Structure (tham khảo pattern hiện có)

```
/crm/admin/                     ← redirect to /analytics
/crm/admin/analytics/page.tsx   ← ví dụ Server Component
/crm/admin/orders/page.tsx      ← dùng useAdminOrders hook
/crm/admin/casso/page.tsx       ← TẠO MỚI (tương tự orders page)
```

**AdminLayout** (`src/app/crm/admin/layout.tsx`) đã handle:
- Auth check (`supabase.auth.getUser()`)
- Role check (`users.role IN ('admin', 'super_admin')`)
- Redirect non-admin → `/crm/dashboard`

→ **Không cần viết lại auth logic**, chỉ tạo page component.

### AdminSidebar Pattern

```typescript
// src/components/admin/AdminSidebar.tsx — tham khảo cấu trúc hiện có
// Thêm item mới tương tự các items khác (Analytics, Orders, Trees, v.v.)
// Dùng icon từ lucide-react (đã có trong project)
```

### Server Action Pattern (từ `src/actions/withdrawals.ts`)

```typescript
// src/actions/casso.ts
'use server'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function manualProcessTransaction(transactionId: string, orderCode: string) {
  // 1. Verify admin role
  // 2. Lookup order
  // 3. Invoke process-payment
  // 4. Update casso_transactions
}
```

### casso_transactions Query

```typescript
const { data } = await supabase
  .from('casso_transactions')
  .select('*')
  .order('created_at', { ascending: false })
  .range(offset, offset + 19) // pagination

// Filter by status:
.eq('status', selectedStatus)

// Filter by date:
.gte('created_at', startDate.toISOString())
.lte('created_at', endDate.toISOString())
```

### Project Structure Notes

```
src/app/crm/admin/
├── casso/
│   └── page.tsx                ← TẠO MỚI
src/actions/
└── casso.ts                    ← TẠO MỚI
src/components/admin/
└── AdminSidebar.tsx            ← SỬA (thêm nav item)
```

### References

- [Source: src/app/crm/admin/layout.tsx — AdminLayout auth pattern]
- [Source: src/app/crm/admin/orders/page.tsx — admin page pattern]
- [Source: src/components/admin/AdminSidebar.tsx — sidebar nav pattern]
- [Source: src/actions/withdrawals.ts — Server Action pattern]
- [Source: supabase/migrations/20260326_create_casso_transactions.sql — table schema]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- `dainganxanh-landing/src/app/crm/admin/casso/page.tsx` — Server Component, fetch casso_transactions với pagination + filter qua URL search params
- `dainganxanh-landing/src/app/crm/admin/casso/CassoTransactionTable.tsx` — Client Component: filter UI (status dropdown + date range), transaction table với status badge, manual process inline form
- `dainganxanh-landing/src/actions/casso.ts` — Server Action `manualProcessTransaction`: verify admin role, lookup order, invoke process-payment Edge Function, update casso_transactions status
- `dainganxanh-landing/src/components/admin/AdminSidebar.tsx` — Thêm nav item "Casso Logs" với icon ArrowPathIcon từ heroicons
