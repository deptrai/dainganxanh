-- Migration: Add UPDATE policy for trees table health_status
-- Purpose: Allow authenticated users (admins) to update tree health status
-- Date: 2026-01-14

-- Add policy for admins to update tree health_status
CREATE POLICY "Admins can update tree health_status"
  ON trees FOR UPDATE
  TO authenticated
  USING (
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can update tree health_status" ON trees IS 'Allows admin users to update tree health status and related fields';
