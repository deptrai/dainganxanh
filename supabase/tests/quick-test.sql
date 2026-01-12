-- Quick Test Script for Notification System
-- Run this in Supabase SQL Editor

-- Step 1: Create a test lot
INSERT INTO lots (id, name, region, description) 
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Lô Test Notification',
  'Đồng Nai',
  'Test lot for notification system'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Step 2: Link an existing order to this lot
UPDATE orders 
SET lot_id = '11111111-1111-1111-1111-111111111111'
WHERE id = (SELECT id FROM orders LIMIT 1)
RETURNING id, user_id, lot_id;

-- Step 3: Check which user will be notified
SELECT 
  u.email,
  u.full_name,
  o.id as order_id,
  o.order_code
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.lot_id = '11111111-1111-1111-1111-111111111111';

-- Step 4: Insert a test photo (THIS TRIGGERS THE WEBHOOK!)
INSERT INTO tree_photos (lot_id, photo_url, caption)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
  'Test photo - ' || NOW()::text
)
RETURNING *;

-- Step 5: Wait a moment, then check if notification was created
SELECT pg_sleep(3);

SELECT 
  n.*,
  u.email,
  u.full_name
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE n.created_at > NOW() - INTERVAL '1 minute'
ORDER BY n.created_at DESC;
