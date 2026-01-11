'use client'

import NotificationBell from './NotificationBell'
import TreeSortFilter from './TreeSortFilter'

interface MyGardenHeaderProps {
    totalTrees: number
    totalCO2: number
    hasOrders: boolean
}

export default function MyGardenHeader({ totalTrees, totalCO2, hasOrders }: MyGardenHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-emerald-800">
                    🌳 Vườn Cây Của Tôi
                </h1>
                {hasOrders && (
                    <p className="text-gray-600 mt-1">
                        {totalTrees.toLocaleString()} cây • {totalCO2.toLocaleString()} kg CO₂/năm
                    </p>
                )}
            </div>
            <div className="flex items-center gap-4">
                <NotificationBell />
                <TreeSortFilter />
            </div>
        </div>
    )
}
