'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { createReferralClick } from '@/actions/createReferralClick'

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
    const serviceSupabase = createServiceRoleClient()

    // Get current order status before updating
    const { data: order } = await serviceSupabase
        .from('orders')
        .select('id, status')
        .eq('id', orderId)
        .single()

    const wasManualPaymentClaimed = order?.status === 'manual_payment_claimed'

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

    // Trigger contract generation for manual payment claimed orders
    if (wasManualPaymentClaimed) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3001}`
        fetch(`${baseUrl}/api/contracts/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
            body: JSON.stringify({ orderId }),
        }).catch((err) => console.error('[Contract] generation trigger failed:', err))
    }

    return {}
}

/**
 * Admin approve payment — marks a pending order as completed and triggers
 * the same post-payment flow as Casso webhook (referral commission, telegram, etc.)
 */
export async function approveAdminOrder(orderId: string): Promise<{ error?: string }> {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Unauthorized' }
    }

    const serviceSupabase = createServiceRoleClient()

    // Check admin role
    const { data: adminUser } = await serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
        return { error: 'Forbidden: admin role required' }
    }

    // Get order details
    const { data: order, error: orderError } = await serviceSupabase
        .from('orders')
        .select('id, code, user_id, user_email, user_name, quantity, total_amount, status, referred_by')
        .eq('id', orderId)
        .single()

    if (orderError || !order) {
        return { error: 'Đơn hàng không tồn tại' }
    }

    if (order.status !== 'pending') {
        return { error: `Đơn hàng đang ở trạng thái "${order.status}", chỉ có thể duyệt đơn "pending"` }
    }

    // Safety net: if referred_by is null, look up from users.referred_by_user_id
    let referredBy = order.referred_by
    if (!referredBy) {
        const { data: profile } = await serviceSupabase
            .from('users')
            .select('referred_by_user_id')
            .eq('id', order.user_id)
            .single()
        referredBy = profile?.referred_by_user_id ?? null

        // Update order with correct referred_by
        if (referredBy) {
            await serviceSupabase
                .from('orders')
                .update({ referred_by: referredBy })
                .eq('id', orderId)
        }
    }

    // Update order status to completed
    const { error: updateError } = await serviceSupabase
        .from('orders')
        .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

    if (updateError) {
        console.error('approveAdminOrder update error:', updateError)
        return { error: updateError.message }
    }

    // Create referral_click for commission tracking
    if (referredBy) {
        await createReferralClick(orderId, referredBy, 'admin-approve')
    }

    return {}
}

