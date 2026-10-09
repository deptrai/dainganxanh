'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import CreateLotForm from '@/components/admin/CreateLotForm'
import EditLotForm from '@/components/admin/EditLotForm'

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

export default function LotsPage() {
    const [lots, setLots] = useState<Lot[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingLot, setEditingLot] = useState<Lot | null>(null)

    useEffect(() => {
        fetchLots()
    }, [])

    const fetchLots = async () => {
        try {
            const supabase = createBrowserClient()
            const { data, error } = await supabase
                .from('lots')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setLots(data || [])
        } catch (err) {
            console.error('Error fetching lots:', err)
        } finally {
            setLoading(false)
        }
    }

    const getCapacityPercentage = (lot: Lot) => {
        if (lot.total_trees === 0) return 0
        return (lot.planted / lot.total_trees) * 100
    }

    const getStatusColor = (percentage: number) => {
        if (percentage >= 100) return 'bg-red-500'
        if (percentage >= 80) return 'bg-orange-500'
        if (percentage >= 50) return 'bg-yellow-500'
        return 'bg-green-500'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Quản Lý Lô Cây
                            </h1>
                            <p className="mt-2 text-gray-600">
                                Quản lý các lô cây và sức chứa
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Tạo Lô Mới
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm text-gray-600">Tổng số lô</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {lots.length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm text-gray-600">Tổng sức chứa</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {lots.reduce((sum, lot) => sum + lot.total_trees, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm text-gray-600">Đã trồng</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {lots.reduce((sum, lot) => sum + lot.planted, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-orange-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm text-gray-600">Còn trống</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {lots.reduce((sum, lot) => sum + (lot.total_trees - lot.planted), 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-purple-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lots List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                        <p className="mt-4 text-gray-600">Đang tải...</p>
                    </div>
                ) : lots.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
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
                            Chưa có lô cây nào
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Bắt đầu bằng cách tạo lô cây đầu tiên
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                                <svg
                                    className="-ml-1 mr-2 h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Tạo Lô Mới
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lots.map((lot) => {
                            const percentage = getCapacityPercentage(lot)
                            return (
                                <div
                                    key={lot.id}
                                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {lot.name}
                                                </h3>
                                                <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                                    {lot.region}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setEditingLot(lot)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                    />
                                                </svg>
                                            </button>
                                        </div>

                                        {lot.description && (
                                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                                {lot.description}
                                            </p>
                                        )}

                                        {/* Capacity */}
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-gray-600">Sức chứa</span>
                                                <span className="font-medium text-gray-900">
                                                    {lot.planted} / {lot.total_trees}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${getStatusColor(percentage)}`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                ></div>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {percentage.toFixed(1)}% - Còn trống:{' '}
                                                {lot.total_trees - lot.planted} cây
                                            </p>
                                        </div>

                                        {/* GPS */}
                                        {lot.location_lat && lot.location_lng && (
                                            <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
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
                                                    {lot.location_lat.toFixed(4)}, {lot.location_lng.toFixed(4)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Create Form Modal */}
                {showCreateForm && (
                    <CreateLotForm
                        onClose={() => setShowCreateForm(false)}
                        onSuccess={() => {
                            fetchLots()
                            setShowCreateForm(false)
                        }}
                    />
                )}

                {/* Edit Form Modal */}
                {editingLot && (
                    <EditLotForm
                        lot={editingLot}
                        onClose={() => setEditingLot(null)}
                        onSuccess={() => {
                            fetchLots()
                            setEditingLot(null)
                        }}
                    />
                )}
            </div>
        </div>
    )
}
