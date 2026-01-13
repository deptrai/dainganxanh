-- Simplified Migration: Create tree_health_logs table
-- No dependency on profiles table

CREATE TABLE IF NOT EXISTS tree_health_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL CHECK (new_status IN ('healthy', 'sick', 'dead')),
    notes TEXT,
    treatment_details TEXT,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tree_health_logs_tree_id ON tree_health_logs(tree_id);
CREATE INDEX IF NOT EXISTS idx_tree_health_logs_changed_at ON tree_health_logs(changed_at);

ALTER TABLE tree_health_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tree_health_logs' AND policyname = 'Service role can manage all tree_health_logs') THEN
        CREATE POLICY "Service role can manage all tree_health_logs"
            ON tree_health_logs
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tree_health_logs' AND policyname = 'Users can view their own tree health logs') THEN
        CREATE POLICY "Users can view their own tree health logs"
            ON tree_health_logs
            FOR SELECT
            TO authenticated
            USING (
                tree_id IN (
                    SELECT id FROM trees WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;

COMMENT ON TABLE tree_health_logs IS 'Audit log for tree health status changes';
