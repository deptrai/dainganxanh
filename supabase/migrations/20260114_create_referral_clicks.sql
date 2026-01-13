-- Create referral_clicks table for tracking referral link clicks and conversions
-- Migration: 20260114_create_referral_clicks.sql

-- Create referral_clicks table
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_hash TEXT, -- Hashed IP for privacy (SHA-256)
  user_agent TEXT,
  converted BOOLEAN DEFAULT FALSE,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_clicks_referrer ON referral_clicks(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_order ON referral_clicks(order_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_created_at ON referral_clicks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral clicks
CREATE POLICY "Users can view own referral clicks"
  ON referral_clicks FOR SELECT
  USING (auth.uid() = referrer_id);

-- Service role has full access
CREATE POLICY "Service role full access"
  ON referral_clicks FOR ALL
  USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE referral_clicks IS 'Tracks clicks on referral links and conversions to orders';
COMMENT ON COLUMN referral_clicks.ip_hash IS 'SHA-256 hashed IP address for privacy compliance';
COMMENT ON COLUMN referral_clicks.converted IS 'True when the click resulted in a completed order';
