'use client'

import { useState } from 'react'
import { approveWithdrawal, rejectWithdrawal } from '@/actions/withdrawals'

interface Withdrawal {
    id: string
    user_id: string
    amount: number
    bank_name: string
    bank_account_number: string
    bank_account_name: string
    status: string
    proof_image_url: string | null
    rejection_reason: string | null
    created_at: string
    users: {
        full_name: string
        email: string
    }
}

interface WithdrawalsListProps {
    initialWithdrawals: Withdrawal[]
}

export default function WithdrawalsList({ initialWithdrawals }: WithdrawalsListProps) {
    const [withdrawals, setWithdrawals] = useState(initialWithdrawals)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [proofImage, setProofImage] = useState<File | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    const filteredWithdrawals = withdrawals.filter(w => {
        if (filter === 'all') return true
        return w.status === filter
    })

    const handleApprove = async () => {
        if (!selectedWithdrawal || !proofImage) {
            alert('Vui lòng upload ảnh chuyển khoản')
            return
        }

        setIsProcessing(true)

        try {
            // Upload + approve via server action (service role bypasses RLS)
            const formData = new FormData()
            formData.append('withdrawalId', selectedWithdrawal.id)
            formData.append('proofImage', proofImage)

            const result = await approveWithdrawal(formData)

            if (result.success) {
                // Update local state
                setWithdrawals(prev => prev.map(w =>
                    w.id === selectedWithdrawal.id
                        ? { ...w, status: 'approved' }
                        : w
                ))
                alert('Đã duyệt yêu cầu rút tiền')
                setShowModal(false)
                setSelectedWithdrawal(null)
                setProofImage(null)
            } else {
                alert(result.error || 'Có lỗi xảy ra')
            }
        } catch (error) {
            console.error('Approve error:', error)
            alert('Có lỗi xảy ra')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleReject = async () => {
        if (!selectedWithdrawal || !rejectionReason.trim()) {
            alert('Vui lòng nhập lý do từ chối')
            return
        }

        setIsProcessing(true)

        try {
            const result = await rejectWithdrawal(selectedWithdrawal.id, rejectionReason)

            if (result.success) {
                // Update local state
                setWithdrawals(prev => prev.map(w =>
                    w.id === selectedWithdrawal.id
                        ? { ...w, status: 'rejected', rejection_reason: rejectionReason }
                        : w
                ))
                alert('Đã từ chối yêu cầu rút tiền')
                setShowModal(false)
                setSelectedWithdrawal(null)
                setRejectionReason('')
            } else {
                alert(result.error || 'Có lỗi xảy ra')
            }
        } catch (error) {
            console.error('Reject error:', error)
            alert('Có lỗi xảy ra')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === f
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chờ duyệt' : f === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                        {' '}({withdrawals.filter(w => f === 'all' || w.status === f).length})
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngân hàng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STK</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredWithdrawals.map((withdrawal) => (
                            <tr key={withdrawal.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{withdrawal.users.full_name}</div>
                                    <div className="text-sm text-gray-500">{withdrawal.users.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(withdrawal.amount))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{withdrawal.bank_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{withdrawal.bank_account_number}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            withdrawal.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                        }`}>
                                        {withdrawal.status === 'pending' ? 'Chờ duyệt' : withdrawal.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(withdrawal.created_at).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => {
                                            setSelectedWithdrawal(withdrawal)
                                            setShowModal(true)
                                        }}
                                        className="text-emerald-600 hover:text-emerald-900 font-medium"
                                    >
                                        Xem chi tiết
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredWithdrawals.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        Không có yêu cầu rút tiền nào
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showModal && selectedWithdrawal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-emerald-800 mb-6">Chi Tiết Yêu Cầu Rút Tiền</h2>

                        {/* User Info */}
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Người dùng</label>
                                <p className="text-lg font-semibold">{selectedWithdrawal.users.full_name}</p>
                                <p className="text-sm text-gray-600">{selectedWithdrawal.users.email}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Số tiền</label>
                                    <p className="text-lg font-bold text-emerald-600">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(selectedWithdrawal.amount))}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                                    <p className="text-lg font-semibold">
                                        {selectedWithdrawal.status === 'pending' ? 'Chờ duyệt' :
                                            selectedWithdrawal.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Ngân hàng</label>
                                <p className="text-lg">{selectedWithdrawal.bank_name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Số tài khoản</label>
                                    <p className="text-lg font-mono">{selectedWithdrawal.bank_account_number}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Tên chủ TK</label>
                                    <p className="text-lg">{selectedWithdrawal.bank_account_name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions for Pending */}
                        {selectedWithdrawal.status === 'pending' && (
                            <div className="space-y-4 border-t pt-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Upload ảnh chuyển khoản <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Lý do từ chối (nếu từ chối)
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="Nhập lý do từ chối..."
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowModal(false)
                                            setSelectedWithdrawal(null)
                                            setProofImage(null)
                                            setRejectionReason('')
                                        }}
                                        disabled={isProcessing}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Đóng
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={isProcessing || !rejectionReason.trim()}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Từ chối
                                    </button>
                                    <button
                                        onClick={handleApprove}
                                        disabled={isProcessing || !proofImage}
                                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        {isProcessing ? 'Đang xử lý...' : 'Duyệt'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Display proof image if approved */}
                        {selectedWithdrawal.status === 'approved' && selectedWithdrawal.proof_image_url && (
                            <div className="border-t pt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh chuyển khoản</label>
                                <img
                                    src={selectedWithdrawal.proof_image_url}
                                    alt="Proof of transfer"
                                    className="max-w-full rounded-lg border"
                                />
                            </div>
                        )}

                        {/* Display rejection reason if rejected */}
                        {selectedWithdrawal.status === 'rejected' && selectedWithdrawal.rejection_reason && (
                            <div className="border-t pt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Lý do từ chối</label>
                                <p className="text-red-600">{selectedWithdrawal.rejection_reason}</p>
                            </div>
                        )}

                        {/* Close button for non-pending */}
                        {selectedWithdrawal.status !== 'pending' && (
                            <div className="border-t pt-6">
                                <button
                                    onClick={() => {
                                        setShowModal(false)
                                        setSelectedWithdrawal(null)
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Đóng
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
