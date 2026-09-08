-- Migration: add room_blocks table for date-range room maintenance blocking
-- Date: 2026-09-08
-- Story: 11.8 Admin Room Calendar
-- Note: rooms.status is for permanent room closure only; room_blocks is for date-range blocking

CREATE TABLE IF NOT EXISTS public.room_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'maintenance',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT room_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT room_blocks_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
  CONSTRAINT room_blocks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT room_blocks_dates_check CHECK (start_date < end_date),
  CONSTRAINT room_blocks_status_check CHECK (status IN ('maintenance'))
);

CREATE INDEX IF NOT EXISTS idx_room_blocks_room_id ON public.room_blocks(room_id);
CREATE INDEX IF NOT EXISTS idx_room_blocks_dates ON public.room_blocks(room_id, start_date, end_date);

-- Enable RLS; only service role and admins can manage/read
ALTER TABLE IF EXISTS public.room_blocks ENABLE ROW LEVEL SECURITY;

-- Admins can manage all room_blocks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'room_blocks' AND policyname = 'admin_manage_room_blocks'
  ) THEN
    CREATE POLICY "admin_manage_room_blocks" ON public.room_blocks
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

  -- resort_manager can manage room_blocks scoped to their assigned lots
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'room_blocks' AND policyname = 'resort_manager_room_blocks'
  ) THEN
    CREATE POLICY "resort_manager_room_blocks" ON public.room_blocks
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_user_lots aul
          JOIN public.rooms r ON r.id = room_blocks.room_id
          WHERE aul.user_id = auth.uid()
            AND aul.lot_id = r.lot_id
            AND aul.role = 'resort_manager'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.admin_user_lots aul
          JOIN public.rooms r ON r.id = room_blocks.room_id
          WHERE aul.user_id = auth.uid()
            AND aul.lot_id = r.lot_id
            AND aul.role = 'resort_manager'
        )
      );
  END IF;
END
$$;
