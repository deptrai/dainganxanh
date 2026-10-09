import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { EcoTourismClient } from '@/components/eco-tourism/EcoTourismClient'
import { calculateEffectiveRoomPrices, type RoomPricingRule } from '@/lib/pricing'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'eco.meta' })
    const canonical = locale === 'vi' ? 'https://dainganxanh.com.vn/eco-tourism' : 'https://dainganxanh.com.vn/en/eco-tourism'
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical,
            languages: {
                vi: 'https://dainganxanh.com.vn/eco-tourism',
                en: 'https://dainganxanh.com.vn/en/eco-tourism',
                'x-default': 'https://dainganxanh.com.vn/eco-tourism',
            },
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: canonical,
            siteName: 'Đại Ngàn Xanh',
            type: 'website',
            locale: locale === 'vi' ? 'vi_VN' : 'en_US',
        },
    }
}

interface LotWithRooms {
    id: string
    name: string
    region: string
    images: string[] | null
    rooms: Array<{ id: string; status: string; price_per_night: number }>
}

function buildJsonLd(lots: LotWithRooms[], locale: string) {
    const baseUrl = locale === 'vi' ? 'https://dainganxanh.com.vn' : 'https://dainganxanh.com.vn/en'
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: locale === 'en' ? 'Dai Ngan Xanh Eco-Resort Gardens' : 'Danh sách vườn nghỉ dưỡng Đại Ngàn Xanh',
        itemListElement: lots.map((lot, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'Place',
                '@id': `${baseUrl}/eco-tourism/${lot.id}`,
                name: lot.name,
            },
        })),
    }
}

interface EcoTourismPageProps {
    params?: Promise<{ locale: string }>
    searchParams?: Promise<{ region?: string | string[] | undefined }>
}

export default async function EcoTourismPage({ params = Promise.resolve({ locale: 'vi' }), searchParams }: EcoTourismPageProps = {}) {
    const { locale } = await params
    setRequestLocale(locale)
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

    const jsonLd = buildJsonLd(rawLots, locale)

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
