-- Fix RLS policies for service role access
-- Problem: auth.role() function doesn't exist in Supabase
-- Solution: Use TO service_role clause instead

-- Fix orders table policies
DROP POLICY IF EXISTS "Service role full access" ON orders;
CREATE POLICY "Service role full access"
  ON orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix lots table policies
DROP POLICY IF EXISTS "Service role can manage lots" ON lots;
CREATE POLICY "Service role can manage lots"
  ON lots FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix trees table policies
DROP POLICY IF EXISTS "Service role can manage trees" ON trees;
CREATE POLICY "Service role can manage trees"
  ON trees FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix tree_photos table policies
DROP POLICY IF EXISTS "Service role can manage tree_photos" ON tree_photos;
CREATE POLICY "Service role can manage tree_photos"
  ON tree_photos FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
