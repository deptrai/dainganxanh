'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const DEFAULT_REFERRER_ID = '5296b70b-03bb-463b-853c-9ccff2697685' // dainganxanh

/**
 * Đảm bảo user luôn có profile trong public.users.
 * Gọi sau mỗi lần đăng nhập thành công để tự động tạo profile nếu trigger bị miss.
 *
 * Reads referral code from cookie 'ref' to set referred_by_user_id.
 */
export async function ensureUserProfile(
    userId: string,
    email: string,
    phone?: string | null
): Promise<void> {
    const supabase = createServiceRoleClient()

    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

    if (existing) return // profile đã tồn tại, không cần làm gì

    // Read referral code from cookie
    const cookieStore = await cookies()
    const referralCode = cookieStore.get('ref')?.value

    // Validate and get referrer ID
    let referredByUserId: string | null = DEFAULT_REFERRER_ID

    if (referralCode && referralCode.trim()) {
        const { data: referrer } = await supabase
            .from('users')
            .select('id')
            .ilike('referral_code', referralCode.trim())
            .single()

        if (referrer) {
            referredByUserId = referrer.id
            console.log('[ensureUserProfile] Valid referrer found:', {
                referralCode: referralCode.trim(),
                referrerId: referrer.id
            })
        } else {
            console.warn('[ensureUserProfile] Invalid referral code, using default:', {
                inputCode: referralCode.trim(),
                defaultReferrerId: DEFAULT_REFERRER_ID
            })
        }
    } else {
        console.log('[ensureUserProfile] No referral code in cookie, using default:', {
            defaultReferrerId: DEFAULT_REFERRER_ID
        })
    }

    // Profile bị thiếu — tạo lại với referral code từ email prefix
    const emailPrefix = email?.split('@')[0] ?? 'user'
    const baseCode = emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)
    const myReferralCode = (baseCode.length >= 3 ? baseCode : 'user') + Date.now().toString().slice(-5)

    const { error } = await supabase
        .from('users')
        .insert({
            id: userId,
            email,
            phone: phone ?? null,
            referral_code: myReferralCode,
            referred_by_user_id: referredByUserId, // CRITICAL: Set referrer
        })

    if (error && error.code !== '23505') {
        // 23505 = unique_violation → profile đã được tạo bởi trigger đồng thời, OK
        console.error('[ensureUserProfile] Failed to create profile:', error)
    } else if (!error) {
        console.warn('[ensureUserProfile] Auto-created missing profile for', email, {
            referredBy: referredByUserId
        })
    }
}
