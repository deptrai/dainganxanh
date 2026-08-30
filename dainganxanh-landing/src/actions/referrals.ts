'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getImpersonationContext } from '@/lib/getImpersonationContext'
import { COMMISSION_ELIGIBLE_ORDER_STATUSES } from '@/lib/constants'
import { createHash } from 'crypto'

// Commission rate constant (10% of order value)
const COMMISSION_RATE = 0.1

/**
 * Centralized commission calculation to ensure consistency
 * Note: Must be async because this file uses 'use server'
 */
export async function calculateCommission(orderAmount: number): Promise<number> {
    return Math.round(Number(orderAmount) * COMMISSION_RATE)
}

/**
 * Hash IP address for privacy compliance
 */
function hashIP(ip: string): string {
    return createHash('sha256').update(ip).digest('hex')
}

/**
 * Track a referral link click with deduplication
 */
export async function trackReferralClick(refCode: string, requestHeaders?: Headers) {
    try {
        const supabase = await createServerClient()

        // Find referrer by referral code (case-insensitive to match cookie normalization)
        const { data: referrer, error: referrerError } = await supabase
            .from('users')
            .select('id')
            .ilike('referral_code', refCode)
            .single()

        if (referrerError || !referrer) {
            return { success: false, error: 'Invalid referral code' }
        }

        // Get IP and user agent
        const rawIp = requestHeaders?.get('x-forwarded-for') || requestHeaders?.get('x-real-ip') || ''
        const userAgent = requestHeaders?.get('user-agent') || 'unknown'

        // Hash IP for privacy. If no IP header is present (common behind some proxies),
        // fall back to a combination of user agent and a short timestamp bucket so
        // distinct visitors behind the same gateway are not collapsed into one hash.
        const ipSource = rawIp || `${userAgent}-${Math.floor(Date.now() / 1000 / 60 / 10)}`
        const ipHash = hashIP(ipSource)

        // DEDUPLICATION: Check if this IP already clicked this referrer's link in the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
        const { data: existingClick } = await supabase
            .from('referral_clicks')
            .select('id')
            .eq('referrer_id', referrer.id)
            .eq('ip_hash', ipHash)
            .gte('created_at', oneHourAgo)
            .single()

        if (existingClick) {
            // Already tracked within the last hour - skip duplicate
            return { success: true, duplicate: true }
        }

        // Insert click record
        const { error: insertError } = await supabase
            .from('referral_clicks')
            .insert({
                referrer_id: referrer.id,
                ip_hash: ipHash,
                user_agent: userAgent,
            })

        if (insertError) {
            console.error('Error tracking referral click:', insertError)
            return { success: false, error: 'Failed to track click' }
        }

        return { success: true }
    } catch (error) {
        console.error('Error in trackReferralClick:', error)
        return { success: false, error: 'Internal error' }
    }
}

/**
 * Get referral statistics for a user
 * @param userId - Must match authenticated user ID
 */
export async function getReferralStats(userId: string) {
    try {
        // Auth check: verify user is querying their own stats (or admin impersonating)
        const ctx = await getImpersonationContext()
        const isImpersonating = ctx?.isImpersonating && ctx.effectiveUserId === userId

        if (!isImpersonating) {
            const authClient = await createServerClient()
            const { data: { user }, error: authError } = await authClient.auth.getUser()
            if (authError || !user || user.id !== userId) {
                console.error('Unauthorized access to getReferralStats')
                return null
            }
        }

        // Use service role for data queries — referral_clicks and orders reference
        // OTHER users' rows, so RLS would block them with the anon client
        const supabase = createServiceRoleClient()

        // Get total clicks
        const { count: totalClicks, error: clicksError } = await supabase
            .from('referral_clicks')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', userId)

        if (clicksError) {
            console.error('Error getting clicks count:', clicksError)
            return null
        }

        // Get conversions count
        const { count: conversions, error: conversionsError } = await supabase
            .from('referral_clicks')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', userId)
            .eq('converted', true)

        if (conversionsError) {
            console.error('Error getting conversions count:', conversionsError)
            return null
        }

        // Get total commission from converted orders
        // Include all post-payment statuses, not just 'completed', so commission is
        // not silently dropped when the order transitions through 'paid'/'verified'/'assigned'.
        const { data: convertedOrders, error: ordersError } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('referred_by', userId)
            .in('status', COMMISSION_ELIGIBLE_ORDER_STATUSES)

        if (ordersError) {
            console.error('Error getting orders:', ordersError)
            return null
        }

        // Calculate total commission
        const totalCommission = await convertedOrders?.reduce(async (sumPromise, order) => {
            const sum = await sumPromise
            return sum + await calculateCommission(Number(order.total_amount))
        }, Promise.resolve(0)) || 0

        // Calculate conversion metrics
        const conversionCount = convertedOrders?.length || 0
        const effectiveClicks = Math.max(totalClicks || 0, conversionCount)
        const conversionRate = effectiveClicks > 0
            ? Math.round((conversionCount / effectiveClicks) * 100)
            : 0

        return {
            totalClicks: effectiveClicks,
            conversions: conversionCount,
            commission: totalCommission,
            conversionRate,
        }
    } catch (error) {
        console.error('Error in getReferralStats:', error)
        return null
    }
}

