'use client'

import { useState } from 'react'
import { ClipboardDocumentIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface ReferralLinkProps {
    referralCode: string
    onRegenerate?: () => Promise<void>
}

export function ReferralLink({ referralCode, onRegenerate }: ReferralLinkProps) {
    const [copied, setCopied] = useState(false)
    const [regenerating, setRegenerating] = useState(false)

    const fullUrl = `https://dainganxanh.com.vn/?ref=${referralCode}`

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(fullUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy:', error)
        }
    }

    const handleRegenerate = async () => {
        if (!onRegenerate) return
        setRegenerating(true)
        try {
            await onRegenerate()
        } finally {
            setRegenerating(false)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-100">
            <h3 className="text-lg font-semibold text-brand-600 mb-4">Link Giới Thiệu Của Bạn</h3>

            {/* Referral Code Display */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã Giới Thiệu
                </label>
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-brand-50 border border-brand-200 rounded-lg px-4 py-3 font-mono text-lg font-bold text-brand-600">
                        {referralCode}
                    </div>
                    {onRegenerate && (
                        <button
                            onClick={handleRegenerate}
                            disabled={regenerating}
                            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            title="Tạo mã mới"
                        >
                            <ArrowPathIcon className={`h-5 w-5 text-gray-600 ${regenerating ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* Full URL Display */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link Đầy Đủ
                </label>
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 overflow-x-auto">
                        {fullUrl}
                    </div>
                    <button
                        onClick={handleCopy}
                        className={`p-3 rounded-lg transition-all ${copied
                            ? 'bg-green-500 text-white'
                            : 'bg-brand-500 hover:bg-brand-600 text-white'
                            }`}
                        title="Sao chép link"
                    >
                        {copied ? (
                            <CheckIcon className="h-5 w-5" />
                        ) : (
                            <ClipboardDocumentIcon className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Helper Text */}
            <p className="text-sm text-gray-500">
                Chia sẻ link này với bạn bè để nhận hoa hồng 10% khi họ mua cây.
            </p>
        </div>
    )
}
