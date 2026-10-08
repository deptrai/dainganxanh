import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import AdminProductsTable from '@/components/admin/AdminProductsTable'
import { PlusIcon } from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Quản lý sản phẩm | Đại Ngàn Xanh Admin',
    description: 'Quản lý danh sách sản phẩm, giá bán, tồn kho và danh mục',
    robots: { index: false },
}

export default async function AdminProductsPage() {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

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
    const { data: products, error } = await serviceSupabase
        .from('products')
        .select(`
            id,
            name,
            slug,
            category_id,
            price,
            compare_at_price,
            stock_quantity,
            sku,
            status,
            origin_type,
            images,
            is_featured,
            created_at,
            product_categories (
                id,
                name
            )
        `)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sản phẩm</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý danh sách sản phẩm, giá bán, tồn kho và danh mục trên cửa hàng
                    </p>
                </div>
                <Link
                    href="/crm/admin/products/new"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm self-start sm:self-auto"
                >
                    <PlusIcon className="w-4 h-4" />
                    Thêm sản phẩm
                </Link>
            </div>

            {/* Error banner if query fails */}
            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                    Lỗi tải dữ liệu sản phẩm: {error.message}
                </div>
            )}

            {/* Table */}
            <AdminProductsTable products={(products as any) || []} />
        </div>
    )
}
