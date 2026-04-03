'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getImpersonationContext } from '@/lib/getImpersonationContext'
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
export async function trackReferralClick(refCode: string, requestHeaders: Headers) {
    try {
        const supabase = await createServerClient()

        // Find referrer by referral code
        const { data: referrer, error: referrerError } = await supabase
            .from('users')
            .select('id')
            .eq('referral_code', refCode)
            .single()

        if (referrerError || !referrer) {
            return { success: false, error: 'Invalid referral code' }
        }

        // Get IP and user agent
        const ip = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || 'unknown'
        const userAgent = requestHeaders.get('user-agent') || 'unknown'

        // Hash IP for privacy
        const ipHash = hashIP(ip)

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
        const { data: convertedOrders, error: ordersError } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('referred_by', userId)
            .eq('status', 'completed')

        if (ordersError) {
            console.error('Error getting orders:', ordersError)
            return null
        }

        // Calculate total commission
        const totalCommission = await convertedOrders?.reduce(async (sumPromise, order) => {
            const sum = await sumPromise
            return sum + await calculateCommission(Number(order.total_amount))
        }, Promise.resolve(0)) || 0

        // Calculate conversion rate
        const conversionRate = totalClicks && totalClicks > 0
            ? Math.round((conversions || 0) / totalClicks * 100)
            : 0

        return {
            totalClicks: totalClicks || 0,
            conversions: conversions || 0,
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

        // Use service role for data queries — referral_clicks and orders reference
        // OTHER users' rows, so RLS would block them with the anon client
        const supabase = createServiceRoleClient()

        const { data: conversions, error } = await supabase
            .from('referral_clicks')
            .select(`
                id,
                created_at,
                order_id,
                orders!inner (
                    code,
                    total_amount,
                    created_at
                )
            `)
            .eq('referrer_id', userId)
            .eq('converted', true)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error getting conversions:', error)
            return []
        }

        interface ConversionRecord {
            id: string
            created_at: string
            order_id: string | null
            orders: {
                code: string
                total_amount: number
                created_at: string
                users: {
                    email: string
                    full_name: string
                } | null
            } | null
        }

        // Calculate commission for each conversion
        return await Promise.all((conversions as unknown as ConversionRecord[])?.map(async (conv) => ({
            id: conv.id,
            clickedAt: conv.created_at,
            orderCode: conv.orders?.code,
            orderAmount: Number(conv.orders?.total_amount || 0),
            commission: await calculateCommission(Number(conv.orders?.total_amount || 0)),
            orderDate: conv.orders?.created_at,
            customerEmail: conv.orders?.users?.email,
            customerName: conv.orders?.users?.full_name,
        })) || [])
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

