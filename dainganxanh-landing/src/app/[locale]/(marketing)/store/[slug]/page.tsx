import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { ProductDetailClient } from '@/components/store/ProductDetailClient'
import { getTranslatedField } from '@/lib/translations'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'store.metadata' })
  const supabase = createServiceRoleClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, description, translations, product_categories(name, slug, translations)')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (!product) return { title: t('notFoundTitle'), robots: { index: false, follow: false } }
  const productName = getTranslatedField(product, 'name', locale)
  const productDesc = getTranslatedField(product, 'description', locale)
  const canonical = locale === 'vi' ? `https://dainganxanh.com.vn/store/${slug}` : `https://dainganxanh.com.vn/en/store/${slug}`
  return {
    title: t('productDetailTitle', { name: productName }),
    description: productDesc || t('productFallbackDesc'),
    alternates: {
      canonical,
      languages: {
        vi: `https://dainganxanh.com.vn/store/${slug}`,
        en: `https://dainganxanh.com.vn/en/store/${slug}`,
        'x-default': `https://dainganxanh.com.vn/store/${slug}`,
      },
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string; locale?: string }> }) {
  const { slug, locale = 'vi' } = await params
  setRequestLocale(locale)
  const supabase = createServiceRoleClient()

  const { data: rawProduct } = await supabase
    .from('products')
    .select(`
      id, category_id, name, slug, description, price, compare_at_price, stock_quantity,
      sku, images, specifications, origin_type, batch_certificate_url,
      is_featured, status, translations,
      product_categories ( id, name, slug, translations ),
      lots ( id, name, region, translations )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  const pickFirst = <T,>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? v[0] ?? null : v ?? null

  const product = rawProduct
    ? {
        ...rawProduct,
        name: getTranslatedField(rawProduct, 'name', locale),
        description: getTranslatedField(rawProduct, 'description', locale),
        product_categories: pickFirst(rawProduct.product_categories)
          ? {
              ...pickFirst(rawProduct.product_categories)!,
              name: getTranslatedField(pickFirst(rawProduct.product_categories)!, 'name', locale),
            }
          : null,
        lots: pickFirst(rawProduct.lots)
          ? {
              ...pickFirst(rawProduct.lots)!,
              name: getTranslatedField(pickFirst(rawProduct.lots)!, 'name', locale),
            }
          : null,
      }
    : null

  if (!product) notFound()

  const relatedQuery = product.category_id
    ? supabase
        .from('products')
        .select('id, name, slug, price, compare_at_price, stock_quantity, images, translations, product_categories(name, translations)')
        .eq('status', 'active')
        .neq('slug', slug)
        .eq('category_id', product.category_id)
        .limit(4)
    : null
  const { data: rawRelated } = relatedQuery ? await relatedQuery : { data: null }

  const related = (rawRelated ?? []).map((item) => ({
    ...item,
    name: getTranslatedField(item, 'name', locale),
    product_categories: pickFirst(item.product_categories)
      ? {
          name: getTranslatedField(pickFirst(item.product_categories)!, 'name', locale),
        }
      : null,
  }))

  return (
    <ProductDetailClient
      key={product.id}
      product={product as any}
      related={related as any}
    />
  )
}
