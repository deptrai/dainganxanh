# Story 5.7: Order Refund for Completed Orders

**Status:** ready-for-dev
**Epic:** 5 — Payment Automation
**Story Points:** 3
**Date:** 2026-04-20

---

## Story

As an **admin**,
I want to cancel and issue a refund for a completed (paid) order,
So that customers receive their money back when an order needs to be reversed after payment has been confirmed.

---

## Acceptance Criteria

**AC1 — New status value:**
- `order_status` enum gains a new value: `cancelled_refunded`
- Migration adds the value without breaking existing rows

**AC2 — Admin cancel route handles completed orders:**
- `POST /api/orders/cancel` currently only cancels `status = 'pending'` orders
- Extend to allow admins (role: `admin` | `super_admin`) to cancel `status = 'completed'` orders
- When cancelling a completed order: set `status = 'cancelled_refunded'`
- When cancelling a pending order (existing behavior): set `status = 'cancelled'` — **NO CHANGE**

**AC3 — Auth & role guard:**
- Only authenticated users with role `admin` or `super_admin` may cancel completed orders
- Regular users (role: `user`, `customer`) may only cancel their own `pending` orders (existing behavior unchanged)

**AC4 — Audit log:**
- On successful `completed → cancelled_refunded` transition, write a row to `admin_audit_log`:
  ```json
  {
    "admin_id": "<caller user.id>",
    "action": "order_refund_initiated",
    "target_id": "<order.id>",
    "metadata": {
      "order_code": "<order.code>",
      "amount": "<order.total_amount>",
      "user_id": "<order.user_id>"
    }
  }
  ```
- Audit log write is **non-blocking** (try/catch, log error if fails, don't fail the request)

**AC5 — Response:**
- Success: `{ success: true, refundStatus: 'manual_pending' }`
- Order not found or wrong status: `{ error: '...' }` with 404
- Unauthorized (non-admin trying completed cancel): `{ error: 'Unauthorized' }` with 403

**AC6 — No automatic money transfer:**
- Refund is manual (admin transfers money outside the system)
- System only records intent; no casso/bank API calls

---

## Tasks / Subtasks

- [ ] **Task 1: DB Migration — add `cancelled_refunded` to enum** (AC1)
  - [ ] Create `supabase/migrations/20260420000001_add_cancelled_refunded_status.sql`
  - [ ] `ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled_refunded';`
  - [ ] Apply to `dainganxanh-dev` via Supabase MCP

- [ ] **Task 2: Extend `/api/orders/cancel/route.ts`** (AC2, AC3, AC4, AC5)
  - [ ] After existing auth check, also fetch caller's role from `users` table using service client
  - [ ] Add branch: if `orderId` targets a `completed` order AND caller is admin/super_admin → update to `cancelled_refunded`
  - [ ] Keep existing branch: `pending` → `cancelled` (user cancels own order, no role check needed beyond ownership via `eq('user_id', user.id)`)
  - [ ] Write audit log row to `admin_audit_log` (non-blocking, same pattern as `impersonation.ts`)
  - [ ] Return `{ success: true, refundStatus: 'manual_pending' }` on success

- [ ] **Task 3: Update admin Orders UI** (AC5 — display)
  - [ ] In `src/app/crm/admin/orders/page.tsx`: add `cancelled_refunded` to status badge mapping (e.g. orange badge "Hoàn tiền")
  - [ ] Add cancel/refund action button for `completed` orders visible only to admin role

---

## Dev Notes

### Stack & Patterns

- **Framework:** Next.js 14 App Router — project root is `dainganxanh-landing/`
- **Auth pattern:** `createServerClient()` from `@/lib/supabase/server` — for session user
- **Service role:** `createServiceRoleClient()` from `@/lib/supabase/server` — for RLS-bypass ops (role lookup, order update, audit insert)
- **Audit log pattern:** Follow `src/actions/impersonation.ts` exactly — `try/catch` wrapping `serviceClient.from('admin_audit_log').insert({...})`, log error with `console.error` but never throw

### Existing cancel route (current implementation)

```typescript
// src/app/api/orders/cancel/route.ts — CURRENT (only handles pending)
const { data, error } = await serviceSupabase
  .from('orders')
  .update({ status: 'cancelled' })
  .eq('user_id', user.id)
  .eq('status', 'pending')
  // + optional eq('id', orderId) or eq('code', orderCode)
```

**Extension approach:** Add a second code path for admin + completed orders. Do NOT remove the existing path. Use `orderId` (UUID) as the primary identifier for admin cancels — `orderCode` is optional.

### Role check pattern (from impersonation.ts)

```typescript
const { data: callerProfile } = await serviceClient
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single()

const isAdmin = ['admin', 'super_admin'].includes(callerProfile?.role)
```

### Enum migration pattern

```sql
-- Safe to run multiple times
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled_refunded';
```

**Note:** PostgreSQL enum additions cannot be rolled back in same transaction. Migration is forward-only.

### admin_audit_log table (from migration 20260420000000)

```sql
-- Columns available:
admin_id UUID, action TEXT, target_id UUID, target_role TEXT, metadata JSONB, created_at TIMESTAMPTZ
```

For this story: `action = 'order_refund_initiated'`, `target_id = order.id`, no `target_role`.

### File locations

| File | Action |
|------|--------|
| `supabase/migrations/20260420000001_add_cancelled_refunded_status.sql` | CREATE |
| `src/app/api/orders/cancel/route.ts` | MODIFY |
| `src/app/crm/admin/orders/page.tsx` | MODIFY (badge + button) |

### Out of scope

- Email/notification to customer (separate story if needed)
- Partial refunds
- Auto bank transfer / casso API
- Unit tests (existing test file at `src/app/api/orders/cancel/__tests__/route.test.ts` — update if tests exist for the cancel route)

---

## Previous Story Intelligence

Story 5.5 (`/api/orders/cancel`) established the cancel pattern. Story 5.6 added HMAC verification. The `admin_audit_log` table was added in session 4 (migration `20260420000000_add_admin_audit_log.sql`) with the non-blocking audit pattern fully established in `src/actions/impersonation.ts`.

The `createServiceRoleClient()` pattern is stable — used across casso, impersonation, and order routes.

---

## Definition of Done

- [ ] Migration applied to dev DB, `cancelled_refunded` value exists in enum
- [ ] Admin can cancel a `completed` order via `POST /api/orders/cancel` with `{ orderId }` — returns `{ success: true, refundStatus: 'manual_pending' }`
- [ ] Non-admin attempting same returns 403
- [ ] `cancelled_refunded` row appears in `admin_audit_log`
- [ ] Existing `pending → cancelled` flow for regular users **unchanged**
- [ ] Admin orders UI shows `cancelled_refunded` status badge
