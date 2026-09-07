# Story 13.6: Lot-Scoped Admin Roles

Status: ready-for-dev

## Story

As a system,
I want lot-scoped roles in addition to coarse admin,
So that on-site staff (resort_manager, store_staff) have limited privileges only for their assigned lots, reducing blast radius and enabling decentralized operations.

## Acceptance Criteria

1. **Database Schema & Migration**:
   - Create `admin_user_lots` table with columns `(id uuid, user_id uuid, lot_id uuid, role text, created_by uuid, created_at timestamptz, updated_at timestamptz)` mapping users to their scoped lots.
   - `role` must be one of: `'resort_manager'`, `'store_staff'`, `'super_admin'`.
   - Composite unique constraint on `(user_id, lot_id)` to prevent duplicate assignments.
   - Foreign keys: `user_id → auth.users(id)`, `lot_id → lots(id)` (ON DELETE CASCADE for both).
   - Add indexes on `user_id` and `lot_id` for lookup performance.
   - Migration file must be idempotent (`IF NOT EXISTS` or equivalent guards).

2. **Helper Functions & Type Safety**:
   - Create `src/lib/admin/permissions.ts` exporting:
     - `getAdminUserLots(userId)` → `Promise<AdminUserLot[]>`
     - `canAccessLot(userId, lotId, requiredRole?)` → `Promise<boolean>`
     - `getUserHighestRole(userId)` → `Promise<'super_admin' | 'admin' | 'resort_manager' | 'store_staff' | 'user'>`
   - Create `src/types/admin.ts` with `AdminUserLot` interface.
   - **CRITICAL**: Existing `users.role` check for `['admin', 'super_admin']` in `src/app/crm/admin/layout.tsx` MUST NOT be broken. New roles are additive, not replacements.

3. **Admin Layout Access for Lot-Scoped Roles**:
   - Modify `src/app/crm/admin/layout.tsx` to allow users with **any** `admin_user_lots` entry (role `resort_manager` or `store_staff`) to access `/crm/admin/*` pages.
   - Keep existing `['admin', 'super_admin']` access intact.
   - **Given** a user with `resort_manager` on lot A and no global role
   - **When** they visit `/crm/admin/bookings`
   - **Then** they are allowed in (not redirected to `/crm/dashboard`)

4. **RLS Policies for Lot-Scoped Access**:
   - **Given** a `resort_manager` assigned to lot A
   - **When** they query `room_bookings` or `rooms` filtered by `lot_id = A`
   - **Then** RLS allows the operation
   - **And** queries for `lot_id = B` return no rows or error
   - **And** `store_staff` on lot A can access `store_orders`/`store_products` scoped to lot A
   - **And** `super_admin`/`admin` bypass lot scoping entirely (global access preserved)
   - Implement via `EXISTS` check on `admin_user_lots` for current `auth.uid()`, or JWT claim fallback.
   - **CRITICAL**: If `room_bookings`, `rooms`, `store_orders`, or `store_products` do not yet exist in the local schema, create `admin_user_lots` and helpers first. RLS policies for those tables can be written with `IF EXISTS` guards or deferred to the migration that creates the tables. The migration file must document this dependency.

5. **Server-Side Enforcement in Admin Actions**:
   - Update `src/actions/adminOrders.ts`, `src/actions/lots.ts`, and future eco-tourism/store admin actions to:
     - Accept optional `lotId` filter
     - Call `canAccessLot()` before performing mutations
     - Return `{ error: 'Insufficient permissions for this lot' }` if check fails
   - `super_admin` and `admin` skip `canAccessLot` check entirely.
   - **CRITICAL**: `verifyAdminRole()` in `src/actions/lots.ts` currently hardcodes `['admin', 'super_admin']`. It MUST be updated or replaced to support lot-scoped roles. Create a new `verifyLotAccess()` helper that checks global role first, then `admin_user_lots`.
   - **DO NOT** modify `src/lib/getEffectiveUser.ts` impersonation logic — it remains `super_admin` only.

