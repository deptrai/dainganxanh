'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Validate a referral code and return the referrer's user ID.
 * Uses service role to bypass RLS on users table.
 */
export async function validateReferralCode(code: string): Promise<string | null> {
    if (!code?.trim()) return null

    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .ilike('referral_code', code.trim())
        .single()

    if (error || !data) return null
    return data.id
}
