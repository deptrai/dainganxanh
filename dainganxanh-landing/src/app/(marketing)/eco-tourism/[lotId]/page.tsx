import type { Metadata } from 'next'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { GardenDetailClient, type GardenDetail } from '@/components/eco-tourism/GardenDetailClient'
import type { RoomBooking } from '@/lib/eco-tourism/availability'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ lotId: string }> }): Promise<Metadata> {
    const { lotId } = await params
    const supabase = createServiceRoleClient()
    const { data: lot } = await supabase
        .from('lots')
        .select('name, description')
        .eq('id', lotId)
        .maybeSingle()

    return {
        title: lot ? `${lot.name} — Nghỉ Dưỡng Tại Vườn` : 'Vườn nghỉ dưỡng — Đại Ngàn Xanh',
        description: lot?.description ?? 'Khám phá phòng nghỉ sinh thái tại vườn Dó Đen.',
        alternates: { canonical: `https://dainganxanh.com.vn/eco-tourism/${lotId}` },
        openGraph: {
            title: lot ? `${lot.name} — Nghỉ Dưỡng Tại Vườn` : 'Vườn nghỉ dưỡng — Đại Ngàn Xanh',
            description: lot?.description ?? 'Khám phá phòng nghỉ sinh thái tại vườn Dó Đen.',
            url: `https://dainganxanh.com.vn/eco-tourism/${lotId}`,
            siteName: 'Đại Ngàn Xanh',
            type: 'website',
            locale: 'vi_VN',
        },
    }
}

interface Room {
    id: string
    name: string
    description: string | null
    capacity: number
    amenities: string[] | null
    price_per_night: number
    images: string[] | null
    status: 'active' | 'inactive' | 'maintenance'
}

interface LotWithRooms {
    id: string
    name: string
    region: string
    description: string | null
    location_lat: number | null
    location_lng: number | null
    images: string[] | null
    rooms: Room[]
}

function buildJsonLd(lot: LotWithRooms) {
    return {
        '@context': 'https://schema.org',
        '@type': 'LodgingBusiness',
        '@id': `https://dainganxanh.com.vn/eco-tourism/${lot.id}`,
        name: lot.name,
        description: lot.description ?? undefined,
        image: Array.isArray(lot.images) ? lot.images : [],
        address: {
            '@type': 'PostalAddress',
            addressRegion: lot.region,
            addressCountry: 'VN',
        },
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Phòng nghỉ',
            itemListElement: (Array.isArray(lot.rooms) ? lot.rooms : [])
                .filter((r) => r.status === 'active')
                .map((room) => ({
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'HotelRoom',
                        name: room.name,
                        occupancy: { '@type': 'QuantitativeValue', value: room.capacity },
                    },
                    priceSpecification: {
                        '@type': 'UnitPriceSpecification',
                        price: room.price_per_night,
                        priceCurrency: 'VND',
                    },
                })),
        },
    }
}

export default async function GardenDetailPage({ params }: { params: Promise<{ lotId: string }> }) {
    const { lotId } = await params
    const supabase = createServiceRoleClient()

    const { data: rawLot, error } = await supabase
        .from('lots')
        .select(
            'id, name, region, description, location_lat, location_lng, images, rooms(id, name, description, capacity, amenities, price_per_night, images, status)'
        )
        .eq('id', lotId)
        .maybeSingle()

    const lot = rawLot as LotWithRooms | null

    if (error || !lot) {
        console.error('Failed to fetch lot:', error?.message ?? 'not found')
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center text-gray-500">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy vườn</h1>
                    <p>Vườn này không tồn tại hoặc đã ngừng hoạt động.</p>
                    <a href="/eco-tourism" className="mt-4 inline-block text-emerald-600 hover:underline">
                        Quay lại danh sách vườn
                    </a>
                </div>
            </div>
        )
    }

    const activeRooms = (Array.isArray(lot.rooms) ? lot.rooms : []).filter((r) => r.status === 'active')
    const roomIds = activeRooms.map((r) => r.id)

    let bookings: RoomBooking[] = []

    if (roomIds.length > 0) {
        const { data: bookingData } = await supabase
            .from('room_bookings')
            .select('id, room_id, check_in_date, check_out_date, status, expires_at')
            .in('room_id', roomIds)
            .in('status', ['pending', 'confirmed', 'completed'])
        bookings = bookingData ?? []
    }

    const garden: GardenDetail = {
        id: lot.id,
        name: lot.name,
        region: lot.region,
        description: lot.description,
        location_lat: lot.location_lat,
        location_lng: lot.location_lng,
        images: Array.isArray(lot.images) ? lot.images : [],
        rooms: activeRooms,
        bookings,
    }

    const jsonLd = buildJsonLd(lot)

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
            />
            <GardenDetailClient garden={garden} />
        </>
    )
}
