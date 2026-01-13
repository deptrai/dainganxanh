import { cookies, headers } from 'next/headers'
import { trackReferralClick } from '@/actions/referrals'

/**
 * Server component to handle referral tracking
 * This runs on the server and sets cookies before rendering
 */
export async function ReferralTracker({ refCode }: { refCode?: string }) {
    if (!refCode) return null

    // Set cookie for 30 days
    const cookieStore = await cookies()
    cookieStore.set('ref', refCode, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
        httpOnly: false, // Need to read in checkout
        sameSite: 'lax',
    })

    // Track click server-side
    const headersList = await headers()
    await trackReferralClick(refCode, headersList)

    return null
}
