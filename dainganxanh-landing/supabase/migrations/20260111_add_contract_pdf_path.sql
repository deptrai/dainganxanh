-- Add contract_pdf_path column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS contract_pdf_path TEXT;

-- Add index for faster user order queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id 
ON orders(user_id);

-- Add index for contract path lookups
CREATE INDEX IF NOT EXISTS idx_orders_contract_path 
ON orders(contract_pdf_path) 
WHERE contract_pdf_path IS NOT NULL;
