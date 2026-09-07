'use client'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export interface BookingStatusBadgeProps {
    status: BookingStatus | string
    className?: string
}

export const BOOKING_STATUS_CONFIG: Record<
    BookingStatus,
    { label: string; className: string }
> = {
    pending: { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-800' },
    confirmed: { label: 'Đã xác nhận', className: 'bg-emerald-100 text-emerald-800' },
    cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' },
    completed: { label: 'Hoàn thành', className: 'bg-blue-100 text-blue-800' },
    no_show: { label: 'Không đến', className: 'bg-gray-100 text-gray-800' },
}

export default function BookingStatusBadge({ status, className = '' }: BookingStatusBadgeProps) {
    const config = BOOKING_STATUS_CONFIG[status as BookingStatus] || {
        label: status || 'Không xác định',
        className: 'bg-gray-100 text-gray-800',
    }

    return (
        <span
            data-testid="booking-status-badge"
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`.trim()}
        >
            {config.label}
        </span>
    )
}

export { BookingStatusBadge }

