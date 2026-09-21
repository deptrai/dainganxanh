-- Migration: 20260906000001_atomic_expire_pending_inventory.sql
-- Story 13.3: Inventory Reservation & Release
-- Atomically cancels expired pending bookings and store orders, releasing product stock exactly once.

-- Drop previous void-returning functions to allow change of return type to INTEGER
DROP FUNCTION IF EXISTS public.expire_pending_bookings();
DROP FUNCTION IF EXISTS public.expire_pending_store_orders();

-- 1. Atomic expiration of pending room bookings
CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  WITH updated AS (
    UPDATE public.room_bookings
    SET status = 'cancelled',
        cancellation_reason = 'Payment timeout (15 mins)',
        updated_at = now()
    WHERE status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at < now()
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM updated;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atomic expiration of pending store orders with single-pass stock release
CREATE OR REPLACE FUNCTION public.expire_pending_store_orders()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
BEGIN
  -- 1. Lock and iterate over all pending store order items whose order has expired
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
    -- Atomically restore stock for this item
    PERFORM public.release_product_stock(r.product_id, r.quantity);
  END LOOP;

  -- 2. Update status of expired store orders
  WITH updated AS (
    UPDATE public.store_orders
    SET status = 'cancelled',
        cancellation_reason = 'Payment timeout (15 mins)',
        updated_at = now()
    WHERE status = 'pending'
      AND payment_method = 'banking'
      AND expires_at IS NOT NULL
      AND expires_at < now()
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM updated;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.expire_pending_bookings IS
'Cancels room bookings that exceeded their 15-minute payment window, freeing the GiST exclusion lock.';

COMMENT ON FUNCTION public.expire_pending_store_orders IS
'Cancels store orders that exceeded their 15-minute payment window and restores reserved product stock exactly once.';
