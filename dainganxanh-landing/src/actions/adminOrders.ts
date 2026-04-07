'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { createReferralClick } from '@/actions/createReferralClick'
import { notifyAdminApproval, notifyContractFailure } from '@/lib/utils/telegram'

async function triggerContractGeneration(orderId: string, retries = 2) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3001}`
    let lastError: string = 'All retries exhausted'
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(`${baseUrl}/api/contracts/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
                body: JSON.stringify({ orderId }),
            })
            if (res.ok) return
            lastError = `HTTP ${res.status}`
            console.error(`[Contract] attempt ${attempt + 1} failed: ${res.status}`)
        } catch (err) {
            lastError = err instanceof Error ? err.message : 'Network error'
            console.error(`[Contract] attempt ${attempt + 1} error:`, err)
        }
        if (attempt < retries) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
    }
    throw new Error(`Contract generation failed after ${retries + 1} attempts: ${lastError}`)
}

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

/**
 * Admin approve payment — marks a pending order as completed and triggers
 * the same post-payment flow as Casso webhook (referral commission, telegram, etc.)
 */
export async function approveAdminOrder(orderId: string, proofUrl?: string): Promise<{ error?: string }> {
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

    if (!['pending', 'paid', 'manual_payment_claimed'].includes(order.status)) {
        return { error: `Đơn hàng đang ở trạng thái "${order.status}", chỉ có thể duyệt đơn "pending", "paid" hoặc "manual_payment_claimed"` }
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
            ...(proofUrl ? { payment_proof_url: proofUrl } : {}),
            approved_by: user.email,
            approved_at: new Date().toISOString(),
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

    // Send Telegram notification to admin group
    notifyAdminApproval({
        orderCode: order.code || orderId.substring(0, 8),
        userName: order.user_name || 'N/A',
        userEmail: order.user_email || '',
        quantity: order.quantity,
        totalAmount: Number(order.total_amount),
        adminEmail: user.email || '',
    }).catch((err) => console.error('[Telegram] admin approval notification failed:', err))

    // Trigger contract generation in background if order has identity info (with retry)
    if (order.user_name || order.user_email) {
        triggerContractGeneration(orderId).catch((err) => {
            notifyContractFailure({
                orderCode: order.code || orderId.substring(0, 8),
                userName: order.user_name || 'N/A',
                userEmail: order.user_email || '',
                errorMessage: err instanceof Error ? err.message : 'Unknown error',
            }).catch((telegramErr) => console.error('[Telegram] notifyContractFailure failed:', telegramErr))
        })
    }

    return {}
}

