-- Migration: Eco-Tourism schema fixes for Story 11.1
-- Date: 2026-09-07
-- Depends: lots, rooms

-- ========================================
-- LOT COVER IMAGES
-- ========================================
-- Story 11.1 needs a cover image on garden cards. Align lots with rooms/products
-- which already use JSONB images arrays.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lots' AND column_name = 'images'
  ) THEN
    ALTER TABLE public.lots ADD COLUMN images JSONB NOT NULL DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN public.lots.images IS 'Cover/gallery images for the garden (same array format as rooms.images and products.images)';
  END IF;
END
$$;

-- ========================================
-- PUBLIC SELECT ON LOTS (if not already)
-- ========================================
-- The baseline migration does not enable RLS or a public policy on lots.
-- This migration enables RLS and grants SELECT to anon/authenticated so that
-- the public eco-tourism listing can be read with or without service role.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lots'
  ) THEN
    ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'lots' AND policyname = 'public_read_lots'
    ) THEN
      CREATE POLICY "public_read_lots" ON public.lots
        FOR SELECT TO anon, authenticated
        USING (true);
    END IF;
  END IF;
END
$$;