6. **Admin UI for Lot Assignment**:
   - Extend `src/app/crm/admin/users/page.tsx` or create `src/app/crm/admin/users/[id]/lots/page.tsx` with:
     - List of user assigned lots with role badges
     - Dropdown to select lot from `lots` table
     - Role selector (resort_manager, store_staff)
     - Add/remove assignment buttons
   - Only `super_admin` can access this UI (hard check in page or server action).
   - Use existing `AdminShell` layout and styling conventions.
   - Log every assign/remove action to `admin_audit_log` (table exists via `20260420000000_add_admin_audit_log.sql`).

7. **Store Orders Lot-Scoping Clarification**:
   - **Verify** whether `store_orders` or `products` have a `lot_id` column in the current schema.
   - If `store_orders` lacks `lot_id`, document that `store_staff` scoping requires a future schema change (add `lot_id` to `store_orders` or derive from `products`).
   - If `products` has `lot_id`, implement `store_staff` scoping via `products.lot_id → admin_user_lots.lot_id` join.

8. **Testing**:
   - Unit tests for permission helpers in `src/lib/admin/__tests__/permissions.test.ts`
   - Integration test verifying RLS denies cross-lot access for `resort_manager` (if tables exist)
   - Test that `super_admin` still has global access
   - Test that existing admin routes continue working without `admin_user_lots` entries (backward compatibility)
   - Test that `resort_manager` can access `/crm/admin/bookings` (layout check)

## Tasks / Subtasks

