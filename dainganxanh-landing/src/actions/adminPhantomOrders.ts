'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const PRICE_PER_TREE = 260_000

async function requireAdmin() {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return { error: 'Unauthorized' as const }

    const serviceSupabase = createServiceRoleClient()
    const { data: adminUser } = await serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
        return { error: 'Forbidden' as const }
    }
    return { user, role: adminUser.role, serviceSupabase }
}

export async function fetchPhantomUsers() {
    const auth = await requireAdmin()
    if ('error' in auth) return { error: auth.error, users: [] }

    const { data } = await auth.serviceSupabase
        .from('users')
        .select('id, email, phone, is_phantom, referral_code')
        .eq('is_phantom', true)
        .order('email')

    return { users: data || [] }
}

export async function togglePhantomUser(userId: string, isPhantom: boolean) {
    const auth = await requireAdmin()
    if ('error' in auth) return { error: auth.error }

    if (auth.role !== 'super_admin') {
        return { error: 'Chỉ super_admin mới được phép thay đổi' }
    }

    const { error } = await auth.serviceSupabase
        .from('users')
        .update({ is_phantom: isPhantom })
        .eq('id', userId)

    if (error) return { error: error.message }
    return {}
}

export async function searchUsersForPhantom(searchTerm: string) {
    const auth = await requireAdmin()
    if ('error' in auth) return { error: auth.error, users: [] }

    const { data } = await auth.serviceSupabase
        .from('users')
        .select('id, email, phone, is_phantom')
        .or(`email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(10)

    return { users: data || [] }
}

function generateOrderCode(): string {
    return 'DH' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function createPhantomOrder({
    phantomUserId,
    quantity,
    userName,
}: {
    phantomUserId: string
    quantity: number
    userName: string
}) {
    const auth = await requireAdmin()
    if ('error' in auth) return { error: auth.error }

    const { data: phantomUser } = await auth.serviceSupabase
        .from('users')
        .select('id, email, is_phantom')
        .eq('id', phantomUserId)
        .single()

    if (!phantomUser?.is_phantom) {
        return { error: 'User không phải phantom user' }
    }

    const { error } = await auth.serviceSupabase
        .from('orders')
        .insert({
            code: generateOrderCode(),
            user_id: phantomUserId,
            user_email: phantomUser.email,
            user_name: userName,
            quantity,
            total_amount: quantity * PRICE_PER_TREE,
            payment_method: 'banking',
            status: 'completed',
            is_phantom: true,
            approved_by: 'system-phantom',
            approved_at: new Date().toISOString(),
        })

    if (error) return { error: error.message }

    revalidatePath('/')
    return {}
}

export async function fetchPhantomOrders(page = 1, pageSize = 20) {
    const auth = await requireAdmin()
    if ('error' in auth) return { error: auth.error, orders: [], totalCount: 0 }

    const { count } = await auth.serviceSupabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('is_phantom', true)

    const { data } = await auth.serviceSupabase
        .from('orders')
        .select('id, code, user_name, user_email, quantity, total_amount, created_at')
        .eq('is_phantom', true)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

    return { orders: data || [], totalCount: count || 0 }
}

export async function deletePhantomOrder(orderId: string) {
    const auth = await requireAdmin()
    if ('error' in auth) return { error: auth.error }

    const { data: order } = await auth.serviceSupabase
        .from('orders')
        .select('is_phantom')
        .eq('id', orderId)
        .single()

    if (!order?.is_phantom) {
        return { error: 'Chỉ có thể xóa phantom orders' }
    }

    const { error } = await auth.serviceSupabase
        .from('orders')
        .delete()
        .eq('id', orderId)

    if (error) return { error: error.message }

    revalidatePath('/')
    return {}
}
