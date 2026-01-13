-- Migration: Add health_status field to trees table
-- Purpose: Track individual tree health for field operator updates
-- Date: 2026-01-13

-- Add health_status column to trees table
ALTER TABLE trees 
ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'healthy';

-- Add constraint to ensure valid health status values
ALTER TABLE trees 
ADD CONSTRAINT trees_health_status_check 
CHECK (health_status IN ('healthy', 'sick', 'dead'));

-- Create index for efficient filtering by health status
CREATE INDEX IF NOT EXISTS idx_trees_health_status ON trees(health_status);

-- Add comments for documentation
COMMENT ON COLUMN trees.health_status IS 'Health status of individual tree: healthy (default), sick (needs treatment), dead (needs replacement)';

-- Note: Existing trees will default to 'healthy' status
