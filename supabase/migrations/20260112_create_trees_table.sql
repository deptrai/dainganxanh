-- Migration: Create trees table for tree lot assignment
-- Purpose: Track individual trees assigned to users from orders
-- Date: 2026-01-12

-- ======================================
-- Table: trees (individual tree records)
-- ======================================
CREATE TABLE IF NOT EXISTS trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE, -- Tree code like TREE-2026-ABC12001
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, harvested, etc.
  planted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for trees
CREATE INDEX IF NOT EXISTS idx_trees_code ON trees(code);
CREATE INDEX IF NOT EXISTS idx_trees_order_id ON trees(order_id);
CREATE INDEX IF NOT EXISTS idx_trees_user_id ON trees(user_id);
CREATE INDEX IF NOT EXISTS idx_trees_lot_id ON trees(lot_id);
CREATE INDEX IF NOT EXISTS idx_trees_status ON trees(status);

-- Enable RLS for trees
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;

-- Users can view their own trees
CREATE POLICY "Users can view their own trees"
  ON trees FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage all trees
CREATE POLICY "Service role can manage trees"
  ON trees FOR ALL
  USING (auth.role() = 'service_role');

-- ======================================
-- Comments for documentation
-- ======================================
COMMENT ON TABLE trees IS 'Individual tree records assigned to users from orders';
COMMENT ON COLUMN trees.code IS 'Unique tree code in format TREE-YYYY-XXXXX';
COMMENT ON COLUMN trees.order_id IS 'Reference to the order this tree belongs to';
COMMENT ON COLUMN trees.user_id IS 'Reference to the user who owns this tree';
COMMENT ON COLUMN trees.lot_id IS 'Reference to the lot where this tree is planted (nullable)';
COMMENT ON COLUMN trees.status IS 'Tree status: active, harvested, etc.';
COMMENT ON COLUMN trees.planted_at IS 'Timestamp when tree was actually planted in the field';
