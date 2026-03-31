
SELECT 
    rc.id,
    rc.referrer_id,
    rc.converted,
    rc.order_id,
    rc.created_at,
    u.email as referrer_email,
    u.referral_code
FROM referral_clicks rc
JOIN users u ON rc.referrer_id = u.id
WHERE u.referral_code ILIKE 'dainganxanh'
ORDER BY rc.created_at DESC
LIMIT 10;
