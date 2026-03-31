-- Add missing referral_clicks for 8 completed orders
-- Commission rate: 10% (0.1)
-- These orders had referred_by set but no conversion tracking in referral_clicks
--
-- Root cause: Referral tracking system didn't create click records properly
-- This migration creates retroactive conversion records for data integrity
--
-- Orders fixed:
-- - DHE6MDDH (1,300,000 VNĐ → 130,000 commission)
-- - DHYQ4OK1 (26,000,000 VNĐ → 2,600,000 commission)
-- - DH1ZZTHM, DHY0MJBQ, DHYSAJ4U, DH1U90XP, DHTEST99, DHY0KDJ1 (260k each → 26k commission)
--
-- Excludes DHH60EJP and DHTXR1UL (already fixed in migration 20260331000000_fix_missing_referrals.sql)

BEGIN;

-- Insert missing referral_clicks records for completed orders
INSERT INTO referral_clicks (referrer_id, converted, order_id, ip_hash, user_agent, created_at)
SELECT
    '5296b70b-03bb-463b-853c-9ccff2697685'::uuid as referrer_id,
    true as converted,
    o.id as order_id,
    'retroactive-fix-batch-2' as ip_hash,
    'Admin retroactive - missing conversion tracking' as user_agent,
    o.created_at
FROM orders o
WHERE o.referred_by = '5296b70b-03bb-463b-853c-9ccff2697685'
  AND o.status = 'completed'
  AND o.code NOT IN ('DHH60EJP', 'DHTXR1UL')
  AND NOT EXISTS (
    SELECT 1 FROM referral_clicks rc
    WHERE rc.order_id = o.id AND rc.converted = true
  );

COMMIT;

-- Verification queries (run these after migration):
--
-- Check total referral_clicks for dainganxanh:
-- SELECT COUNT(*) as total_clicks
-- FROM referral_clicks
-- WHERE referrer_id = '5296b70b-03bb-463b-853c-9ccff2697685';
-- Expected: 10
--
-- Check all conversions:
-- SELECT
--     rc.id,
--     o.code as order_code,
--     o.total_amount,
--     ROUND(o.total_amount * 0.1) as commission,
--     rc.ip_hash,
--     rc.created_at
-- FROM referral_clicks rc
-- JOIN orders o ON rc.order_id = o.id
-- WHERE rc.referrer_id = '5296b70b-03bb-463b-853c-9ccff2697685'
--   AND rc.converted = true
-- ORDER BY rc.created_at;
-- Expected: 10 rows, total commission = 2,938,000 VND
