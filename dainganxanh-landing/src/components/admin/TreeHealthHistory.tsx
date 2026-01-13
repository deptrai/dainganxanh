'use client'

import { useState, useEffect } from 'react'
import { getTreeHealthHistory } from '@/actions/treeHealth'

interface HealthLog {
    id: string
    old_status: string | null
    new_status: string
    notes: string | null
    treatment_details: string | null
    changed_at: string
    changed_by: string | null
}

interface TreeHealthHistoryProps {
    treeId: string
}

export default function TreeHealthHistory({ treeId }: TreeHealthHistoryProps) {
    const [logs, setLogs] = useState<HealthLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchHistory()
    }, [treeId])

    const fetchHistory = async () => {
        setLoading(true)
        setError(null)

        try {
            const result = await getTreeHealthHistory(treeId)

            if (result.error) {
                setError(result.error)
            } else {
                setLogs(result.data || [])
            }
        } catch (err) {
            console.error('Error fetching history:', err)
            setError('Không thể tải lịch sử')
        } finally {
            setLoading(false)
        }
    }

    const getStatusLabel = (status: string | null) => {
        if (!status) return 'N/A'
        const labels: Record<string, string> = {
            healthy: 'Khỏe',
            sick: 'Bệnh',
            dead: 'Chết',
        }
        return labels[status] || status
    }

    const getStatusColor = (status: string | null) => {
        if (!status) return 'text-gray-600'
        const colors: Record<string, string> = {
            healthy: 'text-green-600',
            sick: 'text-yellow-600',
            dead: 'text-red-600',
        }
        return colors[status] || 'text-gray-600'
    }

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <p className="mt-2 text-sm text-gray-600">Đang tải lịch sử...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
            </div>
        )
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-8">
                <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
                <p className="mt-2 text-sm text-gray-600">Chưa có lịch sử thay đổi</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Lịch sử Thay đổi</h3>

            <div className="flow-root">
                <ul className="-mb-8">
                    {logs.map((log, idx) => (
                        <li key={log.id}>
                            <div className="relative pb-8">
                                {idx !== logs.length - 1 && (
                                    <span
                                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                        aria-hidden="true"
                                    />
                                )}
                                <div className="relative flex space-x-3">
                                    <div>
                                        <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center ring-8 ring-white">
                                            <svg
                                                className="h-5 w-5 text-green-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900">
                                                Thay đổi từ{' '}
                                                <span className={`font-medium ${getStatusColor(log.old_status)}`}>
                                                    {getStatusLabel(log.old_status)}
                                                </span>
                                                {' → '}
                                                <span className={`font-medium ${getStatusColor(log.new_status)}`}>
                                                    {getStatusLabel(log.new_status)}
                                                </span>
                                            </p>
                                            {log.notes && (
                                                <p className="mt-1 text-sm text-gray-600">
                                                    <span className="font-medium">Ghi chú:</span> {log.notes}
                                                </p>
                                            )}
                                            {log.treatment_details && (
                                                <p className="mt-1 text-sm text-gray-600">
                                                    <span className="font-medium">Điều trị:</span> {log.treatment_details}
                                                </p>
                                            )}
                                        </div>
                                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                            <time dateTime={log.changed_at}>
                                                {new Date(log.changed_at).toLocaleString('vi-VN')}
                                            </time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
