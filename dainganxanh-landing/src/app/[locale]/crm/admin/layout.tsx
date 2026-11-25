import { setRequestLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { createServerClient } from '@/lib/supabase/server'
import AdminShell from '@/components/admin/AdminShell'

export default async function AdminLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    setRequestLocale(locale)

    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect({ href: '/auth/login', locale })
        return null
    }

    // Check user role
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        console.error('Failed to fetch user profile:', profileError)
        redirect({ href: '/crm/dashboard', locale })
        return null
    }

    // Global admin / super_admin always have access
    const isGlobalAdmin = ['admin', 'super_admin'].includes(profile.role)

    if (!isGlobalAdmin) {
        // Check if the user has any lot-scoped admin assignment
        const { data: lotAssignments, error: lotError } = await supabase
            .from('admin_user_lots')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)

        if (lotError) {
            console.error('Failed to fetch lot assignments:', lotError)
            redirect({ href: '/crm/dashboard', locale })
            return null
        }

        if (!lotAssignments || lotAssignments.length === 0) {
            redirect({ href: '/crm/dashboard', locale })
            return null
        }
    }

    return <AdminShell>{children}</AdminShell>
}
