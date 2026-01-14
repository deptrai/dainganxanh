'use client'

import { useState } from 'react'
import { requestWithdrawal } from '@/actions/withdrawals'

interface WithdrawalFormProps {
    availableBalance: number
    userFullName: string
    onSuccess: () => void
    onCancel: () => void
}

const BANKS = [
    'Vietcombank',
    'BIDV',
    'Techcombank',
    'VietinBank',
    'ACB',
    'MB Bank',
    'VPBank',
    'Sacombank',
    'TPBank',
    'Agribank'
]

export default function WithdrawalForm({
    availableBalance,
    userFullName,
    onSuccess,
    onCancel
}: WithdrawalFormProps) {
    const [formData, setFormData] = useState({
        bankName: '',
        bankAccountNumber: '',
        bankAccountName: '',
        amount: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.bankName) {
            newErrors.bankName = 'Vui lòng chọn ngân hàng'
        }

        if (!formData.bankAccountNumber) {
            newErrors.bankAccountNumber = 'Vui lòng nhập số tài khoản'
        } else if (!/^\d+$/.test(formData.bankAccountNumber)) {
            newErrors.bankAccountNumber = 'Số tài khoản chỉ được chứa số'
        }

        if (!formData.bankAccountName) {
            newErrors.bankAccountName = 'Vui lòng nhập tên chủ tài khoản'
        }

        if (!formData.amount) {
            newErrors.amount = 'Vui lòng nhập số tiền'
        } else {
            const amount = Number(formData.amount)
            if (isNaN(amount) || amount < 200000) {
                newErrors.amount = 'Số tiền rút tối thiểu là 200,000 VNĐ'
            } else if (amount > availableBalance) {
                newErrors.amount = 'Số tiền vượt quá số dư khả dụng'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsSubmitting(true)

        try {
            const result = await requestWithdrawal({
                amount: Number(formData.amount),
                bankName: formData.bankName,
                bankAccountNumber: formData.bankAccountNumber,
                bankAccountName: formData.bankAccountName
            })

            if (result.success) {
                alert('Yêu cầu rút tiền đã được gửi. Admin sẽ xử lý trong 1-3 ngày làm việc.')
                onSuccess()
            } else {
                alert(result.error || 'Có lỗi xảy ra')
            }
        } catch (error) {
            console.error('Withdrawal error:', error)
            alert('Có lỗi xảy ra khi gửi yêu cầu')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-emerald-800 mb-4">Rút tiền hoa hồng</h2>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600">Số dư khả dụng</p>
                    <p className="text-2xl font-bold text-emerald-700">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(availableBalance)}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Bank Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngân hàng <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.bankName ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Chọn ngân hàng</option>
                            {BANKS.map((bank) => (
                                <option key={bank} value={bank}>
                                    {bank}
                                </option>
                            ))}
                        </select>
                        {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
                    </div>

                    {/* Account Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số tài khoản <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.bankAccountNumber}
                            onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                            placeholder="Nhập số tài khoản"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.bankAccountNumber ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.bankAccountNumber && <p className="text-red-500 text-sm mt-1">{errors.bankAccountNumber}</p>}
                    </div>

                    {/* Account Holder Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên chủ tài khoản <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.bankAccountName}
                            onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                            placeholder={userFullName}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.bankAccountName ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        <p className="text-xs text-gray-500 mt-1">Tên phải trùng với tên trong hệ thống: {userFullName}</p>
                        {errors.bankAccountName && <p className="text-red-500 text-sm mt-1">{errors.bankAccountName}</p>}
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số tiền rút <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="Tối thiểu 200,000 VNĐ"
                            min="200000"
                            max={availableBalance}
                            step="1000"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
