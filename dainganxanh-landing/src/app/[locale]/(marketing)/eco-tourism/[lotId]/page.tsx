import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { GardenDetailClient, type GardenDetail } from '@/components/eco-tourism/GardenDetailClient'
import type { RoomBooking, RoomBlock } from '@/lib/eco-tourism/availability'
import { applyEffectiveRoomPrices, type RoomPricingRule } from '@/lib/pricing'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string; lotId: string }> }): Promise<Metadata> {
    const { locale, lotId } = await params
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'eco.meta' })
    const supabase = createServiceRoleClient()
    const { data: lot } = await supabase
        .from('lots')
        .select('name, description, images')
        .eq('id', lotId)
        .maybeSingle()

    const ogImage = Array.isArray(lot?.images) && lot.images.length > 0 ? lot.images[0] : undefined
    const canonical = locale === 'vi' ? `https://dainganxanh.com.vn/eco-tourism/${lotId}` : `https://dainganxanh.com.vn/en/eco-tourism/${lotId}`

    return {
        title: lot ? `${lot.name} — ${t('title')}` : `${t('title')}`,
        description: lot?.description ?? t('description'),
        alternates: {
            canonical,
            languages: {
                vi: `https://dainganxanh.com.vn/eco-tourism/${lotId}`,
                en: `https://dainganxanh.com.vn/en/eco-tourism/${lotId}`,
                'x-default': `https://dainganxanh.com.vn/eco-tourism/${lotId}`,
            },
        },
        openGraph: {
            title: lot ? `${lot.name} — ${t('title')}` : `${t('title')}`,
            description: lot?.description ?? t('description'),
            url: canonical,
            siteName: 'Đại Ngàn Xanh',
            type: 'website',
            locale: locale === 'vi' ? 'vi_VN' : 'en_US',
            images: ogImage ? [{ url: ogImage }] : undefined,
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

function buildJsonLd(lot: LotWithRooms, locale: string) {
    const baseUrl = locale === 'vi' ? 'https://dainganxanh.com.vn' : 'https://dainganxanh.com.vn/en'
    return {
        '@context': 'https://schema.org',
        '@type': 'LodgingBusiness',
        '@id': `${baseUrl}/eco-tourism/${lot.id}`,
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
            name: locale === 'en' ? 'Rooms & Suites' : 'Phòng nghỉ',
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

export default async function GardenDetailPage({ params }: { params: Promise<{ locale: string; lotId: string }> }) {
    const { locale, lotId } = await params
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'eco' })
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
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('detail.notFound')}</h1>
                    <p>{t('detail.notFoundDesc')}</p>
                    <Link href="/eco-tourism" className="mt-4 inline-block text-emerald-600 hover:underline">
                        {t('detail.backToList')}
                    </Link>
                </div>
            </div>
        )
    }

    const activeRooms = (Array.isArray(lot.rooms) ? lot.rooms : []).filter((r) => r.status === 'active')
    const roomIds = activeRooms.map((r) => r.id)

    let bookings: RoomBooking[] = []
    let blocks: RoomBlock[] = []
    let pricingRules: RoomPricingRule[] = []

    if (roomIds.length > 0) {
        const { data: bookingData } = await supabase
            .from('room_bookings')
            .select('id, room_id, check_in_date, check_out_date, status, expires_at')
            .in('room_id', roomIds)
            .in('status', ['pending', 'confirmed', 'completed'])
        bookings = bookingData ?? []

        const { data: blockData } = await supabase
            .from('room_blocks')
            .select('id, room_id, start_date, end_date, reason, status')
            .in('room_id', roomIds)
        blocks = blockData ?? []

        // Query pricing rules để tính "Giá từ" hiệu dụng phản ánh giá mùa vụ/khuyến mãi (TD-01)
        const { data: ruleData } = await supabase
            .from('room_pricing_rules')
            .select('id, room_id, start_date, end_date, price_per_night')
            .in('room_id', roomIds)
        pricingRules = (ruleData ?? []) as RoomPricingRule[]
    }

    // Tính giá từ hiệu dụng cho từng phòng (min giữa base price và các pricing rule áp dụng được trong 90 ngày tới)
    const effectiveRooms = applyEffectiveRoomPrices(activeRooms, pricingRules)

    const garden: GardenDetail = {
        id: lot.id,
        name: lot.name,
        region: lot.region,
        description: lot.description,
        location_lat: lot.location_lat,
        location_lng: lot.location_lng,
        images: Array.isArray(lot.images) ? lot.images : [],
        rooms: effectiveRooms,
        bookings,
        blocks,
    }

    const lotForJsonLd: LotWithRooms = {
        ...lot,
        rooms: effectiveRooms,
    }
    const jsonLd = buildJsonLd(lotForJsonLd, locale)

    return (
        <>
            <script
                type="application/ld+json"
            >
                {JSON.stringify(jsonLd).replace(/</g, '\\u003c')}
            </script>
            <GardenDetailClient garden={garden} />
        </>
    )
}
