'use client'

import { useState } from 'react'
import { submitKeepGrowing } from '@/actions/harvest'

interface HarvestKeepGrowingProps {
    orderId: string
    treeCode: string
    ageInMonths: number
}

const ANNUAL_CARE_FEE = 50_000 // VND per year

const VALUE_PROJECTIONS = [
    { year: 6, increase: 20 },
    { year: 7, increase: 40 },
    { year: 8, increase: 60 },
]

export default function HarvestKeepGrowing({ orderId, treeCode, ageInMonths }: HarvestKeepGrowingProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isConfirmed, setIsConfirmed] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showTerms, setShowTerms] = useState(false)

    const handleConfirm = async () => {
        setIsSubmitting(true)
        setError(null)

        try {
            const result = await submitKeepGrowing(orderId)
            if (result.success) {
                setIsConfirmed(true)
            } else {
                setError(result.error || 'Có lỗi xảy ra. Vui lòng thử lại.')
            }
        } catch {
            setError('Có lỗi xảy ra. Vui lòng thử lại.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isConfirmed) {
        return (
            <div className="border-2 border-emerald-400 bg-emerald-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">✅</span>
                    <div>
                        <h3 className="text-xl font-bold text-emerald-800">Đã xác nhận tiếp tục nuôi cây!</h3>
                        <p className="text-emerald-600">Cây {treeCode} sẽ tiếp tục được chăm sóc.</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                    <p className="text-sm text-gray-600">
                        Hợp đồng chăm sóc đã được gia hạn. Phí chăm sóc hàng năm{' '}
                        <strong>{ANNUAL_CARE_FEE.toLocaleString('vi-VN')} VND/năm</strong> sẽ được tính
                        từ kỳ tiếp theo. Bạn sẽ nhận thông báo khi đến hạn thanh toán.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="border-2 border-emerald-300 rounded-lg p-6 hover:border-emerald-500 transition-colors">
            <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🌳</span>
                <h3 className="text-xl font-bold text-gray-800">Tiếp tục nuôi cây</h3>
            </div>
            <p className="text-gray-600 mb-4">
                Giữ cây tiếp tục lớn để tăng giá trị và hấp thụ thêm CO₂.
            </p>

            {/* Annual Care Fee */}
            <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-emerald-800 mb-1">Phí chăm sóc hàng năm</h4>
                <p className="text-2xl font-bold text-emerald-700">
                    {ANNUAL_CARE_FEE.toLocaleString('vi-VN')} VND
                    <span className="text-sm font-normal text-gray-500">/năm</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                    Bao gồm: tưới nước, bón phân, kiểm tra sức khỏe cây định kỳ
                </p>
            </div>

            {/* Value Projection Timeline */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-emerald-800 mb-3">Dự kiến tăng giá trị</h4>
                <div className="space-y-3">
                    {VALUE_PROJECTIONS.map((projection) => (
                        <div key={projection.year} className="flex items-center gap-3">
                            <div className="w-20 text-sm font-medium text-gray-700">
                                Năm {projection.year}
                            </div>
                            <div className="flex-1 bg-white rounded-full h-6 overflow-hidden border border-emerald-200">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                    style={{ width: `${Math.min(projection.increase + 40, 100)}%` }}
                                >
                                    <span className="text-xs font-bold text-white">
                                        +{projection.increase}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    * Dự kiến dựa trên tốc độ tăng trưởng trung bình. Giá trị thực tế có thể thay đổi.
                </p>
            </div>

            {/* Contract Terms Toggle */}
            <div className="mb-4">
                <button
                    onClick={() => setShowTerms(!showTerms)}
                    className="text-sm text-emerald-600 hover:text-emerald-700 underline font-medium"
                >
                    {showTerms ? 'Ẩn điều khoản hợp đồng' : 'Xem điều khoản hợp đồng gia hạn'}
                </button>
                {showTerms && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
                        <p><strong>1.</strong> Hợp đồng chăm sóc được gia hạn thêm 1 năm, tự động gia hạn nếu không có yêu cầu dừng.</p>
                        <p><strong>2.</strong> Phí chăm sóc {ANNUAL_CARE_FEE.toLocaleString('vi-VN')} VND/năm, thanh toán vào đầu mỗi kỳ.</p>
                        <p><strong>3.</strong> Đại Ngàn Xanh cam kết duy trì chất lượng chăm sóc cây theo tiêu chuẩn.</p>
                        <p><strong>4.</strong> Bạn có thể chọn thu hoạch hoặc chuyển nhượng cây bất kỳ lúc nào trong thời gian gia hạn.</p>
                        <p><strong>5.</strong> Giá trị cây được đánh giá lại mỗi năm dựa trên kích thước và tình trạng sức khỏe thực tế.</p>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Confirm Button */}
            <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Đang xử lý...
                    </>
                ) : (
                    'Xác nhận tiếp tục nuôi cây'
                )}
            </button>
        </div>
    )
}
