'use server'

import { cookies } from 'next/headers'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function startImpersonation(targetUserId: string): Promise<{ error?: string }> {
    const supabase = await createServerClient()
    const serviceClient = createServiceRoleClient()

    // Verify caller is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return { error: 'Unauthorized: admin role required' }
    }

    // Verify target user exists
    const { data: targetUser } = await serviceClient
        .from('users')
        .select('id')
        .eq('id', targetUserId)
        .single()

    if (!targetUser) return { error: 'User not found' }

    // Prevent impersonating yourself
    if (user.id === targetUserId) return { error: 'Không thể vào tài khoản của chính mình' }

    const cookieStore = await cookies()
    cookieStore.set('admin_impersonate', JSON.stringify({ userId: targetUserId, adminId: user.id }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 8, // 8 hours
    })

    return {}
}

export async function stopImpersonation(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete('admin_impersonate')
}
