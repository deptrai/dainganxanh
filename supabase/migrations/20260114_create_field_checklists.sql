-- Create field_checklists table for quarterly field operations tracking
CREATE TABLE IF NOT EXISTS field_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL, -- Format: '2026-Q1', '2026-Q2', etc.
  checklist_items JSONB DEFAULT '[]'::jsonb,
  overall_status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE field_checklists IS 'Quarterly field operations checklists for lot maintenance tracking';
COMMENT ON COLUMN field_checklists.quarter IS 'Format: YYYY-QN (e.g., 2026-Q1)';
COMMENT ON COLUMN field_checklists.checklist_items IS 'JSONB array of checklist items with structure: [{id, label, completed, completed_by, completed_at, notes}]';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_field_checklists_lot_id ON field_checklists(lot_id);
CREATE INDEX IF NOT EXISTS idx_field_checklists_quarter ON field_checklists(quarter);
CREATE INDEX IF NOT EXISTS idx_field_checklists_due_date ON field_checklists(due_date);
CREATE INDEX IF NOT EXISTS idx_field_checklists_status ON field_checklists(overall_status);

-- Composite index for common query pattern (lot + quarter)
CREATE INDEX IF NOT EXISTS idx_field_checklists_lot_quarter ON field_checklists(lot_id, quarter);

-- Enable Row Level Security
ALTER TABLE field_checklists ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admin can view all checklists
CREATE POLICY "Admin can view all checklists"
  ON field_checklists FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'field_operator')
    )
  );

-- RLS Policy: Admin can update checklists
CREATE POLICY "Admin can update checklists"
  ON field_checklists FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'field_operator')
    )
  );

-- RLS Policy: Admin can insert checklists
CREATE POLICY "Admin can insert checklists"
  ON field_checklists FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'field_operator')
    )
  );

-- RLS Policy: Admin can delete checklists
CREATE POLICY "Admin can delete checklists"
  ON field_checklists FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'field_operator')
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_field_checklists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER trigger_update_field_checklists_updated_at
  BEFORE UPDATE ON field_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_field_checklists_updated_at();
