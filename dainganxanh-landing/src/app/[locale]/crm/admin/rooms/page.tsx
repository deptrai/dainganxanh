import type { Metadata } from 'next'
import { redirect } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import RoomCalendarClient from '@/components/admin/RoomCalendarClient'

export const metadata: Metadata = {
    title: 'Lịch phòng | Admin',
    robots: { index: false },
}

export default async function AdminRoomsPage({
    params,
}: {
    params?: Promise<{ locale?: string }>
} = {}) {
    const resolvedParams = params ? await params : undefined
    const locale = resolvedParams?.locale || 'vi'
    setRequestLocale(locale)

    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect({ href: '/auth/login', locale })
        return null
    }

    const serviceSupabase = createServiceRoleClient()
    const { data: profile } = await serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    const allowedRoles = new Set(['admin', 'super_admin', 'resort_manager'])
    if (!profile || !allowedRoles.has(profile.role)) {
        redirect({ href: '/crm/my-bookings', locale })
        return null
    }

    return <RoomCalendarClient userId={user.id} />
}
