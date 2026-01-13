-- Add contract_url column to orders table
-- This column stores the URL to the generated PDF contract for each order

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS contract_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_contract_url ON orders(contract_url) WHERE contract_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN orders.contract_url IS 'URL to the generated PDF contract stored in Supabase Storage';
