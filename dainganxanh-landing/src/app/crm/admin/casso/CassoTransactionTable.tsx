'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { manualProcessTransaction, syncCassoTransactions, type SyncResult } from '@/actions/casso'
import type { CassoTransaction } from './page'

const STATUS_LABELS: Record<string, string> = {
    processed: 'Đã xử lý',
    processing: 'Đang xử lý',
    no_match: 'Không khớp',
    order_not_found: 'Không tìm thấy đơn',
    amount_mismatch: 'Sai số tiền',
    function_error: 'Lỗi hệ thống',
    duplicate: 'Trùng lặp',
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
    processed: 'bg-green-100 text-green-800 border-green-200',
    processing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    no_match: 'bg-gray-100 text-gray-600 border-gray-200',
    order_not_found: 'bg-orange-100 text-orange-800 border-orange-200',
    amount_mismatch: 'bg-red-100 text-red-800 border-red-200',
    function_error: 'bg-red-200 text-red-900 border-red-300',
    duplicate: 'bg-gray-100 text-gray-500 border-gray-200',
}

const ORDER_CODE_REGEX = /\b(DH[A-Z0-9]{6})\b/i

function parseOrderCode(description: string | null): string | null {
    if (!description) return null
    const match = description.match(ORDER_CODE_REGEX)
    return match ? match[1].toUpperCase() : null
}

function formatAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount)
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—'
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date(dateStr))
}

function StatusBadge({ status }: { status: string }) {
    const classes = STATUS_BADGE_CLASSES[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
    const label = STATUS_LABELS[status] ?? status
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
            {label}
        </span>
    )
}

function ManualProcessForm({
    transaction,
    onSuccess,
}: {
    transaction: CassoTransaction
    onSuccess: () => void
}) {
    const [orderCode, setOrderCode] = useState(parseOrderCode(transaction.description) ?? '')
    const [isPending, startTransition] = useTransition()
    const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!orderCode.trim()) return

        startTransition(async () => {
            const res = await manualProcessTransaction(transaction.id, orderCode.trim().toUpperCase())
            setResult(res)
            if (res.success) {
                onSuccess()
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    placeholder="VD: DHABC123"
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                    pattern="DH[A-Z0-9]{6}"
                    required
                    disabled={isPending}
                />
                <button
                    type="submit"
                    disabled={isPending || !orderCode.trim()}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {isPending ? 'Đang xử lý...' : 'Force Process'}
                </button>
            </div>
            {result && (
                <p className={`text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.success ? 'Xử lý thành công!' : `Lỗi: ${result.error}`}
                </p>
            )}
        </form>
    )
}

function SyncButton({ onDone }: { onDone: () => void }) {
    const [isPending, startTransition] = useTransition()
    const [result, setResult] = useState<SyncResult | null>(null)

    const handleSync = () => {
        setResult(null)
        startTransition(async () => {
            const res = await syncCassoTransactions()
            setResult(res)
            if (res.success) onDone()
        })
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                onClick={handleSync}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
                <svg
                    className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isPending ? 'Đang đồng bộ...' : 'Đồng bộ 1 ngày qua'}
            </button>
            {result && (
                <p className={`text-xs ${result.success ? 'text-emerald-700' : 'text-red-600'}`}>
                    {result.success
                        ? `✓ Import: ${result.imported} | Khớp: ${result.matched} | Bỏ qua: ${result.skipped}`
                        : `✗ ${result.error}`}
                </p>
            )}
        </div>
    )
}

interface Props {
    transactions: CassoTransaction[]
    totalCount: number
    totalPages: number
    currentPage: number
    statusFilter: string
    fromDate: string
    toDate: string
}

export default function CassoTransactionTable({
    transactions,
    totalCount,
    totalPages,
    currentPage,
    statusFilter,
    fromDate,
    toDate,
}: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const updateParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        // Reset to page 1 when filters change
        if (key !== 'page') {
            params.set('page', '1')
        }
        router.push(`/crm/admin/casso?${params.toString()}`)
    }

    const goToPage = (page: number) => {
        updateParam('page', String(page))
    }

    const canManualProcess = (status: string) =>
        status === 'order_not_found' || status === 'amount_mismatch'

    const handleProcessSuccess = () => {
        setExpandedId(null)
        router.refresh()
    }

    return (
        <div className="space-y-4">
            {/* Filters + Sync */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-end justify-between">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Trạng thái
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(e) => updateParam('status', e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                        <option value="">Tất cả</option>
                        <option value="processed">Đã xử lý</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="no_match">Không khớp</option>
                        <option value="order_not_found">Không tìm thấy đơn</option>
                        <option value="amount_mismatch">Sai số tiền</option>
                        <option value="function_error">Lỗi hệ thống</option>
                        <option value="duplicate">Trùng lặp</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Từ ngày
                    </label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => updateParam('from', e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Đến ngày
                    </label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => updateParam('to', e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>

                {(statusFilter || fromDate || toDate) && (
                    <button
                        onClick={() => {
                            const params = new URLSearchParams()
                            params.set('page', '1')
                            router.push(`/crm/admin/casso?${params.toString()}`)
                        }}
                        className="text-sm px-3 py-2 text-gray-600 hover:text-gray-800 underline"
                    >
                        Xóa bộ lọc
                    </button>
                )}

                <SyncButton onDone={() => router.refresh()} />
            </div>

            {/* Table */}
            {transactions.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-600">Không có giao dịch nào</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thời gian
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Số tiền
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nội dung CK
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order Code
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ghi chú
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.map((tx) => {
                                    const parsedCode = parseOrderCode(tx.description)
                                    const isExpanded = expandedId === tx.id
                                    const showManual = canManualProcess(tx.status)

                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                                {formatDate(tx.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right whitespace-nowrap">
                                                {formatAmount(tx.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={tx.description ?? ''}>
                                                {tx.description ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono text-gray-900 whitespace-nowrap">
                                                {parsedCode ? (
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                                                        {parsedCode}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <StatusBadge status={tx.status} />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={tx.note ?? ''}>
                                                {tx.note ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {showManual && (
                                                    <div>
                                                        <button
                                                            onClick={() =>
                                                                setExpandedId(isExpanded ? null : tx.id)
                                                            }
                                                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                        >
                                                            {isExpanded ? 'Đóng' : 'Xử lý thủ công'}
                                                        </button>
                                                        {isExpanded && (
                                                            <ManualProcessForm
                                                                transaction={tx}
                                                                onSuccess={handleProcessSuccess}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
                <div className="text-sm text-gray-700">
                    Hiển thị{' '}
                    <span className="font-medium">{transactions.length}</span> trong tổng số{' '}
                    <span className="font-medium">{totalCount}</span> giao dịch
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700">
                        Trang {currentPage} / {totalPages || 1}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Trước
                        </button>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
