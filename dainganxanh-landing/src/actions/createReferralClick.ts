'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Create a referral_click record when an order is completed/approved.
 * Ensures commission is tracked for the referrer.
 * Idempotent — skips if a converted click for this order already exists.
 */
export async function createReferralClick(
    orderId: string,
    referrerId: string,
    source: string = 'system'
): Promise<{ success: boolean; error?: string }> {
    const supabase = createServiceRoleClient()

    // Idempotency check
    const { data: existing } = await supabase
        .from('referral_clicks')
        .select('id')
        .eq('order_id', orderId)
        .eq('converted', true)
        .maybeSingle()

    if (existing) {
        return { success: true } // already tracked
    }

    const { error } = await supabase
        .from('referral_clicks')
        .insert({
            referrer_id: referrerId,
            order_id: orderId,
            converted: true,
            ip_hash: `auto-${source}`,
            user_agent: `Auto-created on order completion (${source})`,
        })

    if (error) {
        console.error('[createReferralClick] Failed:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}
