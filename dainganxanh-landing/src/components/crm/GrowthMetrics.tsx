'use client'

interface GrowthMetricsProps {
    co2Total: number
    ageInMonths: number
    quantity: number
    progressToHarvest: number
}

export default function GrowthMetrics({ co2Total, ageInMonths, quantity, progressToHarvest }: GrowthMetricsProps) {
    // Estimate value (simple calculation: 260k initial + growth over time)
    const estimatedValue = quantity * 260000 * (1 + (ageInMonths / 60) * 0.5)

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* CO2 Absorbed */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">💨</span>
                    <h3 className="text-lg font-semibold text-gray-700">CO₂ Hấp Thụ</h3>
                </div>
                <p className="text-3xl font-bold text-emerald-600">
                    {co2Total.toFixed(1)} kg
                </p>
                <p className="text-sm text-gray-500 mt-1">mỗi năm</p>
            </div>

            {/* Age */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">📆</span>
                    <h3 className="text-lg font-semibold text-gray-700">Tuổi Cây</h3>
                </div>
                <p className="text-3xl font-bold text-emerald-600">
                    {ageInMonths} tháng
                </p>
                <p className="text-sm text-gray-500 mt-1">
                    {ageInMonths < 12 ? 'Còn nhỏ' : `${Math.floor(ageInMonths / 12)} năm`}
                </p>
            </div>

            {/* Estimated Value */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">💰</span>
                    <h3 className="text-lg font-semibold text-gray-700">Giá Trị Ước Tính</h3>
                </div>
                <p className="text-3xl font-bold text-emerald-600">
                    {(estimatedValue / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-gray-500 mt-1">VNĐ</p>
            </div>

            {/* Progress to Harvest */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:col-span-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">🎯</span>
                        <h3 className="text-lg font-semibold text-gray-700">Tiến Độ Đến Thu Hoạch</h3>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600">
                        {progressToHarvest.toFixed(0)}%
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-emerald-500 to-green-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressToHarvest}%` }}
                    />
                </div>

                <p className="text-sm text-gray-500 mt-2">
                    {ageInMonths < 60
                        ? `Còn ${60 - ageInMonths} tháng nữa đến năm thứ 5`
                        : 'Đã đến thời điểm thu hoạch!'}
                </p>
            </div>
        </div>
    )
}
