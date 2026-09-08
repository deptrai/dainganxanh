import type { Metadata } from 'next'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { StoreClient } from '@/components/store/StoreClient'

export const revalidate = 3600

export const metadata: Metadata = {
    title: 'Cửa Hàng Trầm Hương — Đại Ngàn Xanh',
    description: 'Mua sản phẩm trầm hương thuần Việt: nước hoa, tinh dầu, hương liệu, thủ công mỹ nghệ từ vườn cây Dó Đen.',
    alternates: { canonical: 'https://dainganxanh.com.vn/store' },
}

export default async function StorePage() {
    const supabase = createServiceRoleClient()

    const { data: categories } = await supabase
        .from('product_categories')
        .select('id, name, slug')
        .order('sort_order')

    const { data: products } = await supabase
        .from('products')
        .select(`
            id, name, slug, price, compare_at_price, stock_quantity,
            images, is_featured, status,
            product_categories ( name, slug )
        `)
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

    return (
        <StoreClient
            categories={categories ?? []}
            products={(products ?? []) as any}
        />
    )
}
