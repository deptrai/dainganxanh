import { cookies } from 'next/headers'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export interface EffectiveUser {
    /** The user ID to use for data operations */
    userId: string
    email: string
    name: string
    /** Whether this is an impersonated session */
    isImpersonating: boolean
    /** The admin's real user ID (only set when impersonating) */
    adminId?: string
}

/**
 * Returns the effective user for order operations.
 * If a super_admin is impersonating a user, returns the impersonated user's info.
 * Otherwise returns the authenticated user's info.
 */
export async function getEffectiveUser(): Promise<EffectiveUser | null> {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const cookieStore = await cookies()
    const impersonateCookie = cookieStore.get('admin_impersonate')

    if (!impersonateCookie?.value) {
        return {
            userId: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            isImpersonating: false,
        }
    }

    try {
        const { userId: targetUserId, adminId } = JSON.parse(impersonateCookie.value)

        // Cookie's adminId must match the authenticated user
        if (adminId !== user.id) {
            return {
                userId: user.id,
                email: user.email || '',
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
                isImpersonating: false,
            }
        }

        // Only super_admin can perform actions on behalf of users
        const serviceSupabase = createServiceRoleClient()
        const { data: adminProfile } = await serviceSupabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (adminProfile?.role !== 'super_admin') {
            return {
                userId: user.id,
                email: user.email || '',
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
                isImpersonating: false,
            }
        }

        // Fetch impersonated user info
        const { data: targetUser } = await serviceSupabase
            .from('users')
            .select('full_name, email, phone')
            .eq('id', targetUserId)
            .single()

        return {
            userId: targetUserId,
            email: targetUser?.email || '',
            name: targetUser?.full_name || targetUser?.email?.split('@')[0] || '',
            isImpersonating: true,
            adminId: user.id,
        }
    } catch {
        return {
            userId: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            isImpersonating: false,
        }
    }
}
