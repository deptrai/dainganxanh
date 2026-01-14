-- Create withdrawals table for referral commission withdrawal feature
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 200000),
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  proof_image_url TEXT,
  rejection_reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);

-- Enable Row Level Security
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals"
  ON withdrawals FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own withdrawals (status must be pending)
CREATE POLICY "Users can create own withdrawals"
  ON withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Policy: Service role (admin) has full access
CREATE POLICY "Service role full access"
  ON withdrawals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE withdrawals IS 'Stores referral commission withdrawal requests from users';
COMMENT ON COLUMN withdrawals.amount IS 'Withdrawal amount in VND, minimum 200,000';
COMMENT ON COLUMN withdrawals.status IS 'Withdrawal status: pending, approved, or rejected';
COMMENT ON COLUMN withdrawals.proof_image_url IS 'URL to proof of transfer image uploaded by admin';
