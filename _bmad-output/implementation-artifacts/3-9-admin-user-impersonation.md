# Story 3.9: Admin User Impersonation (Vào Tài Khoản User)

Status: completed

## Story

As an **admin**,
I want to **xem tài khoản của bất kỳ user nào từ góc nhìn của họ**,
so that **tôi có thể hỗ trợ kỹ thuật, kiểm tra trải nghiệm user, và debug vấn đề mà không cần user phải mô tả**.

## Acceptance Criteria

1. **Given** admin truy cập `/crm/admin/users`
   **When** trang load
   **Then** mỗi row trong bảng user có thêm nút "👁️ Vào tài khoản"

2. **Given** admin click nút "👁️ Vào tài khoản" của user X
   **When** server action `startImpersonation(userId)` được gọi
   **Then** server verify admin đang đăng nhập và có role admin/super_admin
   **And** set cookie `admin_impersonate` (httpOnly, secure, sameSite=strict, maxAge 8h) chứa `{ userId: X, adminId: admin_id }`
   **And** redirect đến `/crm/my-garden`

3. **Given** admin đang trong chế độ impersonation
   **When** truy cập bất kỳ trang nào trong `/crm`
   **Then** hiển thị banner vàng cố định đầu trang: "👁️ Đang xem tài khoản: **[tên/email/phone của user]**"
   **And** có nút "Thoát ←" trên banner

4. **Given** admin đang trong chế độ impersonation
   **When** truy cập `/crm/my-garden`
   **Then** hiển thị danh sách orders của user đang được xem (không phải của admin)

5. **Given** admin đang trong chế độ impersonation
   **When** truy cập `/crm/my-garden/[orderId]`
   **Then** hiển thị chi tiết order của user đang được xem

6. **Given** admin đang trong chế độ impersonation
   **When** truy cập `/crm/referrals`
   **Then** hiển thị referral stats, conversions, và mã giới thiệu của user đang được xem

7. **Given** admin click nút "Thoát ←" trên banner
   **When** `stopImpersonation()` được gọi
   **Then** xóa cookie `admin_impersonate`
   **And** redirect về `/crm/admin/users`

8. **And** Admin không thể vào tài khoản của chính mình (server reject)
9. **And** Chỉ admin/super_admin mới có nút "Vào tài khoản" (server-side check mỗi request)
10. **And** Cookie `admin_impersonate` tự hết hạn sau 8 giờ
11. **And** Nếu cookie `adminId` không khớp với user đang đăng nhập → bỏ qua impersonation, xử lý như bình thường

## Tasks / Subtasks

- [x] Task 1: Server Actions impersonation (AC: 2, 7)
  - [x] 1.1 Tạo `src/actions/impersonation.ts`
  - [x] 1.2 `startImpersonation(targetUserId)` — verify admin, set httpOnly cookie
  - [x] 1.3 `stopImpersonation()` — xóa cookie
  - [x] 1.4 Guard: prevent self-impersonation
  - [x] 1.5 Guard: verify target user tồn tại trước khi set cookie

- [x] Task 2: Helper `getImpersonationContext` (AC: 3-6, 8-11)
  - [x] 2.1 Tạo `src/lib/getImpersonationContext.ts`
  - [x] 2.2 Đọc cookie `admin_impersonate` từ Next.js `cookies()`
  - [x] 2.3 Re-verify `adminId` trong cookie khớp với user đang auth
  - [x] 2.4 Re-verify user đang auth vẫn còn role admin/super_admin
  - [x] 2.5 Fetch tên user đang được xem (full_name / email / phone)
  - [x] 2.6 Return `{ effectiveUserId, isImpersonating, impersonatedUserName }`

- [x] Task 3: ImpersonationBanner component (AC: 3, 7)
  - [x] 3.1 Tạo `src/components/crm/ImpersonationBanner.tsx` (Client Component)
  - [x] 3.2 Hiển thị banner vàng với tên user đang được xem
  - [x] 3.3 Nút "Thoát ←" gọi `stopImpersonation()` rồi `window.location.href = '/crm/admin/users'`

- [x] Task 4: CRM Layout update (AC: 3)
  - [x] 4.1 Update `src/app/crm/layout.tsx`
  - [x] 4.2 Gọi `getImpersonationContext()` trong layout
  - [x] 4.3 Render `<ImpersonationBanner>` khi `isImpersonating === true`

- [x] Task 5: User-facing pages dùng effectiveUserId (AC: 4, 5, 6)
  - [x] 5.1 Update `src/app/crm/my-garden/page.tsx` — thay `supabase.auth.getUser()` bằng `getImpersonationContext()`; dùng service role client để bypass RLS
  - [x] 5.2 Update `src/app/crm/my-garden/[orderId]/page.tsx` — tương tự
  - [x] 5.3 Update `src/app/crm/referrals/page.tsx` — tương tự

