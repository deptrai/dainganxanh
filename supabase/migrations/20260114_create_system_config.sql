-- Create system_config table for storing system-wide configuration
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all system config
CREATE POLICY "Admins can view system config"
  ON system_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can update system config
CREATE POLICY "Admins can update system config"
  ON system_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can insert system config
CREATE POLICY "Admins can insert system config"
  ON system_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Create index for faster lookups by key
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_system_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE FUNCTION update_system_config_updated_at();

-- Seed default system configuration values
INSERT INTO system_config (key, value) VALUES
  ('site_name', '"Đại Ngàn Xanh"'::jsonb),
  ('support_email', '"support@dainganxanh.com"'::jsonb),
  ('currency', '"VND"'::jsonb),
  ('timezone', '"Asia/Ho_Chi_Minh"'::jsonb),
  ('date_format', '"DD/MM/YYYY"'::jsonb)
ON CONFLICT (key) DO NOTHING;
