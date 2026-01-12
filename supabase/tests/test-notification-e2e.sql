-- Complete End-to-End Test for Notification System
-- Run each step sequentially and verify results

-- ============================================
-- STEP 1: Verify Prerequisites
-- ============================================
SELECT 'Checking prerequisites...' as status;

-- Check if lots table exists and has data
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Lots table has data'
    ELSE '❌ No lots found - run seed script first'
  END as lots_check
FROM lots;

-- Check if orders are linked to lots
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Orders linked to lots'
    ELSE '❌ No orders linked - run seed script first'
  END as orders_check
FROM orders
WHERE lot_id IS NOT NULL;

-- Check if notifications table exists
SELECT 
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Notifications table ready'
    ELSE '❌ Notifications table missing'
  END as notifications_check
FROM notifications;

-- ============================================
-- STEP 2: Insert Test Photo (Triggers Webhook)
-- ============================================
-- This will trigger the webhook and create notifications
INSERT INTO tree_photos (lot_id, photo_url, caption, taken_at)
VALUES (
  (SELECT id FROM lots WHERE name LIKE 'Lô Thử Nghiệm%' LIMIT 1),
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80',
  'Test notification - ' || NOW()::text,
  NOW()
)
RETURNING 
  id as photo_id,
  lot_id,
  photo_url,
  uploaded_at;

-- ============================================
-- STEP 3: Wait 5 seconds for webhook processing
-- ============================================
SELECT 'Waiting for webhook to process...' as status;
SELECT pg_sleep(5);

-- ============================================
-- STEP 4: Verify Notifications Created
-- ============================================
SELECT 
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.body,
  n.data->>'lotName' as lot_name,
  n.data->>'photoUrl' as photo_url,
  n.read,
  n.created_at,
  u.email,
  u.full_name
FROM notifications n
LEFT JOIN users u ON u.id = n.user_id
WHERE n.created_at > NOW() - INTERVAL '1 minute'
ORDER BY n.created_at DESC;

-- ============================================
-- STEP 5: Check Notification Count
-- ============================================
SELECT 
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE read = false) as unread_count,
  COUNT(*) FILTER (WHERE type = 'tree_update') as tree_update_count
FROM notifications
WHERE created_at > NOW() - INTERVAL '1 minute';

-- ============================================
-- STEP 6: Verify Realtime Subscription
-- ============================================
-- Check if notifications table is in realtime publication
SELECT 
  schemaname,
  tablename,
  'Realtime enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'notifications';

-- ============================================
-- STEP 7: Test Mark as Read
-- ============================================
-- Mark the first unread notification as read
UPDATE notifications
SET read = true
WHERE id = (
  SELECT id FROM notifications 
  WHERE read = false 
  ORDER BY created_at DESC 
  LIMIT 1
)
RETURNING id, title, read;

-- ============================================
-- STEP 8: Cleanup Test Data (Optional)
-- ============================================
-- Uncomment to clean up test notifications
/*
DELETE FROM tree_photos 
WHERE caption LIKE 'Test notification%';

DELETE FROM notifications 
WHERE created_at > NOW() - INTERVAL '5 minutes';
*/

-- ============================================
-- STEP 9: Summary Report
-- ============================================
SELECT 
  '=== NOTIFICATION SYSTEM TEST SUMMARY ===' as report;

SELECT 
  'Total Lots' as metric,
  COUNT(*)::text as value
FROM lots
UNION ALL
SELECT 
  'Orders with Lots' as metric,
  COUNT(*)::text as value
FROM orders WHERE lot_id IS NOT NULL
UNION ALL
SELECT 
  'Total Photos' as metric,
  COUNT(*)::text as value
FROM tree_photos
UNION ALL
SELECT 
  'Total Notifications' as metric,
  COUNT(*)::text as value
FROM notifications
UNION ALL
SELECT 
  'Unread Notifications' as metric,
  COUNT(*)::text as value
FROM notifications WHERE read = false;
