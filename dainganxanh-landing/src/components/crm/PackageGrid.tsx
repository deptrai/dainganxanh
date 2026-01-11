'use client'

import PackageCard from './PackageCard'

interface PackageGridProps {
    orders: Array<{
        id: string
        order_code: string | null
        quantity: number
        status: string
        tree_status: string | null
        planted_at: string | null
        co2_absorbed: number | null
        latest_photo_url: string | null
        created_at: string
    }>
}

export default function PackageGrid({ orders }: PackageGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {orders.map((order) => (
                <PackageCard key={order.id} order={order} />
            ))}
        </div>
    )
}
