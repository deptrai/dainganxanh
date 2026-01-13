'use server'

import { createServerClient } from '@/lib/supabase/server'

export interface AnalyticsKPIs {
    totalTrees: number
    activeUsers: number
    totalRevenue: number
    carbonOffset: number
    // Trend data (vs previous period)
    trends?: {
        trees: { value: number; isPositive: boolean }
        users: { value: number; isPositive: boolean }
        revenue: { value: number; isPositive: boolean }
        carbon: { value: number; isPositive: boolean }
    }
}

export interface PlantingChartData {
    month: string
    count: number
}

export interface RevenueChartData {
    month: string
    revenue: number
}

export interface ConversionFunnelData {
    stage: string
    count: number
    percentage: number
}

// Simple in-memory cache with TTL
const cache: Record<string, { data: unknown; expires: number }> = {}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached<T>(key: string): T | null {
    const cached = cache[key]
    if (cached && cached.expires > Date.now()) {
        return cached.data as T
    }
    return null
}

function setCache(key: string, data: unknown): void {
    cache[key] = { data, expires: Date.now() + CACHE_TTL }
}

/**
 * Verify user has admin role
 */
async function verifyAdminRole(supabase: Awaited<ReturnType<typeof createServerClient>>): Promise<{ user: { id: string } | null; error: string | null }> {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        return { user: null, error: 'Unauthorized' }
    }

    // Check admin role in users table
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
        return { user: null, error: 'Forbidden: Admin access required' }
    }

    return { user, error: null }
}

/**
 * Get analytics KPIs with trends
 */
export async function getAnalyticsKPIs(dateRange?: { start: string; end: string }) {
    try {
        const supabase = await createServerClient()

        // Verify admin role
        const { user, error: authError } = await verifyAdminRole(supabase)
        if (authError || !user) {
            return { data: null, error: authError || 'Unauthorized' }
        }

        // Check cache
        const cacheKey = `kpis_${dateRange?.start || 'default'}_${dateRange?.end || 'default'}`
        const cached = getCached<{ data: AnalyticsKPIs }>(cacheKey)
        if (cached) {
            return { data: cached.data, error: null }
        }

        // Calculate date ranges for trends
        const currentEnd = dateRange?.end ? new Date(dateRange.end) : new Date()
        const currentStart = dateRange?.start ? new Date(dateRange.start) : new Date(currentEnd.getTime() - 30 * 24 * 60 * 60 * 1000)
        const periodLength = currentEnd.getTime() - currentStart.getTime()
        const previousStart = new Date(currentStart.getTime() - periodLength)
        const previousEnd = new Date(currentStart.getTime())

        // Total trees (excluding dead)
        const { count: totalTrees, error: treesError } = await supabase
            .from('trees')
            .select('*', { count: 'exact', head: true })
            .neq('health_status', 'dead')

        if (treesError) {
            console.error('Error fetching total trees:', treesError)
        }

        // Previous period trees
        const { count: prevTrees } = await supabase
            .from('trees')
            .select('*', { count: 'exact', head: true })
            .neq('health_status', 'dead')
            .lte('created_at', previousEnd.toISOString())

        // Active users (current period)
        const { data: activeUsersData, error: usersError } = await supabase
            .from('orders')
            .select('user_id')
            .gte('created_at', currentStart.toISOString())
            .lte('created_at', currentEnd.toISOString())

        if (usersError) {
            console.error('Error fetching active users:', usersError)
        }

        const uniqueUsers = new Set(activeUsersData?.map(o => o.user_id) || [])
        const activeUsers = uniqueUsers.size

        // Previous period users
        const { data: prevUsersData } = await supabase
            .from('orders')
            .select('user_id')
            .gte('created_at', previousStart.toISOString())
            .lt('created_at', previousEnd.toISOString())

        const prevUniqueUsers = new Set(prevUsersData?.map(o => o.user_id) || [])
        const prevActiveUsers = prevUniqueUsers.size

        // Total revenue
        const { data: revenueData, error: revenueError } = await supabase
            .from('orders')
            .select('total_amount, created_at')
            .eq('status', 'completed')

        if (revenueError) {
            console.error('Error fetching revenue:', revenueError)
        }

        const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

        // Previous period revenue
        const prevRevenue = revenueData?.filter(o => {
            const d = new Date(o.created_at)
            return d >= previousStart && d < previousEnd
        }).reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

        // Carbon offset (sum from trees)
        const { data: carbonData, error: carbonError } = await supabase
            .from('trees')
            .select('co2_absorbed')

        if (carbonError) {
            console.error('Error fetching carbon offset:', carbonError)
        }

        const carbonOffset = carbonData?.reduce((sum, tree) => sum + (tree.co2_absorbed || 0), 0) || 0

        // Calculate trends
        const calcTrend = (current: number, previous: number) => {
            if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current > 0 }
            const change = ((current - previous) / previous) * 100
            return { value: Math.abs(change), isPositive: change >= 0 }
        }

        const kpis: AnalyticsKPIs = {
            totalTrees: totalTrees || 0,
            activeUsers,
            totalRevenue,
            carbonOffset,
            trends: {
                trees: calcTrend(totalTrees || 0, prevTrees || 0),
                users: calcTrend(activeUsers, prevActiveUsers),
                revenue: calcTrend(totalRevenue, prevRevenue),
                carbon: calcTrend(carbonOffset, 0) // Carbon doesn't have previous period data
            }
        }

        // Cache result
        setCache(cacheKey, { data: kpis })

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

        // Verify admin role
        const { error: authError } = await verifyAdminRole(supabase)
        if (authError) {
            return { data: null, error: authError }
        }

        // Check cache
        const cacheKey = `planting_${dateRange?.start || 'default'}_${dateRange?.end || 'default'}`
        const cached = getCached<PlantingChartData[]>(cacheKey)
        if (cached) {
            return { data: cached, error: null }
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

        // Cache result
        setCache(cacheKey, chartData)

        return { data: chartData, error: null }
    } catch (error) {
        console.error('Get planting chart data error:', error)
        return { data: null, error: 'Failed to fetch planting chart data' }
    }
}

