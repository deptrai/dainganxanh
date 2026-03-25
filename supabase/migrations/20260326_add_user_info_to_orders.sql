-- Migration: Add user_email and user_name columns to orders table
-- Story 5.1: Pre-create Pending Order at Checkout
-- These columns allow Casso webhook to process orders automatically with full user context

ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_name  TEXT;

-- Add comments for documentation
COMMENT ON COLUMN orders.user_email IS 'User email address, stored at order creation time for webhook processing';
COMMENT ON COLUMN orders.user_name  IS 'User display name, stored at order creation time for contract/email generation';
