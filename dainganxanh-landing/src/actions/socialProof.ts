'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { maskName } from '@/lib/utils/maskName'

export interface SocialProofOrder {
    maskedName: string
    quantity: number
    createdAt: string
}

export async function fetchRecentOrders(limit = 10): Promise<SocialProofOrder[]> {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
        .from('orders')
        .select('user_name, quantity, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(limit)

    return (data || []).map((o) => ({
        maskedName: maskName(o.user_name),
        quantity: o.quantity,
        createdAt: o.created_at,
    }))
}

export async function fetchActiveOrderCount(): Promise<number> {
    const supabase = createServiceRoleClient()
    const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'paid', 'manual_payment_claimed'])

    return count || 0
}
