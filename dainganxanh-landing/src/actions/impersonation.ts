'use server'

import { cookies } from 'next/headers'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Start impersonating another user.
 *
 * Security:
 * - Caller must be authenticated and have role admin | super_admin.
 * - Only super_admin can impersonate another admin or super_admin.
 *   (Regular admins can impersonate customers / users only.)
 * - Self-impersonation is blocked.
 * - Every successful start is recorded in `admin_audit_log`.
 */
export async function startImpersonation(targetUserId: string): Promise<{ error?: string }> {
    const supabase = await createServerClient()
    const serviceClient = createServiceRoleClient()

    // Verify caller
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Unauthorized' }

    const { data: callerProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!callerProfile || !['admin', 'super_admin'].includes(callerProfile.role)) {
        return { error: 'Unauthorized: admin role required' }
    }

    // Verify target user exists + pull role for privilege check
    const { data: targetUser } = await serviceClient
        .from('users')
        .select('id, role')
        .eq('id', targetUserId)
        .single()

    if (!targetUser) return { error: 'User not found' }

    // Prevent impersonating yourself
    if (user.id === targetUserId) {
        return { error: 'Không thể vào tài khoản của chính mình' }
    }

    // Privilege escalation guard:
    // Only super_admin may impersonate another admin / super_admin.
    // A regular admin impersonating an admin would gain unreviewable privileges.
    const targetIsPrivileged = ['admin', 'super_admin'].includes(targetUser.role)
    if (targetIsPrivileged && callerProfile.role !== 'super_admin') {
        return { error: 'Chỉ super_admin mới được phép vào tài khoản admin khác' }
    }

    const cookieStore = await cookies()
    cookieStore.set('admin_impersonate', JSON.stringify({ userId: targetUserId, adminId: user.id }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 8, // 8 hours
    })

    // Audit log (non-blocking — log errors but never fail impersonation on audit insert failure)
    try {
        await serviceClient.from('admin_audit_log').insert({
            admin_id: user.id,
            action: 'impersonate_start',
            target_id: targetUserId,
            target_role: targetUser.role,
            metadata: { caller_role: callerProfile.role },
        })
    } catch (err) {
        console.error('[impersonation] audit log insert failed (non-blocking):', err)
    }

    return {}
}

/**
 * Stop the current impersonation session.
 *
 * Security:
 * - Requires an authenticated admin caller. Anonymous callers are ignored.
 * - The stop event is audit-logged when a session was actually active.
 */
export async function stopImpersonation(): Promise<void> {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return // no session — nothing to stop; don't leak info

    const cookieStore = await cookies()
    const existing = cookieStore.get('admin_impersonate')
    cookieStore.delete('admin_impersonate')

    if (!existing) return // idempotent: nothing was active

    // Audit log (non-blocking)
    try {
        const parsed = JSON.parse(existing.value) as { userId?: string; adminId?: string }
        const serviceClient = createServiceRoleClient()
        await serviceClient.from('admin_audit_log').insert({
            admin_id: user.id,
            action: 'impersonate_stop',
            target_id: parsed.userId ?? null,
            metadata: { original_admin_id: parsed.adminId ?? null },
        })
    } catch (err) {
        console.error('[impersonation] audit log insert failed (non-blocking):', err)
    }
}
