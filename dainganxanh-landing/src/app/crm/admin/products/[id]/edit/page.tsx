import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/ProductForm'
import { ChevronRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

interface Props {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params
    const serviceSupabase = createServiceRoleClient()
    const { data: product } = await serviceSupabase
        .from('products')
        .select('name')
        .eq('id', id)
        .single()

    return {
        title: product ? `Sửa ${product.name} | Đại Ngàn Xanh Admin` : 'Sửa sản phẩm | Đại Ngàn Xanh Admin',
        robots: { index: false },
    }
}

export default async function EditProductPage({ params }: Props) {
    const { id } = await params
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

    // Fetch product, categories, lots in parallel
    const [productRes, categoriesRes, lotsRes] = await Promise.all([
        serviceSupabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single(),
        serviceSupabase
            .from('product_categories')
            .select('id, name')
            .order('name', { ascending: true }),
        serviceSupabase
            .from('lots')
            .select('id, name')
            .order('name', { ascending: true }),
    ])

    if (productRes.error || !productRes.data) {
        notFound()
    }

    const product = productRes.data
    const categories = categoriesRes.data || []
    const lots = lotsRes.data || []

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-gray-500 gap-1.5 flex-wrap">
                <Link href="/crm/admin/products" className="hover:text-gray-900 transition-colors">
                    Sản phẩm
                </Link>
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 truncate max-w-xs">{product.name}</span>
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 font-medium">Sửa</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Chỉnh sửa: {product.name}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 font-mono">
                        /store/{product.slug}
                    </p>
                </div>
                <Link
                    href={`/store/${product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors self-start sm:self-auto"
                >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    Xem sản phẩm
                </Link>
            </div>

            {/* Form */}
            <ProductForm
                initialData={product as any}
                categories={categories}
                lots={lots}
            />
        </div>
    )
}
