'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Đảm bảo user luôn có profile trong public.users.
 * Gọi sau mỗi lần đăng nhập thành công để tự động tạo profile nếu trigger bị miss.
 */
export async function ensureUserProfile(userId: string, email: string, phone?: string | null): Promise<void> {
    const supabase = createServiceRoleClient()

    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

    if (existing) return // profile đã tồn tại, không cần làm gì

    // Profile bị thiếu — tạo lại với referral code từ email prefix
    const emailPrefix = email?.split('@')[0] ?? 'user'
    const baseCode = emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)
    const referralCode = (baseCode.length >= 3 ? baseCode : 'user') + Date.now().toString().slice(-5)

    const { error } = await supabase
        .from('users')
        .insert({
            id: userId,
            email,
            phone: phone ?? null,
            referral_code: referralCode,
        })

    if (error && error.code !== '23505') {
        // 23505 = unique_violation → profile đã được tạo bởi trigger đồng thời, OK
        console.error('[ensureUserProfile] Failed to create profile:', error)
    } else if (!error) {
        console.warn('[ensureUserProfile] Auto-created missing profile for', email)
    }
}
