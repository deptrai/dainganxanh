import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link, redirect } from '@/i18n/navigation'
import { notFound } from 'next/navigation'
import { Clock, AlertCircle } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getBlockingBookings, isBlockOverlapping } from '@/lib/eco-tourism/availability'
import BookingPageClient from './BookingPageClient'
import type { Tables } from '@/types/database.types'

export const dynamic = 'force-dynamic'

type RoomRow = Tables<'rooms'>
type LotRow = Tables<'lots'>

type Room = Omit<RoomRow, 'amenities' | 'images' | 'status'> & {
    amenities: string[] | null
    images: string[] | null
    status: 'active' | 'inactive' | 'maintenance'
}

type Lot = Pick<LotRow, 'id' | 'name' | 'region' | 'description' | 'location_lat' | 'location_lng'> & {
    images: string[] | null
}

interface RoomWithLot extends Room {
    lots: Lot | Lot[] | null
}

function getFirstLot(lotData: Lot | Lot[] | null | undefined): Lot | null {
    if (!lotData) return null
    return Array.isArray(lotData) ? lotData[0] ?? null : lotData
}

interface BookingPageProps {
    params: Promise<{ locale: string; lotId: string }>
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
    const { locale, lotId } = await params
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'eco.meta' })
    const supabase = createServiceRoleClient()
    const { data: lot } = await supabase
        .from('lots')
        .select('name')
        .eq('id', lotId)
        .maybeSingle()

    const canonical = locale === 'vi' ? `https://dainganxanh.com.vn/eco-tourism/${lotId}/book` : `https://dainganxanh.com.vn/en/eco-tourism/${lotId}/book`

    return {
        title: lot ? `${t('title')} — ${lot.name}` : `${t('title')}`,
        description: t('description'),
        alternates: {
            canonical,
            languages: {
                vi: `https://dainganxanh.com.vn/eco-tourism/${lotId}/book`,
                en: `https://dainganxanh.com.vn/en/eco-tourism/${lotId}/book`,
                'x-default': `https://dainganxanh.com.vn/eco-tourism/${lotId}/book`,
            },
        },
        robots: { index: false, follow: false },
    }
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
    const { locale, lotId } = await params
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'eco.bookingPage' })
    const searchParamsResolved = await searchParams
    const rawCode = Array.isArray(searchParamsResolved.code)
        ? searchParamsResolved.code[0]
        : searchParamsResolved.code
    const codeParam = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : undefined

    const supabase = createServiceRoleClient()

    // Handle resume/revisit booking via code query param
    if (codeParam) {
        if (!/^BK[A-Z0-9]{6}$/.test(codeParam)) {
            redirect({ href: `/eco-tourism/${encodeURIComponent(lotId)}`, locale })
            return null
        }

        const { data: rawBooking, error: bookingError } = await supabase
            .from('room_bookings')
            .select('id, code, status, expires_at, total_amount, check_in_date, check_out_date, nights_count, guests_count, room_id, rooms(id, name, description, capacity, amenities, price_per_night, images, status, lot_id, lots(id, name, region, description, location_lat, location_lng, images))')
            .eq('code', codeParam)
            .maybeSingle()

        if (bookingError || !rawBooking) {
            redirect({ href: `/eco-tourism/${encodeURIComponent(lotId)}`, locale })
            return null
        }

        const roomsData = rawBooking.rooms
        const room = (Array.isArray(roomsData) ? roomsData[0] : roomsData) as RoomWithLot | null
        const lot = getFirstLot(room?.lots)
        const bookingLotId = room?.lot_id

        // Guard against mismatched lot_id
        if (bookingLotId && bookingLotId !== lotId) {
            redirect({ href: `/eco-tourism/${encodeURIComponent(bookingLotId)}/book?code=${encodeURIComponent(codeParam)}`, locale })
            return null
        }

        // Already confirmed/completed -> redirect to success page
        if (rawBooking.status === 'confirmed' || rawBooking.status === 'completed') {
            redirect({ href: `/eco-tourism/${encodeURIComponent(lotId)}/book/success?code=${encodeURIComponent(codeParam)}`, locale })
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
                            {isCancelled ? t('cancelledTitle') : t('expiredTitle')}
                        </h1>
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                            {isCancelled
                                ? t('cancelledDesc')
                                : t('expiredDescLong')}
                        </p>
                        <div className="space-y-3">
                            <Link
                                href={`/eco-tourism/${lotId}`}
                                className="block w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors text-sm"
                            >
                                {t('newBooking')}
                            </Link>
                            <Link
                                href="/eco-tourism"
                                className="block w-full py-2.5 px-4 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
                            >
                                {t('exploreOther')}
                            </Link>
                        </div>
                    </div>
                </div>
            )
        }

        // Active pending booking -> restore payment step
        if (room && lot) {
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
                        id: lot.id,
                        name: lot.name,
                        region: lot.region,
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
        redirect({ href: `/eco-tourism/${lotId}`, locale })
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
        redirect({ href: `/eco-tourism/${lotId}`, locale })
        return null
    }

    const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('id, name, description, capacity, amenities, price_per_night, images, status, lot_id, lots(id, name, region, description, location_lat, location_lng, images)')
        .eq('id', roomId)
        .maybeSingle()

    const room = roomData as RoomWithLot | null
    const lot = getFirstLot(room?.lots)

    if (roomError || !room) {
        console.error('Failed to fetch room:', roomError?.message ?? 'not found')
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center text-gray-500">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('roomNotFound')}</h1>
                    <p>{t('roomNotFoundDesc')}</p>
                    <Link href={`/eco-tourism/${lotId}`} className="mt-4 inline-block text-emerald-600 hover:underline">
                        {t('backToGardenPage')}
                    </Link>
                </div>
            </div>
        )
    }

    if (room.status !== 'active' || room.lot_id !== lotId || !lot) {
        return notFound()
    }

    const { data: bookingData } = await supabase
        .from('room_bookings')
        .select('id, room_id, check_in_date, check_out_date, status, expires_at')
        .eq('room_id', roomId)
        .in('status', ['pending', 'confirmed', 'completed'])

    const { data: blockData } = await supabase
        .from('room_blocks')
        .select('id, room_id, start_date, end_date, reason, status')
        .eq('room_id', roomId)

    const blocking = getBlockingBookings(bookingData ?? [], checkIn, checkOut)

    if (blocking.length > 0) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center text-gray-500">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('roomBooked')}</h1>
                    <p>{t('roomBookedDesc')}</p>
                    <Link href={`/eco-tourism/${lotId}`} className="mt-4 inline-block text-emerald-600 hover:underline">
                        {t('chooseAnotherRoom')}
                    </Link>
                </div>
            </div>
        )
    }

    const overlappingBlocks = (blockData ?? []).filter((b) => isBlockOverlapping(b, checkIn, checkOut))

    if (overlappingBlocks.length > 0) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center text-gray-500">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('roomMaintenance')}</h1>
                    <p>{t('roomMaintenanceDesc')}</p>
                    <Link href={`/eco-tourism/${lotId}`} className="mt-4 inline-block text-emerald-600 hover:underline">
                        {t('chooseAnotherRoom')}
                    </Link>
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
                id: lot.id,
                name: lot.name,
                region: lot.region,
            }}
            checkIn={checkIn}
            checkOut={checkOut}
        />
    )
}
