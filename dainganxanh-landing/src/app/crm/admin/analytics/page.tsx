'use client'

import { useState, useEffect } from 'react'
import KPICard from '@/components/admin/KPICard'
import PlantingChart from '@/components/admin/PlantingChart'
import RevenueChart from '@/components/admin/RevenueChart'
import ConversionFunnel from '@/components/admin/ConversionFunnel'
import ExportButton from '@/components/admin/ExportButton'
import { getAnalyticsKPIs, getPlantingChartData, getRevenueChartData, getConversionFunnelData } from '@/actions/analytics'
import type { AnalyticsKPIs, PlantingChartData, RevenueChartData, ConversionFunnelData } from '@/actions/analytics'

export default function AnalyticsPage() {
    const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null)
    const [plantingData, setPlantingData] = useState<PlantingChartData[] | null>(null)
    const [revenueData, setRevenueData] = useState<RevenueChartData[] | null>(null)
    const [funnelData, setFunnelData] = useState<ConversionFunnelData[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30')

    const fetchData = async () => {
        setLoading(true)
        setError(null)

        try {
            // Calculate date range
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - parseInt(dateRange))

            const range = {
                start: start.toISOString(),
                end: end.toISOString()
            }

            // Fetch all data in parallel
            const [kpisResult, plantingResult, revenueResult, funnelResult] = await Promise.all([
                getAnalyticsKPIs(range),
                getPlantingChartData(range),
                getRevenueChartData(range),
                getConversionFunnelData()
            ])

            if (kpisResult.error) {
                throw new Error(kpisResult.error)
            }
            if (plantingResult.error) {
                throw new Error(plantingResult.error)
            }
            if (revenueResult.error) {
                throw new Error(revenueResult.error)
            }
            if (funnelResult.error) {
                throw new Error(funnelResult.error)
            }

            setKpis(kpisResult.data)
            setPlantingData(plantingResult.data)
            setRevenueData(revenueResult.data)
            setFunnelData(funnelResult.data)
        } catch (err) {
            console.error('Fetch analytics error:', err)
            setError(err instanceof Error ? err.message : 'Failed to load analytics')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [dateRange])

    if (loading && !kpis) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">❌ {error}</p>
                        <button
                            onClick={fetchData}
                            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">📊 Analytics Dashboard</h1>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Date Range Selector */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Khoảng thời gian:</label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value as '7' | '30' | '90')}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="7">7 ngày qua</option>
                                <option value="30">30 ngày qua</option>
                                <option value="90">90 ngày qua</option>
                            </select>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? '🔄 Đang tải...' : '🔄 Refresh'}
                        </button>

                        {/* Export Buttons */}
                        <ExportButton kpis={kpis} plantingData={plantingData} funnelData={funnelData} />
                    </div>
                </div>

                {/* KPI Cards with Trends */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <KPICard
                        title="Tổng số cây"
                        value={kpis?.totalTrees || 0}
                        icon="🌳"
                        color="emerald"
                        trend={kpis?.trends?.trees}
                    />
                    <KPICard
                        title="Người dùng hoạt động"
                        value={kpis?.activeUsers || 0}
                        icon="👥"
                        color="blue"
                        trend={kpis?.trends?.users}
                    />
                    <KPICard
                        title="Tổng doanh thu"
                        value={`${(kpis?.totalRevenue || 0).toLocaleString('vi-VN')} ₫`}
                        icon="💰"
                        color="purple"
                        trend={kpis?.trends?.revenue}
                    />
                    <KPICard
                        title="Carbon Offset"
                        value={`${(kpis?.carbonOffset || 0).toLocaleString('vi-VN')} kg`}
                        icon="🌍"
                        color="green"
                        trend={kpis?.trends?.carbon}
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <PlantingChart data={plantingData || []} />
                    <RevenueChart data={revenueData || []} />
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1">
                    <ConversionFunnel data={funnelData || []} />
                </div>
            </div>
        </div>
    )
}
