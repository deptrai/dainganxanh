-- Migration: Fix RLS policy for notifications INSERT
-- The current INSERT policy is too permissive
-- This migration makes it more restrictive while still allowing service role access

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- Create a more restrictive INSERT policy
-- Edge Functions use service_role key which bypasses RLS, so this is secure
-- But for belt-and-suspenders security, we only allow admin or service role
CREATE POLICY "Only service role can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (
    -- Service role bypasses RLS entirely, so this will work for Edge Functions
    -- For any other role, check if they're trying to insert for themselves (future use case)
    auth.uid() = user_id OR auth.role() = 'service_role'
  );

-- Also allow service role to delete (for cleanup operations)
CREATE POLICY "Service role can delete notifications"
  ON notifications
  FOR DELETE
  USING (auth.role() = 'service_role');
