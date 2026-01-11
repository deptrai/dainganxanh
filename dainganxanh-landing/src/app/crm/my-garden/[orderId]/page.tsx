import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PackageDetailHeader from '@/components/crm/PackageDetailHeader'
import LotMap from '@/components/crm/LotMap'
import TreeTimeline from '@/components/crm/TreeTimeline'
import PhotoGallery from '@/components/crm/PhotoGallery'
import QuarterlyReports from '@/components/crm/QuarterlyReports'
import GrowthMetrics from '@/components/crm/GrowthMetrics'
import Link from 'next/link'

interface PackageDetailPageProps {
    params: {
        orderId: string
    }
}

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
    // Next.js 16: params is a Promise, must await it
    const { orderId } = await params

    const supabase = await createServerClient()

    // Check authentication
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?redirect=/crm/my-garden')
    }

    // Fetch order detail (without lots join to avoid errors if lots table doesn't exist)
    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            id,
            order_code,
            quantity,
            status,
            tree_status,
            planted_at,
            co2_absorbed,
            latest_photo_url,
            created_at,
            lot_id
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

    if (error || !order) {
        console.error('Error fetching order:', error?.message)
        notFound()
    }

    // Try to fetch lot info separately (if lot_id exists and lots table exists)
    let lotInfo = null
    let treePhotos: { id: string, photo_url: string, caption: string | null, uploaded_at: string }[] = []

    if (order.lot_id) {
        try {
            const { data: lot } = await supabase
                .from('lots')
                .select('id, name, region, gps_lat, gps_lng, gps_polygon')
                .eq('id', order.lot_id)
                .single()
            lotInfo = lot

            // Fetch photos for this lot
            const { data: photos } = await supabase
                .from('tree_photos')
                .select('id, photo_url, caption, uploaded_at')
                .eq('lot_id', order.lot_id)
                .order('uploaded_at', { ascending: true })

            if (photos) {
                treePhotos = photos
            }
        } catch (lotError) {
            console.log('Lots table not available or lot not found')
        }
    }

    // Calculate metrics
    const co2Total = order.co2_absorbed ?? (order.quantity * 20)
    const plantedDate = order.planted_at ? new Date(order.planted_at) : new Date(order.created_at)
    const ageInMonths = Math.floor((Date.now() - plantedDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    const progressToHarvest = Math.min((ageInMonths / 60) * 100, 100)


    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
            <div className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <Link
                    href="/crm/my-garden"
                    className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">Quay lại Vườn Cây</span>
                </Link>

                {/* Package Header */}
                <PackageDetailHeader
                    order={{ ...order, lots: lotInfo }}
                    packageCode={order.order_code || `PKG-${new Date().getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`}
                />

                {/* Growth Metrics */}
                <GrowthMetrics
                    co2Total={co2Total}
                    ageInMonths={ageInMonths}
                    quantity={order.quantity}
                    progressToHarvest={progressToHarvest}
                />

                {/* GPS Map */}
                {lotInfo ? (
                    <LotMap
                        lotName={lotInfo.name}
                        region={lotInfo.region}
                        gpsLat={lotInfo.gps_lat}
                        gpsLng={lotInfo.gps_lng}
                        gpsPolygon={lotInfo.gps_polygon}
                    />
                ) : (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">🗺️</span>
                            <h2 className="text-2xl font-bold text-gray-800">Vị Trí Lô Cây</h2>
                        </div>
                        <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <span className="text-6xl mb-4 block">⏳</span>
                                <p className="text-gray-600">Lô cây đang được phân bổ...</p>
                                <p className="text-sm text-gray-500 mt-1">Thông tin vị trí sẽ có sau khi cây được trồng</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Photo Gallery */}
                <PhotoGallery
                    orderId={order.id}
                    latestPhotoUrl={order.latest_photo_url}
                    ageInMonths={ageInMonths}
                />

                {/* Tree Timeline */}
                <TreeTimeline
                    plantedAt={order.planted_at}
                    createdAt={order.created_at}
                    ageInMonths={ageInMonths}
                    photos={treePhotos}
                />

                {/* Quarterly Reports */}
                <QuarterlyReports
                    orderId={order.id}
                    ageInMonths={ageInMonths}
                />
            </div>
        </div>
    )
}
