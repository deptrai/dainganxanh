'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export interface OrderFilters {
    status?: string
    search?: string
    dateFrom?: string
    dateTo?: string
}

export interface FetchOrdersResult {
    orders: any[]
    totalCount: number
    error?: string
}

export async function fetchAdminOrders(
    filters: OrderFilters,
    page: number,
    pageSize: number
): Promise<FetchOrdersResult> {
    const serviceSupabase = createServiceRoleClient()

    try {
        // If searching by email, find matching user_ids using service role (bypasses RLS)
        let searchUserIds: string[] | null = null
        if (filters.search) {
            const searchTerm = filters.search.trim()
            if (searchTerm.includes('@')) {
                const { data: matchedUsers } = await serviceSupabase
                    .from('users')
                    .select('id')
                    .ilike('email', `%${searchTerm}%`)
                searchUserIds = (matchedUsers || []).map((u: any) => u.id)
            }
        }

        // Count query — use service role to bypass RLS (admin sees all orders)
        let countQuery = serviceSupabase
            .from('orders')
            .select('id', { count: 'exact', head: true })

        if (filters.status && filters.status !== 'all') {
            countQuery = countQuery.eq('status', filters.status)
        }
        if (filters.dateFrom) {
            countQuery = countQuery.gte('created_at', filters.dateFrom)
        }
        if (filters.dateTo) {
            countQuery = countQuery.lte('created_at', filters.dateTo)
        }
        if (filters.search) {
            const searchTerm = filters.search.trim()
            if (searchUserIds !== null) {
                countQuery = searchUserIds.length > 0
                    ? countQuery.in('user_id', searchUserIds)
                    : countQuery.eq('user_id', 'no-match')
            } else {
                countQuery = countQuery.or(`id.ilike.%${searchTerm}%,order_code.ilike.%${searchTerm}%`)
            }
        }

        const { count } = await countQuery
        const totalCount = count || 0

        // Data query — use service role to bypass RLS (admin sees all orders)
        let query = serviceSupabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1)

        if (filters.status && filters.status !== 'all') {
            query = query.eq('status', filters.status)
        }
        if (filters.search) {
            const searchTerm = filters.search.trim()
            if (searchUserIds !== null) {
                query = searchUserIds.length > 0
                    ? query.in('user_id', searchUserIds)
                    : query.eq('user_id', 'no-match')
            } else {
                query = query.or(`id.ilike.%${searchTerm}%,order_code.ilike.%${searchTerm}%`)
            }
        }
        if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom)
        }
        if (filters.dateTo) {
            query = query.lte('created_at', filters.dateTo)
        }

        const { data: ordersData, error: fetchError } = await query
        if (fetchError) throw fetchError

        // Fetch user details using service role to bypass RLS on users table
        const userIds = [...new Set((ordersData || []).map((o: any) => o.user_id).filter(Boolean))]
        // Fetch referrer IDs as well
        const referrerIds = [...new Set((ordersData || []).map((o: any) => o.referred_by).filter(Boolean))]
        const allUserIds = [...new Set([...userIds, ...referrerIds])]

        let usersMap: Record<string, { email?: string; phone?: string; referral_code?: string }> = {}

        if (allUserIds.length > 0) {
            const { data: usersData } = await serviceSupabase
                .from('users')
                .select('id, email, phone, referral_code')
                .in('id', allUserIds)

            usersMap = (usersData || []).reduce((acc: any, user: any) => {
                acc[user.id] = {
                    email: user.email,
                    phone: user.phone,
                    referral_code: user.referral_code
                }
                return acc
            }, {})
        }

        const orders = (ordersData || []).map((order: any) => ({
            ...order,
            user_email: usersMap[order.user_id]?.email,
            user_phone: usersMap[order.user_id]?.phone,
            referrer: order.referred_by ? {
                email: usersMap[order.referred_by]?.email,
                referral_code: usersMap[order.referred_by]?.referral_code
            } : null,
        }))

        return { orders, totalCount }
    } catch (err) {
        console.error('fetchAdminOrders error:', err)
        return {
            orders: [],
            totalCount: 0,
            error: err instanceof Error ? err.message : 'Không thể tải danh sách đơn hàng',
        }
    }
}

export async function verifyAdminOrder(orderId: string): Promise<{ error?: string }> {
    const supabase = await createServerClient()

    const { error } = await supabase
        .from('orders')
        .update({
            status: 'verified',
            verified_at: new Date().toISOString(),
        })
        .eq('id', orderId)

    if (error) {
        console.error('verifyAdminOrder error:', error)
        return { error: error.message }
    }

    return {}
}

