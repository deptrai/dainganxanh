-- SQL function to get harvest-ready trees
-- This should be created in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_harvest_ready_trees()
RETURNS TABLE (
    id UUID,
    tree_code TEXT,
    order_id UUID,
    user_id UUID,
    user_email TEXT,
    age_months INTEGER,
    co2_absorbed NUMERIC,
    planted_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        trees.id,
        trees.tree_code,
        trees.order_id,
        orders.user_id,
        users.email AS user_email,
        EXTRACT(MONTH FROM AGE(NOW(), trees.planted_at))::INTEGER AS age_months,
        trees.co2_absorbed,
        trees.planted_at
    FROM trees
    JOIN orders ON trees.order_id = orders.id
    JOIN users ON orders.user_id = users.id
    WHERE trees.status IN ('growing', 'mature')
    AND EXTRACT(MONTH FROM AGE(NOW(), trees.planted_at)) >= 60
    AND NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE notifications.user_id = users.id 
        AND notifications.type = 'harvest_ready'
        AND notifications.data->>'treeId' = trees.id::text
    );
END;
$$ LANGUAGE plpgsql;
