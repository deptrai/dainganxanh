import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { STORE_ORDER_STATUS_CONFIG, type StoreOrderStatus } from '@/lib/store-order-status'
import { CheckCircle2, XCircle, Package, Truck, Phone } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { notFound } from 'next/navigation'
import { formatCurrency } from '@/lib/format'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'store.metadata' })
  return {
    title: t('successTitle'),
    description: t('successDesc'),
  }
}

export default async function StoreSuccessPage({
  params = Promise.resolve({ locale: 'vi' }),
  searchParams,
}: {
  params?: Promise<{ locale: string }>
  searchParams: Promise<{ code?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const { code } = await searchParams
  if (!code) notFound()

  const t = await getTranslations({ locale, namespace: 'store.successPage' })
  const tStatus = await getTranslations({ locale, namespace: 'store.statuses' })

  const supabase = createServiceRoleClient()
  const { data: order } = await supabase
    .from('store_orders')
    .select(`
      id,
      code,
      status,
      customer_name,
      total_amount,
      payment_method,
      expires_at,
      created_at,
      store_order_items(product_id, products(slug))
    `)
    .eq('code', code)
    .maybeSingle()

  if (!order) notFound()

  // Expired = the 15-min payment window elapsed — regardless of who/what cancelled.
  // COD orders never carry expires_at, so a cancelled COD is never "expired".
  const isExpired = Boolean(order.expires_at && new Date(order.expires_at).getTime() < Date.now())
  const isCancelled = order.status === 'cancelled'
  const isBadState = isExpired || isCancelled

  if (isExpired && order.status === 'pending') {
    // Cron hasn't flipped it yet — expire now so reserved stock frees before a reorder.
    try {
      await supabase.rpc('expire_pending_store_orders')
    } catch {
      // best effort; the cron will pick it up
    }
  }

  // ponytail: reorder links to the first item's product page; orders are single-item
  // by design (create route inserts exactly one item) — multi-item guard falls back to /store.
  const orderItems = (order as {
    store_order_items?: Array<{
      product_id: string
      products: { slug: string } | Array<{ slug: string }> | null
    }>
  }).store_order_items ?? []
  const firstItem = orderItems[0]
  const productInfo = Array.isArray(firstItem?.products) ? firstItem.products[0] : firstItem?.products
  const productSlug = productInfo?.slug
  const reorderHref = orderItems.length === 1 && productSlug ? `/store/${productSlug}` : '/store'

  const amount = order.total_amount
  const statusConfig = STORE_ORDER_STATUS_CONFIG[order.status as StoreOrderStatus]
  const statusLabel = isExpired ? tStatus('expired') : (tStatus(order.status as any) || statusConfig?.label || order.status)
  const statusChipClass = isExpired ? 'bg-red-100 text-red-800' : (statusConfig?.className ?? 'bg-stone-100 text-gray-800')
  const heading = isExpired
    ? t('headingExpired')
    : isCancelled
      ? t('headingCancelled')
      : order.payment_method === 'cod'
        ? t('headingCodSuccess')
        : order.status === 'confirmed'
          ? t('headingPaidSuccess')
          : t('headingPending')

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-8 max-w-md w-full text-center">
        <div className={`w-20 h-20 ${isBadState ? 'bg-red-100' : 'bg-emerald-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
          {isBadState
            ? <XCircle className="w-10 h-10 text-red-600" />
            : <CheckCircle2 className="w-10 h-10 text-emerald-600" />}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {heading}
        </h1>
        <p className="text-gray-600 mb-6">
          {t.rich('thankYou', {
            name: order.customer_name,
            customer: (chunks) => <span className="font-semibold text-gray-900">{chunks}</span>,
          })}
        </p>

        <div className="bg-stone-100 rounded-xl p-4 text-left space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('orderCode')}</span>
            <span className="font-mono font-bold text-emerald-700">{order.code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('totalAmount')}</span>
            <span className="font-bold text-gray-900">{formatCurrency(amount, locale)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('paymentMethod')}</span>
            <span className="font-medium text-gray-900">{order.payment_method === 'cod' ? t('cod') : t('banking')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">{t('status')}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusChipClass}`}>{statusLabel}</span>
          </div>
        </div>

        <div className="space-y-3 text-left text-sm text-gray-600 mb-8">
          {!isBadState && (
            <>
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{t('shippingNotice')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{t('trackingNotice')}</span>
              </div>
            </>
          )}
          <div className="flex items-start gap-3">
            <Phone className={`w-5 h-5 ${isBadState ? 'text-red-600' : 'text-emerald-600'} shrink-0`} />
            <span>
              {t.rich('hotlineNotice', {
                phone: '0909 888 999',
                hotline: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          {isExpired ? (
            <Link
              href={reorderHref}
              className="flex-1 py-3 bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-800 transition-colors text-center"
            >
              {t('reorder')}
            </Link>
          ) : (
            <Link
              href="/store"
              className="flex-1 py-3 border border-emerald-600 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors text-center"
            >
              {t('continueShopping')}
            </Link>
          )}
          <Link
            href="/crm/my-store-orders"
            className={`flex-1 py-3 ${isExpired ? 'border border-emerald-600 text-emerald-700 hover:bg-emerald-50' : 'bg-emerald-700 text-white hover:bg-emerald-800'} font-semibold rounded-xl transition-colors text-center`}
          >
            {t('viewOrder')}
          </Link>
        </div>
      </div>
    </div>
  )
}
