# Story 3.8: Admin User Management

Status: completed

## Story

As an **admin**,
I want to **xem và quản lý tất cả user accounts**,
so that **tôi có thể phân quyền, theo dõi hoạt động, và gán mã giới thiệu cho user**.

## Acceptance Criteria

1. **Given** admin truy cập `/crm/admin/users`
   **When** trang load
   **Then** hiển thị danh sách tất cả user với email, tên, SĐT, mã giới thiệu, số đơn hàng, ngày tạo, role

2. **Given** admin nhập từ khóa tìm kiếm
   **When** submit form
   **Then** lọc user theo email, tên, hoặc số điện thoại

3. **Given** admin chọn filter role
   **When** click vào role button
   **Then** chỉ hiển thị user của role đó

4. **Given** admin thay đổi role của user qua dropdown
   **When** chọn role mới → confirm modal
   **Then** cập nhật role trong database, optimistic update UI

5. **Given** admin click "🤝 Gán mã" cho 1 user
   **When** nhập mã giới thiệu và confirm
   **Then** gán mã cho user, cộng hoa hồng hồi tố cho tất cả đơn cũ chưa có người giới thiệu

6. **And** Pagination 20 users/trang

7. **And** Admin không thể tự demote role của chính mình

## Tasks / Subtasks

- [x] Task 1: Server Action `fetchAdminUsers` (AC: 1, 2, 3, 6)
  - [x] 1.1 Tạo `src/actions/adminUsers.ts`
  - [x] 1.2 Query `public.users` với LEFT JOIN `orders` count
  - [x] 1.3 Full-text search: email, full_name, phone
  - [x] 1.4 Filter by role
  - [x] 1.5 Pagination (offset-based, PAGE_SIZE=20)
  - [x] 1.6 Auth check: chỉ admin/super_admin mới gọi được

- [x] Task 2: Server Action `updateUserRole` (AC: 4, 7)
  - [x] 2.1 Auth check: only admin/super_admin
  - [x] 2.2 Prevent self-demotion
  - [x] 2.3 UPDATE `public.users` SET role = ?

- [x] Task 3: Server Action `assignUserReferral` (AC: 5)
  - [x] 3.1 Validate referral code tồn tại trong `users`
  - [x] 3.2 Prevent self-referral
  - [x] 3.3 Cập nhật `users.referred_by_code`
  - [x] 3.4 Retroactive: UPDATE `orders SET referred_by = referrer_id` cho đơn cũ (status=completed, referred_by IS NULL)
  - [x] 3.5 Tạo `referral_clicks` records cho mỗi đơn hồi tố (converted=true)
  - [x] 3.6 Tính tổng hoa hồng hồi tố (10%)
  - [x] 3.7 Gửi Telegram notification

- [x] Task 4: Hook `useAdminUsers` (AC: 1-7)
  - [x] 4.1 Tạo `src/hooks/useAdminUsers.ts`
  - [x] 4.2 State: users, loading, error, filters, pagination, updatingId
  - [x] 4.3 `loadUsers()` với filters + page
  - [x] 4.4 `changeRole()` với optimistic update
  - [x] 4.5 `assignReferral()` + refresh sau khi gán
  - [x] 4.6 `refetch()` helper

- [x] Task 5: Component `UserTable` (AC: 1-5)
  - [x] 5.1 Tạo `src/components/admin/UserTable.tsx`
  - [x] 5.2 Columns: email, tên, SĐT, referral_code, orders_count, created_at, role, actions
  - [x] 5.3 Role badge + dropdown thay đổi role
  - [x] 5.4 Confirm modal thay đổi role
  - [x] 5.5 "🤝 Gán mã" button → assign referral modal
  - [x] 5.6 Assign modal: input mã, warning hồi tố, confirm button
  - [x] 5.7 Success banner hiển thị kết quả hồi tố

- [x] Task 6: Page `/crm/admin/users` (AC: 1-7)
  - [x] 6.1 Tạo `src/app/crm/admin/users/page.tsx`
  - [x] 6.2 Search form + role filter buttons
  - [x] 6.3 Loading / empty states
  - [x] 6.4 Pagination controls (Trước / Sau)

- [x] Task 7: Admin Sidebar navigation (AC: 1)
  - [x] 7.1 Thêm "Người dùng" link vào `src/components/admin/AdminSidebar.tsx`
  - [x] 7.2 Icon: `UsersIcon` từ `@heroicons/react`

## Dev Notes

### Route
`/crm/admin/users` - trong CRM admin layout

### Database Queries

**fetchAdminUsers:**
```sql
SELECT
  u.id, u.email, u.full_name, u.phone,
  u.referral_code, u.role, u.created_at,
  COUNT(o.id) as orders_count
FROM public.users u
LEFT JOIN public.orders o ON o.user_id = u.id
WHERE
  (search IS NULL OR u.email ILIKE '%search%' OR u.full_name ILIKE '%search%' OR u.phone ILIKE '%search%')
  AND (role_filter IS NULL OR u.role = role_filter)
GROUP BY u.id
ORDER BY u.created_at DESC
LIMIT 20 OFFSET (page-1)*20
```

**assignUserReferral - retroactive:**
```sql
-- Find referrer
SELECT id FROM users WHERE referral_code = refCode

-- Update orders (retroactive)
UPDATE orders
SET referred_by = referrerId
WHERE user_id = targetUserId
  AND status = 'completed'
  AND referred_by IS NULL

-- Create referral_click records
INSERT INTO referral_clicks (referrer_id, order_id, converted, ...)
VALUES (referrerId, orderId, true, ...)
```

### Key Types

```typescript
export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  referral_code: string
  role: 'user' | 'admin' | 'super_admin'
  created_at: string
  orders_count: number
}

export interface AssignReferralResult {
  error?: string
  retroOrders?: number       // Số đơn hồi tố
  retroCommission?: number   // Tổng hoa hồng hồi tố (VNĐ)
}
```

### UI States

- **Loading:** Spinner centered
- **Empty:** "Không tìm thấy người dùng nào"
- **Error:** Red banner + retry button
- **Role updating:** Spinner inline trong row
- **Assign success:** Green banner "✅ Đã gán mã giới thiệu! Hồi tố X đơn, hoa hồng: Yđ" (tự ẩn sau 5s)

### Security

- All server actions check: `supabase.auth.getUser()` → chỉ admin/super_admin
- Prevent self-demotion: `user.id === userId` → reject
- Prevent self-referral trong assignUserReferral

### Files

- `src/actions/adminUsers.ts` - Server actions
- `src/hooks/useAdminUsers.ts` - Client hook
- `src/components/admin/UserTable.tsx` - Table component
- `src/app/crm/admin/users/page.tsx` - Page
- `src/components/admin/AdminSidebar.tsx` - Updated sidebar

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6

### Change Log
- 2026-03-28: Implemented admin user management page with search, filter, role change, assign referral
- 2026-03-28: Added Telegram notification on referral assignment
- 2026-03-28: Retroactive commission calculation on admin referral assignment
