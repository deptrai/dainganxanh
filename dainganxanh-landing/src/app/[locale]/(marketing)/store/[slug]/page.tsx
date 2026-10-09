import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
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

  if (!product) return { title: 'Sản phẩm không tồn tại — Đại Ngàn Xanh', robots: { index: false, follow: false } }
  return {
    title: `${product.name} — Cửa Hàng Trầm Hương`,
    description: product.description ?? 'Sản phẩm trầm hương thuần Việt từ vườn cây Dó Đen.',
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

  const pickFirst = <T,>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? v[0] ?? null : v ?? null

  const product = rawProduct
    ? {
        ...rawProduct,
        product_categories: pickFirst(rawProduct.product_categories),
        lots: pickFirst(rawProduct.lots),
      }
    : null

  if (!product) notFound()

  const relatedQuery = product.category_id
    ? supabase
        .from('products')
        .select('id, name, slug, price, compare_at_price, stock_quantity, images, product_categories(name)')
        .eq('status', 'active')
        .neq('slug', slug)
        .eq('category_id', product.category_id)
        .limit(4)
    : null
  const { data: related } = relatedQuery ? await relatedQuery : { data: null }

  return (
    <ProductDetailClient
      key={product.id}
      product={product}
      related={related ?? []}
    />
  )
}
