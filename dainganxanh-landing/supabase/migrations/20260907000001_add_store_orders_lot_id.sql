-- Migration: add lot_id to store_orders for store_staff lot-scoped access
-- Date: 2026-09-07
-- Depends: store_orders, lots, admin_user_lots

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'store_orders'
  ) THEN
    -- Add lot_id column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'store_orders' AND column_name = 'lot_id'
    ) THEN
      ALTER TABLE public.store_orders ADD COLUMN lot_id uuid;
      ALTER TABLE public.store_orders
        ADD CONSTRAINT store_orders_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_store_orders_lot_id ON public.store_orders(lot_id);
    END IF;

    -- Policy: store_staff can manage orders for their assigned lots
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'store_orders' AND policyname = 'store_staff_store_orders'
    ) THEN
      CREATE POLICY "store_staff_store_orders" ON public.store_orders
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.admin_user_lots aul
            WHERE aul.user_id = auth.uid()
              AND aul.lot_id = store_orders.lot_id
              AND aul.role = 'store_staff'
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.admin_user_lots aul
            WHERE aul.user_id = auth.uid()
              AND aul.lot_id = store_orders.lot_id
              AND aul.role = 'store_staff'
          )
        );
    END IF;
  END IF;
END
$$;
