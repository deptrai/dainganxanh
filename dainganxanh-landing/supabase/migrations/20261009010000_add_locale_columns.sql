-- Migration: 20261009010000_add_locale_columns.sql
-- Add locale column to users, orders, store_orders, and room_bookings
-- Default 'vi', restricted to 'vi' or 'en'

-- 1. users table
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'vi'
  CONSTRAINT users_locale_check CHECK (locale IN ('vi', 'en'));

-- 2. orders table (tree planting orders)
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'vi'
  CONSTRAINT orders_locale_check CHECK (locale IN ('vi', 'en'));

-- 3. store_orders table (agarwood shop orders)
ALTER TABLE IF EXISTS public.store_orders
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'vi'
  CONSTRAINT store_orders_locale_check CHECK (locale IN ('vi', 'en'));

-- 4. room_bookings table (eco-tourism bookings)
ALTER TABLE IF EXISTS public.room_bookings
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'vi'
  CONSTRAINT room_bookings_locale_check CHECK (locale IN ('vi', 'en'));

-- Comments for documentation
COMMENT ON COLUMN public.users.locale IS 'Preferred UI language for user (vi or en)';
COMMENT ON COLUMN public.orders.locale IS 'Language snapshot when order was created (vi or en)';
COMMENT ON COLUMN public.store_orders.locale IS 'Language snapshot when store order was created (vi or en)';
COMMENT ON COLUMN public.room_bookings.locale IS 'Language snapshot when booking was created (vi or en)';
