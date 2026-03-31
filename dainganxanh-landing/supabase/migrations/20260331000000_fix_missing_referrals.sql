-- Fix missing referrals for orders on 2026-03-31
-- Commission rate: 10% (0.1) - NOT 5%!
-- Root cause: Login modal không bắt buộc + checkout query thất bại im lặng
--
-- Impact: 2 đơn hàng (DHH60EJP, DHTXR1UL) bị mất referral attribution
-- Total commission to restore: 52,000 VNĐ (10% of 520,000 VNĐ)
--
-- Người giới thiệu: dainganxanh (nguyenphuonghoang888@gmail.com)
-- User ID: 5296b70b-03bb-463b-853c-9ccff2697685

BEGIN;

-- 1. Update referred_by cho 2 đơn hàng completed
UPDATE orders
SET referred_by = '5296b70b-03bb-463b-853c-9ccff2697685'
WHERE code IN ('DHH60EJP', 'DHTXR1UL')
  AND status = 'completed'
  AND referred_by IS NULL;

-- 2. Tạo referral_clicks records cho conversion tracking
INSERT INTO referral_clicks (referrer_id, converted, order_id, ip_hash, user_agent, created_at)
SELECT
    '5296b70b-03bb-463b-853c-9ccff2697685'::uuid as referrer_id,
    true as converted,
    o.id as order_id,
    'retroactive-fix-20260331' as ip_hash,
    'Admin manual fix - missing referral attribution (10% commission)' as user_agent,
    o.created_at
FROM orders o
WHERE o.code IN ('DHH60EJP', 'DHTXR1UL')
  AND o.status = 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM referral_clicks rc
    WHERE rc.order_id = o.id AND rc.converted = true
  );

COMMIT;

-- Verification queries (run these after migration):
--
-- Check orders updated:
-- SELECT
--     o.code,
--     o.user_email,
--     o.referred_by,
--     o.total_amount,
--     ROUND(o.total_amount * 0.1) as commission_10_percent
-- FROM orders o
-- WHERE o.code IN ('DHH60EJP', 'DHTXR1UL');
--
-- Check referral_clicks created:
-- SELECT
--     rc.id,
--     rc.referrer_id,
--     rc.converted,
--     rc.order_id,
--     o.code as order_code,
--     o.total_amount,
--     ROUND(o.total_amount * 0.1) as commission_10_percent
-- FROM referral_clicks rc
-- JOIN orders o ON rc.order_id = o.id
-- WHERE o.code IN ('DHH60EJP', 'DHTXR1UL');
--
-- Total commission restored:
-- SELECT
--     COUNT(*) as orders_fixed,
--     SUM(o.total_amount) as total_order_value,
--     SUM(ROUND(o.total_amount * 0.1)) as total_commission_10_percent
-- FROM orders o
-- WHERE o.code IN ('DHH60EJP', 'DHTXR1UL')
--   AND o.status = 'completed';
