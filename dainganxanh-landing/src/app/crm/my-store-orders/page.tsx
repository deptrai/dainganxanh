import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { getScopedCrmClient } from '@/lib/supabase/scopedClient'
import { StoreOrdersList } from '@/components/crm/StoreOrdersList'
import { captureError } from '@/lib/monitoring'
import type { StoreOrderWithItems } from '@/types/database.types'

export const metadata: Metadata = {
    title: 'Đơn hàng của tôi | Đại Ngàn Xanh',
    robots: { index: false },
}

interface MyStoreOrdersPageProps {
    searchParams: Promise<{ page?: string }>
}

export default async function MyStoreOrdersPage({ searchParams }: MyStoreOrdersPageProps) {
    // Lấy service client đã gắn quyền cùng effectiveUserId (hỗ trợ impersonation)
    const scoped = await getScopedCrmClient()

    if (!scoped) {
        redirect('/login?redirect=/crm/my-store-orders')
    }

    const { client: serviceClient, effectiveUserId } = scoped

    // Lazily expire overdue pending store orders before querying
    try {
        const { error: expireError } = await serviceClient.rpc('expire_pending_store_orders')
        if (expireError) {
            console.error('Error expiring pending store orders:', expireError.message)
            captureError(new Error(expireError.message), { context: 'MyStoreOrdersPage.lazyExpire', effectiveUserId })
        }
    } catch (err) {
        console.error('Unexpected error running expire_pending_store_orders:', err)
        captureError(err instanceof Error ? err : new Error(String(err)), { context: 'MyStoreOrdersPage.lazyExpire', effectiveUserId })
    }

    const { page: pageParam } = await searchParams
    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
    const pageSize = 20
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const {
        data: orders,
        error,
        count,
    } = await serviceClient
        .from('store_orders')
        .select(
            `
            id,
            code,
            status,
            total_amount,
            shipping_fee,
            payment_method,
            shipping_address,
            tracking_number,
            created_at,
            store_order_items(id, quantity, unit_price, products(name, slug, images))
        `,
            { count: 'exact' }
        )
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })
        .range(start, end)

    if (error) {
        console.error('Error fetching my store orders:', error.message)
        captureError(new Error(error.message), { context: 'MyStoreOrdersPage', effectiveUserId })
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.</p>
                </div>
            </div>
        )
    }

    const orderRows = (orders || []) as StoreOrderWithItems[]
    const formattedOrders = orderRows.map((row) => ({
        id: row.id,
        code: row.code,
        status: row.status,
        totalAmount: row.total_amount,
        shippingFee: row.shipping_fee || 0,
        paymentMethod: row.payment_method as 'banking' | 'cod' | undefined,
        shippingAddress: row.shipping_address,
        trackingNumber: row.tracking_number,
        createdAt: row.created_at,
        items: (row.store_order_items || []).map((item) => {
            const product = Array.isArray(item.products) ? item.products[0] : item.products
            const images = Array.isArray(product?.images) ? product.images : []
            return {
                id: item.id,
                name: product?.name || '',
                slug: product?.slug || '',
                image: (images[0] as string | undefined) || null,
                quantity: item.quantity,
                unitPrice: item.unit_price,
            }
        }),
    }))

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / pageSize)

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Đơn hàng của tôi</h1>
            <p className="text-gray-600 mb-6">Theo dõi trạng thái đơn hàng và mã vận chuyển</p>

            <StoreOrdersList
                orders={formattedOrders}
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
            />
        </div>
    )
}
