'use client'

import { useState, useEffect } from 'react'
import { getAvailableBalance, getSavedBankInfo } from '@/actions/withdrawals'
import WithdrawalForm from '@/components/crm/WithdrawalForm'

interface WithdrawalButtonProps {
    userId: string
    userFullName: string
}

export interface SavedBankInfo {
    bankName: string
    bankAccountNumber: string
    bankAccountName: string
}

export default function WithdrawalButton({ userId, userFullName }: WithdrawalButtonProps) {
    const [balance, setBalance] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [savedBankInfo, setSavedBankInfo] = useState<SavedBankInfo | null>(null)

    useEffect(() => {
        loadBalance()
    }, [])

    const loadBalance = async () => {
        setLoading(true)
        try {
            const [availableBalance, bankInfo] = await Promise.all([
                getAvailableBalance(userId),
                getSavedBankInfo(userId),
            ])
            setBalance(availableBalance)
            setSavedBankInfo(bankInfo)
        } catch (error) {
            console.error('Error loading balance:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSuccess = () => {
        setShowForm(false)
        loadBalance() // Reload balance after successful withdrawal
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-100">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Số dư khả dụng</p>
                        <p className="text-3xl font-bold text-emerald-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(balance)}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        disabled={balance < 200000}
                        className={`px-6 py-3 rounded-lg font-semibold transition-colors ${balance >= 200000
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        💰 Rút tiền
                    </button>
                </div>
                {balance < 200000 && (
                    <p className="text-sm text-gray-500 mt-3">
                        Số dư tối thiểu để rút tiền là 200,000 VNĐ
                    </p>
                )}
            </div>

            {showForm && (
                <WithdrawalForm
                    availableBalance={balance}
                    userFullName={userFullName}
                    savedBankInfo={savedBankInfo}
                    onSuccess={handleSuccess}
                    onCancel={() => setShowForm(false)}
                />
            )}
        </>
    )
}
