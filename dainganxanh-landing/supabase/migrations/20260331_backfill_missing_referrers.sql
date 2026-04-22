-- Backfill missing referred_by_user_id for users without referrer
-- Issue: Some users created before migration or via non-standard paths
-- have NULL referred_by_user_id, violating mandatory referral policy
--
-- Default referrer: dainganxanh (nguyenphuonghoang888@gmail.com)
-- User ID: 5296b70b-03bb-463b-853c-9ccff2697685

BEGIN;

-- Update all users with NULL referred_by_user_id → default to dainganxanh
UPDATE users
SET referred_by_user_id = '5296b70b-03bb-463b-853c-9ccff2697685'
WHERE referred_by_user_id IS NULL
  AND id != '5296b70b-03bb-463b-853c-9ccff2697685'; -- Exclude dainganxanh itself

COMMIT;

-- Verification query (run after migration):
--
-- SELECT
--   COUNT(*) as users_with_null_referrer
-- FROM users
-- WHERE referred_by_user_id IS NULL
--   AND id != '5296b70b-03bb-463b-853c-9ccff2697685';
-- Expected result: 0 (except dainganxanh root user)
