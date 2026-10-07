import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getAssignedLotIds } from '@/actions/adminRooms'
import AdminBookingDetailClient from '@/components/admin/AdminBookingDetailClient'
import type { RoomBookingWithJoinedRoom } from '@/types/database.types'

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

    const bookingRow = booking as RoomBookingWithJoinedRoom
    const roomData = Array.isArray(bookingRow.rooms) ? bookingRow.rooms[0] : bookingRow.rooms
    const lotData = roomData?.lots
    const lot = Array.isArray(lotData) ? lotData[0] : lotData

    // Kiểm tra quyền theo lô: resort_manager chỉ được xem booking thuộc lô được phân công (TD-10)
    // admin_full (admin, super_admin) có quyền xem mọi booking không phụ thuộc vào lô
    const isGlobalAdmin = profile.role === 'admin' || profile.role === 'super_admin'
    if (!isGlobalAdmin) {
        const assignedLotIds = await getAssignedLotIds(user.id)
        if (!roomData?.lot_id || !assignedLotIds.includes(roomData.lot_id)) {
            notFound()
        }
    }

    return (
        <AdminBookingDetailClient
            booking={{
                id: bookingRow.id,
                code: bookingRow.code,
                roomId: bookingRow.room_id,
                roomName: roomData?.name || '',
                lotId: roomData?.lot_id,
                lotName: lot?.name || '',
                lotRegion: lot?.region || '',
                lotDescription: lot?.description || '',
                guestName: bookingRow.guest_name,
                guestPhone: bookingRow.guest_phone,
                guestEmail: bookingRow.guest_email,
                checkInDate: bookingRow.check_in_date,
                checkOutDate: bookingRow.check_out_date,
                guestsCount: bookingRow.guests_count,
                nightsCount: bookingRow.nights_count,
                totalAmount: bookingRow.total_amount,
                paymentMethod: bookingRow.payment_method,
                status: bookingRow.status,
                specialRequests: bookingRow.special_requests,
                cancellationReason: bookingRow.cancellation_reason,
                expiresAt: bookingRow.expires_at,
                createdAt: bookingRow.created_at,
                updatedAt: bookingRow.updated_at,
            }}
        />
    )
}
