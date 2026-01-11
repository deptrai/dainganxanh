'use client'

interface QuarterlyReportsProps {
    orderId: string
    ageInMonths: number
}

interface Report {
    quarter: number
    year: number
    title: string
    available: boolean
}

export default function QuarterlyReports({ orderId, ageInMonths }: QuarterlyReportsProps) {
    // Generate report list based on age
    const currentYear = new Date().getFullYear()
    const reports: Report[] = []

    // Generate quarterly reports for each year
    const yearsActive = Math.ceil(ageInMonths / 12)
    for (let year = 0; year < yearsActive; year++) {
        for (let quarter = 1; quarter <= 4; quarter++) {
            const monthsFromStart = (year * 12) + (quarter * 3)
            if (monthsFromStart <= ageInMonths) {
                reports.push({
                    quarter,
                    year: currentYear - yearsActive + year + 1,
                    title: `Báo Cáo Quý ${quarter}/${currentYear - yearsActive + year + 1}`,
                    available: monthsFromStart >= 9 // Reports available after 9 months
                })
            }
        }
    }

    const availableReports = reports.filter(r => r.available)

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📄</span>
                <h2 className="text-2xl font-bold text-gray-800">Báo Cáo Định Kỳ</h2>
            </div>

            {availableReports.length === 0 ? (
                <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">📋</span>
                    <p className="text-gray-600 text-lg">Báo cáo sẽ có sau 9 tháng</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Chúng tôi sẽ gửi báo cáo định kỳ mỗi quý
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {availableReports.reverse().map((report, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">📊</span>
                                <div>
                                    <h3 className="font-semibold text-gray-800">{report.title}</h3>
                                    <p className="text-sm text-gray-500">
                                        Cập nhật tiến độ và hình ảnh cây
                                    </p>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                                Tải xuống
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                    💡 <strong>Lưu ý:</strong> Báo cáo được gửi tự động qua email mỗi quý. Bạn cũng có thể tải xuống tại đây.
                </p>
            </div>
        </div>
    )
}
