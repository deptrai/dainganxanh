import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import AdminShell from '@/components/admin/AdminShell'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect('/auth/login')
    }

    // Check user role
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        console.error('Failed to fetch user profile:', profileError)
        redirect('/crm/dashboard')
    }

    // Only allow admin and super_admin roles
    if (!['admin', 'super_admin'].includes(profile.role)) {
        redirect('/crm/dashboard')
    }

    return <AdminShell>{children}</AdminShell>
}
