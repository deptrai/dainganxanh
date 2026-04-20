-- Migration: add composite indexes for common query patterns
-- NFR P1c: Performance — reduce full-table scans on hot query paths
-- Date: 2026-04-21

-- ─────────────────────────────────────────────────────────────────
-- orders table
-- ─────────────────────────────────────────────────────────────────

-- Admin CRM: list orders for a user filtered by status (very common)
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status
    ON public.orders(user_id, status);

-- Webhook: casso lookup by code + pending status (hot path on every payment)
CREATE INDEX IF NOT EXISTS idx_orders_code_status
    ON public.orders(code, status)
    WHERE status = 'pending';

-- Admin dashboard: sort by created_at descending (default view)
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc
    ON public.orders(created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- casso_transactions table
-- ─────────────────────────────────────────────────────────────────

-- Idempotency check: casso_tid lookup (already has unique constraint,
-- but explicit index ensures planner uses it for single-row lookups)
CREATE INDEX IF NOT EXISTS idx_casso_transactions_casso_tid
    ON public.casso_transactions(casso_tid);

-- Admin audit: filter by status + time range
CREATE INDEX IF NOT EXISTS idx_casso_transactions_status_created_at
    ON public.casso_transactions(status, created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- referrals / referral_clicks (if tables exist)
-- ─────────────────────────────────────────────────────────────────

-- Referral lookup by referrer user_id (used on signup)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referrals') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referral_clicks') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_referral_clicks_referral_code ON public.referral_clicks(referral_code)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_referral_clicks_created_at ON public.referral_clicks(created_at DESC)';
    END IF;
END
$$;
