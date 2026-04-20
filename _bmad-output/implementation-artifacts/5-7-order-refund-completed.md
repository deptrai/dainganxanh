# Story 5.7: Order Refund for Completed Orders

**Status:** done
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

### Review Findings

**Decision-needed:**
- [x] [Review][Defer] Referral commission clawback when a `completed` order is refunded — `getAvailableBalance` filters by `status='completed'` (`src/actions/withdrawals.ts:40-43`, `src/actions/referrals.ts:124-128`, `src/actions/adminReferrals.ts:33-38`). Decision: defer. Clawback policy needs a separate story (when/how/notify referrer). Refunds are rare → narrow window of risk.
- [x] [Review][Patch] Refund confirmation strength — replace `confirm()` with a typed-code modal at `src/components/admin/OrderTable.tsx:217`. Industry convention for irreversible money writes.

**Patch:**
- [x] [Review][Patch] TOCTOU: refund UPDATE has no row-count check → false `success:true` + spurious audit log on concurrent admin clicks [`src/app/api/orders/cancel/route.ts:46-72`]. UPDATE only checks `error`; if `.eq('status','completed')` matches 0 rows (because another admin already refunded), no error is raised, audit row is still inserted, and 200 is returned. Add `.select('id')` and treat zero rows as 404 (mirror the regular-cancel branch).
- [x] [Review][Patch] Migration `DROP CONSTRAINT` not idempotent — add `IF EXISTS` [`supabase/migrations/20260420000001_add_cancelled_refunded_status.sql:6`]. Re-applying the migration on a fresh env will fail.
- [x] [Review][Patch] `OrderFilters` dropdown missing `cancelled_refunded` option [`src/components/admin/OrderFilters.tsx:12-20`]. Refunded orders are invisible unless admin selects "Tất cả"; default filter is `pending` so the row vanishes from the list right after refund.
- [x] [Review][Patch] Admin path leaks 403/404 oracle: regular user submitting any `orderId` that resolves to a `completed` order receives 403, otherwise 404 [`src/app/api/orders/cancel/route.ts:33-44`]. Lets an authenticated regular user enumerate which UUIDs map to other users' completed orders. Either return 404 uniformly when the caller is non-admin, or skip the order fetch entirely when caller is non-admin.
- [x] [Review][Patch] Tests do not assert `admin_audit_log.insert` is called with the spec'd payload [`src/app/api/orders/cancel/__tests__/route.test.ts` admin-refund block]. AC4 is unverified by CI; payload regressions won't be caught.
- [x] [Review][Patch] Lost regression: "prefers orderId over orderCode when both supplied" test was deleted in the rewrite [`src/app/api/orders/cancel/__tests__/route.test.ts`]. Behaviour still exists in `route.ts:88-89` but is no longer guarded.
- [x] [Review][Patch] Role lookup `error` is destructured away [`src/app/api/orders/cancel/route.ts:24-28`]. Any DB hiccup, RLS misconfig or missing `public.users` row collapses `isAdmin` to `false` silently — admin gets 403 with no operator log line. At minimum log the error; consider failing closed with 500.
- [x] [Review][Patch] Audit log try/catch only catches thrown errors, not Supabase's `{error}` return shape [`src/app/api/orders/cancel/route.ts:58-71`]. RLS / FK / schema mismatches are silently dropped; AC4 says "log error if fails". Inspect the resolved `{error}` and `console.error` it.

**Deferred (pre-existing or out of scope):**
- [x] [Review][Defer] Admin cancelling a `verified`/`paid`/`assigned` order silently 404s — out of scope for AC2 (only `completed` required), but worth a follow-up story.
- [x] [Review][Defer] Analytics revenue + carbon under-report after refund (5-min cache, no bust) [`src/actions/analytics.ts:144-170`] — separate story.
- [x] [Review][Defer] "Gán lô cây" + "Hoàn tiền" buttons coexist on completed rows; no status re-check in `assignOrderToLot` at UPDATE time [`src/components/admin/OrderTable.tsx:202-230`, `src/actions/assignOrderToLot.ts`] — pre-existing race surface.
- [x] [Review][Defer] No CSRF / rate-limit on admin money-relevant POST [`src/app/api/orders/cancel/route.ts:4-19`] — pre-existing pattern across all admin routes; needs a platform-level fix.
- [x] [Review][Defer] `Order.status` union missing `failed` / `manual_payment_claimed` (DB allows them, UI breaks silently) [`src/hooks/useAdminOrders.ts:12`, `src/components/admin/OrderTable.tsx:20-38`] — pre-existing values, not introduced by 5-7.
- [x] [Review][Defer] `admin_audit_log.admin_id` FK to `public.users` can fail silently if admin only exists in `auth.users` [`supabase/migrations/20260420000000_add_admin_audit_log.sql:6`] — pre-existing schema.

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
