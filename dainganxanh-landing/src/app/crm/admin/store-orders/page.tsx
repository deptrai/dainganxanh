import { redirect } from 'next/navigation'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { captureError } from '@/lib/monitoring'
import AdminStoreOrdersTable, { AdminStoreOrder } from '@/components/admin/AdminStoreOrdersTable'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Quản lý đơn hàng shop | Đại Ngàn Xanh Admin',
    description: 'Quản lý đơn hàng cửa hàng, xử lý giao nhận và cập nhật trạng thái',
    robots: { index: false },
}

interface AdminStoreOrdersPageProps {
    searchParams: Promise<{ status?: string }>
}

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

export default async function AdminStoreOrdersPage({ searchParams }: AdminStoreOrdersPageProps) {
    const supabase = await createServerClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect('/auth/login')
    }

    const serviceSupabase = createServiceRoleClient()
    const { data: profile } = await serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        redirect('/crm')
    }

    // Lazily expire overdue pending store orders before loading the list
    try {
        const { error: expireError } = await serviceSupabase.rpc('expire_pending_store_orders')
        if (expireError) {
            const errMsg = (expireError as any)?.message || String(expireError)
            captureError(
                expireError instanceof Error ? expireError : new Error(errMsg),
                { context: 'AdminStoreOrdersPage.lazyExpire' }
            )
        }
    } catch (err: any) {
        captureError(err instanceof Error ? err : new Error(String(err)), {
            context: 'AdminStoreOrdersPage.lazyExpire',
        })
    }

    const resolvedParams = await searchParams
    const statusParam = resolvedParams?.status
    const activeStatus = statusParam && VALID_STATUSES.includes(statusParam) ? statusParam : undefined

    let query = serviceSupabase
        .from('store_orders')
        .select(`
            id,
            code,
            user_id,
            customer_name,
            customer_phone,
            customer_email,
            shipping_address,
            shipping_province,
            shipping_note,
            subtotal,
            shipping_fee,
            total_amount,
            payment_method,
            payment_ref,
            status,
            tracking_number,
            cancellation_reason,
            expires_at,
            created_at,
            updated_at,
            store_order_items (
                id,
                product_id,
                quantity,
                unit_price,
                subtotal,
                products (
                    id,
                    name,
                    slug,
                    images
                )
            )
        `)
        .order('created_at', { ascending: false })

    if (activeStatus) {
        query = query.eq('status', activeStatus)
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) {
        const errMsg = (ordersError as any)?.message || String(ordersError)
        captureError(
            ordersError instanceof Error ? ordersError : new Error(errMsg),
            { context: 'AdminStoreOrdersPage.fetchOrders' }
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Đơn hàng shop</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý quy trình xử lý, đóng gói và giao nhận đơn hàng cửa hàng
                    </p>
                </div>
            </div>

            {/* Error notice if fetch failed — don't render the table so the empty state can't mislead */}
            {ordersError ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                    Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.
                </div>
            ) : (
                <AdminStoreOrdersTable
                    orders={((orders as unknown) as AdminStoreOrder[]) || []}
                    currentStatus={activeStatus}
                />
            )}
        </div>
    )
}