/**
 * Get revenue chart data (revenue by month)
 */
export async function getRevenueChartData(dateRange?: { start: string; end: string }) {
    try {
        const supabase = await createServerClient()

        // Verify admin role
        const { error: authError } = await verifyAdminRole(supabase)
        if (authError) {
            return { data: null, error: authError }
        }

        // Check cache
        const cacheKey = `revenue_${dateRange?.start || 'default'}_${dateRange?.end || 'default'}`
        const cached = getCached<RevenueChartData[]>(cacheKey)
        if (cached) {
            return { data: cached, error: null }
        }

        // Fetch completed orders with amounts
        let query = supabase
            .from('orders')
            .select('total_amount, created_at')
            .eq('status', 'completed')

        if (dateRange) {
            query = query
                .gte('created_at', dateRange.start)
                .lte('created_at', dateRange.end)
        }

        const { data: orders, error } = await query

        if (error) {
            console.error('Error fetching revenue data:', error)
            return { data: null, error: error.message }
        }

        // Group by month
        const monthlyData: Record<string, number> = {}

        orders?.forEach(order => {
            const date = new Date(order.created_at)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (order.total_amount || 0)
        })

        // Convert to array and sort
        const chartData: RevenueChartData[] = Object.entries(monthlyData)
            .map(([month, revenue]) => ({ month, revenue }))
            .sort((a, b) => a.month.localeCompare(b.month))

        // Cache result
        setCache(cacheKey, chartData)

        return { data: chartData, error: null }
    } catch (error) {
        console.error('Get revenue chart data error:', error)
        return { data: null, error: 'Failed to fetch revenue chart data' }
    }
}

/**
 * Get conversion funnel data
 */
export async function getConversionFunnelData() {
    try {
        const supabase = await createServerClient()

        // Verify admin role
        const { error: authError } = await verifyAdminRole(supabase)
        if (authError) {
            return { data: null, error: authError }
        }

        // Check cache
        const cacheKey = 'funnel_default'
        const cached = getCached<ConversionFunnelData[]>(cacheKey)
        if (cached) {
            return { data: cached, error: null }
        }

        // Try to get landing page views (if table exists)
        let landingCount = 0
        try {
            const { count } = await supabase
                .from('page_views')
                .select('*', { count: 'exact', head: true })
                .eq('path', '/')
            landingCount = count || 0
        } catch {
            // Table doesn't exist, use estimate
            landingCount = 0
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

        // Calculate percentages (relative to landing or registered)
        const landing = landingCount
        const registered = registeredCount || 0
        const checkout = checkoutCount || 0
        const paid = paidCount || 0
        const completed = completedCount || 0

        // Use landing as base if available, otherwise registered
        const baseCount = landing > 0 ? landing : registered
        const calcPercentage = (count: number) => baseCount > 0 ? (count / baseCount) * 100 : 0

        const funnelData: ConversionFunnelData[] = []

        // Only add landing if we have data
        if (landing > 0) {
            funnelData.push({
                stage: 'Landing',
                count: landing,
                percentage: 100
            })
        }

        funnelData.push(
            {
                stage: 'Registered',
                count: registered,
                percentage: landing > 0 ? calcPercentage(registered) : 100
            },
            {
                stage: 'Checkout',
                count: checkout,
                percentage: calcPercentage(checkout)
            },
            {
                stage: 'Paid',
                count: paid,
                percentage: calcPercentage(paid)
            },
            {
                stage: 'Completed',
                count: completed,
                percentage: calcPercentage(completed)
            }
        )

        // Cache result
        setCache(cacheKey, funnelData)

        return { data: funnelData, error: null }
    } catch (error) {
        console.error('Get conversion funnel data error:', error)
        return { data: null, error: 'Failed to fetch conversion funnel data' }
    }
}
