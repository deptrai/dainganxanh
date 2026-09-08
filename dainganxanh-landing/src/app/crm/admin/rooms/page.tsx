import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import RoomCalendarClient from '@/components/admin/RoomCalendarClient'

export const metadata: Metadata = {
    title: 'Lịch phòng | Admin',
    robots: { index: false },
}

export default async function AdminRoomsPage() {
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect('/auth/login')
    }

    const serviceSupabase = createServiceRoleClient()
    const { data: profile } = await serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    const allowedRoles = new Set(['admin', 'super_admin', 'resort_manager'])
    if (!profile || !allowedRoles.has(profile.role)) {
        redirect('/crm/my-bookings')
    }

    return <RoomCalendarClient userId={user.id} />
}