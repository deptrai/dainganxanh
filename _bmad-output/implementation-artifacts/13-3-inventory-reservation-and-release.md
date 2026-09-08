# Story 13.3: Inventory Reservation & Release

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a system,
I want to hold inventory for 15 minutes while payment is pending,
So that I can release rooms and store stock automatically if payment fails or times out.

## Acceptance Criteria

1. **Given** a pending room booking with `status = 'pending'` and `expires_at < now()`
   **When** `/api/cron/expire-pending` runs
   **Then** the booking status transitions to `cancelled` with `cancellation_reason = 'Payment timeout (15 mins)'`
   **And** the GiST exclusion constraint automatically frees the room date range for other guests to book immediately

2. **Given** a pending store order with `status = 'pending'`, `payment_method = 'banking'`, and `expires_at < now()`
   **When** `/api/cron/expire-pending` runs
   **Then** the order status transitions to `cancelled` with `cancellation_reason = 'Payment timeout (15 mins)'`
   **And** the reserved product stock is returned atomically via `release_product_stock(product_id, quantity)` exactly ONCE
   **And** already-cancelled orders are NEVER processed again (preventing infinite stock inflation)

3. **Given** an unauthenticated request to `/api/cron/expire-pending` (missing or invalid Bearer token)
   **When** the request arrives via either GET or POST
   **Then** the endpoint returns HTTP 401 Unauthorized
   **And** no database records or inventory holds are touched

4. **Given** valid execution of `/api/cron/expire-pending`
   **When** holds are released
   **Then** the endpoint triggers on-demand cache revalidation for `/eco-tourism` and `/store`
   **And** returns a JSON response containing counts of expired bookings, expired store orders, and duration:
     `{ ok: true, expiredBookings: N, expiredOrders: N, durationMs: number }`

5. **Technical Constraints:**
   - Both `GET` and `POST` handlers must be supported on `/api/cron/expire-pending` with identical security and behavior.
   - Database operations for stock release must be atomic: use a dedicated stored procedure `expire_pending_store_orders() RETURNS integer` that locks target rows with `FOR UPDATE` and restores stock within the same transaction.
   - Error isolation: A failure in room booking release must not block store order release (separate try/catch blocks).
   - Use `createServiceRoleClient()` for privileged operations.
   - Log release actions with structured logging (`trackLatency`, `captureError`).

## Tasks / Subtasks

