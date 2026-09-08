-- Add unique constraint to payment_transactions for idempotency
-- Migration: 20260905000002_payment_transactions_unique_constraint.sql
-- Date: 2026-09-05
-- Story: 13.1 Polymorphic Casso Webhook

-- Ensure casso_tid is always populated (set to generated value if null)
UPDATE public.payment_transactions
SET casso_tid = COALESCE(casso_tid, 'unknown_' || gen_random_uuid()::text)
WHERE casso_tid IS NULL;

-- Add unique constraint to enforce idempotent upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_idempotency
  ON public.payment_transactions(casso_tid, order_code);

-- Add comment explaining the constraint
COMMENT ON INDEX idx_payment_transactions_idempotency IS
'Ensures idempotent processing of Casso webhook events. Prevents duplicate payment processing when Casso retries webhooks.';


-- Enforce casso_tid is non-null from now on
ALTER TABLE public.payment_transactions
  ALTER COLUMN casso_tid SET NOT NULL;
