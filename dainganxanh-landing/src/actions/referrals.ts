'use server'

import { createServerClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import { createHash } from 'crypto'

/**
 * Hash IP address for privacy compliance
 */
function hashIP(ip: string): string {
    return createHash('sha256').update(ip).digest('hex')
}

/**
 * Track a referral link click
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
 */
export async function getReferralStats(userId: string) {
    try {
        const supabase = await createServerClient()

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

        // Calculate total commission (5% of order amount)
        const COMMISSION_RATE = 0.05
        const totalCommission = convertedOrders?.reduce((sum, order) => {
            return sum + Math.round(Number(order.total_amount) * COMMISSION_RATE)
        }, 0) || 0

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
 */
export async function getReferralConversions(userId: string) {
    try {
        const supabase = await createServerClient()

        const { data: conversions, error } = await supabase
            .from('referral_clicks')
            .select(`
                id,
                created_at,
                order_id,
                orders (
                    code,
                    total_amount,
                    created_at,
                    users (
                        email,
                        full_name
                    )
                )
            `)
            .eq('referrer_id', userId)
            .eq('converted', true)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error getting conversions:', error)
            return []
        }

        // Calculate commission for each conversion
        const COMMISSION_RATE = 0.05
        return conversions?.map((conv: any) => ({
            id: conv.id,
            clickedAt: conv.created_at,
            orderCode: conv.orders?.code,
            orderAmount: Number(conv.orders?.total_amount || 0),
            commission: Math.round(Number(conv.orders?.total_amount || 0) * COMMISSION_RATE),
            orderDate: conv.orders?.created_at,
            customerEmail: conv.orders?.users?.email,
            customerName: conv.orders?.users?.full_name,
        })) || []
    } catch (error) {
        console.error('Error in getReferralConversions:', error)
        return []
    }
}

/**
 * Regenerate referral code for a user
 */
export async function regenerateReferralCode(userId: string) {
    try {
        const supabase = await createServerClient()

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
