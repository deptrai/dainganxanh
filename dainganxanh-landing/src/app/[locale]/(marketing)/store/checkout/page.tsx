import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/getEffectiveUser'
import { StoreCheckoutClient } from '@/components/store/StoreCheckoutClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'store.metadata' })
  return {
    title: t('checkoutTitle'),
    description: t('checkoutDesc'),
    robots: { index: false, follow: false },
  }
}

export default async function StoreCheckoutPage({
  params = Promise.resolve({ locale: 'vi' }),
  searchParams,
}: {
  params?: Promise<{ locale: string }>
  searchParams: Promise<{ slug?: string; quantity?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const { slug, quantity } = await searchParams
  const t = await getTranslations({ locale, namespace: 'store.checkoutPage' })

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t('noProduct')}</p>
      </div>
    )
  }

  const qty = Math.max(1, Math.min(parseInt(quantity || '1', 10) || 1, 10))
  const supabase = createServiceRoleClient()

  const { data: product } = await supabase
    .from('products')
    .select('id, name, slug, price, stock_quantity, images')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t('notFound')}</p>
      </div>
    )
  }

  if (product.stock_quantity < qty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{t('outOfStock', { stock: product.stock_quantity, requested: qty })}</p>
      </div>
    )
  }

  let user = null
  try {
    user = await getEffectiveUser()
  } catch {
    // Guest or auth error
  }
  const prefill = user
    ? {
        name: user.name || undefined,
        email: user.email || undefined,
      }
    : undefined

  return (
    <StoreCheckoutClient
      product={product}
      quantity={qty}
      prefill={prefill}
    />
  )
}
