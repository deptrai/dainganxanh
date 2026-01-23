-- Create admin_preferences table for storing admin notification and UI preferences
CREATE TABLE IF NOT EXISTS admin_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications JSONB DEFAULT '{"orders": true, "withdrawals": true, "alerts": true}'::jsonb,
  in_app_sound BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view their own preferences
CREATE POLICY "Admins can view own preferences"
  ON admin_preferences
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can insert their own preferences
CREATE POLICY "Admins can insert own preferences"
  ON admin_preferences
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can update their own preferences
CREATE POLICY "Admins can update own preferences"
  ON admin_preferences
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_preferences_user_id ON admin_preferences(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_admin_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_preferences_updated_at
  BEFORE UPDATE ON admin_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_preferences_updated_at();
