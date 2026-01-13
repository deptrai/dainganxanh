'use server'

import { createServerClient } from '@/lib/supabase/server'

export interface AnalyticsKPIs {
    totalTrees: number
    activeUsers: number
    totalRevenue: number
    carbonOffset: number
}

export interface PlantingChartData {
    month: string
    count: number
}

export interface ConversionFunnelData {
    stage: string
    count: number
    percentage: number
}

/**
 * Get analytics KPIs
 */
export async function getAnalyticsKPIs(dateRange?: { start: string; end: string }) {
    try {
        const supabase = await createServerClient()

        // Get current user and check admin
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' }
        }

        // Total trees (excluding dead)
        const { count: totalTrees, error: treesError } = await supabase
            .from('trees')
            .select('*', { count: 'exact', head: true })
            .neq('health_status', 'dead')

        if (treesError) {
            console.error('Error fetching total trees:', treesError)
        }

        // Active users (last 30 days or custom range)
        let activeUsersQuery = supabase
            .from('orders')
            .select('user_id', { count: 'exact', head: false })

        if (dateRange) {
            activeUsersQuery = activeUsersQuery
                .gte('created_at', dateRange.start)
                .lte('created_at', dateRange.end)
        } else {
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            activeUsersQuery = activeUsersQuery.gte('created_at', thirtyDaysAgo.toISOString())
        }

        const { data: activeUsersData, error: usersError } = await activeUsersQuery

        if (usersError) {
            console.error('Error fetching active users:', usersError)
        }

        // Count unique users
        const uniqueUsers = new Set(activeUsersData?.map(o => o.user_id) || [])
        const activeUsers = uniqueUsers.size

        // Total revenue
        const { data: revenueData, error: revenueError } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('status', 'completed')

        if (revenueError) {
            console.error('Error fetching revenue:', revenueError)
        }

        const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

        // Carbon offset (sum from trees)
        const { data: carbonData, error: carbonError } = await supabase
            .from('trees')
            .select('co2_absorbed')

        if (carbonError) {
            console.error('Error fetching carbon offset:', carbonError)
        }

        const carbonOffset = carbonData?.reduce((sum, tree) => sum + (tree.co2_absorbed || 0), 0) || 0

        const kpis: AnalyticsKPIs = {
            totalTrees: totalTrees || 0,
            activeUsers,
            totalRevenue,
            carbonOffset
        }

        return { data: kpis, error: null }
    } catch (error) {
        console.error('Get analytics KPIs error:', error)
        return { data: null, error: 'Failed to fetch analytics KPIs' }
    }
}

/**
 * Get planting chart data (trees planted over time)
 */
export async function getPlantingChartData(dateRange?: { start: string; end: string }) {
    try {
        const supabase = await createServerClient()

        // Get current user and check admin
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' }
        }

        // Fetch trees with planted_at dates
        let query = supabase
            .from('trees')
            .select('created_at')
            .not('created_at', 'is', null)

        if (dateRange) {
            query = query
                .gte('created_at', dateRange.start)
                .lte('created_at', dateRange.end)
        }

        const { data: trees, error } = await query

        if (error) {
            console.error('Error fetching planting data:', error)
            return { data: null, error: error.message }
        }

        // Group by month
        const monthlyData: Record<string, number> = {}

        trees?.forEach(tree => {
            const date = new Date(tree.created_at)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1
        })

        // Convert to array and sort
        const chartData: PlantingChartData[] = Object.entries(monthlyData)
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month))

        return { data: chartData, error: null }
    } catch (error) {
        console.error('Get planting chart data error:', error)
        return { data: null, error: 'Failed to fetch planting chart data' }
    }
}

/**
 * Get conversion funnel data
 */
export async function getConversionFunnelData() {
    try {
        const supabase = await createServerClient()

        // Get current user and check admin
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' }
        }

        // Count users (registered)
        const { count: registeredCount, error: usersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })

        if (usersError) {
            console.error('Error fetching users count:', usersError)
        }

        // Count orders (checkout initiated)
        const { count: checkoutCount, error: ordersError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })

        if (ordersError) {
            console.error('Error fetching orders count:', ordersError)
        }

        // Count paid orders
        const { count: paidCount, error: paidError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .in('status', ['paid', 'verified', 'assigned', 'completed'])

        if (paidError) {
            console.error('Error fetching paid orders:', paidError)
        }

        // Count completed orders
        const { count: completedCount, error: completedError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed')

        if (completedError) {
            console.error('Error fetching completed orders:', completedError)
        }

        // Calculate percentages (relative to registered users)
        const registered = registeredCount || 0
        const checkout = checkoutCount || 0
        const paid = paidCount || 0
        const completed = completedCount || 0

        const funnelData: ConversionFunnelData[] = [
            {
                stage: 'Registered',
                count: registered,
                percentage: 100
            },
            {
                stage: 'Checkout',
                count: checkout,
                percentage: registered > 0 ? (checkout / registered) * 100 : 0
            },
            {
                stage: 'Paid',
                count: paid,
                percentage: registered > 0 ? (paid / registered) * 100 : 0
            },
            {
                stage: 'Completed',
                count: completed,
                percentage: registered > 0 ? (completed / registered) * 100 : 0
            }
        ]

        return { data: funnelData, error: null }
    } catch (error) {
        console.error('Get conversion funnel data error:', error)
        return { data: null, error: 'Failed to fetch conversion funnel data' }
    }
}
