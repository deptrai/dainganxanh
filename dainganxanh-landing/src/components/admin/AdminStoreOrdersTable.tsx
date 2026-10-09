'use client'

import { Fragment, useState, useTransition } from 'react'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { ChevronDownIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import { StoreOrderStatus } from '@/lib/store-order-status'
import StoreOrderStatusBadge from '@/components/crm/StoreOrderStatusBadge'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/format'
import { updateStoreOrderStatus } from '@/actions/adminStoreOrders'
import { useLocale, useTranslations } from 'next-intl'

export interface AdminStoreOrderItem {
    id: string
    product_id: string
    quantity: number
    unit_price: number
    subtotal?: number | null
    products?:
        | {
              id: string
              name: string
              slug: string
              images?: string[] | null
          }
        | {
              id: string
              name: string
              slug: string
              images?: string[] | null
          }[]
        | null
}

export interface AdminStoreOrder {
    id: string
    code: string
    user_id?: string | null
    customer_name: string
    customer_phone: string
    customer_email?: string | null
    shipping_address: string
    shipping_province?: string | null
    shipping_note?: string | null
    subtotal: number
    shipping_fee: number
    total_amount: number
    payment_method: string
    payment_ref?: string | null
    status: string
    tracking_number?: string | null
    cancellation_reason?: string | null
    expires_at?: string | null
    created_at: string
    updated_at?: string
    store_order_items?: AdminStoreOrderItem[] | null
}

interface AdminStoreOrdersTableProps {
    orders: AdminStoreOrder[]
    currentStatus?: string
}

export default function AdminStoreOrdersTable({ orders, currentStatus }: AdminStoreOrdersTableProps) {
    const locale = useLocale()
    const t = useTranslations('admin.storeOrders')
    const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({})
    const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({})
    const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null)
    const [cancelReason, setCancelReason] = useState('')
    const [actionError, setActionError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const toggleExpand = (orderId: string) => {
        setExpandedOrders((prev) => ({
            ...prev,
            [orderId]: !prev[orderId],
        }))
    }

    const closeCancelModal = () => {
        setCancelModalOrderId(null)
        setCancelReason('')
    }

    const handleUpdateStatus = (
        orderId: string,
        nextStatus: StoreOrderStatus,
        opts?: { trackingNumber?: string; cancellationReason?: string },
        onSuccess?: () => void
    ) => {
        setActionError(null)
        startTransition(async () => {
            try {
                const res = await updateStoreOrderStatus(orderId, nextStatus, opts)
                if (res.success) {
                    onSuccess?.()
                } else {
                    setActionError(res.error || 'Có lỗi xảy ra khi cập nhật trạng thái')
                }
            } catch {
                setActionError('Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại.')
            }
        })
    }

    const handleConfirmOrder = (order: AdminStoreOrder) => {
        if (
            order.payment_method === 'banking' &&
            !window.confirm(t('confirmBankingAlert'))
        ) {
            return
        }
        handleUpdateStatus(order.id, 'confirmed')
    }

    const handleShipOrder = (orderId: string) => {
        const tracking = trackingInputs[orderId]?.trim()
        if (!tracking) {
            setActionError(t('errors.enterTracking'))
            return
        }
        handleUpdateStatus(orderId, 'shipped', { trackingNumber: tracking })
    }

    const handleConfirmCancel = () => {
        if (!cancelModalOrderId) return
        const reason = cancelReason.trim()
        handleUpdateStatus(
            cancelModalOrderId,
            'cancelled',
            { cancellationReason: reason || undefined },
            closeCancelModal
        )
    }

    const orderToCancel = orders.find((o) => o.id === cancelModalOrderId)

    const getItemSummary = (items?: AdminStoreOrderItem[] | null) => {
        if (!items || items.length === 0) return t('noProducts')
        const first = items[0]
        const firstProd = Array.isArray(first.products) ? first.products[0] : first.products
        const firstName = firstProd?.name || 'Sản phẩm'
        if (items.length === 1) {
            return `${firstName} (x${first.quantity})`
        }
        return `${firstName} (x${first.quantity}) + ${items.length - 1} ${t('otherProducts')}`
    }

    const renderActionCell = (order: AdminStoreOrder, status: StoreOrderStatus) => {
        if (status === 'pending') {
            return (
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <button
                        onClick={() => handleConfirmOrder(order)}
                        disabled={isPending}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                    >
                        {t('actions.confirm')}
                    </button>
                    <button
                        onClick={() => {
                            setCancelModalOrderId(order.id)
                            setCancelReason('')
                        }}
                        disabled={isPending}
                        className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
                    >
                        {t('actions.cancel')}
                    </button>
                </div>
            )
        }
        if (status === 'confirmed') {
            return (
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <button
                        onClick={() => handleUpdateStatus(order.id, 'processing')}
                        disabled={isPending}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                    >
                        {t('actions.process')}
                    </button>
                    <button
                        onClick={() => {
                            setCancelModalOrderId(order.id)
                            setCancelReason('')
                        }}
                        disabled={isPending}
                        className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
                    >
                        {t('actions.cancel')}
                    </button>
                </div>
            )
        }
        if (status === 'processing') {
            return (
                <div className="flex items-center gap-1">
                    <input
                        type="text"
                        aria-label={t('trackingCode')}
                        placeholder={t('trackingCode')}
                        value={trackingInputs[order.id] || ''}
                        onChange={(e) =>
                            setTrackingInputs({
                                ...trackingInputs,
                                [order.id]: e.target.value,
                            })
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleShipOrder(order.id)
                        }}
                        disabled={isPending}
                        className="w-28 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                    />
                    <button
                        onClick={() => handleShipOrder(order.id)}
                        disabled={isPending}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                    >
                        {t('actions.ship')}
                    </button>
                </div>
            )
        }
        if (status === 'shipped') {
            return (
                <button
                    onClick={() => handleUpdateStatus(order.id, 'delivered')}
                    disabled={isPending}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                >
                    {t('actions.deliver')}
                </button>
            )
        }
        return <span className="text-xs text-gray-400">—</span>
    }

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200">
                {[
                    { label: t('tabs.all'), value: undefined },
                    { label: t('tabs.pending'), value: 'pending' },
                    { label: t('tabs.confirmed'), value: 'confirmed' },
                    { label: t('tabs.processing'), value: 'processing' },
                    { label: t('tabs.shipped'), value: 'shipped' },
                    { label: t('tabs.delivered'), value: 'delivered' },
                    { label: t('tabs.cancelled'), value: 'cancelled' },
                ].map((tab) => {
                    const isActive = (!currentStatus && !tab.value) || currentStatus === tab.value
                    const href = tab.value
                        ? `/crm/admin/store-orders?status=${tab.value}`
                        : '/crm/admin/store-orders'
                    return (
                        <Link
                            key={tab.label}
                            href={href}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                isActive
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            {tab.label}
                        </Link>
                    )
                })}
            </div>

            {/* Error Banner */}
            {actionError && (
                <div
                    role="alert"
                    className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between"
                >
                    <span>{actionError}</span>
                    <button
                        onClick={() => setActionError(null)}
                        className="text-red-500 hover:text-red-700 font-bold ml-2 px-1"
                        aria-label={t('aria.closeError')}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Empty State */}
            {orders.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <ShoppingBagIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{t('emptyTitle')}</h3>
                    <p className="text-sm text-gray-500">
                        {currentStatus
                            ? t('emptyFiltered')
                            : t('emptyDefault')}
                    </p>
                </div>
            ) : (
                /* Orders Table */
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4">{t('thCode')}</th>
                                    <th className="py-3 px-4">{t('thCustomer')}</th>
                                    <th className="py-3 px-4">{t('thProducts')}</th>
                                    <th className="py-3 px-4">{t('thTotal')}</th>
                                    <th className="py-3 px-4">{t('thAddress')}</th>
                                    <th className="py-3 px-4">{t('thStatus')}</th>
                                    <th className="py-3 px-4">{t('thDate')}</th>
                                    <th className="py-3 px-4 text-center">{t('thActions')}</th>
                                    <th className="py-3 px-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orders.map((order) => {
                                    const isExpanded = Boolean(expandedOrders[order.id])
                                    const status = order.status as StoreOrderStatus
                                    return (
                                        <Fragment key={order.id}>
                                            <tr className="hover:bg-gray-50/80 transition-colors">
                                                <td className="py-3 px-4 font-medium text-gray-900 font-mono text-xs whitespace-nowrap">
                                                    {order.code}
                                                </td>
                                                <td className="py-3 px-4 text-gray-900">
                                                    <div className="font-medium truncate max-w-[10rem]">
                                                        {order.customer_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-mono">
                                                        {order.customer_phone}
                                                    </div>
                                                    {order.customer_email && (
                                                        <div className="text-xs text-gray-400 truncate max-w-[10rem]">
                                                            {order.customer_email}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-gray-600 truncate max-w-[12rem]">
                                                    {getItemSummary(order.store_order_items)}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">
                                                    {formatCurrency(order.total_amount, locale)}
                                                </td>
                                                <td className="py-3 px-4 text-xs text-gray-600 truncate max-w-[12rem]">
                                                    {order.shipping_province
                                                        ? `${order.shipping_province} - ${order.shipping_address}`
                                                        : order.shipping_address}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <StoreOrderStatusBadge status={status} />
                                                </td>
                                                <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                                                    {formatDate(order.created_at, locale)}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {renderActionCell(order, status)}
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleExpand(order.id)}
                                                        aria-expanded={isExpanded}
                                                        aria-label={
                                                            isExpanded
                                                                ? t('aria.collapseDetails')
                                                                : t('aria.viewDetails')
                                                        }
                                                        className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                                                    >
                                                        <ChevronDownIcon
                                                            className={`w-4 h-4 transition-transform duration-200 ${
                                                                isExpanded ? 'rotate-180' : ''
                                                            }`}
                                                        />
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expandable Accordion Body */}
                                            {isExpanded && (
                                                <tr>
                                                    <td
                                                        colSpan={9}
                                                        className="px-6 py-4 bg-gray-50/90 border-t border-gray-100"
                                                    >
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            {/* Column 1: Items List */}
                                                            <div className="space-y-2 md:col-span-2">
                                                                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                    {t('productDetails')} (
                                                                    {order.store_order_items?.length || 0})
                                                                </h4>
                                                                {order.store_order_items &&
                                                                order.store_order_items.length > 0 ? (
                                                                    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 overflow-hidden bg-white">
                                                                        {order.store_order_items.map((item) => {
                                                                            const prod = Array.isArray(item.products)
                                                                                ? item.products[0]
                                                                                : item.products
                                                                            const itemImage =
                                                                                prod?.images && prod.images.length > 0
                                                                                    ? prod.images[0]
                                                                                    : null
                                                                            return (
                                                                                <div
                                                                                    key={item.id}
                                                                                    className="p-3 flex items-center justify-between text-sm"
                                                                                >
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-100 overflow-hidden flex-shrink-0 relative">
                                                                                            {itemImage ? (
                                                                                                <Image
                                                                                                    src={itemImage}
                                                                                                    alt={prod?.name || 'Sản phẩm'}
                                                                                                    fill
                                                                                                    sizes="40px"
                                                                                                    className="object-cover"
                                                                                                />
                                                                                            ) : (
                                                                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                                                    <ShoppingBagIcon className="w-5 h-5" />
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="font-medium text-gray-900">
                                                                                                {prod?.name || 'Sản phẩm'}
                                                                                            </p>
                                                                                            <p className="text-xs text-gray-500">
                                                                                                {t('quantity')}: {item.quantity}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <p className="font-medium text-gray-900">
                                                                                            {formatCurrency(item.unit_price * item.quantity, locale)}
                                                                                        </p>
                                                                                        <p className="text-xs text-gray-500">
                                                                                            {t('unitPrice')}: {formatCurrency(item.unit_price, locale)}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-gray-500">
                                                                        {t('noProducts')}
                                                                    </p>
                                                                )}

                                                                {/* Financial breakdown */}
                                                                <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-1 text-sm">
                                                                    <div className="flex justify-between text-gray-600">
                                                                        <span>{t('subtotal')}</span>
                                                                        <span>{formatCurrency(order.subtotal, locale)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-gray-600">
                                                                        <span>{t('shippingFee')}</span>
                                                                        <span>
                                                                            {order.shipping_fee > 0
                                                                                ? formatCurrency(order.shipping_fee, locale)
                                                                                : t('freeShipping')}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
                                                                        <span>{t('total')}</span>
                                                                        <span>{formatCurrency(order.total_amount, locale)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Column 2: Order Details */}
                                                            <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 text-sm">
                                                                {/* Shipping Address */}
                                                                <div>
                                                                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                                                        {t('shippingAddress')}
                                                                    </h4>
                                                                    <p className="text-gray-800">
                                                                        {order.shipping_address}
                                                                    </p>
                                                                    {order.shipping_province && (
                                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                                            {t('province')}: {order.shipping_province}
                                                                        </p>
                                                                    )}
                                                                    {order.shipping_note && (
                                                                        <p className="text-xs text-gray-500 italic mt-0.5">
                                                                            {t('note')}: {order.shipping_note}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Payment Information */}
                                                                <div className="pt-2 border-t border-gray-100">
                                                                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                                                        {t('payment')}
                                                                    </h4>
                                                                    <p className="text-gray-800">
                                                                        {order.payment_method === 'banking'
                                                                            ? t('banking')
                                                                            : t('cod')}
                                                                    </p>
                                                                    {order.payment_ref && (
                                                                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                                                                            {t('transactionCode')}: {order.payment_ref}
                                                                        </p>
                                                                    )}
                                                                    {order.expires_at && order.status === 'pending' && (
                                                                        <p className="text-xs text-amber-600 mt-0.5">
                                                                            {t('paymentDeadline')}:{' '}
                                                                            {formatDateTime(order.expires_at, locale)}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Fulfillment info (tracking, cancel reason) */}
                                                                {(order.tracking_number ||
                                                                    order.cancellation_reason) && (
                                                                    <div className="pt-2 border-t border-gray-100">
                                                                        {order.tracking_number && (
                                                                            <div>
                                                                                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                                                                    {t('shipping')}
                                                                                </h4>
                                                                                <p className="text-sm font-mono text-indigo-700 font-medium">
                                                                                    {t('trackingCode')}: {order.tracking_number}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                        {order.cancellation_reason && (
                                                                            <div className="mt-2">
                                                                                <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
                                                                                    {t('cancellationReason')}
                                                                                </h4>
                                                                                <p className="text-xs text-red-700">
                                                                                    {order.cancellation_reason}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {cancelModalOrderId && orderToCancel && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cancel-dialog-title"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isPending) closeCancelModal()
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape' && !isPending) closeCancelModal()
                    }}
                >
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <h3 id="cancel-dialog-title" className="text-lg font-bold text-gray-900">
                            {t('cancelModal.title', { code: orderToCancel.code })}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {t('cancelModal.description')}
                        </p>
                        <div>
                            <label
                                htmlFor="cancel-reason-input"
                                className="block text-xs font-medium text-gray-700 mb-1"
                            >
                                {t('cancelModal.reasonLabel')}
                            </label>
                            <input
                                id="cancel-reason-input"
                                type="text"
                                placeholder={t('cancelModal.placeholder')}
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                autoFocus
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={closeCancelModal}
                                disabled={isPending}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {t('cancelModal.close')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                disabled={isPending}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
                            >
                                {t('cancelModal.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
