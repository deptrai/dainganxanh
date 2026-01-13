'use client'

interface KPICardProps {
    title: string
    value: string | number
    icon: string
    trend?: {
        value: number
        isPositive: boolean
    }
    color?: string
}

export default function KPICard({ title, value, icon, trend, color = 'emerald' }: KPICardProps) {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-700',
        blue: 'bg-blue-50 text-blue-700',
        purple: 'bg-purple-50 text-purple-700',
        green: 'bg-green-50 text-green-700'
    }

    const bgColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.emerald

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6">
            {/* Icon and Title */}
            <div className="flex items-center justify-between mb-4">
                <div className={`${bgColor} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{trend.isPositive ? '↑' : '↓'}</span>
                        <span>{Math.abs(trend.value).toFixed(1)}%</span>
                    </div>
                )}
            </div>

            {/* Title */}
            <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>

            {/* Value */}
            <p className="text-3xl font-bold text-gray-900">
                {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
            </p>
        </div>
    )
}
