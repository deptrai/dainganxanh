'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

interface Lot {
    id: string
    name: string
    region: string
    description: string | null
    location_lat: number | null
    location_lng: number | null
    total_trees: number
    planted: number
    created_at: string
}

interface LotAssignmentModalProps {
    orderId: string
    quantity: number
    onClose: () => void
    onAssign: (lotId: string) => Promise<void>
}

export default function LotAssignmentModal({
    orderId,
    quantity,
    onClose,
    onAssign,
}: LotAssignmentModalProps) {
    const [lots, setLots] = useState<Lot[]>([])
    const [selectedLotId, setSelectedLotId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [assigning, setAssigning] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchAvailableLots()
    }, [quantity])

    const fetchAvailableLots = async () => {
        try {
            const supabase = createBrowserClient()

            // Fetch lots that have enough capacity
            const { data, error: fetchError } = await supabase
                .from('lots')
                .select('*')
                .gte('total_trees', quantity) // Must have enough total capacity
                .order('name')

            if (fetchError) throw fetchError

            // Filter lots with enough available space
            const availableLots = (data || []).filter(
                (lot) => lot.total_trees - lot.planted >= quantity
            )

            setLots(availableLots)
        } catch (err) {
            console.error('Error fetching lots:', err)
            setError('Không thể tải danh sách lô cây')
        } finally {
            setLoading(false)
        }
    }

    const handleAssign = async () => {
        if (!selectedLotId) return

        setAssigning(true)
        setError(null)

        try {
            await onAssign(selectedLotId)
            onClose()
        } catch (err) {
            console.error('Assignment error:', err)
            setError(
                err instanceof Error
                    ? err.message
                    : 'Không thể gán lô cây'
            )
        } finally {
            setAssigning(false)
        }
    }

    const getCapacityPercentage = (lot: Lot) => {
        return (lot.planted / lot.total_trees) * 100
    }

    const getAvailableSpace = (lot: Lot) => {
        return lot.total_trees - lot.planted
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Gán Lô Cây
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
                        Chọn lô cây để gán {quantity} cây từ đơn hàng này
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {loading && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            <p className="mt-2 text-gray-600">Đang tải...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {!loading && lots.length === 0 && (
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
                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                Không có lô cây khả dụng
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Không có lô nào đủ sức chứa cho {quantity} cây
                            </p>
                        </div>
                    )}

                    {!loading && lots.length > 0 && (
                        <div className="space-y-4">
                            {lots.map((lot) => (
                                <div
                                    key={lot.id}
                                    onClick={() => setSelectedLotId(lot.id)}
                                    className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedLotId === lot.id
                                            ? 'border-green-600 bg-green-50 ring-2 ring-green-600'
                                            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {lot.name}
                                                </h3>
                                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                                    {lot.region}
                                                </span>
                                            </div>
                                            {lot.description && (
                                                <p className="mt-1 text-sm text-gray-600">
                                                    {lot.description}
                                                </p>
                                            )}

                                            {/* Capacity Info */}
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-gray-600">
                                                        Sức chứa
                                                    </span>
                                                    <span className="font-medium text-gray-900">
                                                        {lot.planted} / {lot.total_trees} cây
                                                    </span>
                                                </div>
                                                {/* Progress Bar */}
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${getCapacityPercentage(lot) > 80
                                                                ? 'bg-orange-500'
                                                                : 'bg-green-600'
                                                            }`}
                                                        style={{
                                                            width: `${getCapacityPercentage(lot)}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Còn trống: {getAvailableSpace(lot)} cây
                                                </p>
                                            </div>

                                            {/* GPS Location */}
                                            {lot.location_lat && lot.location_lng && (
                                                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                    </svg>
                                                    <span>
                                                        {lot.location_lat.toFixed(6)},{' '}
                                                        {lot.location_lng.toFixed(6)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Selection Indicator */}
                                        {selectedLotId === lot.id && (
                                            <div className="ml-4">
                                                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                                                    <svg
                                                        className="w-4 h-4 text-white"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={assigning}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedLotId || assigning}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {assigning ? 'Đang gán...' : 'Xác nhận gán'}
                    </button>
                </div>
            </div>
        </div>
    )
}
