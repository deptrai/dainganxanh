-- Database Webhook Configuration for Tree Photo Notifications
-- This webhook triggers the notify-tree-update Edge Function when a new photo is uploaded

-- Step 1: Create the webhook in Supabase Dashboard
-- Navigate to: Database > Webhooks > Create a new hook

-- Webhook Configuration:
-- Name: tree-photo-notification
-- Table: tree_photos
-- Events: INSERT
-- Type: HTTP Request
-- Method: POST
-- URL: https://gzuuyzikjvykjpeixzqk.supabase.co/functions/v1/notify-tree-update
-- HTTP Headers:
--   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
--   Content-Type: application/json

-- The webhook will send a payload like:
-- {
--   "type": "INSERT",
--   "table": "tree_photos",
--   "record": {
--     "id": "uuid",
--     "order_id": "uuid",
--     "photo_url": "string",
--     "uploaded_at": "timestamp",
--     ...
--   },
--   "schema": "public",
--   "old_record": null
-- }

-- Step 2: Test the webhook
-- Insert a test photo to verify the webhook triggers correctly:
-- INSERT INTO tree_photos (order_id, photo_url, uploaded_at)
-- VALUES (
--   (SELECT id FROM orders LIMIT 1),
--   'https://example.com/test-photo.jpg',
--   NOW()
-- );

-- Step 3: Verify notification creation
-- Check that a notification was created:
-- SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;

-- Step 4: Check Edge Function logs
-- Navigate to: Edge Functions > notify-tree-update > Logs
-- Verify the function executed successfully
