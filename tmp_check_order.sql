
SELECT 
    o.code, 
    o.user_id,
    o.referred_by,
    o.status,
    o.total_amount,
    o.created_at,
    o.user_email
FROM orders o
WHERE o.code = 'DHTXR1UL';
