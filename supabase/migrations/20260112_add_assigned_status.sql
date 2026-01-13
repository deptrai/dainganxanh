-- Add 'assigned' status to orders table CHECK constraint
-- Problem: The original constraint only allowed: pending, completed, failed, cancelled
-- Solution: Add 'assigned' status for tree lot assignment workflow

-- Drop the old constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Recreate with 'assigned' status included
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'completed', 'assigned', 'failed', 'cancelled'));

-- Verify the constraint was updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'orders_status_check';
