'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, ShoppingBag, Truck, MapPin, CreditCard } from 'lucide-react'
import StoreOrderStatusBadge from './StoreOrderStatusBadge'
import { formatDateVN, formatVND } from '@/lib/date'

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
    pageSize,
    totalCount,
    totalPages,
}: StoreOrdersListProps) {
    if (!orders || orders.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-emerald-100 p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Bạn chưa có đơn hàng nào</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                    Khám phá các sản phẩm trầm hương thuần Việt từ vườn cây của chúng tôi.
                </p>
                <Link
                    href="/store"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-emerald-200"
                >
                    <span>Mua sắm ngay</span>
                </Link>
            </div>
        )
    }

    const safeTotalPages = Math.max(1, totalPages)

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-emerald-700 text-sm">
                                    #{order.code}
                                </span>
                                <StoreOrderStatusBadge status={order.status} />
                            </div>
                            <span className="text-xs text-gray-500">
                                {formatDateVN(order.createdAt)}
                            </span>
                        </div>

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
                                        <Link
                                            href={`/store/${item.slug}`}
                                            className="font-medium text-gray-900 text-sm hover:text-emerald-700 transition-colors truncate block"
                                        >
                                            {item.name}
                                        </Link>
                                        <p className="text-xs text-gray-500">
                                            {item.quantity} × {formatVND(item.unitPrice)}
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
                                        Mã vận đơn: <span className="font-mono font-medium">{order.trackingNumber}</span>
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600">
                                <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="text-xs">
                                    {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                {order.shippingFee > 0 ? `Phí ship: ${formatVND(order.shippingFee)}` : 'Miễn phí vận chuyển'}
                            </span>
                            <span className="font-bold text-emerald-700">
                                {formatVND(order.totalAmount)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {safeTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                        Hiển thị {orders.length} / {totalCount} đơn (Trang {page} / {safeTotalPages})
                    </p>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/crm/my-store-orders?page=${page - 1}`}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                page <= 1
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                            aria-label="Trang trước"
                            aria-disabled={page <= 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Trước</span>
                        </Link>
                        <span className="text-xs font-medium text-gray-700 px-2">
                            {page} / {safeTotalPages}
                        </span>
                        <Link
                            href={`/crm/my-store-orders?page=${page + 1}`}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                page >= safeTotalPages
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                            aria-label="Trang sau"
                            aria-disabled={page >= safeTotalPages}
                        >
                            <span>Sau</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

export { StoreOrdersList }
