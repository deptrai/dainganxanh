"use client"

import { useState, useEffect } from 'react'

interface VerifyOrderButtonProps {
    orderId: string
    verifyOrder: (orderId: string) => Promise<void>
}

export default function VerifyOrderButton({ orderId, verifyOrder }: VerifyOrderButtonProps) {
    const [showModal, setShowModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showSuccessToast, setShowSuccessToast] = useState(false)

    // Auto-hide success toast after 3 seconds
    useEffect(() => {
        if (showSuccessToast) {
            const timer = setTimeout(() => setShowSuccessToast(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [showSuccessToast])

    const handleVerify = async () => {
        setLoading(true)
        setError(null)

        try {
            await verifyOrder(orderId)
            setShowModal(false)
            setShowSuccessToast(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
                    ✅ Đơn hàng đã được xác minh thành công
                </div>
            )}

            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setShowModal(true)
                }}
                className="text-green-600 hover:text-green-900 font-medium"
            >
                Xác minh
            </button>

            {/* Confirmation Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Xác nhận xác minh đơn hàng
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xác minh đơn hàng này? Hành động này không thể hoàn tác.
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={loading}
                                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleVerify}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Đang xử lý...' : 'Xác minh'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
