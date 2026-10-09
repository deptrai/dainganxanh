'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, ChevronDown, ShoppingBag, Truck, MapPin, CreditCard } from 'lucide-react'
import StoreOrderStatusBadge from './StoreOrderStatusBadge'
import { formatDate, formatCurrency } from '@/lib/format'

export interface StoreOrderItem {
    id: string
    name: string
    slug: string
    image: string | null
    quantity: number
    unitPrice: number
}

export interface StoreOrder {
    id: string
    code: string
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string
    totalAmount: number
    shippingFee: number
    paymentMethod?: 'banking' | 'cod'
    shippingAddress?: string
    trackingNumber?: string | null
    createdAt?: string
    items: StoreOrderItem[]
}

export interface StoreOrdersListProps {
    orders: StoreOrder[]
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
}

export default function StoreOrdersList({
    orders,
    page,
    pageSize: _pageSize,
    totalCount,
    totalPages,
}: StoreOrdersListProps) {
    const locale = useLocale()
    const t = useTranslations('crm.storeOrders')
    const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({})

    const toggleOrder = (id: string) => {
        setExpandedOrders((prev) => ({
            ...prev,
            [id]: !prev[id],
        }))
    }

    if (!orders || (orders.length === 0 && totalCount === 0)) {
        return (
            <div className="bg-white rounded-2xl border border-emerald-100 p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('emptyTitle')}</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                    {t('emptyDesc')}
                </p>
                <Link
                    href="/store"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-emerald-200"
                >
                    <span>{t('shopNow')}</span>
                </Link>
            </div>
        )
    }

    const safeTotalPages = Math.max(1, totalPages)

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {orders.map((order) => {
                    const isExpanded = Boolean(expandedOrders[order.id])
                    return (
                        <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Header */}
                            <button
                                type="button"
                                onClick={() => toggleOrder(order.id)}
                                aria-expanded={isExpanded}
                                className="w-full text-left p-4 bg-gray-50/50 hover:bg-gray-100/50 transition-colors flex flex-wrap items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                            >
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-emerald-700 text-sm">
                                        #{order.code}
                                    </span>
                                    <StoreOrderStatusBadge status={order.status} />
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>{formatDate(order.createdAt, locale)}</span>
                                    <span className="font-bold text-emerald-700 text-sm">
                                        {formatCurrency(order.totalAmount, locale)}
                                    </span>
                                    <ChevronDown
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                            isExpanded ? 'rotate-180' : ''
                                        }`}
                                    />
                                </div>
                            </button>

                            {/* Details */}
                            {isExpanded && (
                                <div className="border-t border-gray-100">
                                    {/* Items */}
                                    <div className="p-4 space-y-3">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ShoppingBag className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {item.slug ? (
                                                        <Link
                                                            href={`/store/${item.slug}`}
                                                            className="font-medium text-gray-900 text-sm hover:text-emerald-700 transition-colors truncate block"
                                                        >
                                                            {item.name}
                                                        </Link>
                                                    ) : (
                                                        <span className="font-medium text-gray-900 text-sm truncate block">
                                                            {item.name}
                                                        </span>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                        {item.quantity} × {formatCurrency(item.unitPrice, locale)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Info rows */}
                                    <div className="px-4 pb-4 space-y-2 text-sm">
                                        {order.shippingAddress && (
                                            <div className="flex items-start gap-2 text-gray-600">
                                                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                                <span className="text-xs leading-relaxed">{order.shippingAddress}</span>
                                            </div>
                                        )}
                                        {order.trackingNumber && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Truck className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span className="text-xs">
                                                    {t('trackingNumber')}: <span className="font-mono font-medium">{order.trackingNumber}</span>
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span className="text-xs">
                                                {order.paymentMethod === 'cod' ? t('paymentCod') : t('paymentBanking')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                                        <span className="text-xs text-gray-500">
                                            {order.shippingFee > 0 ? t('shippingFee', { fee: formatCurrency(order.shippingFee, locale) }) : t('freeShipping')}
                                        </span>
                                        <span className="font-bold text-emerald-700">
                                            {formatCurrency(order.totalAmount, locale)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Pagination */}
            {safeTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                        {t('pagination.showing', { count: orders.length, total: totalCount, page, totalPages: safeTotalPages })}
                    </p>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/crm/my-store-orders?page=${page - 1}`}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                page <= 1
                                    ? 'text-gray-400 cursor-not-allowed pointer-events-none'
                                    : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                            aria-label={t('pagination.prev')}
                            aria-disabled={page <= 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>{t('pagination.prev')}</span>
                        </Link>
                        <span className="text-xs font-medium text-gray-700 px-2">
                            {page} / {safeTotalPages}
                        </span>
                        <Link
                            href={`/crm/my-store-orders?page=${page + 1}`}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                page >= safeTotalPages
                                    ? 'text-gray-400 cursor-not-allowed pointer-events-none'
                                    : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                            aria-label={t('pagination.next')}
                            aria-disabled={page >= safeTotalPages}
                        >
                            <span>{t('pagination.next')}</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

export { StoreOrdersList }
