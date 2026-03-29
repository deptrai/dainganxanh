'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { notifyReferralAssigned } from '@/lib/utils/telegram'

export interface AdminUser {
    id: string
    email: string | null
    phone: string | null
    full_name: string | null
    role: string
    referral_code: string
    created_at: string
    orders_count?: number
}

export interface UserFilters {
    search?: string
    role?: string
}

export interface FetchUsersResult {
    users: AdminUser[]
    totalCount: number
    error?: string
}

export async function fetchAdminUsers(
    filters: UserFilters,
    page: number,
    pageSize: number
): Promise<FetchUsersResult> {
    const supabase = await createServerClient()
    const serviceSupabase = createServiceRoleClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { users: [], totalCount: 0, error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return { users: [], totalCount: 0, error: 'Unauthorized: admin role required' }
    }

    try {
        let query = serviceSupabase
            .from('users')
            .select('id, email, phone, full_name, role, referral_code, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1)

        if (filters.role && filters.role !== 'all') {
            query = query.eq('role', filters.role)
        }

        if (filters.search) {
            const s = filters.search.trim()
            query = query.or(`email.ilike.%${s}%,full_name.ilike.%${s}%,phone.ilike.%${s}%`)
        }

        const { data, count, error } = await query
        if (error) throw error

        // Fetch order counts per user
        const userIds = (data || []).map((u) => u.id)
        let orderCountMap: Record<string, number> = {}

        if (userIds.length > 0) {
            const { data: orderCounts } = await serviceSupabase
                .from('orders')
                .select('user_id')
                .in('user_id', userIds)
                .in('status', ['completed', 'assigned'])

            orderCountMap = (orderCounts || []).reduce((acc: Record<string, number>, o) => {
                acc[o.user_id] = (acc[o.user_id] || 0) + 1
                return acc
            }, {})
        }

        const users: AdminUser[] = (data || []).map((u) => ({
            ...u,
            orders_count: orderCountMap[u.id] || 0,
        }))

        return { users, totalCount: count || 0 }
    } catch (err) {
        console.error('fetchAdminUsers error:', err)
        return {
            users: [],
            totalCount: 0,
            error: err instanceof Error ? err.message : 'Không thể tải danh sách người dùng',
        }
    }
}

export async function updateUserRole(
    targetUserId: string,
    newRole: 'user' | 'admin' | 'super_admin'
): Promise<{ error?: string }> {
    const supabase = await createServerClient()
    const serviceSupabase = createServiceRoleClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return { error: 'Unauthorized: admin role required' }
    }

    // Only super_admin can set super_admin
    if (newRole === 'super_admin' && profile.role !== 'super_admin') {
        return { error: 'Chỉ super_admin mới có thể gán role super_admin' }
    }

    // Prevent demoting yourself
    if (targetUserId === user.id && newRole === 'user') {
        return { error: 'Không thể tự hạ quyền của mình' }
    }

    const { error } = await serviceSupabase
        .from('users')
        .update({ role: newRole })
        .eq('id', targetUserId)

    if (error) return { error: error.message }
    return {}
}

export interface AssignReferralResult {
    error?: string
    retroOrders?: number
    retroCommission?: number
}

/**
 * Admin: Gán mã giới thiệu cho user chưa có, đồng thời cộng hoa hồng hồi tố
 * cho tất cả đơn hàng completed/assigned trước đây chưa có referred_by.
 */
export async function assignUserReferral(
    targetUserId: string,
    refCode: string
): Promise<AssignReferralResult> {
    const supabase = await createServerClient()
    const serviceSupabase = createServiceRoleClient()

    // Auth + role check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase
        .from('users')
        .select('role, email, full_name')
        .eq('id', user.id)
        .single()

    if (!adminProfile || !['admin', 'super_admin'].includes(adminProfile.role)) {
        return { error: 'Unauthorized: admin role required' }
    }

    // Find referrer by refCode
    const { data: referrer, error: referrerError } = await serviceSupabase
        .from('users')
        .select('id, email, full_name, referral_code')
        .ilike('referral_code', refCode.trim())
        .single()

    if (referrerError || !referrer) {
        return { error: `Không tìm thấy mã giới thiệu: ${refCode}` }
    }

    // Prevent self-referral
    if (referrer.id === targetUserId) {
        return { error: 'Không thể tự giới thiệu bản thân' }
    }

    // Get target user info
    const { data: targetUser } = await serviceSupabase
        .from('users')
        .select('email, full_name')
        .eq('id', targetUserId)
        .single()

    // Find all past orders without referred_by
    const { data: pastOrders, error: ordersError } = await serviceSupabase
        .from('orders')
        .select('id, code, total_amount, status')
        .eq('user_id', targetUserId)
        .is('referred_by', null)
        .in('status', ['completed', 'assigned'])

    if (ordersError) return { error: ordersError.message }

    const retroOrders = pastOrders?.length || 0
    let retroCommission = 0

    // Retroactively update all past orders + create referral_clicks records
    if (retroOrders > 0) {
        // Update orders.referred_by
        const { error: updateOrdersError } = await serviceSupabase
            .from('orders')
            .update({ referred_by: referrer.id })
            .in('id', pastOrders!.map((o) => o.id))

        if (updateOrdersError) return { error: updateOrdersError.message }

        // Calculate retroactive commission (10%)
        retroCommission = pastOrders!.reduce((sum, o) => {
            return sum + Math.round(Number(o.total_amount) * 0.1)
        }, 0)

        // Create referral_clicks records for each converted order
        const clickRecords = pastOrders!.map((o) => ({
            referrer_id: referrer.id,
            ip_hash: `retro-admin-${o.id}`,
            user_agent: `[Admin retroactive] assigned by ${adminProfile.email || user.id}`,
            converted: true,
            order_id: o.id,
        }))

        await serviceSupabase.from('referral_clicks').insert(clickRecords)
    }

    // Send Telegram notification (non-blocking)
    notifyReferralAssigned({
        targetEmail: targetUser?.email || targetUserId,
        targetName: targetUser?.full_name,
        referrerEmail: referrer.email,
        referrerName: referrer.full_name,
        refCode: referrer.referral_code,
        retroOrders,
        retroCommission,
        adminEmail: adminProfile.email || user.id,
    }).catch((err) => console.error('[Telegram] notifyReferralAssigned failed:', err))

    return { retroOrders, retroCommission }
}

