-- Step 1: Create execute_sql function in Supabase
-- This allows running raw SQL from service role
-- Run this ONCE in Supabase SQL Editor

CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to service_role
GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;

-- Test it works
SELECT execute_sql('SELECT 1');
