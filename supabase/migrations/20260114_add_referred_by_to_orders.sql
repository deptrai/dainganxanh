-- Add referred_by column to orders table for referral tracking
-- Migration: 20260114_add_referred_by_to_orders.sql

-- Add referred_by column
ALTER TABLE orders
ADD COLUMN referred_by UUID REFERENCES auth.users(id);

-- Add index for faster referral queries
CREATE INDEX IF NOT EXISTS idx_orders_referred_by ON orders(referred_by);

-- Add comment for documentation
COMMENT ON COLUMN orders.referred_by IS 'User ID of the referrer who brought this customer';
