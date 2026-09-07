-- Migration: add admin_user_lots for lot-scoped admin roles
-- Date: 2026-09-07
-- Depends: lots, auth.users, admin_audit_log already migrated

-- ========================================
-- LOT-SCOPED ADMIN ROLES
-- ========================================

CREATE TABLE IF NOT EXISTS public.admin_user_lots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lot_id uuid NOT NULL,
  role text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_user_lots_pkey PRIMARY KEY (id),
  CONSTRAINT admin_user_lots_user_id_lot_id_unique UNIQUE (user_id, lot_id),
  CONSTRAINT admin_user_lots_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT admin_user_lots_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE,
  CONSTRAINT admin_user_lots_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT admin_user_lots_role_check CHECK (role IN ('resort_manager', 'store_staff', 'super_admin'))
);

CREATE INDEX IF NOT EXISTS idx_admin_user_lots_user_id ON public.admin_user_lots(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_lots_lot_id ON public.admin_user_lots(lot_id);

-- Enable RLS on admin_user_lots
ALTER TABLE IF EXISTS public.admin_user_lots ENABLE ROW LEVEL SECURITY;

-- Only super_admin and admin can manage assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_user_lots' AND policyname = 'admin_full_admin_user_lots'
  ) THEN
    CREATE POLICY "admin_full_admin_user_lots" ON public.admin_user_lots
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
        )
      );
  END IF;
END
$$;

-- Authenticated users can see their own lot-scoped assignments (read only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_user_lots' AND policyname = 'users_read_own_admin_user_lots'
  ) THEN
    CREATE POLICY "users_read_own_admin_user_lots" ON public.admin_user_lots
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END
$$;

-- ========================================
-- LOT-SCOPED RLS POLICIES
-- ========================================
-- These policies enable lot-scoped roles for eco-tourism/store tables.
-- If the underlying tables do not yet exist, these policies are guarded
-- with DO $$ ... IF EXISTS ... blocks so the migration stays idempotent.
-- When the tables are created, drop the guards and apply the policies
-- directly if needed.

DO $$
BEGIN
  -- ========== ROOM BOOKINGS ==========
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'room_bookings'
  ) THEN
    -- Enable RLS if not already enabled
    ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;

    -- Global admin / super_admin can do anything
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'room_bookings' AND policyname = 'admin_full_room_bookings'
    ) THEN
      CREATE POLICY "admin_full_room_bookings" ON public.room_bookings
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
          )
        );
    END IF;

    -- Guests can see their own bookings
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'room_bookings' AND policyname = 'users_read_own_bookings'
    ) THEN
      CREATE POLICY "users_read_own_bookings" ON public.room_bookings
        FOR SELECT TO authenticated
        USING (user_id = auth.uid());
    END IF;

    -- resort_manager can manage bookings for their assigned lots
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'room_bookings' AND policyname = 'resort_manager_room_bookings'
    ) THEN
      CREATE POLICY "resort_manager_room_bookings" ON public.room_bookings
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.admin_user_lots aul
            JOIN public.rooms r ON r.lot_id = aul.lot_id
            WHERE aul.user_id = auth.uid()
              AND r.id = room_bookings.room_id
              AND aul.role = 'resort_manager'
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.admin_user_lots aul
            JOIN public.rooms r ON r.lot_id = aul.lot_id
            WHERE aul.user_id = auth.uid()
              AND r.id = room_bookings.room_id
              AND aul.role = 'resort_manager'
          )
        );
    END IF;
  END IF;

  -- ========== ROOMS ==========
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rooms'
  ) THEN
    ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'rooms' AND policyname = 'admin_full_rooms'
    ) THEN
      CREATE POLICY "admin_full_rooms" ON public.rooms
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'rooms' AND policyname = 'resort_manager_rooms'
    ) THEN
      CREATE POLICY "resort_manager_rooms" ON public.rooms
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.admin_user_lots aul
            WHERE aul.user_id = auth.uid()
              AND aul.lot_id = rooms.lot_id
              AND aul.role = 'resort_manager'
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.admin_user_lots aul
            WHERE aul.user_id = auth.uid()
              AND aul.lot_id = rooms.lot_id
              AND aul.role = 'resort_manager'
          )
        );
    END IF;
  END IF;

  -- ========== STORE ORDERS ==========
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'store_orders'
  ) THEN
    ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'store_orders' AND policyname = 'admin_full_store_orders'
    ) THEN
      CREATE POLICY "admin_full_store_orders" ON public.store_orders
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
          )
        );
    END IF;

    -- Customers can read their own store orders
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'store_orders' AND policyname = 'users_read_own_store_orders'
    ) THEN
      CREATE POLICY "users_read_own_store_orders" ON public.store_orders
        FOR SELECT TO authenticated
        USING (user_id = auth.uid());
    END IF;
  END IF;

  -- ========== PRODUCTS ==========
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'admin_full_products'
    ) THEN
      CREATE POLICY "admin_full_products" ON public.products
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
          )
        );
    END IF;

    -- Public read access for active products (only if status column exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'status'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'public_read_products'
    ) THEN
      CREATE POLICY "public_read_products" ON public.products
        FOR SELECT TO anon, authenticated
        USING (status = 'active');
    END IF;

    -- store_staff can manage products scoped to their lots
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'store_staff_products'
    ) THEN
      CREATE POLICY "store_staff_products" ON public.products
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.admin_user_lots aul
            WHERE aul.user_id = auth.uid()
              AND aul.lot_id = products.lot_id
              AND aul.role = 'store_staff'
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.admin_user_lots aul
            WHERE aul.user_id = auth.uid()
              AND aul.lot_id = products.lot_id
              AND aul.role = 'store_staff'
          )
        );
    END IF;
  END IF;
END
$$;
