import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface TreePhotoWebhookPayload {
    type: 'INSERT'
    table: 'tree_photos'
    record: {
        id: string
        lot_id: string
        photo_url: string
        uploaded_at: string
    }
}

serve(async (req) => {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const payload: TreePhotoWebhookPayload = await req.json()

        console.log('Received tree photo webhook:', payload)

        // Get lot information
        const { data: lot, error: lotError } = await supabase
            .from('lots')
            .select('id, name, region')
            .eq('id', payload.record.lot_id)
            .single()

        if (lotError || !lot) {
            console.error('Lot not found:', lotError)
            return new Response(JSON.stringify({ error: 'Lot not found' }), { status: 404 })
        }

        // Find all orders associated with this lot
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, user_id, order_code, quantity')
            .eq('lot_id', lot.id)

        if (ordersError || !orders || orders.length === 0) {
            console.log('No orders found for lot:', lot.id)
            return new Response(JSON.stringify({ message: 'No affected users' }), { status: 200 })
        }

        console.log(`Found ${orders.length} orders for lot ${lot.name}`)

        // Get unique users
        const userIds = [...new Set(orders.map(o => o.user_id))]

        // Fetch user details
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, full_name')
            .in('id', userIds)

        if (usersError || !users) {
            console.error('Users fetch error:', usersError)
            return new Response(JSON.stringify({ error: 'Users not found' }), { status: 500 })
        }

        // Create notifications and send emails for each user
        const results = await Promise.all(
            users.map(async (user) => {
                // Find user's orders for this lot
                const userOrders = orders.filter(o => o.user_id === user.id)
                const orderIds = userOrders.map(o => o.id)

                // Create notification record
                const { data: notification, error: notifError } = await supabase
                    .from('notifications')
                    .insert({
                        user_id: user.id,
                        type: 'tree_update',
                        title: '🌳 Cây của bạn có ảnh mới!',
                        body: `Lô ${lot.name} (${lot.region}) vừa được cập nhật ảnh mới`,
                        data: {
                            orderIds,
                            lotId: lot.id,
                            lotName: lot.name,
                            photoUrl: payload.record.photo_url,
                        },
                    })
                    .select()
                    .single()

                if (notifError) {
                    console.error('Notification creation failed:', notifError)
                    return { user: user.email, notification: 'failed', email: 'skipped' }
                }

                // Send email
                try {
                    const emailResponse = await fetch(
                        `${supabaseUrl}/functions/v1/send-quarterly-update`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${supabaseServiceKey}`,
                            },
                            body: JSON.stringify({
                                userEmail: user.email,
                                userName: user.full_name || 'Bạn',
                                lotName: lot.name,
                                lotRegion: lot.region,
                                photoUrl: payload.record.photo_url,
                                orderCodes: userOrders.map(o => o.order_code),
                                totalTrees: userOrders.reduce((sum, o) => sum + o.quantity, 0),
                            }),
                        }
                    )

                    const emailResult = emailResponse.ok ? 'sent' : 'failed'
                    return { user: user.email, notification: 'created', email: emailResult }
                } catch (emailError) {
                    console.error('Email sending failed:', emailError)
                    return { user: user.email, notification: 'created', email: 'failed' }
                }
            })
        )

        return new Response(
            JSON.stringify({
                success: true,
                lot: lot.name,
                usersNotified: results.length,
                results,
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Webhook processing failed:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
