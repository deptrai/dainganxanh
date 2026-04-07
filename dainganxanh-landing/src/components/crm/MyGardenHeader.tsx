'use client'

import NotificationBell from './NotificationBell'
import TreeSortFilter from './TreeSortFilter'

interface MyGardenHeaderProps {
    totalTrees: number
    totalCO2: number
    totalAmount: number
    hasOrders: boolean
}

export default function MyGardenHeader({ totalTrees, totalCO2, totalAmount, hasOrders }: MyGardenHeaderProps) {
    return (
        <div className="mb-6 space-y-3">
            {/* Title row */}
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-emerald-800">🌳 Vườn Cây Của Tôi</h1>
                    {hasOrders && (
                        <p className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)} • {totalTrees.toLocaleString()} cây • {totalCO2.toLocaleString()} kg CO₂/năm
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <NotificationBell />
                </div>
            </div>
            {/* Actions row */}
            <div className="flex items-center gap-2">
                <a
                    href="/crm/referrals"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Giới thiệu bạn bè
                </a>
                <TreeSortFilter />
            </div>
        </div>
    )
}
