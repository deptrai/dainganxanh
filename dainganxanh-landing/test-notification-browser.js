// Quick Test: Create Notification via Browser Console
// Paste this into browser console on My Garden page

(async () => {
    try {
        // Get Supabase client from window
        const { createClient } = window.supabase || {};

        if (!createClient) {
            console.error('Supabase not available. Make sure you are on My Garden page.');
            return;
        }

        // Create client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error('No user logged in');
            return;
        }

        console.log('Creating test notification for user:', user.id);

        // Get user's latest order
        const { data: orders } = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (!orders || orders.length === 0) {
            console.error('No orders found for user');
            return;
        }

        const orderId = orders[0].id;
        console.log('Using order ID:', orderId);

        // Create test notification
        const { data: notification, error } = await supabase
            .from('notifications')
            .insert({
                user_id: user.id,
                type: 'tree_update',
                title: '🌳 Cây của bạn có ảnh mới!',
                body: 'Lô Test vừa được cập nhật ảnh mới. Hãy xem cây của bạn đang lớn lên như thế nào nhé!',
                data: {
                    orderIds: [orderId],
                    lotId: 'test-lot-123',
                    lotName: 'Lô Test A',
                    photoUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'
                },
                read: false
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating notification:', error);
            return;
        }

        console.log('✅ Test notification created successfully!', notification);
        console.log('🔔 Notification should appear in the bell dropdown now!');
        console.log('📱 Click the notification to test navigation to #photos');

    } catch (err) {
        console.error('Error:', err);
    }
})();
