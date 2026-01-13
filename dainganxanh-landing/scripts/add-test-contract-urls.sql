-- Add contract_url to existing orders for testing
-- This script adds sample contract URLs to orders that don't have them yet

UPDATE orders
SET contract_url = 'https://example.com/contracts/' || id || '.pdf',
    order_code = COALESCE(order_code, 'ORD-' || SUBSTRING(id::text, 1, 8))
WHERE contract_url IS NULL
LIMIT 5;
