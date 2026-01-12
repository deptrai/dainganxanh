-- Migration: Add tree tracking columns to orders table
-- Purpose: Enable package-based tree tracking (1 order = 1 package with N trees)
-- Date: 2026-01-11

-- Add tree_status column to track overall status of trees in this order
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tree_status TEXT DEFAULT 'pending';

-- Add planted_at to track when trees were actually planted
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS planted_at TIMESTAMPTZ;

-- Add lot_id to link order to a specific planting lot (when lots table exists)
-- Note: Foreign key constraint omitted since lots table may not exist yet
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS lot_id UUID;

-- Add latest_photo_url for dashboard display
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS latest_photo_url TEXT;

-- Add co2_absorbed to track total CO2 for this package
-- Calculated as quantity * 20kg per tree per year (approximate)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS co2_absorbed DECIMAL(10,2) DEFAULT 0;

-- Add order_code for user-friendly display
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_code TEXT;

-- Create index for better query performance on user's orders
CREATE INDEX IF NOT EXISTS idx_orders_tree_status ON orders(tree_status);

-- Comment for clarity
COMMENT ON COLUMN orders.tree_status IS 'Status of trees in this package: pending, seedling, planted, growing, mature, harvested, dead';
COMMENT ON COLUMN orders.planted_at IS 'Actual date when trees were planted in the field';
COMMENT ON COLUMN orders.lot_id IS 'Reference to the planting lot where trees are located';
COMMENT ON COLUMN orders.co2_absorbed IS 'Total CO2 absorbed by all trees in this package (kg)';
COMMENT ON COLUMN orders.order_code IS 'User-friendly order code: PKG-YYYY-XXXXX';
