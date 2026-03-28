'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

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