- [ ] Task 1: Create `admin_user_lots` migration (AC: #1)
  - [ ] Write `supabase/migrations/YYYYMMDDHHMMSS_add_admin_user_lots.sql` with table, constraints, indexes
  - [ ] Include `created_at`, `updated_at` timestamps and `created_by` audit column
  - [ ] Test migration idempotency locally
- [ ] Task 2: Implement permission helpers (AC: #2, #5)
  - [ ] Create `src/lib/admin/permissions.ts` with `canAccessLot`, `getAdminUserLots`, `getUserHighestRole`
  - [ ] Create `src/types/admin.ts` with `AdminUserLot` type
  - [ ] Create `verifyLotAccess()` helper replacing `verifyAdminRole()` for lot-scoped checks
- [ ] Task 3: Update admin layout access (AC: #3)
  - [ ] Modify `src/app/crm/admin/layout.tsx` to check `admin_user_lots` for `resort_manager`/`store_staff`
  - [ ] Ensure `super_admin`/`admin` continue to work
- [ ] Task 4: Write RLS policies (AC: #4)
  - [ ] Create policies for `room_bookings`, `rooms`, `store_orders`, `store_products` (if tables exist) or document deferred implementation
  - [ ] Use `EXISTS` on `admin_user_lots` with `auth.uid()` or JWT `role` claim
  - [ ] Preserve existing public read policies on `lots` and user self-access on bookings
- [ ] Task 5: Update admin actions with lot checks (AC: #5, #7)
  - [ ] Modify `src/actions/adminOrders.ts` to accept `lotId` and enforce `canAccessLot`
  - [ ] Update `verifyAdminRole()` in `src/actions/lots.ts` to `verifyLotAccess()` supporting lot-scoped roles
  - [ ] Verify `store_orders`/`products` `lot_id` mapping for `store_staff` scoping
- [ ] Task 6: Build admin lot-assignment UI (AC: #6)
  - [ ] Create/edit `src/app/crm/admin/users/[id]/lots/page.tsx`
  - [ ] Implement `assignLotToUser` and `removeLotFromUser` server actions in `src/actions/adminUserLots.ts`
  - [ ] Restrict page to `super_admin` only
  - [ ] Write to `admin_audit_log` for every assignment change
- [ ] Task 7: Comprehensive test suite (AC: #8)
  - [ ] Unit tests for `permissions.ts` helpers
  - [ ] RLS policy tests (integration or Supabase test harness)
  - [ ] Regression test: existing admin routes work without lot assignments
  - [ ] Layout access test for `resort_manager` on `/crm/admin/*`

## Dev Notes

### Current Auth Architecture

- **Coarse roles**: `users.role` currently supports `'user'`, `'admin'`, `'super_admin'`.
- **Admin access**: `src/app/crm/admin/layout.tsx` gates `/crm/admin/*` to `['admin', 'super_admin']`. This MUST be updated to also allow `admin_user_lots` holders.
- **Service role bypass**: Most admin actions use `createServiceRoleClient()` to bypass RLS entirely — this is intentional for admin dashboards but means RLS policies mainly protect direct DB access, not these server actions.
- **Impersonation**: `src/lib/getEffectiveUser.ts` handles `super_admin` impersonation via `admin_impersonate` cookie — DO NOT touch this logic.

### Existing Role Check Pattern (MUST UPDATE)

```typescript
// src/actions/lots.ts — current verifyAdminRole (hardcoded global admin)
async function verifyAdminRole(): Promise<{ userId: string | null; error: string | null }> {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { userId: null, error: 'Unauthorized' }
    const serviceClient = createServiceRoleClient()
    const { data: profile } = await serviceClient.from('users').select('role').eq('id', user.id).single()
    if (!['admin', 'super_admin'].includes(profile.role)) {
        return { userId: null, error: 'Bạn không có quyền thực hiện hành động này' }
    }
    return { userId: user.id, error: null }
}
```

**Required change**: Replace `verifyAdminRole` with `verifyLotAccess(userId, lotId)` that:
1. Returns `true` if `users.role` is `'admin'` or `'super_admin'` (global bypass)
2. Otherwise checks `admin_user_lots` for matching `(user_id, lot_id)` with role `resort_manager` or `store_staff`
3. Returns `false` if no match

### Proposed Schema

```sql
CREATE TABLE IF NOT EXISTS public.admin_user_lots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lot_id uuid NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('resort_manager', 'store_staff', 'super_admin')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, lot_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_user_lots_user_id ON public.admin_user_lots(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_lots_lot_id ON public.admin_user_lots(lot_id);
```

### RLS Policy Pattern (Example)

```sql
-- Allow super_admin/admin full access
CREATE POLICY "super_admin_all_room_bookings" ON public.room_bookings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

-- Allow lot-scoped managers access to their lot's bookings
CREATE POLICY "lot_manager_room_bookings" ON public.room_bookings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_user_lots aul
      JOIN public.rooms r ON r.lot_id = aul.lot_id
      WHERE aul.user_id = auth.uid()
        AND r.id = room_bookings.room_id
        AND aul.role = 'resort_manager'
    )
  );
```

**Note**: If `room_bookings`, `rooms`, `store_orders`, `store_products` do not yet exist in the current schema, create `admin_user_lots` and helpers first. RLS policies for those tables can be deferred to their creation migration, OR written now with `IF EXISTS` guards. Verify schema state before writing policies.

### File Structure

- **New migration**: `supabase/migrations/YYYYMMDDHHMMSS_add_admin_user_lots.sql`
- **New file**: `src/lib/admin/permissions.ts`
- **New file**: `src/types/admin.ts`
- **Modified**: `src/app/crm/admin/layout.tsx` — add `admin_user_lots` check
- **Modified**: `src/actions/adminOrders.ts` — add `lotId` parameter to `fetchAdminOrders` and `updateOrderStatus`
- **Modified**: `src/actions/lots.ts` — replace `verifyAdminRole` with `verifyLotAccess`
- **New UI**: `src/app/crm/admin/users/[id]/lots/page.tsx` + server actions `src/actions/adminUserLots.ts`
- **Tests**: `src/lib/admin/__tests__/permissions.test.ts`, `src/actions/__tests__/adminUserLots.test.ts`

### Backward Compatibility & Regression Prevention

- All existing admin actions MUST continue to work without requiring `admin_user_lots` entries.
- `admin`/`super_admin` bypass all lot checks.
- Do not remove `createServiceRoleClient()` usage in admin actions — RLS is intentionally bypassed for dashboards.
- Do not change `src/lib/getEffectiveUser.ts`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-13.6]
- [Source: database_schema.sql]
- [Source: src/app/crm/admin/layout.tsx]
- [Source: src/lib/getEffectiveUser.ts]
- [Source: src/actions/adminOrders.ts]
- [Source: src/actions/lots.ts]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Admin-pages]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
