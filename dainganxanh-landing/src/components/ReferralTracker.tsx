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
            // NOTE: httpOnly must be false because we need to read this cookie
            // in the client-side checkout flow (BankingPayment component)
            // TODO: Refactor checkout to read cookie server-side, then enable httpOnly
            httpOnly: false,
            sameSite: 'lax', // Prevent CSRF while allowing normal navigation
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        })

        // Track click server-side (fire-and-forget, don't block page render)
        const headersList = await headers()
        trackReferralClick(refCode, headersList).catch((error) => {
            console.error('Error tracking referral click:', error)
        })
    } catch (error) {
        // Log error but don't crash the landing page
        console.error('Error in ReferralTracker:', error)
    }

    return null
}
