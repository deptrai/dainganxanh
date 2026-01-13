'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

interface ExportButtonProps {
    kpis: {
        totalTrees: number
        activeUsers: number
        totalRevenue: number
        carbonOffset: number
    } | null
    plantingData: Array<{ month: string; count: number }> | null
    funnelData: Array<{ stage: string; count: number; percentage: number }> | null
}

export default function ExportButton({ kpis, plantingData, funnelData }: ExportButtonProps) {
    const [exporting, setExporting] = useState(false)

    const exportPDF = async () => {
        setExporting(true)
        try {
            const doc = new jsPDF()

            // Title
            doc.setFontSize(20)
            doc.text('Đại Ngàn Xanh - Analytics Report', 20, 20)

            // Date
            doc.setFontSize(10)
            doc.text(`Generated: ${new Date().toLocaleDateString('vi-VN')}`, 20, 30)

            // KPIs
            doc.setFontSize(14)
            doc.text('Key Performance Indicators', 20, 45)
            doc.setFontSize(10)

            if (kpis) {
                doc.text(`Total Trees: ${kpis.totalTrees.toLocaleString('vi-VN')}`, 30, 55)
                doc.text(`Active Users: ${kpis.activeUsers.toLocaleString('vi-VN')}`, 30, 62)
                doc.text(`Total Revenue: ${kpis.totalRevenue.toLocaleString('vi-VN')} VND`, 30, 69)
                doc.text(`Carbon Offset: ${kpis.carbonOffset.toLocaleString('vi-VN')} kg CO2`, 30, 76)
            }

            // Planting Data
            if (plantingData && plantingData.length > 0) {
                doc.setFontSize(14)
                doc.text('Trees Planted Over Time', 20, 95)
                doc.setFontSize(10)

                let y = 105
                plantingData.forEach((item, index) => {
                    if (y > 270) {
                        doc.addPage()
                        y = 20
                    }
                    doc.text(`${item.month}: ${item.count} trees`, 30, y)
                    y += 7
                })
            }

            // Save PDF
            doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`)
        } catch (error) {
            console.error('PDF export error:', error)
            alert('Lỗi khi xuất PDF')
        } finally {
            setExporting(false)
        }
    }

    const exportExcel = () => {
        setExporting(true)
        try {
            const wb = XLSX.utils.book_new()

            // KPIs Sheet
            if (kpis) {
                const kpisData = [
                    ['Metric', 'Value'],
                    ['Total Trees', kpis.totalTrees],
                    ['Active Users', kpis.activeUsers],
                    ['Total Revenue (VND)', kpis.totalRevenue],
                    ['Carbon Offset (kg CO2)', kpis.carbonOffset]
                ]
                const ws1 = XLSX.utils.aoa_to_sheet(kpisData)
                XLSX.utils.book_append_sheet(wb, ws1, 'KPIs')
            }

            // Planting Data Sheet
            if (plantingData && plantingData.length > 0) {
                const ws2 = XLSX.utils.json_to_sheet(plantingData)
                XLSX.utils.book_append_sheet(wb, ws2, 'Planting Data')
            }

            // Funnel Data Sheet
            if (funnelData && funnelData.length > 0) {
                const ws3 = XLSX.utils.json_to_sheet(funnelData)
                XLSX.utils.book_append_sheet(wb, ws3, 'Conversion Funnel')
            }

            // Save Excel
            XLSX.writeFile(wb, `analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`)
        } catch (error) {
            console.error('Excel export error:', error)
            alert('Lỗi khi xuất Excel')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={exportPDF}
                disabled={exporting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {exporting ? 'Đang xuất...' : '📄 Export PDF'}
            </button>
            <button
                onClick={exportExcel}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {exporting ? 'Đang xuất...' : '📊 Export Excel'}
            </button>
        </div>
    )
}
