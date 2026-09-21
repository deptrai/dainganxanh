import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import AdminBookingDetailClient from '@/components/admin/AdminBookingDetailClient'

export const metadata: Metadata = {
    title: 'Chi tiết đặt phòng | Admin',
    robots: { index: false },
}

export default async function AdminBookingDetailPage({
    params,
}: {
    params: Promise<{ bookingId: string }>
}) {
    const { bookingId } = await params

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

    const { data: booking, error } = await serviceSupabase
        .from('room_bookings')
        .select(`
            id, code, room_id, guest_name, guest_phone, guest_email,
            check_in_date, check_out_date, guests_count, nights_count, total_amount,
            status, payment_method, special_requests, cancellation_reason,
            expires_at, created_at, updated_at,
            rooms(name, lot_id, lots(name, region, description))
        `)
        .eq('id', bookingId)
        .single()

    if (error || !booking) {
        notFound()
    }

    const roomData = booking.rooms as unknown as {
        name?: string
        lot_id?: string
        lots?: { name?: string; region?: string; description?: string | null } | Array<{ name?: string; region?: string; description?: string | null }> | null
    } | null
    const lotData = roomData?.lots
    const lot = Array.isArray(lotData) ? lotData[0] : lotData

    return (
        <AdminBookingDetailClient
            booking={{
                id: booking.id,
                code: booking.code,
                roomId: booking.room_id,
                roomName: roomData?.name || '',
                lotId: roomData?.lot_id,
                lotName: lot?.name || '',
                lotRegion: lot?.region || '',
                lotDescription: lot?.description || '',
                guestName: booking.guest_name,
                guestPhone: booking.guest_phone,
                guestEmail: booking.guest_email,
                checkInDate: booking.check_in_date,
                checkOutDate: booking.check_out_date,
                guestsCount: booking.guests_count,
                nightsCount: booking.nights_count,
                totalAmount: booking.total_amount,
                paymentMethod: booking.payment_method,
                status: booking.status,
                specialRequests: booking.special_requests,
                cancellationReason: booking.cancellation_reason,
                expiresAt: booking.expires_at,
                createdAt: booking.created_at,
                updatedAt: booking.updated_at,
            }}
        />
    )
}
