import { cookies, headers } from 'next/headers'
import { trackReferralClick } from '@/actions/referrals'

/**
 * Server component to handle referral tracking
 * This runs on the server and sets cookies before rendering
 */
export async function ReferralTracker({ refCode }: { refCode?: string }) {
    if (!refCode) return null

    try {
        // Set cookie for 30 days
        const cookieStore = await cookies()
        cookieStore.set('ref', refCode, {
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
            httpOnly: false, // Need to read in checkout
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production', // Secure in production
        })

        // Track click server-side (non-blocking, don't fail page render)
        const headersList = await headers()
        await trackReferralClick(refCode, headersList)
    } catch (error) {
        // Log error but don't crash the landing page
        console.error('Error in ReferralTracker:', error)
    }

    return null
}
