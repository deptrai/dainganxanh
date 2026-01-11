-- Test Notification Creation Script
-- This script creates test data for notification system testing

-- Step 1: Get the latest user and order
DO $$
DECLARE
    test_user_id uuid;
    test_order_id uuid;
    test_lot_id uuid;
    test_notification_id uuid;
BEGIN
    -- Get latest user
    SELECT id INTO test_user_id 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Get latest order for this user
    SELECT id INTO test_order_id
    FROM orders
    WHERE user_id = test_user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Create or get a test lot
    INSERT INTO lots (name, region, description)
    VALUES ('Lô Test A', 'Đà Lạt', 'Lô test cho notification system')
    ON CONFLICT DO NOTHING
    RETURNING id INTO test_lot_id;
    
    -- If lot already exists, get its ID
    IF test_lot_id IS NULL THEN
        SELECT id INTO test_lot_id
        FROM lots
        WHERE name = 'Lô Test A'
        LIMIT 1;
    END IF;
    
    -- Update order to link with lot
    UPDATE orders
    SET lot_id = test_lot_id
    WHERE id = test_order_id;
    
    -- Insert a test tree photo (this should trigger the webhook)
    INSERT INTO tree_photos (lot_id, photo_url, caption, uploaded_by)
    VALUES (
        test_lot_id,
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
        'Ảnh test cho notification system',
        'admin'
    );
    
    -- Manually create a test notification (in case webhook doesn't fire)
    INSERT INTO notifications (
        user_id,
        type,
        title,
        body,
        data,
        read
    ) VALUES (
        test_user_id,
        'tree_update',
        '🌳 Cây của bạn có ảnh mới!',
        'Lô Test A vừa được cập nhật ảnh mới. Hãy xem cây của bạn đang lớn lên như thế nào nhé!',
        jsonb_build_object(
            'orderIds', ARRAY[test_order_id::text],
            'lotId', test_lot_id::text,
            'lotName', 'Lô Test A',
            'photoUrl', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'
        ),
        false
    )
    RETURNING id INTO test_notification_id;
    
    -- Output results
    RAISE NOTICE 'Test data created successfully!';
    RAISE NOTICE 'User ID: %', test_user_id;
    RAISE NOTICE 'Order ID: %', test_order_id;
    RAISE NOTICE 'Lot ID: %', test_lot_id;
    RAISE NOTICE 'Notification ID: %', test_notification_id;
END $$;
