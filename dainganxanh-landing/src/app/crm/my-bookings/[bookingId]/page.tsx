import { redirect, notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getImpersonationContext } from '@/lib/getImpersonationContext'
import { BookingDetail } from '@/components/crm/BookingDetail'
import { Metadata } from 'next'

interface BookingDetailPageProps {
    params: Promise<{ bookingId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
    return { robots: { index: false } }
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
    const { bookingId } = await params
    const ctx = await getImpersonationContext()

    if (!ctx) {
        redirect(`/login?redirect=${encodeURIComponent(`/crm/my-bookings/${bookingId}`)}`)
    }

    const { effectiveUserId } = ctx

    const serviceClient = createServiceRoleClient()
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

    const roomData = booking.rooms as unknown as { name?: string; lot_id?: string; lots?: { name?: string; region?: string; description?: string | null } | Array<{ name?: string; region?: string; description?: string | null }> | null } | null
    const lotData = roomData?.lots
    const lot = Array.isArray(lotData) ? lotData[0] : lotData

    const formattedBooking = {
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
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <BookingDetail booking={formattedBooking} />
        </div>
    )
}
