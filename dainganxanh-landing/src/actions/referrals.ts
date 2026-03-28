'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { headers } from 'next/headers'

// Commission rate constant (10% of order value)
const COMMISSION_RATE = 0.10

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
export async function trackReferralClick(refCode: string) {
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

        // Get IP and user agent from request headers
        const requestHeaders = await headers()
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
        const supabase = await createServerClient()

        // AUTH CHECK: Verify user is querying their own stats
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user || user.id !== userId) {
            console.error('Unauthorized access to getReferralStats')
            return null
        }

        // Get total clicks
        const { count: totalClicks, error: clicksError } = await supabase
            .from('referral_clicks')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', userId)

        if (clicksError) {
            console.error('Error getting clicks count:', clicksError)
            return null
        }

        // Get conversions + commission from orders directly (source of truth)
        const { data: convertedOrders, error: ordersError } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('referred_by', userId)
            .eq('status', 'completed')

        if (ordersError) {
            console.error('Error getting orders:', ordersError)
            return null
        }

        const conversions = convertedOrders?.length || 0

        // Calculate total commission
        const totalCommission = await convertedOrders?.reduce(async (sumPromise, order) => {
            const sum = await sumPromise
            return sum + await calculateCommission(Number(order.total_amount))
        }, Promise.resolve(0)) || 0

        // Calculate conversion rate
        const conversionRate = totalClicks && totalClicks > 0
            ? Math.round(conversions / totalClicks * 100)
            : 0

        return {
            totalClicks: totalClicks || 0,
            conversions,
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
        const supabase = await createServerClient()

        // AUTH CHECK: Verify user is querying their own conversions
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user || user.id !== userId) {
            console.error('Unauthorized access to getReferralConversions')
            return []
        }

        // Query orders directly using referred_by (works regardless of referral_clicks)
        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, code, total_amount, created_at, user_id, user_email, user_name')
            .eq('referred_by', userId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error getting conversions:', error)
            return []
        }

        // Calculate commission for each order
        return await Promise.all((orders || []).map(async (order) => ({
            id: order.id,
            clickedAt: order.created_at,
            orderCode: order.code,
            orderAmount: Number(order.total_amount || 0),
            commission: await calculateCommission(Number(order.total_amount || 0)),
            orderDate: order.created_at,
            customerEmail: order.user_email,
            customerName: order.user_name,
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
/**
 * Convert a display name or email to a clean slug for referral code.
 * Removes Vietnamese diacritics and other special characters.
 * e.g. "Nguyễn Văn A" → "nguyenvana", "john.doe@gmail.com" → "johndoe"
 */
function slugifyForReferral(input: string): string {
    return input
        .normalize('NFD')                        // decompose diacritics
        .replace(/[\u0300-\u036f]/g, '')         // remove combining marks
        .replace(/[đĐ]/g, 'd')                   // Vietnamese đ
        .replace(/[^a-zA-Z0-9]/g, '')            // keep only alphanumeric
        .toLowerCase()
        .slice(0, 20)
}

export async function regenerateReferralCode(userId: string) {
    try {
        const supabase = await createServerClient()

        // AUTH CHECK: Verify user is regenerating their own code
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user || user.id !== userId) {
            console.error('Unauthorized access to regenerateReferralCode')
            return { success: false, error: 'Unauthorized' }
        }

        // Get user profile for name
        const { data: profile } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', userId)
            .single()

        // Generate base slug from full_name → email prefix → fallback
        const rawName = profile?.full_name?.trim()
            || profile?.email?.split('@')[0]?.trim()
            || user.user_metadata?.full_name?.trim()
            || ''

        let baseCode = slugifyForReferral(rawName)
        if (baseCode.length < 3) {
            baseCode = 'user' + Math.floor(Math.random() * 100000).toString().padStart(5, '0')
        }

        // Ensure uniqueness: try baseCode, baseCode2, baseCode3, ...
        let newCode = baseCode
        let suffix = 0
        while (true) {
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('referral_code', newCode)
                .single()

            if (!existing) break
            suffix++
            newCode = baseCode + suffix
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

