-- Seed Data for Testing Notification System
-- Run this in Supabase SQL Editor after migrations are applied

-- Step 1: Create test lots
INSERT INTO lots (id, name, region, description, total_trees) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Lô Thử Nghiệm A', 'Đồng Nai', 'Lô test cho notification system', 100),
  ('22222222-2222-2222-2222-222222222222', 'Lô Thử Nghiệm B', 'Bình Phước', 'Lô test thứ 2', 150)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Update existing orders to link to test lots
-- Find some existing orders and assign them to lots
UPDATE orders 
SET lot_id = '11111111-1111-1111-1111-111111111111'
WHERE id IN (
  SELECT id FROM orders 
  WHERE lot_id IS NULL 
  LIMIT 3
);

-- Step 3: Verify setup
SELECT 
  'Lots' as table_name,
  COUNT(*) as count
FROM lots
UNION ALL
SELECT 
  'Orders with lot_id' as table_name,
  COUNT(*) as count
FROM orders
WHERE lot_id IS NOT NULL
UNION ALL
SELECT 
  'Notifications' as table_name,
  COUNT(*) as count
FROM notifications;

-- Step 4: Check which users will be notified
SELECT 
  u.id,
  u.email,
  u.full_name,
  COUNT(o.id) as order_count,
  l.name as lot_name
FROM users u
JOIN orders o ON o.user_id = u.id
JOIN lots l ON l.id = o.lot_id
WHERE o.lot_id = '11111111-1111-1111-1111-111111111111'
GROUP BY u.id, u.email, u.full_name, l.name;

-- Step 5: Ready to test!
-- Next step: Insert a test photo to trigger the webhook
-- (Don't run this yet - wait for webhook configuration)
/*
INSERT INTO tree_photos (lot_id, photo_url, caption, taken_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
  'Ảnh test notification system',
  NOW()
);
*/
