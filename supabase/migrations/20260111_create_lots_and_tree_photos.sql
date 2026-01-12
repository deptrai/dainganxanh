-- Migration: Create lots and tree_photos tables for notification system
-- Purpose: Enable tree photo tracking and notification webhooks
-- Date: 2026-01-11

-- ======================================
-- Table: lots (planting lots/areas)
-- ======================================
CREATE TABLE IF NOT EXISTS lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  description TEXT,
  location_lat DECIMAL(10, 7),
  location_lng DECIMAL(10, 7),
  total_trees INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for lots
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;

-- Lots are public read for all authenticated users
CREATE POLICY "Authenticated users can view lots"
  ON lots FOR SELECT
  TO authenticated
  USING (true);

-- Only admin/service role can modify lots
CREATE POLICY "Service role can manage lots"
  ON lots FOR ALL
  USING (auth.role() = 'service_role');

-- ======================================
-- Table: tree_photos
-- ======================================
CREATE TABLE IF NOT EXISTS tree_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  taken_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for tree_photos
CREATE INDEX IF NOT EXISTS idx_tree_photos_lot_id ON tree_photos(lot_id);
CREATE INDEX IF NOT EXISTS idx_tree_photos_uploaded_at ON tree_photos(uploaded_at DESC);

-- Enable RLS for tree_photos
ALTER TABLE tree_photos ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view tree photos
CREATE POLICY "Authenticated users can view tree_photos"
  ON tree_photos FOR SELECT
  TO authenticated
  USING (true);

-- Only admin/service role can insert/update photos
CREATE POLICY "Service role can manage tree_photos"
  ON tree_photos FOR ALL
  USING (auth.role() = 'service_role');

-- ======================================
-- Add FK constraint to orders.lot_id
-- ======================================
DO $$
BEGIN
  -- Add foreign key if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_orders_lot_id' 
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders 
    ADD CONSTRAINT fk_orders_lot_id 
    FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ======================================
-- Enable Realtime for tree_photos (for admin dashboard)
-- ======================================
ALTER PUBLICATION supabase_realtime ADD TABLE tree_photos;

-- ======================================
-- Comments for documentation
-- ======================================
COMMENT ON TABLE lots IS 'Planting lots/areas where trees are planted. Used for grouping trees and photos.';
COMMENT ON TABLE tree_photos IS 'Photos uploaded for tree lots. Triggers webhook for user notifications.';
COMMENT ON COLUMN tree_photos.lot_id IS 'Reference to the lot where photo was taken';
COMMENT ON COLUMN tree_photos.taken_at IS 'Optional date when photo was actually taken';
COMMENT ON COLUMN tree_photos.uploaded_at IS 'Timestamp when photo was uploaded - triggers webhook';
