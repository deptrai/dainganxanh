import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import HarvestSellBack from '@/components/crm/HarvestSellBack'
import HarvestKeepGrowing from '@/components/crm/HarvestKeepGrowing'
import HarvestReceiveProduct from '@/components/crm/HarvestReceiveProduct'

interface HarvestPageProps {
    params: {
        orderId: string
    }
}

export default async function HarvestPage({ params }: HarvestPageProps) {
    const { orderId } = await params
    const supabase = await createServerClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login?redirect=/crm/my-garden')
    }

    // Fetch order with trees using correct column names
    const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

    if (error || !order) {
        notFound()
    }

    // Fetch trees for this order
    const { data: trees } = await supabase
        .from('trees')
        .select('id, code, order_id, created_at, status')
        .eq('order_id', orderId)
        .limit(1)

    const tree = trees?.[0]

    // Calculate tree age from order or tree created_at
    const plantedDate = tree ? new Date(tree.created_at) : new Date(order.created_at)
    const ageInMonths = Math.floor((Date.now() - plantedDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={`/crm/my-garden/${orderId}`}
                        className="text-emerald-600 hover:text-emerald-700 mb-4 inline-flex items-center gap-2"
                    >
                        ← Quay lại
                    </Link>
                    <h1 className="text-4xl font-bold text-emerald-900 mt-4">
                        🌟 Cây Sẵn Sàng Thu Hoạch
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Chúc mừng! Cây của bạn đã đạt 10 năm tuổi và sẵn sàng cho thu hoạch.
                    </p>
                </div>

                {/* Tree Summary Card */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-4 border-yellow-400">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Thông Tin Cây</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Mã cây</p>
                            <p className="text-lg font-bold text-emerald-700">{tree?.code || order.code || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tuổi cây</p>
                            <p className="text-lg font-bold text-emerald-700">{ageInMonths} tháng</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Ngày trồng</p>
                            <p className="text-lg font-bold text-emerald-700">
                                {format(plantedDate, 'dd/MM/yyyy', { locale: vi })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">CO₂ đã hấp thụ</p>
                            <p className="text-lg font-bold text-emerald-700">
                                {order.co2_absorbed?.toFixed(1) || (ageInMonths / 12 * 20).toFixed(1)} kg
                            </p>
                        </div>
                    </div>
                </div>

                {/* Harvest Options - Coming Soon */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Lựa Chọn Thu Hoạch</h2>

                    <div className="space-y-4">
                        {/* Option 1: Sell Back */}
                        <HarvestSellBack
                            orderId={order.id}
                            totalAmount={order.total_amount || 0}
                            orderCode={order.code || null}
                            plantedDate={plantedDate.toISOString()}
                        />

                        {/* Option 2: Keep Growing */}
                        <HarvestKeepGrowing
                            orderId={order.id}
                            treeCode={tree?.code || order.code || 'N/A'}
                            ageInMonths={ageInMonths}
                        />

                        {/* Option 3: Receive Product */}
                        <HarvestReceiveProduct
                            orderId={order.id}
                            orderCode={order.code || undefined}
                        />
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            💡 <strong>Lưu ý:</strong> Các tùy chọn thu hoạch sẽ được kích hoạt trong các bản cập nhật tiếp theo.
                            Vui lòng theo dõi thông báo từ Đại Ngàn Xanh.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
