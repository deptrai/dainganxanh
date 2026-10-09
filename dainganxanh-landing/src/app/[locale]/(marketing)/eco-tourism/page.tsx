import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { EcoTourismClient } from '@/components/eco-tourism/EcoTourismClient'
import { calculateEffectiveRoomPrices, type RoomPricingRule } from '@/lib/pricing'

export const revalidate = 3600

export const metadata: Metadata = {
    title: 'Nghỉ Dưỡng Tại Vườn — Đại Ngàn Xanh',
    description: 'Khám phá các vườn Dó Đen có phòng nghỉ dưỡng sinh thái. Đặt phòng trực tiếp, giá minh bạch, trải nghiệm thiên nhiên.',
    alternates: { canonical: 'https://dainganxanh.com.vn/eco-tourism' },
    openGraph: {
        title: 'Nghỉ Dưỡng Tại Vườn — Đại Ngàn Xanh',
        description: 'Khám phá các vườn Dó Đen có phòng nghỉ dưỡng sinh thái.',
        url: 'https://dainganxanh.com.vn/eco-tourism',
        siteName: 'Đại Ngàn Xanh',
        type: 'website',
        locale: 'vi_VN',
    },
}

interface LotWithRooms {
    id: string
    name: string
    region: string
    images: string[] | null
    rooms: Array<{ id: string; status: string; price_per_night: number }>
}

function buildJsonLd(lots: LotWithRooms[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Danh sách vườn nghỉ dưỡng Đại Ngàn Xanh',
        itemListElement: lots.map((lot, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'Place',
                '@id': `https://dainganxanh.com.vn/eco-tourism/${lot.id}`,
                name: lot.name,
            },
        })),
    }
}

interface EcoTourismPageProps {
    searchParams?: Promise<{ region?: string | string[] | undefined }>
}

export default async function EcoTourismPage({ searchParams }: EcoTourismPageProps = {}) {
    const resolvedParams = searchParams ? await searchParams : undefined
    const rawRegion = resolvedParams?.region
    const initialRegion = Array.isArray(rawRegion) ? rawRegion[0] : rawRegion

    const supabase = createServiceRoleClient()

    const { data: lots, error } = await supabase
        .from('lots')
        .select(`
            id,
            name,
            region,
            images,
            rooms!inner (
                id,
                status,
                price_per_night
            )
        `)
        .eq('rooms.status', 'active')
        .order('name')

    if (error) {
        console.error('Error fetching eco-tourism lots:', error)
    }

    const rawLots = (lots ?? []) as LotWithRooms[]
    const allActiveRooms = rawLots.flatMap(lot =>
        (lot.rooms ?? []).filter(r => r.status === 'active')
    )
    const roomIds = allActiveRooms.map(r => r.id)

    let pricingRules: RoomPricingRule[] = []
    if (roomIds.length > 0) {
        // Query thứ 2: lấy pricing rules cho các phòng active (TD-01)
        const { data: rules, error: rulesError } = await supabase
            .from('room_pricing_rules')
            .select('id, room_id, start_date, end_date, price_per_night')
            .in('room_id', roomIds)

        if (rulesError) {
            console.error('Error fetching room pricing rules:', rulesError)
        } else if (rules) {
            pricingRules = rules
        }
    }

    // Tính giá từ hiệu dụng cho từng phòng (min giữa base price và các pricing rule áp dụng được trong 90 ngày tới)
    const effectivePrices = calculateEffectiveRoomPrices(allActiveRooms, pricingRules)

    const gardenLots = rawLots.map(lot => {
        const activeRooms = lot.rooms?.filter(r => r.status === 'active') ?? []
        const priceFrom = activeRooms.length
            ? Math.min(...activeRooms.map(r => effectivePrices.get(r.id) ?? r.price_per_night))
            : null
        return {
            id: lot.id,
            name: lot.name,
            region: lot.region,
            images: Array.isArray(lot.images) ? (lot.images as string[]) : [],
            priceFrom,
        }
    })

    const jsonLd = buildJsonLd(rawLots)

    return (
        <>
            <script type="application/ld+json">
                {JSON.stringify(jsonLd).replace(/</g, '\\u003c')}
            </script>
            <Suspense fallback={null}>
                <EcoTourismClient lots={gardenLots} initialRegion={initialRegion} />
            </Suspense>
        </>
    )
}
