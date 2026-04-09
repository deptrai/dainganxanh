'use client'

import { useState } from 'react'
import { submitSellBack } from '@/actions/harvest'

interface HarvestSellBackProps {
    orderId: string
    totalAmount: number
    orderCode: string | null
    plantedDate: string
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount)
}

export default function HarvestSellBack({
    orderId,
    totalAmount,
    orderCode,
    plantedDate,
}: HarvestSellBackProps) {
    const [step, setStep] = useState<'info' | 'contract' | 'submitting' | 'success'>('info')
    const [error, setError] = useState<string | null>(null)
    const [agreed, setAgreed] = useState(false)
    const [resultData, setResultData] = useState<{ buybackPrice: number; message: string } | null>(null)

    const buybackMultiplier = 2
    const buybackPrice = Math.round(totalAmount * buybackMultiplier)
    const today = new Date().toLocaleDateString('vi-VN')

    const handleShowContract = () => {
        setStep('contract')
        setError(null)
    }

    const handleConfirm = async () => {
        if (!agreed) {
            setError('Vui lòng đồng ý với các điều khoản hợp đồng.')
            return
        }

        setStep('submitting')
        setError(null)

        try {
            const result = await submitSellBack(orderId)
            if (result.success) {
                setResultData({
                    buybackPrice: result.buybackPrice!,
                    message: result.message!,
                })
                setStep('success')
            } else {
                setError(result.error || 'Có lỗi xảy ra.')
                setStep('contract')
            }
        } catch {
            setError('Có lỗi xảy ra. Vui lòng thử lại sau.')
            setStep('contract')
        }
    }

    // Success state
    if (step === 'success' && resultData) {
        return (
            <div className="border-2 border-emerald-400 rounded-lg p-6 bg-emerald-50">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">✅</span>
                    <h3 className="text-xl font-bold text-emerald-800">Yêu Cầu Bán Lại Thành Công!</h3>
                </div>
                <div className="space-y-3">
                    <p className="text-emerald-700">
                        {resultData.message}
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-emerald-200">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Số tiền sẽ nhận:</span>
                            <span className="text-2xl font-bold text-emerald-700">
                                {formatCurrency(resultData.buybackPrice)}
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">
                        Bạn sẽ nhận được thông báo khi thanh toán được xử lý.
                    </p>
                </div>
            </div>
        )
    }

    // Info / initial state
    if (step === 'info') {
        return (
            <div className="border-2 border-yellow-400 rounded-lg p-6 hover:border-emerald-400 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">💰</span>
                    <h3 className="text-xl font-bold text-gray-800">Bán lại cho Đại Ngàn Xanh</h3>
                </div>
                <p className="text-gray-600 mb-4">
                    Nhận thanh toán cho cây của bạn theo giá cam kết mua lại.
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-sm text-gray-500">Giá trị ban đầu</p>
                            <p className="text-lg font-semibold text-gray-700">{formatCurrency(totalAmount)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Giá mua lại (x{buybackMultiplier})</p>
                            <p className="text-lg font-bold text-emerald-700">{formatCurrency(buybackPrice)}</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleShowContract}
                    className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                    Xem Hợp Đồng Mua Lại
                </button>
            </div>
        )
    }

    // Contract / confirmation state
    return (
        <div className="border-2 border-emerald-400 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📋</span>
                <h3 className="text-xl font-bold text-gray-800">Hợp Đồng Điện Tử - Bán Lại Cây</h3>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-4 space-y-4 text-sm">
                <div className="border-b border-gray-200 pb-3">
                    <h4 className="font-bold text-gray-800 mb-2">THÔNG TIN HỢP ĐỒNG</h4>
                    <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <p>Mã đơn hàng: <strong>{orderCode || orderId.slice(0, 8).toUpperCase()}</strong></p>
                        <p>Ngày lập: <strong>{today}</strong></p>
                        <p>Ngày trồng: <strong>{new Date(plantedDate).toLocaleDateString('vi-VN')}</strong></p>
                    </div>
                </div>

                <div className="border-b border-gray-200 pb-3">
                    <h4 className="font-bold text-gray-800 mb-2">ĐIỀU KHOẢN MUA LẠI</h4>
                    <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">&#10003;</span>
                            <span>Giá trị ban đầu: <strong>{formatCurrency(totalAmount)}</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">&#10003;</span>
                            <span>Hệ số mua lại: <strong>x{buybackMultiplier}</strong> (cây 10 năm tuổi)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">&#10003;</span>
                            <span>Giá mua lại: <strong className="text-emerald-700">{formatCurrency(buybackPrice)}</strong></span>
                        </li>
                    </ul>
                </div>

                <div className="border-b border-gray-200 pb-3">
                    <h4 className="font-bold text-gray-800 mb-2">PHƯƠNG THỨC THANH TOÁN</h4>
                    <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">&#10003;</span>
                            <span>Thanh toán qua chuyển khoản ngân hàng trong vòng <strong>30 ngày</strong> kể từ ngày xác nhận.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">&#10003;</span>
                            <span>Đại Ngàn Xanh sẽ liên hệ để xác nhận thông tin tài khoản ngân hàng.</span>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-gray-800 mb-2">THAY ĐỔI TRẠNG THÁI</h4>
                    <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">&#10003;</span>
                            <span>Sau khi xác nhận, cây sẽ chuyển sang trạng thái <strong>&quot;Đã thu hoạch - Bán lại&quot;</strong>.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">&#10003;</span>
                            <span>Quyền sở hữu cây sẽ được chuyển lại cho Đại Ngàn Xanh sau khi thanh toán hoàn tất.</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Agreement checkbox */}
            <label className="flex items-start gap-3 mb-4 cursor-pointer">
                <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                        setAgreed(e.target.checked)
                        if (e.target.checked) setError(null)
                    }}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">
                    Tôi đã đọc và đồng ý với các điều khoản của hợp đồng mua lại. Tôi xác nhận muốn bán lại cây cho Đại Ngàn Xanh.
                </span>
            </label>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={() => {
                        setStep('info')
                        setAgreed(false)
                        setError(null)
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                    Quay lại
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={step === 'submitting'}
                    className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {step === 'submitting' ? 'Đang xử lý...' : 'Xác Nhận Bán Lại'}
                </button>
            </div>
        </div>
    )
}
