-- Eco-Tourism Feature: Rooms, Bookings, Products, Store Orders
-- Migration: 20260530000001_eco_tourism_schema.sql
-- Date: 2026-05-30
-- Updated: 2026-08-29 — incorporates PRD cross-cutting requirements

-- ========================================
-- EXTENSIONS
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ========================================
-- HELPERS
-- ========================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  );
$$;

-- ========================================
-- ROOMS (phòng nghỉ trong vườn cây)
-- ========================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 2 CHECK (capacity > 0),
  price_per_night BIGINT NOT NULL CHECK (price_per_night > 0),
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_lot_id ON public.rooms(lot_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);

-- ========================================
-- ROOM PRICING RULES (seasonal / weekend / holiday)
-- ========================================
CREATE TABLE IF NOT EXISTS public.room_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_per_night BIGINT NOT NULL CHECK (price_per_night > 0),
  min_nights INTEGER DEFAULT 1,
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_room_pricing_rules_room_id ON public.room_pricing_rules(room_id);
CREATE INDEX IF NOT EXISTS idx_room_pricing_rules_dates ON public.room_pricing_rules(start_date, end_date);

-- ========================================
-- ROOM BOOKINGS (đặt phòng)
-- ========================================
CREATE TABLE IF NOT EXISTS public.room_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests_count INTEGER NOT NULL DEFAULT 1 CHECK (guests_count > 0),
  nights_count INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
  total_amount BIGINT NOT NULL CHECK (total_amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('banking')),
  payment_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  special_requests TEXT,
  cancellation_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT room_bookings_dates_check CHECK (check_out_date > check_in_date),
  CONSTRAINT room_bookings_stay_check CHECK (check_out_date - check_in_date <= 30),
  CONSTRAINT exclude_overlapping_bookings
    EXCLUDE USING gist (
      room_id WITH =,
      daterange(check_in_date, check_out_date, '[)') WITH &&
    ) WHERE (status IN ('pending', 'confirmed', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_room_bookings_user_id ON public.room_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_room_id ON public.room_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_dates ON public.room_bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_room_bookings_status ON public.room_bookings(status);
CREATE INDEX IF NOT EXISTS idx_room_bookings_code ON public.room_bookings(code);
CREATE INDEX IF NOT EXISTS idx_room_bookings_expires ON public.room_bookings(expires_at);

-- ========================================
-- PRODUCT CATEGORIES (danh mục sản phẩm)
-- ========================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_slug ON public.product_categories(slug);

-- Seed default categories
INSERT INTO public.product_categories (name, slug, description, sort_order) VALUES
  ('Nước hoa trầm hương', 'nuoc-hoa', 'Nước hoa cao cấp từ tinh dầu trầm hương Việt Nam', 1),
  ('Tinh dầu trầm hương', 'tinh-dau', 'Tinh dầu nguyên chất từ cây Dó Đen', 2),
  ('Hương liệu & Nhang', 'huong-lieu', 'Nhang trầm hương, hương cone, hương bột', 3),
  ('Thủ công mỹ nghệ', 'thu-cong', 'Vòng tay, tượng, đồ trang trí từ gỗ trầm', 4)
ON CONFLICT (slug) DO NOTHING;

-- ========================================
-- PRODUCTS (sản phẩm trầm hương)
-- ========================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE RESTRICT,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price BIGINT NOT NULL CHECK (price > 0),
  compare_at_price BIGINT CHECK (compare_at_price > 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  sku TEXT UNIQUE,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  origin_type TEXT NOT NULL DEFAULT 'mature_partner_plantation' CHECK (origin_type IN ('mature_partner_plantation', 'cooperative_farm', 'dainganxanh_harvest')),
  batch_certificate_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_lot_id ON public.products(lot_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- ========================================
-- STORE ORDERS (đơn hàng store)
-- ========================================
CREATE TABLE IF NOT EXISTS public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  shipping_address TEXT NOT NULL,
  shipping_province TEXT,
  shipping_note TEXT,
  subtotal BIGINT NOT NULL CHECK (subtotal > 0),
  shipping_fee BIGINT NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  total_amount BIGINT NOT NULL CHECK (total_amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('banking', 'cod')),
  payment_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  tracking_number TEXT,
  cancellation_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_orders_user_id ON public.store_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON public.store_orders(status);
CREATE INDEX IF NOT EXISTS idx_store_orders_code ON public.store_orders(code);
CREATE INDEX IF NOT EXISTS idx_store_orders_expires ON public.store_orders(expires_at);

-- ========================================
-- STORE ORDER ITEMS (chi tiết đơn hàng)
-- ========================================
CREATE TABLE IF NOT EXISTS public.store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price BIGINT NOT NULL CHECK (unit_price > 0),
  subtotal BIGINT GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_order_items_order_id ON public.store_order_items(store_order_id);
CREATE INDEX IF NOT EXISTS idx_store_order_items_product_id ON public.store_order_items(product_id);

-- ========================================
-- PAYMENT TRANSACTIONS LEDGER
-- ========================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type TEXT NOT NULL CHECK (order_type IN ('tree', 'booking', 'store')),
  order_id UUID NOT NULL,
  order_code TEXT NOT NULL,
  casso_tid TEXT,
  amount BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'amount_mismatch', 'stale', 'duplicate')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_casso_tid ON public.payment_transactions(casso_tid);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON public.payment_transactions(order_type, order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_code ON public.payment_transactions(order_code);

-- ========================================
-- USER CARTS
-- ========================================
CREATE TABLE IF NOT EXISTS public.user_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_carts_user_id ON public.user_carts(user_id);

-- ========================================
-- STORED PROCEDURES
-- ========================================

-- Atomic product stock reservation
CREATE OR REPLACE FUNCTION public.reserve_product_stock(p_product_id UUID, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - p_qty,
      reserved_quantity = reserved_quantity + p_qty
  WHERE id = p_product_id AND stock_quantity >= p_qty;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Release reserved product stock
CREATE OR REPLACE FUNCTION public.release_product_stock(p_product_id UUID, p_qty INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity + p_qty,
      reserved_quantity = GREATEST(reserved_quantity - p_qty, 0)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Booking capacity and date validation trigger
CREATE OR REPLACE FUNCTION public.validate_room_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_capacity INT;
BEGIN
  SELECT capacity INTO v_capacity FROM public.rooms WHERE id = NEW.room_id;

  IF NEW.guests_count > v_capacity THEN
    RAISE EXCEPTION 'Guest count exceeds room capacity of %', v_capacity;
  END IF;

  IF NEW.check_in_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Check-in date cannot be in the past';
  END IF;

  IF NEW.check_out_date - NEW.check_in_date > 30 THEN
    RAISE EXCEPTION 'Stay cannot exceed 30 nights';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_room_booking ON public.room_bookings;
CREATE TRIGGER trg_validate_room_booking
BEFORE INSERT OR UPDATE ON public.room_bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_room_booking();

-- Release expired pending bookings
CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS void AS $$
BEGIN
  UPDATE public.room_bookings
  SET status = 'cancelled', cancellation_reason = 'Payment timeout (15 mins)'
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Release expired pending store orders
CREATE OR REPLACE FUNCTION public.expire_pending_store_orders()
RETURNS void AS $$
BEGIN
  UPDATE public.store_orders
  SET status = 'cancelled', cancellation_reason = 'Payment timeout (15 mins)'
  WHERE status = 'pending'
    AND payment_method = 'banking'
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- ROOMS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rooms_public_read" ON public.rooms;
DROP POLICY IF EXISTS "rooms_admin_all" ON public.rooms;

CREATE POLICY "rooms_public_read"
  ON public.rooms FOR SELECT
  USING (status = 'active');

CREATE POLICY "rooms_admin_all"
  ON public.rooms FOR ALL
  USING (public.is_admin());

-- ROOM PRICING RULES
ALTER TABLE public.room_pricing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "room_pricing_rules_public_read" ON public.room_pricing_rules;
DROP POLICY IF EXISTS "room_pricing_rules_admin_all" ON public.room_pricing_rules;

CREATE POLICY "room_pricing_rules_public_read"
  ON public.room_pricing_rules FOR SELECT
  USING (true);

CREATE POLICY "room_pricing_rules_admin_all"
  ON public.room_pricing_rules FOR ALL
  USING (public.is_admin());

-- ROOM BOOKINGS — no direct client insert
ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "room_bookings_user_select" ON public.room_bookings;
DROP POLICY IF EXISTS "room_bookings_insert_all" ON public.room_bookings;
DROP POLICY IF EXISTS "room_bookings_admin_all" ON public.room_bookings;

CREATE POLICY "room_bookings_user_select"
  ON public.room_bookings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "room_bookings_admin_all"
  ON public.room_bookings FOR ALL
  USING (public.is_admin());

-- PRODUCT CATEGORIES
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_categories_public_read" ON public.product_categories;
DROP POLICY IF EXISTS "product_categories_admin_all" ON public.product_categories;

CREATE POLICY "product_categories_public_read"
  ON public.product_categories FOR SELECT
  USING (true);

CREATE POLICY "product_categories_admin_all"
  ON public.product_categories FOR ALL
  USING (public.is_admin());

-- PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read" ON public.products;
DROP POLICY IF EXISTS "products_admin_all" ON public.products;

CREATE POLICY "products_public_read"
  ON public.products FOR SELECT
  USING (status IN ('active', 'out_of_stock'));

CREATE POLICY "products_admin_all"
  ON public.products FOR ALL
  USING (public.is_admin());

-- STORE ORDERS — no direct client insert
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_orders_user_select" ON public.store_orders;
DROP POLICY IF EXISTS "store_orders_insert_all" ON public.store_orders;
DROP POLICY IF EXISTS "store_orders_admin_all" ON public.store_orders;

CREATE POLICY "store_orders_user_select"
  ON public.store_orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "store_orders_admin_all"
  ON public.store_orders FOR ALL
  USING (public.is_admin());

-- STORE ORDER ITEMS — no direct client insert
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_order_items_user_select" ON public.store_order_items;
DROP POLICY IF EXISTS "store_order_items_insert_all" ON public.store_order_items;
DROP POLICY IF EXISTS "store_order_items_admin_all" ON public.store_order_items;

CREATE POLICY "store_order_items_user_select"
  ON public.store_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_orders
      WHERE store_orders.id = store_order_items.store_order_id
      AND store_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "store_order_items_admin_all"
  ON public.store_order_items FOR ALL
  USING (public.is_admin());

-- USER CARTS
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_carts_owner" ON public.user_carts;

CREATE POLICY "user_carts_owner"
  ON public.user_carts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- PAYMENT TRANSACTIONS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_transactions_admin_read" ON public.payment_transactions;

CREATE POLICY "payment_transactions_admin_read"
  ON public.payment_transactions FOR SELECT
  USING (public.is_admin());

-- ========================================
-- SUPABASE STORAGE BUCKETS
-- ========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-images',
  'room-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-order-proofs',
  'store-order-proofs',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "room_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "room_images_admin_upload" ON storage.objects;

CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "room_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'room-images');

CREATE POLICY "product_images_admin_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

CREATE POLICY "room_images_admin_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'room-images'
    AND public.is_admin()
  );
