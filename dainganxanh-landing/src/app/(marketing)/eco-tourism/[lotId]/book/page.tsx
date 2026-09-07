import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { Clock, AlertCircle } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getBlockingBookings } from '@/lib/eco-tourism/availability'
import BookingPageClient from './BookingPageClient'

export const dynamic = 'force-dynamic'

interface Room {
    id: string
    name: string
    description: string | null
    capacity: number
    amenities: string[] | null
    price_per_night: number
    images: string[] | null
    status: 'active' | 'inactive' | 'maintenance'
    lot_id: string
}

interface Lot {
    id: string
    name: string
    region: string
    description: string | null
    location_lat: number | null
    location_lng: number | null
    images: string[] | null
}

interface RoomWithLot extends Room {
    lots: Lot | null
}

interface BookingPageProps {
    params: Promise<{ lotId: string }>
    searchParams: Promise<{
        room_id?: string | string[]
        check_in?: string | string[]
        check_out?: string | string[]
        code?: string | string[]
    }>
}

function isValidDate(value: string | undefined): value is string {
    if (!value) return false
    return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
    const { lotId } = await params
    const supabase = createServiceRoleClient()
    const { data: lot } = await supabase
        .from('lots')
        .select('name')
        .eq('id', lotId)
        .maybeSingle()

    return {
        title: lot ? `Đặt phòng — ${lot.name}` : 'Đặt phòng — Đại Ngàn Xanh',
        description: 'Đặt phòng nghỉ dưỡng tại vườn Dó Đen Đại Ngàn Xanh.',
        alternates: { canonical: `https://dainganxanh.com.vn/eco-tourism/${lotId}/book` },
        robots: { index: false, follow: false },
    }
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
    const { lotId } = await params
    const searchParamsResolved = await searchParams
    const rawCode = Array.isArray(searchParamsResolved.code)
        ? searchParamsResolved.code[0]
        : searchParamsResolved.code
    const codeParam = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : undefined

    const supabase = createServiceRoleClient()

    // Handle resume/revisit booking via code query param
    if (codeParam) {
        if (!/^BK[A-Z0-9]{6}$/.test(codeParam)) {
            redirect(`/eco-tourism/${encodeURIComponent(lotId)}`)
            return null
        }

        const { data: rawBooking, error: bookingError } = await supabase
            .from('room_bookings')
            .select('id, code, status, expires_at, total_amount, check_in_date, check_out_date, nights_count, guests_count, room_id, rooms(id, name, description, capacity, amenities, price_per_night, images, status, lot_id, lots(id, name, region, description, location_lat, location_lng, images))')
            .eq('code', codeParam)
            .maybeSingle()

        if (bookingError || !rawBooking) {
            redirect(`/eco-tourism/${encodeURIComponent(lotId)}`)
            return null
        }

        const roomsData = rawBooking.rooms as unknown
        const room = (Array.isArray(roomsData) ? roomsData[0] : roomsData) as (RoomWithLot & { lots: Lot | null }) | null
        const bookingLotId = room?.lot_id

        // Guard against mismatched lot_id
        if (bookingLotId && bookingLotId !== lotId) {
            redirect(`/eco-tourism/${encodeURIComponent(bookingLotId)}/book?code=${encodeURIComponent(codeParam)}`)
            return null
        }

        // Already confirmed/completed -> redirect to success page
        if (rawBooking.status === 'confirmed' || rawBooking.status === 'completed') {
            redirect(`/eco-tourism/${encodeURIComponent(lotId)}/book/success?code=${encodeURIComponent(codeParam)}`)
            return null
        }

        const isExpired =
            rawBooking.status === 'cancelled' ||
            rawBooking.status === 'no_show' ||
            (rawBooking.status === 'pending' &&
                rawBooking.expires_at &&
                new Date(rawBooking.expires_at).getTime() <= Date.now())

        // Expired or cancelled booking -> render expired screen
        if (isExpired) {
            const isCancelled = rawBooking.status === 'cancelled' || rawBooking.status === 'no_show'
            return (
                <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-gray-50 flex items-center justify-center px-4 py-12">
                    <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-amber-200">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            {isCancelled ? (
                                <AlertCircle className="w-8 h-8 text-amber-600" />
                            ) : (
                                <Clock className="w-8 h-8 text-amber-600" />
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {isCancelled ? 'Đơn đặt phòng đã bị hủy' : 'Đơn đặt phòng đã hết hạn'}
                        </h1>
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                            {isCancelled
                                ? 'Đơn đặt phòng này đã được hủy. Thời gian giữ chỗ đã kết thúc và phòng đã được giải phóng.'
                                : 'Thời gian giữ chỗ 15 phút cho đơn đặt phòng này đã hết hạn. Phòng đã được giải phóng cho khách hàng khác.'}
                        </p>
                        <div className="space-y-3">
                            <Link
                                href={`/eco-tourism/${lotId}`}
                                className="block w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors text-sm"
                            >
                                Tạo đặt phòng mới / Chọn ngày khác
                            </Link>
                            <Link
                                href="/eco-tourism"
                                className="block w-full py-2.5 px-4 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
                            >
                                Khám phá các khu nghỉ dưỡng khác
                            </Link>
                        </div>
                    </div>
                </div>
            )
        }

        // Active pending booking -> restore payment step
        if (room && room.lots) {
            return (
                <BookingPageClient
                    room={{
                        id: room.id,
                        name: room.name,
                        description: room.description,
                        capacity: room.capacity,
                        amenities: room.amenities,
                        price_per_night: room.price_per_night,
                        images: Array.isArray(room.images) ? room.images : [],
                        status: room.status,
                    }}
                    lot={{
                        id: room.lots.id,
                        name: room.lots.name,
                        region: room.lots.region,
                    }}
                    checkIn={rawBooking.check_in_date}
                    checkOut={rawBooking.check_out_date}
                    initialBooking={{
                        bookingId: rawBooking.id,
                        bookingCode: rawBooking.code,
                        roomName: room.name,
                        checkInDate: rawBooking.check_in_date,
                        checkOutDate: rawBooking.check_out_date,
                        nightsCount: rawBooking.nights_count,
                        totalAmount: rawBooking.total_amount,
                        expiresAt: rawBooking.expires_at,
                        status: rawBooking.status,
                    }}
                    initialStep="payment"
                />
            )
        }

        // Fallback when room or lot data is unexpectedly missing
        console.warn(`[Booking Resume] Missing room/lot relationship for booking ${codeParam}`)
        redirect(`/eco-tourism/${lotId}`)
        return null
    }

    // Default flow: New booking creation
    const roomId = Array.isArray(searchParamsResolved.room_id)
        ? searchParamsResolved.room_id[0]
        : searchParamsResolved.room_id
    const checkIn = Array.isArray(searchParamsResolved.check_in)
        ? searchParamsResolved.check_in[0]
        : searchParamsResolved.check_in
    const checkOut = Array.isArray(searchParamsResolved.check_out)
        ? searchParamsResolved.check_out[0]
        : searchParamsResolved.check_out

    const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000)
    const todayVN = nowVN.toISOString().slice(0, 10)

    if (!roomId || !isValidDate(checkIn) || !isValidDate(checkOut) || checkIn >= checkOut || checkIn < todayVN) {
        redirect(`/eco-tourism/${lotId}`)
        return null
    }

    const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('id, name, description, capacity, amenities, price_per_night, images, status, lot_id, lots(id, name, region, description, location_lat, location_lng, images)')
        .eq('id', roomId)
        .maybeSingle()

    const room = roomData as RoomWithLot | null

    if (roomError || !room) {
        console.error('Failed to fetch room:', roomError?.message ?? 'not found')
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center text-gray-500">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy phòng</h1>
                    <p>Phòng này không tồn tại hoặc đã ngừng hoạt động.</p>
                    <a href={`/eco-tourism/${lotId}`} className="mt-4 inline-block text-emerald-600 hover:underline">
                        Quay lại trang vườn
                    </a>
                </div>
            </div>
        )
    }

    if (room.status !== 'active' || room.lot_id !== lotId || !room.lots) {
        return notFound()
    }

    const { data: bookingData } = await supabase
        .from('room_bookings')
        .select('id, room_id, check_in_date, check_out_date, status, expires_at')
        .eq('room_id', roomId)
        .in('status', ['pending', 'confirmed', 'completed'])

    const blocking = getBlockingBookings(bookingData ?? [], checkIn, checkOut)

    if (blocking.length > 0) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center text-gray-500">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Phòng đã được đặt</h1>
                    <p>Phòng này đã có người đặt hoặc đang giữ chỗ trong khoảng thời gian này.</p>
                    <a href={`/eco-tourism/${lotId}`} className="mt-4 inline-block text-emerald-600 hover:underline">
                        Chọn phòng khác
                    </a>
                </div>
            </div>
        )
    }

    return (
        <BookingPageClient
            room={{
                id: room.id,
                name: room.name,
                description: room.description,
                capacity: room.capacity,
                amenities: room.amenities,
                price_per_night: room.price_per_night,
                images: Array.isArray(room.images) ? room.images : [],
                status: room.status,
            }}
            lot={{
                id: room.lots.id,
                name: room.lots.name,
                region: room.lots.region,
            }}
            checkIn={checkIn}
            checkOut={checkOut}
        />
    )
}
