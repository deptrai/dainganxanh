-- Simplified Migration: Create follow_up_tasks table
-- No dependency on profiles table

CREATE TABLE IF NOT EXISTS follow_up_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    health_log_id UUID NOT NULL REFERENCES tree_health_logs(id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_tree_id ON follow_up_tasks(tree_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_due_date ON follow_up_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_status ON follow_up_tasks(status);

ALTER TABLE follow_up_tasks ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_up_tasks' AND policyname = 'Service role can manage all follow_up_tasks') THEN
        CREATE POLICY "Service role can manage all follow_up_tasks"
            ON follow_up_tasks
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_up_tasks' AND policyname = 'Users can view their own tree follow_up_tasks') THEN
        CREATE POLICY "Users can view their own tree follow_up_tasks"
            ON follow_up_tasks
            FOR SELECT
            TO authenticated
            USING (
                tree_id IN (
                    SELECT id FROM trees WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;

COMMENT ON TABLE follow_up_tasks IS 'Follow-up tasks for sick trees (30-day reminders)';
