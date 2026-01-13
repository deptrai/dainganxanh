-- Migration: Create tree_health_logs table
-- Purpose: Track all health status changes for audit and history
-- Date: 2026-01-13

-- Create tree_health_logs table
CREATE TABLE IF NOT EXISTS tree_health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    notes TEXT,
    treatment_details TEXT,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_tree_health_logs_tree_id ON tree_health_logs(tree_id);
CREATE INDEX IF NOT EXISTS idx_tree_health_logs_changed_at ON tree_health_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tree_health_logs_new_status ON tree_health_logs(new_status);

-- Enable RLS
ALTER TABLE tree_health_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage tree_health_logs"
  ON tree_health_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view logs for their trees"
  ON tree_health_logs FOR SELECT
  TO authenticated
  USING (
    tree_id IN (
      SELECT id FROM trees WHERE user_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE tree_health_logs IS 'Audit log of all tree health status changes';
COMMENT ON COLUMN tree_health_logs.old_status IS 'Previous health status before change';
COMMENT ON COLUMN tree_health_logs.new_status IS 'New health status after change';
COMMENT ON COLUMN tree_health_logs.treatment_details IS 'Details of treatment plan for sick trees';
COMMENT ON COLUMN tree_health_logs.changed_by IS 'User who made the status change (typically field operator)';