- [x] Task 6: UserTable — thêm nút "Vào tài khoản" (AC: 1, 2)
  - [x] 6.1 Update `src/components/admin/UserTable.tsx`
  - [x] 6.2 Thêm column "Truy cập" với nút "👁️ Vào tài khoản"
  - [x] 6.3 Click → gọi `startImpersonation(user.id)` → `window.location.href = '/crm/my-garden'`
  - [x] 6.4 Loading state: spinner + text "Đang vào..." khi đang xử lý
  - [x] 6.5 Error state: hiển thị errorMsg nếu server trả về lỗi

## Dev Notes

### Approach: Cookie-based Impersonation (không thay đổi Supabase auth session)

Admin giữ nguyên session Supabase của mình. Chỉ thêm cookie `admin_impersonate` để báo hiệu "đang xem data của user X". Cách này:
- Không phụ thuộc vào email hay phone của user (Supabase magic link chỉ work với email)
- Admin không bao giờ mất session của mình
- Security: cookie httpOnly, sameSite=strict, server re-verify mỗi request

### Security Model

```
Request → getImpersonationContext() {
  1. Lấy actual user từ supabase.auth.getUser() (không dùng getSession())
  2. Đọc cookie admin_impersonate
  3. Parse { userId, adminId }
  4. Verify: adminId === actual_user.id (chống giả mạo cookie)
  5. Verify: actual_user.role IN ('admin', 'super_admin')
  6. Nếu pass → return effectiveUserId = userId (impersonated)
  7. Nếu fail → return effectiveUserId = actual_user.id (normal)
}
```

### Service Role Usage khi Impersonating

Khi `isImpersonating === true`, các user-facing pages dùng `createServiceRoleClient()` thay vì `createServerClient()` để bypass Supabase RLS. RLS chỉ cho phép user đọc data của chính họ, nhưng admin cần đọc data của user khác.

### Route Structure

```
/crm/layout.tsx         ← banner render ở đây (wrap toàn bộ /crm)
/crm/my-garden/page.tsx       ← dùng effectiveUserId
/crm/my-garden/[orderId]/page.tsx  ← dùng effectiveUserId
/crm/referrals/page.tsx       ← dùng effectiveUserId
```

### Files Changed/Created

```
src/actions/impersonation.ts           (NEW)
src/lib/getImpersonationContext.ts     (NEW)
src/components/crm/ImpersonationBanner.tsx (NEW)
src/app/crm/layout.tsx                 (MODIFIED)
src/app/crm/my-garden/page.tsx         (MODIFIED)
src/app/crm/my-garden/[orderId]/page.tsx (MODIFIED)
src/app/crm/referrals/page.tsx         (MODIFIED)
src/components/admin/UserTable.tsx     (MODIFIED)
```

### Cookie Spec

| Attribute | Value |
|-----------|-------|
| Name | `admin_impersonate` |
| Value | `JSON.stringify({ userId, adminId })` |
| httpOnly | `true` |
| secure | `true` (production) / `false` (development) |
| sameSite | `strict` |
| path | `/` |
| maxAge | `28800` (8 giờ) |

### UI States

- **Chưa impersonating:** Nút "👁️ Vào tài khoản" màu xanh border
- **Đang xử lý:** Spinner + "Đang vào..." (disabled button)
- **Error:** errorMsg hiện trên bảng (đỏ)
- **Đang impersonating:** Banner vàng sticky top với tên user + nút "Thoát ←"

### References

- Cookie approach: `src/actions/impersonation.ts`
- Context helper: `src/lib/getImpersonationContext.ts`
- Admin user management (parent story): `_bmad-output/implementation-artifacts/3-8-admin-user-management.md`
- Service role client: `src/lib/supabase/server.ts#createServiceRoleClient`
- [Source: docs/prd.md#FR-46]

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6

### Completion Notes List
- Cookie httpOnly đảm bảo XSS không thể đọc được
- Server re-verify admin role mỗi request (không chỉ khi set cookie)
- `window.location.href` thay vì `router.push()` để đảm bảo full page reload sau cookie change
- Dùng service role thay vì pass user context qua request headers để đơn giản hóa

### File List
- `src/actions/impersonation.ts`
- `src/lib/getImpersonationContext.ts`
- `src/components/crm/ImpersonationBanner.tsx`
- `src/app/crm/layout.tsx`
- `src/app/crm/my-garden/page.tsx`
- `src/app/crm/my-garden/[orderId]/page.tsx`
- `src/app/crm/referrals/page.tsx`
- `src/components/admin/UserTable.tsx`
