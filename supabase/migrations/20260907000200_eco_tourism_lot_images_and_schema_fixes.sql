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
