-- Update trees table schema to match application requirements
-- Problem: trees table missing lot_id and planted_at columns
-- Solution: Add missing columns with proper constraints

-- Add lot_id column (nullable, references lots table)
ALTER TABLE trees 
ADD COLUMN IF NOT EXISTS lot_id UUID REFERENCES lots(id) ON DELETE SET NULL;

-- Add planted_at column (nullable timestamp)
ALTER TABLE trees 
ADD COLUMN IF NOT EXISTS planted_at TIMESTAMPTZ;

-- Create index for lot_id lookups
CREATE INDEX IF NOT EXISTS idx_trees_lot_id ON trees(lot_id);

-- Add order_id foreign key constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'trees_order_id_fkey' 
    AND table_name = 'trees'
  ) THEN
    ALTER TABLE trees 
    ADD CONSTRAINT trees_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN trees.lot_id IS 'Reference to the lot where this tree is planted (nullable)';
COMMENT ON COLUMN trees.planted_at IS 'Timestamp when tree was actually planted in the field';

-- Verify schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trees' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
