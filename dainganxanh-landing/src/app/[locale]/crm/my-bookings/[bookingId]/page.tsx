import { redirect } from '@/i18n/navigation'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getScopedCrmClient } from '@/lib/supabase/scopedClient'
import { BookingDetail } from '@/components/crm/BookingDetail'
import { Metadata } from 'next'
import type { RoomBookingWithJoinedRoom } from '@/types/database.types'

interface BookingDetailPageProps {
    params: Promise<{ locale: string; bookingId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
    return { robots: { index: false } }
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
    const { locale, bookingId } = await params
    setRequestLocale(locale)

    // Lấy service client đã gắn quyền cùng effectiveUserId (hỗ trợ impersonation)
    const scoped = await getScopedCrmClient()

    if (!scoped) {
        redirect({ href: `/login?redirect=${encodeURIComponent(`/crm/my-bookings/${bookingId}`)}`, locale })
        return null
    }

    const { client: serviceClient, effectiveUserId } = scoped
    const { data: booking, error } = await serviceClient
        .from('room_bookings')
        .select(
            `
            id,
            code,
            room_id,
            guest_name,
            guest_phone,
            guest_email,
            check_in_date,
            check_out_date,
            guests_count,
            nights_count,
            total_amount,
            payment_method,
            status,
            special_requests,
            cancellation_reason,
            expires_at,
            created_at,
            rooms(name, lot_id, lots(name, region, description))
        `
        )
        .eq('id', bookingId)
        .eq('user_id', effectiveUserId)
        .single()

    if (error || !booking) {
        notFound()
    }

    const bookingRow = booking as RoomBookingWithJoinedRoom
    const roomData = Array.isArray(bookingRow.rooms) ? bookingRow.rooms[0] : bookingRow.rooms
    const lotData = roomData?.lots
    const lot = Array.isArray(lotData) ? lotData[0] : lotData

    const formattedBooking = {
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
        nightsCount: bookingRow.nights_count ?? undefined,
        totalAmount: bookingRow.total_amount,
        paymentMethod: bookingRow.payment_method,
        status: bookingRow.status,
        specialRequests: bookingRow.special_requests,
        cancellationReason: bookingRow.cancellation_reason,
        expiresAt: bookingRow.expires_at,
        createdAt: bookingRow.created_at,
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <BookingDetail booking={formattedBooking} />
        </div>
    )
}
