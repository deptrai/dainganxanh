-- Webhook configuration for Tree Health Status notifications
-- This webhook triggers when a tree is marked as dead to notify the tree owner

-- Step 1: Create webhook in Supabase Dashboard
-- Navigate to: Database > Webhooks > Create a new hook

-- Webhook Configuration:
-- Name: tree-health-dead-notification
-- Table: tree_health_logs
-- Events: INSERT
-- Type: HTTP Request
-- Method: POST
-- URL: https://gzuuyzikjvykjpeixzqk.supabase.co/functions/v1/notify-tree-health
-- HTTP Headers:
--   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
--   Content-Type: application/json

-- Conditions (optional):
-- Filter to only trigger when new_status = 'dead'
-- SQL condition: new_status = 'dead'

-- Payload example:
-- {
--   "type": "INSERT",
--   "table": "tree_health_logs",
--   "record": {
--     "id": "uuid",
--     "tree_id": "uuid",
--     "old_status": "healthy",
--     "new_status": "dead",
--     "notes": "Tree died due to disease",
--     "changed_by": "user_id",
--     "changed_at": "timestamp"
--   }
-- }

-- The Edge Function will:
-- 1. Fetch tree details (code, user_id)
-- 2. Create in-app notification for tree owner
-- 3. Send email notification (if enabled)
-- 4. Log the notification event

-- Test the webhook:
-- UPDATE trees SET health_status = 'dead' WHERE id = (SELECT id FROM trees LIMIT 1);
