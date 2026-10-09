import { Link, redirect } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/ProductForm'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Thêm sản phẩm mới | Đại Ngàn Xanh Admin',
    description: 'Tạo sản phẩm mới cho cửa hàng Đại Ngàn Xanh',
    robots: { index: false },
}

export default async function NewProductPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    setRequestLocale(locale)

    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect({ href: '/auth/login', locale })
        return null
    }

    const serviceSupabase = createServiceRoleClient()
    const { data: profile } = await serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        redirect({ href: '/crm', locale })
        return null
    }

    // Fetch categories and lots
    const [categoriesRes, lotsRes] = await Promise.all([
        serviceSupabase
            .from('product_categories')
            .select('id, name')
            .order('name', { ascending: true }),
        serviceSupabase
            .from('lots')
            .select('id, name')
            .order('name', { ascending: true }),
    ])

    const categories = categoriesRes.data || []
    const lots = lotsRes.data || []

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-gray-500 gap-1.5">
                <Link href="/crm/admin/products" className="hover:text-gray-900 transition-colors">
                    Sản phẩm
                </Link>
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 font-medium">Thêm mới</span>
            </nav>

            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Điền đầy đủ thông tin để hiển thị sản phẩm trên cửa hàng
                </p>
            </div>

            {/* Form */}
            <ProductForm categories={categories} lots={lots} />
        </div>
    )
}
