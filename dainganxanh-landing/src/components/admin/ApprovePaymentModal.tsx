"use client"

import { useState, useRef, useEffect } from 'react'
import { Order } from '@/hooks/useAdminOrders'

interface ApprovePaymentModalProps {
    order: Order
    onClose: () => void
    onApprove: (orderId: string, proofUrl?: string) => Promise<void>
}

export default function ApprovePaymentModal({ order, onClose, onApprove }: ApprovePaymentModalProps) {
    const [uploading, setUploading] = useState(false)
    const [approving, setApproving] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Cleanup object URL on unmount or change
    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
    }, [previewUrl])

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Preview
        setPreviewUrl(URL.createObjectURL(file))
        setUploadedUrl(null)
        setError(null)
        setUploading(true)

        try {
            const res = await fetch('/api/admin/upload-payment-proof', {
                method: 'POST',
                headers: { 'Content-Type': file.type, 'x-filename': file.name },
                body: file,
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || `Upload failed: ${res.status}`)
            }

            const { url } = await res.json()
            setUploadedUrl(url)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload thất bại')
            setPreviewUrl(null)
        } finally {
            setUploading(false)
        }
    }

    const handleApprove = async () => {
        setApproving(true)
        setError(null)
        try {
            await onApprove(order.id, uploadedUrl ?? undefined)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Duyệt thất bại')
        } finally {
            setApproving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Duyệt thanh toán</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* Order info */}
                <div className="px-6 py-4 bg-gray-50 border-b space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Mã đơn:</span>
                        <span className="font-medium">{order.order_code || order.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Khách hàng:</span>
                        <span className="font-medium">{order.user_email || order.user_phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Số lượng:</span>
                        <span className="font-medium">{order.quantity} cây</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Tổng tiền:</span>
                        <span className="font-semibold text-green-700">{formatCurrency(order.total_amount)}</span>
                    </div>
                </div>

                {/* Upload proof */}
                <div className="px-6 py-4 space-y-3">
                    <p className="text-sm text-gray-700 font-medium">
                        Upload ảnh xác nhận chuyển khoản <span className="text-gray-400 font-normal">(không bắt buộc)</span>
                    </p>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
                    >
                        {previewUrl ? (
                            <img src={previewUrl} alt="proof" className="mx-auto max-h-48 rounded object-contain" />
                        ) : (
                            <div className="text-gray-400 space-y-1">
                                <div className="text-3xl">📷</div>
                                <p className="text-sm">Click để chọn ảnh biên lai / screenshot ngân hàng</p>
                                <p className="text-xs">JPG, PNG, WEBP — tối đa 10MB</p>
                            </div>
                        )}
                        {uploading && (
                            <p className="text-xs text-blue-600 mt-2 animate-pulse">Đang tải lên...</p>
                        )}
                        {uploadedUrl && !uploading && (
                            <p className="text-xs text-green-600 mt-2">✓ Đã tải lên thành công</p>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 py-4 border-t">
                    <button
                        onClick={onClose}
                        disabled={approving}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={uploading || approving}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
                    >
                        {approving ? 'Đang duyệt...' : 'Xác nhận duyệt'}
                    </button>
                </div>
            </div>
        </div>
    )
}
