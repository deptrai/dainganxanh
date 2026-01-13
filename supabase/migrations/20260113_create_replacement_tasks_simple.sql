-- Simplified Migration: Create replacement_tasks table
-- No dependency on profiles table

CREATE TABLE IF NOT EXISTS replacement_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dead_tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    new_tree_id UUID REFERENCES trees(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    reason TEXT,
    notes TEXT,
    assigned_to UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_replacement_tasks_dead_tree_id ON replacement_tasks(dead_tree_id);
CREATE INDEX IF NOT EXISTS idx_replacement_tasks_status ON replacement_tasks(status);
CREATE INDEX IF NOT EXISTS idx_replacement_tasks_assigned_to ON replacement_tasks(assigned_to);

ALTER TABLE replacement_tasks ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'replacement_tasks' AND policyname = 'Service role can manage all replacement_tasks') THEN
        CREATE POLICY "Service role can manage all replacement_tasks"
            ON replacement_tasks
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'replacement_tasks' AND policyname = 'Users can view their own tree replacement tasks') THEN
        CREATE POLICY "Users can view their own tree replacement tasks"
            ON replacement_tasks
            FOR SELECT
            TO authenticated
            USING (
                dead_tree_id IN (
                    SELECT id FROM trees WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;

COMMENT ON TABLE replacement_tasks IS 'Tasks for replacing dead trees';
