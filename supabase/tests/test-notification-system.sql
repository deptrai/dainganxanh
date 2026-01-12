-- Test Script for Tree Photo Notification System
-- Run these queries in Supabase SQL Editor to test the end-to-end flow

-- Step 1: Check if notifications table exists and is configured
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'notifications';

-- Step 2: Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies 
WHERE tablename = 'notifications';

-- Step 3: Verify Realtime is enabled
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'notifications';

-- Step 4: Check tree_photos table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tree_photos' 
ORDER BY ordinal_position;

-- Step 5: Check if there are any existing orders with lot_id
SELECT 
    o.id,
    o.order_code,
    o.lot_id,
    l.name as lot_name,
    o.user_id
FROM orders o
LEFT JOIN lots l ON l.id = o.lot_id
LIMIT 5;

-- Step 6: Insert a test photo (REPLACE with actual values)
-- NOTE: Make sure to use a valid lot_id from an existing order
/*
INSERT INTO tree_photos (lot_id, photo_url, uploaded_at)
VALUES (
    (SELECT lot_id FROM orders WHERE lot_id IS NOT NULL LIMIT 1),
    'https://placehold.co/800x600/22c55e/white?text=Test+Tree+Photo',
    NOW()
)
RETURNING *;
*/

-- Step 7: Check if notification was created
SELECT 
    n.id,
    n.user_id,
    n.type,
    n.title,
    n.body,
    n.data,
    n.read,
    n.created_at,
    u.email,
    u.full_name
FROM notifications n
LEFT JOIN users u ON u.id = n.user_id
ORDER BY n.created_at DESC
LIMIT 10;

-- Step 8: Check webhook execution logs
-- Navigate to: Database > Webhooks > tree-photo-notification > Logs

-- Step 9: Check Edge Function logs
-- Navigate to: Edge Functions > notify-tree-update > Logs

-- Step 10: Clean up test data (optional)
/*
DELETE FROM tree_photos 
WHERE photo_url LIKE '%placehold.co%';

DELETE FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour';
*/
