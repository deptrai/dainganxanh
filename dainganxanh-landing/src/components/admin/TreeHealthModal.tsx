'use client'

import { useState } from 'react'
import { updateTreeHealth } from '@/actions/treeHealth'

interface TreeHealthModalProps {
    isOpen: boolean
    onClose: () => void
    treeId: string
    treeCode: string
    currentStatus: 'healthy' | 'sick' | 'dead'
    onSuccess: () => void
}

export default function TreeHealthModal({
    isOpen,
    onClose,
    treeId,
    treeCode,
    currentStatus,
    onSuccess,
}: TreeHealthModalProps) {
    const [newStatus, setNewStatus] = useState<'healthy' | 'sick' | 'dead'>(currentStatus)
    const [notes, setNotes] = useState('')
    const [treatmentDetails, setTreatmentDetails] = useState('')
    const [updating, setUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = async () => {
        // Validate: notes required for dead trees
        if (newStatus === 'dead' && !notes.trim()) {
            setError('Vui lòng nhập nguyên nhân cây chết')
            return
        }

        // Validate: must change status or add notes
        if (newStatus === currentStatus && !notes.trim()) {
            setError('Vui lòng thay đổi trạng thái hoặc thêm ghi chú')
            return
        }

        setUpdating(true)
        setError(null)

        try {
            const result = await updateTreeHealth({
                treeId,
                newStatus,
                notes,
                treatmentDetails: newStatus === 'sick' ? treatmentDetails : undefined,
            })

            if (result.error) {
                setError(result.error)
            } else {
                onSuccess()
                onClose()
            }
        } catch (err) {
            console.error('Update error:', err)
            setError('Không thể cập nhật trạng thái cây')
        } finally {
            setUpdating(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-100 text-green-800'
            case 'sick':
                return 'bg-yellow-100 text-yellow-800'
            case 'dead':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'Khỏe'
            case 'sick':
                return 'Bệnh'
            case 'dead':
                return 'Chết'
            default:
                return status
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Cập nhật Tình trạng Cây
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                        Cây {treeCode} - Trạng thái hiện tại:{' '}
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(currentStatus)}`}>
                            {getStatusLabel(currentStatus)}
                        </span>
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Status Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái mới
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {(['healthy', 'sick', 'dead'] as const).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setNewStatus(status)}
                                        className={`p-4 border-2 rounded-lg transition-all ${newStatus === status
                                            ? 'border-green-600 bg-green-50 ring-2 ring-green-600'
                                            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="text-center">
                                            <div className={`text-2xl mb-1`}>
                                                {status === 'healthy' && '🌱'}
                                                {status === 'sick' && '🤒'}
                                                {status === 'dead' && '💀'}
                                            </div>
                                            <div className={`text-sm font-medium ${getStatusColor(status)}`}>
                                                {getStatusLabel(status)}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ghi chú {newStatus === 'dead' && <span className="text-red-600">*</span>}
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder={
                                    newStatus === 'dead'
                                        ? 'Nguyên nhân cây chết (bắt buộc)'
                                        : 'Ghi chú về tình trạng cây'
                                }
                            />
                        </div>

                        {/* Treatment Details (only for sick trees) */}
                        {newStatus === 'sick' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chi tiết điều trị
                                </label>
                                <textarea
                                    value={treatmentDetails}
                                    onChange={(e) => setTreatmentDetails(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Mô tả phương pháp điều trị, thuốc sử dụng, lịch kiểm tra..."
                                />
                            </div>
                        )}

                        {/* Warning for dead trees */}
                        {newStatus === 'dead' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <svg
                                        className="w-5 h-5 text-yellow-600 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        />
                                    </svg>
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-medium">Lưu ý:</p>
                                        <p className="mt-1">
                                            Đánh dấu cây chết sẽ tự động tạo task trồng cây thay thế và gửi thông báo cho chủ cây.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={updating}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={updating || (newStatus === 'dead' && !notes)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {updating ? 'Đang cập nhật...' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    )
}
