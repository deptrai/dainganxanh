-- Migration: Add RLS policies for trees table  
-- Purpose: Allow service role to insert trees during lot assignment
-- Date: 2026-01-12

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own trees" ON trees;
DROP POLICY IF EXISTS "Service role can manage trees" ON trees;

-- Enable RLS for trees
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;

-- Users can view their own trees
CREATE POLICY "Users can view their own trees"
  ON trees FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role has full access (critical for admin assignment workflow)
CREATE POLICY "Service role can manage trees"
  ON trees FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE trees IS 'Individual tree records assigned to users from orders. RLS allows users to view own trees, service role has full access for admin operations.';
