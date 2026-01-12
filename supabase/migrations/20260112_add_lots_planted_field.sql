-- Migration: Add planted field to lots table for capacity tracking
-- Story 3-2: Tree Lot Assignment

-- Step 1: Add planted column (no constraint yet)
ALTER TABLE lots 
ADD COLUMN IF NOT EXISTS planted INTEGER DEFAULT 0;

-- Step 2: Backfill planted count from existing trees through orders
-- Relationship: trees → orders → lots
UPDATE lots
SET planted = (
    SELECT COUNT(*)
    FROM trees
    JOIN orders ON trees.order_id = orders.id
    WHERE orders.lot_id = lots.id
)
WHERE EXISTS (
    SELECT 1 
    FROM orders 
    WHERE orders.lot_id = lots.id
);

-- Step 3: Fix data inconsistency - update total_trees if planted exceeds it
UPDATE lots
SET total_trees = planted
WHERE planted > total_trees;

-- Step 4: Drop existing constraint if it exists, then add it (idempotent)
ALTER TABLE lots
DROP CONSTRAINT IF EXISTS check_planted_capacity;

ALTER TABLE lots
ADD CONSTRAINT check_planted_capacity 
CHECK (planted <= total_trees);

-- Step 5: Create index for faster capacity queries
DROP INDEX IF EXISTS idx_lots_capacity;
CREATE INDEX idx_lots_capacity ON lots(planted, total_trees);

-- Verify the migration
SELECT 
    id,
    name,
    planted,
    total_trees,
    (total_trees - planted) as available_capacity
FROM lots
ORDER BY name;
