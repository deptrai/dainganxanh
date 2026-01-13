'use client'

import {
    CursorArrowRaysIcon,
    ShoppingCartIcon,
    BanknotesIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline'

interface ReferralStatsProps {
    stats: {
        totalClicks: number
        conversions: number
        commission: number
        conversionRate: number
    }
}

export function ReferralStats({ stats }: ReferralStatsProps) {
    const statCards = [
        {
            label: 'Tổng Clicks',
            value: stats.totalClicks.toLocaleString('vi-VN'),
            icon: CursorArrowRaysIcon,
            color: 'blue',
        },
        {
            label: 'Chuyển Đổi',
            value: stats.conversions.toLocaleString('vi-VN'),
            icon: ShoppingCartIcon,
            color: 'green',
        },
        {
            label: 'Hoa Hồng',
            value: `${stats.commission.toLocaleString('vi-VN')}đ`,
            icon: BanknotesIcon,
            color: 'yellow',
        },
        {
            label: 'Tỷ Lệ Chuyển Đổi',
            value: `${stats.conversionRate}%`,
            icon: ChartBarIcon,
            color: 'purple',
        },
    ]

    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => {
                const Icon = stat.icon
                const colorClass = colorClasses[stat.color as keyof typeof colorClasses]

                return (
                    <div
                        key={index}
                        className="bg-white rounded-lg shadow-md p-6 border border-brand-100 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${colorClass}`}>
                                <Icon className="h-6 w-6" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                            <p className="text-2xl font-bold text-brand-600">{stat.value}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