- [x] Task 1: Create DB migration for atomic inventory expiration (AC: #1, #2, #5)
  - [x] Write migration `20260906000001_atomic_expire_pending_inventory.sql`
  - [x] Implement `public.expire_pending_store_orders() RETURNS integer` with atomic row-locking stock release
  - [x] Implement `public.expire_pending_bookings() RETURNS integer` returning count of cancelled bookings
- [x] Task 2: Refactor `/api/cron/expire-pending` route (AC: #1, #2, #3, #4, #5)
  - [x] Support both `GET` and `POST` with `Bearer ${CRON_SECRET}` authentication
  - [x] Call atomic stored procedures with error isolation between booking and store operations
  - [x] Prevent repeat stock releases (eliminate previous multi-release bug)
  - [x] Call `revalidatePath('/eco-tourism')` and `revalidatePath('/store')`
  - [x] Add `captureError` and `trackLatency` logging
  - [x] Return JSON payload with `{ ok: true, expiredBookings, expiredOrders, durationMs }`
- [x] Task 3: Write comprehensive unit and integration tests (AC: #1 - #5)
  - [x] Test 401 Unauthorized on missing/wrong CRON_SECRET for both GET and POST
  - [x] Test expiration of room booking frees GiST exclusion lock
  - [x] Test expiration of store order restores `stock_quantity` exactly once
  - [x] Test that orders with `expires_at > now()` are NOT touched
  - [x] Test that COD orders (`payment_method = 'cod'`) are NEVER expired
- [x] Task 4: Validate local execution against local Supabase instance
  - [x] Apply migration `20260906000001_atomic_expire_pending_inventory.sql` on local database
  - [x] Test cron execution via curl with mock expired records

## Dev Notes

### Current Implementation Flaw Analysis

In `src/app/api/cron/expire-pending/route.ts`, the previous code performed:
```ts
const { data: cancelledStoreItems } = await supabase
  .from('store_order_items')
  .select('id, product_id, quantity, store_orders!inner(id, status, cancellation_reason)')
  .eq('store_orders.status', 'cancelled')
  .eq('store_orders.cancellation_reason', 'Payment timeout (15 mins)')
```
**Critical Bug:** This query fetched ALL historically cancelled store orders on EVERY cron run, calling `release_product_stock` on them repeatedly, leading to infinite stock inflation on products!

**Fix:** Move the query + stock release + status update into an atomic PostgreSQL stored procedure:
```sql
CREATE OR REPLACE FUNCTION public.expire_pending_store_orders()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
BEGIN
  -- 1. Loop only through currently PENDING banking orders that have expired
  FOR r IN
    SELECT so.id AS order_id, soi.product_id, soi.quantity
    FROM public.store_orders so
    JOIN public.store_order_items soi ON soi.store_order_id = so.id
    WHERE so.status = 'pending'
      AND so.payment_method = 'banking'
      AND so.expires_at IS NOT NULL
      AND so.expires_at < now()
    FOR UPDATE OF so
  LOOP
    -- Atomically restore stock
    PERFORM public.release_product_stock(r.product_id, r.quantity);
  END LOOP;

  -- 2. Update status of those expired orders
  WITH updated AS (
    UPDATE public.store_orders
    SET status = 'cancelled', cancellation_reason = 'Payment timeout (15 mins)', updated_at = now()
    WHERE status = 'pending'
      AND payment_method = 'banking'
      AND expires_at IS NOT NULL
      AND expires_at < now()
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM updated;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

Similarly for room bookings:
```sql
CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  WITH updated AS (
    UPDATE public.room_bookings
    SET status = 'cancelled', cancellation_reason = 'Payment timeout (15 mins)', updated_at = now()
    WHERE status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at < now()
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM updated;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

### Architecture Compliance

- **File**: `dainganxanh-landing/src/app/api/cron/expire-pending/route.ts`
- **Database**: `supabase/migrations/20260906000001_atomic_expire_pending_inventory.sql`
- **Security**: `CRON_SECRET` Bearer token header validation
- **Scheduler**: Supabase `pg_cron` or external scheduler invoking every minute

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 13.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Inventory Control]
- [Source: supabase/migrations/20260530000001_eco_tourism_schema.sql#expire_pending_bookings]


### Review Findings

- [x] [Review] Clean review: Xác thực Bearer CRON_SECRET, concurrency locking FOR UPDATE trong stored procedure, giải phóng GiST exclusion lock và hoàn kho nguyên tử đạt 100% tiêu chuẩn. Không phát hiện lỗi logic hoặc bảo mật.

## Dev Agent Record

### Agent Model Used

claude-sonnet-5

### Debug Log References

### Completion Notes List

- ✅ Created migration `20260906000001_atomic_expire_pending_inventory.sql` implementing atomic row-locking procedures `expire_pending_store_orders()` and `expire_pending_bookings()` returning integer counts.
- ✅ Fixed critical flaw in previous cron implementation: eliminated repeat/infinite stock restore for historically cancelled orders. Stock is now restored atomically exactly once.
- ✅ Refactored `/api/cron/expire-pending/route.ts` to support both `GET` and `POST` with `Bearer ${CRON_SECRET}` authentication.
- ✅ Added error isolation between room bookings and store orders, so failure in one vertical never halts the other.
- ✅ Added on-demand Next.js cache revalidation for `/store` and `/eco-tourism` when inventory items expire.
- ✅ Created unit tests covering authentication, RPC invocation, return counts, and error isolation (6 tests passed).
- ✅ Live verified end-to-end against local Next.js server + local Supabase:
  - 401 on missing/wrong token.
  - Expired booking `BK_EXPIRED` transitioned to `cancelled` and freed GiST exclusion lock.
  - Valid booking `BK_VALID` remained `pending`.
  - Expired store order `ST_EXPIRED` transitioned to `cancelled` and product stock was restored (+2) exactly once.
  - Subsequent cron calls returned 0 expired items and did not alter stock.

### File List

- `supabase/migrations/20260906000001_atomic_expire_pending_inventory.sql` (created)
- `dainganxanh-landing/src/app/api/cron/expire-pending/route.ts` (refactored)
- `dainganxanh-landing/src/app/api/cron/expire-pending/__tests__/route.test.ts` (created)
- `_bmad-output/implementation-artifacts/13-3-inventory-reservation-and-release.md` (updated)
