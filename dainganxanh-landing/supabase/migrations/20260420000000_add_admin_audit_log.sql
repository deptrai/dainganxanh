-- Audit log for security-sensitive admin actions (impersonation, role changes, etc.)
-- Created to address G3 security finding: impersonation invisible forensically.

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    action       text NOT NULL,                          -- e.g. 'impersonate_start', 'impersonate_stop', 'role_change'
    target_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,
    target_role  text,                                   -- snapshot at the time of action
    metadata     jsonb DEFAULT '{}'::jsonb,              -- e.g. { reason, ip, user_agent }
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id  ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_id ON public.admin_audit_log(target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action    ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

COMMENT ON TABLE public.admin_audit_log IS
    'Forensic audit trail for security-sensitive admin actions. Insert via service role only. Never delete rows.';

-- RLS: only super_admin can read; nobody can update/delete; inserts via service role only
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_super_admin_read" ON public.admin_audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'super_admin'
        )
    );

-- No INSERT/UPDATE/DELETE policies → only service role can write (bypasses RLS)
