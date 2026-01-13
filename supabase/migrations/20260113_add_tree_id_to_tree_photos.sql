-- Migration: Add optional tree_id to tree_photos for specific tree assignment
-- Purpose: Allow photos to be linked to specific trees while maintaining lot-level batch uploads
-- Date: 2026-01-13

-- Add optional tree_id field to tree_photos
ALTER TABLE tree_photos 
ADD COLUMN IF NOT EXISTS tree_id UUID REFERENCES trees(id) ON DELETE SET NULL;

-- Create index for tree_id lookups
CREATE INDEX IF NOT EXISTS idx_tree_photos_tree_id ON tree_photos(tree_id) 
WHERE tree_id IS NOT NULL;

-- Update table comments
COMMENT ON COLUMN tree_photos.tree_id IS 'Optional reference to specific tree. If NULL, photo applies to entire lot.';

-- Note: Backward compatible - existing photos remain lot-level only
-- New photos can be:
--   1. Lot-level (tree_id = NULL) - applies to all trees in lot
--   2. Tree-specific (tree_id = UUID) - applies to one specific tree