/**
 * Get list of referral conversions with order details
 * @param userId - Must match authenticated user ID
 */
export async function getReferralConversions(userId: string) {
    try {
        // Auth check: verify user is querying their own conversions (or admin impersonating)
        const ctx = await getImpersonationContext()
        const isImpersonating = ctx?.isImpersonating && ctx.effectiveUserId === userId

        if (!isImpersonating) {
            const authClient = await createServerClient()
            const { data: { user }, error: authError } = await authClient.auth.getUser()
            if (authError || !user || user.id !== userId) {
                console.error('Unauthorized access to getReferralConversions')
                return []
            }
        }

        // Use service role for data queries — orders reference
        // OTHER users' rows, so RLS would block them with the anon client
        const supabase = createServiceRoleClient()

        // Fetch converted orders directly from orders table to ensure all eligible
        // referred orders appear, even if referral_clicks record was omitted.
        const { data: convertedOrders, error } = await supabase
            .from('orders')
            .select('id, code, total_amount, created_at, user_email, user_name, user_id')
            .eq('referred_by', userId)
            .in('status', COMMISSION_ELIGIBLE_ORDER_STATUSES)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error getting conversions:', error)
            return []
        }

        // Calculate commission for each conversion
        return await Promise.all((convertedOrders || []).map(async (order) => ({
            id: order.id,
            clickedAt: order.created_at,
            orderCode: order.code,
            orderAmount: Number(order.total_amount || 0),
            commission: await calculateCommission(Number(order.total_amount || 0)),
            orderDate: order.created_at,
            customerEmail: order.user_email || undefined,
            customerName: order.user_name || undefined,
        })))
    } catch (error) {
        console.error('Error in getReferralConversions:', error)
        return []
    }
}

/**
 * Regenerate referral code for a user
 * @param userId - Must match authenticated user ID
 */
export async function regenerateReferralCode(userId: string) {
    try {
        const supabase = await createServerClient()

        // AUTH CHECK: Verify user is regenerating their own code
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user || user.id !== userId) {
            console.error('Unauthorized access to regenerateReferralCode')
            return { success: false, error: 'Unauthorized' }
        }

        // Generate new unique code (8 characters alphanumeric)
        const generateCode = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude similar chars
            let code = ''
            for (let i = 0; i < 8; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length))
            }
            return code
        }

        let newCode = generateCode()
        let attempts = 0
        const maxAttempts = 10

        // Ensure code is unique
        while (attempts < maxAttempts) {
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('referral_code', newCode)
                .single()

            if (!existing) break

            newCode = generateCode()
            attempts++
        }

        if (attempts >= maxAttempts) {
            return { success: false, error: 'Failed to generate unique code' }
        }

        // Update user's referral code
        const { error: updateError } = await supabase
            .from('users')
            .update({ referral_code: newCode })
            .eq('id', userId)

        if (updateError) {
            console.error('Error updating referral code:', updateError)
            return { success: false, error: 'Failed to update code' }
        }

        return { success: true, code: newCode }
    } catch (error) {
        console.error('Error in regenerateReferralCode:', error)
        return { success: false, error: 'Internal error' }
    }
}

