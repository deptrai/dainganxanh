'use client'

import {
    type StoreOrderStatus,
    STORE_ORDER_STATUS_CONFIG,
} from '@/lib/store-order-status'

export type { StoreOrderStatus }
export { STORE_ORDER_STATUS_CONFIG }

export interface StoreOrderStatusBadgeProps {
    status: StoreOrderStatus | string
    className?: string
}

export default function StoreOrderStatusBadge({ status, className = '' }: StoreOrderStatusBadgeProps) {
    const config = STORE_ORDER_STATUS_CONFIG[status as StoreOrderStatus] || {
        label: status || 'Không xác định',
        className: 'bg-gray-100 text-gray-800',
    }

    return (
        <span
            data-testid="store-order-status-badge"
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`.trim()}
        >
            {config.label}
        </span>
    )
}

export { StoreOrderStatusBadge }
