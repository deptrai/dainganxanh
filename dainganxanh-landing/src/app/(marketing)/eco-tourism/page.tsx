import type { Metadata } from 'next'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { EcoTourismClient } from '@/components/eco-tourism/EcoTourismClient'

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
    rooms: Array<{ status: string; price_per_night: number }>
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

export default async function EcoTourismPage() {
    const supabase = createServiceRoleClient()

    const { data: lots, error } = await supabase
        .from('lots')
        .select(`
            id,
            name,
            region,
            images,
            rooms!inner (
                status,
                price_per_night
            )
        `)
        .eq('rooms.status', 'active')
        .order('name')

    if (error) {
        console.error('Error fetching eco-tourism lots:', error)
    }

    const gardenLots = ((lots ?? []) as LotWithRooms[]).map(lot => {
        const activeRooms = lot.rooms?.filter(r => r.status === 'active') ?? []
        const priceFrom = activeRooms.length
            ? Math.min(...activeRooms.map(r => r.price_per_night))
            : null
        return {
            id: lot.id,
            name: lot.name,
            region: lot.region,
            images: Array.isArray(lot.images) ? (lot.images as string[]) : [],
            priceFrom,
        }
    })

    const jsonLd = buildJsonLd((lots ?? []) as LotWithRooms[])

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
            />
            <EcoTourismClient lots={gardenLots} />
        </>
    )
}
