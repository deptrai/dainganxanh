import type { Metadata } from 'next'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { ProductDetailClient } from '@/components/store/ProductDetailClient'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServiceRoleClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, description, product_categories(name, slug)')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  return {
    title: product ? `${product.name} — Cửa Hàng Trầm Hương` : 'Sản phẩm — Đại Ngàn Xanh',
    description: product?.description ?? 'Sản phẩm trầm hương thuần Việt từ vườn cây Dó Đen.',
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServiceRoleClient()

  const { data: rawProduct } = await supabase
    .from('products')
    .select(`
      id, category_id, name, slug, description, price, compare_at_price, stock_quantity,
      sku, images, specifications, origin_type, batch_certificate_url,
      is_featured, status,
      product_categories ( id, name, slug ),
      lots ( id, name, region )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  const product = rawProduct
    ? {
        ...rawProduct,
        product_categories: Array.isArray(rawProduct.product_categories)
          ? rawProduct.product_categories[0] ?? null
          : rawProduct.product_categories,
        lots: Array.isArray(rawProduct.lots) ? rawProduct.lots[0] ?? null : rawProduct.lots,
      }
    : null

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center text-gray-500">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h1>
          <p>Sản phẩm này không tồn tại hoặc đã ngừng bán.</p>
        </div>
      </div>
    )
  }

  const { data: related } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_at_price, stock_quantity, images, product_categories(name)')
    .eq('status', 'active')
    .neq('slug', slug)
    .eq('category_id', product.category_id)
    .limit(4)

  return (
    <ProductDetailClient
      product={product}
      related={related ?? []}
    />
  )
}
