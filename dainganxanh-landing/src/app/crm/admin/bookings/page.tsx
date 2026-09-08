import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import AdminBookingClient from '@/components/admin/AdminBookingClient'

export const metadata: Metadata = {
    title: 'Quản lý đặt phòng | Admin',
    robots: { index: false },
}

export default async function AdminBookingsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
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

    const { page, status, search, dateFrom, dateTo, lotId } = await searchParams
    const initialFilters = {
        status: typeof status === 'string' ? status : undefined,
        search: typeof search === 'string' ? search : undefined,
        dateFrom: typeof dateFrom === 'string' ? dateFrom : undefined,
        dateTo: typeof dateTo === 'string' ? dateTo : undefined,
        lotId: typeof lotId === 'string' ? lotId : undefined,
    }

    return (
        <AdminBookingClient
            userId={user.id}
            initialPage={Math.max(1, Number(page) || 1)}
            initialFilters={initialFilters}
        />
    )
}
