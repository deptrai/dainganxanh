-- Migration: harden EXECUTE permissions on stock/expiry RPCs
-- Story 12.5 deferred-item resolution.
-- Default Supabase privileges grant EXECUTE to PUBLIC/anon/authenticated, which would
-- let any client call mutating RPCs via PostgREST (e.g. release_product_stock could
-- inflate stock, expire_pending_store_orders could mass-cancel orders).
-- These functions are server-only (service_role) — revoke everyone else.

REVOKE EXECUTE ON FUNCTION public.confirm_product_stock(UUID, INT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reserve_product_stock(UUID, INT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_product_stock(UUID, INT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_pending_store_orders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_pending_bookings() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.confirm_product_stock(UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_product_stock(UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_product_stock(UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_pending_store_orders() TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_pending_bookings() TO service_role;
