# Story 3.1: Order Management Dashboard

Status: ready-for-dev

## Story

As an **admin**,
I want to **xác minh đơn hàng mới nhanh chóng**,
so that **tôi có thể tiến hành gán cây**.

## Acceptance Criteria

1. **Given** tôi đăng nhập với quyền admin  
   **When** mở Order Management  
   **Then** hiển thị list đơn hàng filter "Pending Verification"

2. **And** mỗi order có: ID, User, Quantity, Payment Method, Timestamp

3. **When** click "Xác minh"  
   **Then** status = "Verified"

4. **And** toast confirmation

5. **And** có thể filter by status: All, Pending, Verified, Assigned, Completed

## Tasks / Subtasks

- [ ] Task 1: Admin Layout (AC: 1)
  - [ ] 1.1 Tạo `/src/app/crm/admin/layout.tsx`
  - [ ] 1.2 Admin sidebar với navigation
  - [ ] 1.3 Permission check (role: admin, super_admin)

- [ ] Task 2: Orders Page (AC: 1, 2, 5)
  - [ ] 2.1 Tạo `/src/app/crm/admin/orders/page.tsx`
  - [ ] 2.2 Data table với pagination
  - [ ] 2.3 Columns: Order ID, User, Qty, Amount, Payment, Status, Actions

- [ ] Task 3: Order Table Component (AC: 2)
  - [ ] 3.1 Tạo `components/admin/OrderTable.tsx`
  - [ ] 3.2 Sortable columns
  - [ ] 3.3 Status badges với colors
  - [ ] 3.4 Expandable row cho details

- [ ] Task 4: Filter & Search (AC: 5)
  - [ ] 4.1 Tạo `components/admin/OrderFilters.tsx`
  - [ ] 4.2 Status filter dropdown
  - [ ] 4.3 Date range picker
  - [ ] 4.4 Search by order ID or user email

- [ ] Task 5: Verification Action (AC: 3, 4)
  - [ ] 5.1 Tạo `components/admin/VerifyOrderButton.tsx`
  - [ ] 5.2 Confirmation modal
  - [ ] 5.3 API call to update status
  - [ ] 5.4 Toast notification on success

- [ ] Task 6: Hooks & API (AC: 1, 3)
  - [ ] 6.1 Tạo `hooks/useAdminOrders.ts`
  - [ ] 6.2 Server action cho verify order
  - [ ] 6.3 Optimistic update

## Dev Notes

### Architecture Compliance
- **Route:** `/crm/admin/orders` - admin only
- **Middleware:** Check role in `/crm/admin/layout.tsx`
- **RLS:** Admin can view all orders

### Admin Permission Check
```typescript
// app/crm/admin/layout.tsx
export default async function AdminLayout({ children }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!['admin', 'super_admin'].includes(profile?.role)) {
    redirect('/crm/dashboard')
  }
  
  return <AdminShell>{children}</AdminShell>
}
```

### Status Colors
- `pending` → 🟡 Yellow
- `paid` → 🔵 Blue
- `verified` → 🟢 Green
- `assigned` → 🟣 Purple
- `completed` → ✅ Green check
- `cancelled` → 🔴 Red

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Admin-Routes]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Admin-Dashboard]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.1]
- [Source: docs/prd.md#FR-13]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/app/crm/admin/layout.tsx
- src/app/crm/admin/orders/page.tsx
- src/components/admin/AdminShell.tsx
- src/components/admin/AdminSidebar.tsx
- src/components/admin/OrderTable.tsx
- src/components/admin/OrderFilters.tsx
- src/components/admin/VerifyOrderButton.tsx
- src/hooks/useAdminOrders.ts
