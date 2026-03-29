import { cookies } from 'next/headers'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export interface ImpersonationContext {
    effectiveUserId: string
    isImpersonating: boolean
    impersonatedUserName?: string | null
}

/**
 * Returns the effective user ID for data fetching.
 * If admin has set an impersonation cookie, returns the impersonated user's ID.
 * Always verifies the actual auth user is still an admin before applying impersonation.
 */
export async function getImpersonationContext(): Promise<ImpersonationContext | null> {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const cookieStore = await cookies()
    const impersonateCookie = cookieStore.get('admin_impersonate')

    if (!impersonateCookie?.value) {
        return { effectiveUserId: user.id, isImpersonating: false }
    }

    try {
        const { userId: targetUserId, adminId } = JSON.parse(impersonateCookie.value)

        // Security: cookie's adminId must match the actual authenticated user
        if (adminId !== user.id) {
            return { effectiveUserId: user.id, isImpersonating: false }
        }

        // Security: re-verify the actual user is still an admin
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
            return { effectiveUserId: user.id, isImpersonating: false }
        }

        // Fetch target user info for display in banner
        const serviceClient = createServiceRoleClient()
        const { data: targetUser } = await serviceClient
            .from('users')
            .select('full_name, email, phone')
            .eq('id', targetUserId)
            .single()

        const displayName =
            targetUser?.full_name ||
            targetUser?.email ||
            targetUser?.phone ||
            targetUserId

        return {
            effectiveUserId: targetUserId,
            isImpersonating: true,
            impersonatedUserName: displayName,
        }
    } catch {
        return { effectiveUserId: user.id, isImpersonating: false }
    }
}
