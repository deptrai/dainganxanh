-- Migration: Create replacement_tasks table
-- Purpose: Track dead tree replacement tasks for field operators
-- Date: 2026-01-13

-- Create replacement_tasks table
CREATE TABLE IF NOT EXISTS replacement_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dead_tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    new_tree_id UUID REFERENCES trees(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES users(id),
    notes TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_replacement_tasks_dead_tree ON replacement_tasks(dead_tree_id);
CREATE INDEX IF NOT EXISTS idx_replacement_tasks_status ON replacement_tasks(status);
CREATE INDEX IF NOT EXISTS idx_replacement_tasks_assigned_to ON replacement_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_replacement_tasks_created_at ON replacement_tasks(created_at DESC);

-- Enable RLS
ALTER TABLE replacement_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage replacement_tasks"
  ON replacement_tasks FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Field operators can view assigned tasks"
  ON replacement_tasks FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid() OR assigned_to IS NULL);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_replacement_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_replacement_tasks_updated_at
  BEFORE UPDATE ON replacement_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_replacement_tasks_updated_at();

-- Add comments
COMMENT ON TABLE replacement_tasks IS 'Tasks to replace dead trees with new ones';
COMMENT ON COLUMN replacement_tasks.dead_tree_id IS 'Reference to the dead tree that needs replacement';
COMMENT ON COLUMN replacement_tasks.new_tree_id IS 'Reference to the new replacement tree (NULL until planted)';
COMMENT ON COLUMN replacement_tasks.status IS 'Task status: pending, assigned, in_progress, completed, cancelled';
COMMENT ON COLUMN replacement_tasks.assigned_to IS 'Field operator assigned to this replacement task';
COMMENT ON COLUMN replacement_tasks.reason IS 'Reason why the tree died (from health log notes)';
