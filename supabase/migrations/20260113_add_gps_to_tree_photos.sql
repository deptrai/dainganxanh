-- Migration: Add GPS fields to tree_photos table
-- Purpose: Enable GPS tagging for uploaded photos (Story 3-5)
-- Date: 2026-01-13

-- Add GPS coordinate fields to tree_photos
ALTER TABLE tree_photos 
ADD COLUMN IF NOT EXISTS gps_lat DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS gps_lng DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS gps_accuracy DECIMAL(6, 2);

-- Create index for potential spatial queries
CREATE INDEX IF NOT EXISTS idx_tree_photos_gps ON tree_photos(gps_lat, gps_lng) 
WHERE gps_lat IS NOT NULL AND gps_lng IS NOT NULL;

-- Update table comments
COMMENT ON COLUMN tree_photos.gps_lat IS 'GPS latitude extracted from photo EXIF data (-90 to 90)';
COMMENT ON COLUMN tree_photos.gps_lng IS 'GPS longitude extracted from photo EXIF data (-180 to 180)';
COMMENT ON COLUMN tree_photos.gps_accuracy IS 'GPS accuracy in meters from EXIF GPSHPositioningError';
