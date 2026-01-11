import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PackageGrid from '@/components/crm/PackageGrid'
import TreeSortFilter from '@/components/crm/TreeSortFilter'
import EmptyGarden from '@/components/crm/EmptyGarden'

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
            created_at
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
    }))

    // Calculate total trees and CO2
    const totalTrees = processedOrders.reduce((sum, order) => sum + order.quantity, 0)
    const totalCO2 = processedOrders.reduce((sum, order) => sum + (order.co2_absorbed || 0), 0)

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header with Stats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-emerald-800">
                        🌳 Vườn Cây Của Tôi
                    </h1>
                    {processedOrders.length > 0 && (
                        <p className="text-gray-600 mt-1">
                            {totalTrees.toLocaleString()} cây • {totalCO2.toLocaleString()} kg CO₂/năm
                        </p>
                    )}
                </div>
                <TreeSortFilter />
            </div>

            {processedOrders.length === 0 ? (
                <EmptyGarden />
            ) : (
                <PackageGrid orders={processedOrders} />
            )}
        </div>
    )
}
