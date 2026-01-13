-- Migration: Create follow_up_tasks table for sick tree reminders
-- This table tracks 30-day follow-up tasks for sick trees

-- Create follow_up_tasks table
CREATE TABLE IF NOT EXISTS follow_up_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    health_log_id UUID NOT NULL REFERENCES tree_health_logs(id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_follow_up_tasks_tree_id ON follow_up_tasks(tree_id);
CREATE INDEX idx_follow_up_tasks_due_date ON follow_up_tasks(due_date);
CREATE INDEX idx_follow_up_tasks_status ON follow_up_tasks(status);

-- Enable RLS
ALTER TABLE follow_up_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage all follow_up_tasks"
    ON follow_up_tasks
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can view their own tree follow_up_tasks"
    ON follow_up_tasks
    FOR SELECT
    TO authenticated
    USING (
        tree_id IN (
            SELECT id FROM trees WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all follow_up_tasks"
    ON follow_up_tasks
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Auto-update updated_at trigger
CREATE TRIGGER update_follow_up_tasks_updated_at
    BEFORE UPDATE ON follow_up_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE follow_up_tasks IS 'Tracks 30-day follow-up tasks for sick trees';
COMMENT ON COLUMN follow_up_tasks.tree_id IS 'Reference to the sick tree';
COMMENT ON COLUMN follow_up_tasks.health_log_id IS 'Reference to the health log that triggered this follow-up';
COMMENT ON COLUMN follow_up_tasks.due_date IS 'When the follow-up is due (30 days after sick status)';
COMMENT ON COLUMN follow_up_tasks.status IS 'Status: pending, completed, cancelled';
