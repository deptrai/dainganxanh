'use server'

import { createClient } from '@supabase/supabase-js'

const DEV_OTP = '12345678'

/**
 * DEV ONLY: Bypass OTP verification for testing
 * TODO: Remove before production deployment
 */
export async function devBypassOTP(identifier: string, mode: 'phone' | 'email', code: string) {
    if (process.env.NODE_ENV !== 'development') {
        return { error: 'Not available in production' }
    }
    if (code !== DEV_OTP) {
        return { error: 'Invalid dev OTP' }
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        const email = mode === 'email' ? identifier : `${identifier.replace(/\+/g, '')}@phone.dev`

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
        })

        if (error) {
            console.error('Dev bypass error:', error)
            return { error: error.message }
        }

        return {
            tokenHash: data.properties?.hashed_token,
        }
    } catch (err) {
        console.error('Dev bypass error:', err)
        return { error: 'Failed to generate bypass token' }
    }
}

