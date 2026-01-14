import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PackageGrid from '@/components/crm/PackageGrid'
import EmptyGarden from '@/components/crm/EmptyGarden'
import MyGardenHeader from '@/components/crm/MyGardenHeader'

export default async function MyGardenPage() {
    const supabase = await createServerClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?redirect=/crm/my-garden')
    }

    // Fetch user's orders (packages) instead of individual trees
    // Each order represents a "package" of trees that are tracked together
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            id,
            order_code,
            quantity,
            status,
            tree_status,
            planted_at,
            co2_absorbed,
            latest_photo_url,
            created_at,
            total_amount
        `)
        .eq('user_id', user.id)
        .in('status', ['paid', 'verified', 'assigned', 'completed'])
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching orders:', error.message)
    }

    // Process orders with defaults for missing fields
    const processedOrders = (orders || []).map(order => ({
        ...order,
        order_code: order.order_code || null,
        tree_status: order.tree_status || 'pending',
        planted_at: order.planted_at || null,
        co2_absorbed: order.co2_absorbed ?? (order.quantity * 20),
        latest_photo_url: order.latest_photo_url || null,
        total_amount: order.total_amount || 0,
    }))

    // Calculate total trees, CO2, and amount
    const totalTrees = processedOrders.reduce((sum, order) => sum + order.quantity, 0)
    const totalCO2 = processedOrders.reduce((sum, order) => sum + (order.co2_absorbed || 0), 0)
    const totalAmount = processedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header with Stats and Notifications */}
            <MyGardenHeader
                totalTrees={totalTrees}
                totalCO2={totalCO2}
                totalAmount={totalAmount}
                hasOrders={processedOrders.length > 0}
            />

            {processedOrders.length === 0 ? (
                <EmptyGarden />
            ) : (
                <PackageGrid orders={processedOrders} />
            )}
        </div>
    )
}
