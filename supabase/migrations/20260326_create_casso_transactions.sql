-- Migration: Create casso_transactions table
-- Story 5.2: Casso Webhook Integration — Auto Payment Verification
-- Logs every webhook call from Casso for idempotency, auditing, and debugging

CREATE TABLE casso_transactions (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  casso_id       bigint,
  casso_tid      text UNIQUE NOT NULL,
  amount         bigint NOT NULL,
  description    text,
  bank_account   text,
  transaction_at timestamptz,
  raw_payload    jsonb,
  status         text NOT NULL DEFAULT 'processing',
  note           text,
  order_id       uuid REFERENCES orders(id),
  created_at     timestamptz DEFAULT now()
);

-- Status enum values:
--   processing       = initial insert, being processed
--   processed        = matched order and invoked process-payment successfully
--   no_match         = outgoing tx or no orderCode in description
--   order_not_found  = orderCode parsed but no pending order found
--   amount_mismatch  = order found but amount differs by >1,000đ
--   function_error   = process-payment Edge Function returned error
--   duplicate        = casso_tid already exists (idempotency guard)

CREATE INDEX idx_casso_transactions_tid     ON casso_transactions(casso_tid);
CREATE INDEX idx_casso_transactions_status  ON casso_transactions(status);
CREATE INDEX idx_casso_transactions_created ON casso_transactions(created_at DESC);
CREATE INDEX idx_casso_transactions_order   ON casso_transactions(order_id);

ALTER TABLE casso_transactions ENABLE ROW LEVEL SECURITY;

-- Service role: full access (for webhook API route using service role key)
CREATE POLICY "service_role_full_access" ON casso_transactions
  USING (auth.role() = 'service_role');

-- Admin read: view transaction logs in admin dashboard
CREATE POLICY "admin_read" ON casso_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));
