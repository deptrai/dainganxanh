import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
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
    searchParams: Promise<{ room_id?: string; check_in?: string; check_out?: string }>
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
    }
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
    const { lotId } = await params
    const searchParamsResolved = await searchParams
    const roomId = searchParamsResolved.room_id
    const checkIn = searchParamsResolved.check_in
    const checkOut = searchParamsResolved.check_out

    const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000)
    const todayVN = nowVN.toISOString().slice(0, 10)

    if (!roomId || !isValidDate(checkIn) || !isValidDate(checkOut) || checkIn >= checkOut || checkIn < todayVN) {
        redirect(`/eco-tourism/${lotId}`)
        return null
    }

    const supabase = createServiceRoleClient()
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
