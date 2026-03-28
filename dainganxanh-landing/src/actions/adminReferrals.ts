'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'

export interface ReferredOrder {
    code: string
    buyer_email: string
    buyer_name: string | null
    quantity: number
    total_amount: number
    commission: number
    created_at: string
}

export interface ReferrerSummary {
    user_id: string
    email: string
    full_name: string | null
    referral_code: string | null
    total_orders: number
    total_sales: number
    total_commission: number
    total_withdrawn: number
    available_balance: number
    orders: ReferredOrder[]
}

export async function fetchAdminReferrals(): Promise<{ data: ReferrerSummary[]; error?: string }> {
    const supabase = createServiceRoleClient()

    try {
        // Get all completed orders that have a referrer (with buyer info)
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, code, referred_by, total_amount, quantity, created_at, user_email, user_name, user_id')
            .eq('status', 'completed')
            .not('referred_by', 'is', null)
            .order('created_at', { ascending: false })

        if (ordersError) throw ordersError

        // Aggregate by referrer
        const map: Record<string, { total_orders: number; total_sales: number; total_commission: number; orders: ReferredOrder[] }> = {}
        for (const o of orders || []) {
            if (!o.referred_by) continue
            if (!map[o.referred_by]) map[o.referred_by] = { total_orders: 0, total_sales: 0, total_commission: 0, orders: [] }
            const commission = Math.round(Number(o.total_amount) * 0.1)
            map[o.referred_by].total_orders += 1
            map[o.referred_by].total_sales += Number(o.total_amount)
            map[o.referred_by].total_commission += commission
            map[o.referred_by].orders.push({
                code: o.code,
                buyer_email: o.user_email || o.user_id,
                buyer_name: o.user_name,
                quantity: o.quantity,
                total_amount: Number(o.total_amount),
                commission,
                created_at: o.created_at,
            })
        }

        if (Object.keys(map).length === 0) return { data: [] }

        // Get referrer profiles
        const referrerIds = Object.keys(map)
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, full_name, referral_code')
            .in('id', referrerIds)

        if (usersError) throw usersError

        // Get withdrawals per referrer
        const { data: withdrawals, error: wError } = await supabase
            .from('withdrawals')
            .select('user_id, amount')
            .in('user_id', referrerIds)
            .eq('status', 'approved')

        if (wError) throw wError

        const withdrawnMap: Record<string, number> = {}
        for (const w of withdrawals || []) {
            withdrawnMap[w.user_id] = (withdrawnMap[w.user_id] || 0) + Number(w.amount)
        }

        const data: ReferrerSummary[] = (users || []).map((u) => {
            const stats = map[u.id]
            const total_withdrawn = withdrawnMap[u.id] || 0
            return {
                user_id: u.id,
                email: u.email,
                full_name: u.full_name,
                referral_code: u.referral_code,
                total_orders: stats.total_orders,
                total_sales: stats.total_sales,
                total_commission: stats.total_commission,
                total_withdrawn,
                available_balance: stats.total_commission - total_withdrawn,
                orders: stats.orders,
            }
        })

        // Sort by commission desc
        data.sort((a, b) => b.total_commission - a.total_commission)

        return { data }
    } catch (err) {
        console.error('fetchAdminReferrals error:', err)
        return { data: [], error: err instanceof Error ? err.message : 'Lỗi tải dữ liệu hoa hồng' }
    }
}
