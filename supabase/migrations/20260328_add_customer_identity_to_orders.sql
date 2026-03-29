-- Migration: add customer identity fields to orders (Story 10.1)
-- These fields are used for auto-generating the contract PDF
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'Việt Nam';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS id_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS id_issue_date date;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS id_issue_place text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone text;
