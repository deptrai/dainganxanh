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
}

interface EditLotFormProps {
    lot: Lot
    onClose: () => void
    onSuccess: () => void
}

export default function EditLotForm({ lot, onClose, onSuccess }: EditLotFormProps) {
    const [formData, setFormData] = useState({
        name: lot.name,
        region: lot.region,
        description: lot.description || '',
        location_lat: lot.location_lat?.toString() || '',
        location_lng: lot.location_lng?.toString() || '',
        total_trees: lot.total_trees.toString(),
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const supabase = createBrowserClient()

            // Validate
            if (!formData.name || !formData.region || !formData.total_trees) {
                throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc')
            }

            const totalTrees = parseInt(formData.total_trees)
            if (isNaN(totalTrees) || totalTrees <= 0) {
                throw new Error('Sức chứa phải là số dương')
            }

            // Cannot reduce capacity below planted count
            if (totalTrees < lot.planted) {
                throw new Error(
                    `Không thể giảm sức chứa xuống dưới ${lot.planted} (số cây đã trồng)`
                )
            }

            // Prepare data
            const lotData: any = {
                name: formData.name.trim(),
                region: formData.region.trim(),
                description: formData.description.trim() || null,
                total_trees: totalTrees,
            }

            // Add GPS if provided
            if (formData.location_lat && formData.location_lng) {
                const lat = parseFloat(formData.location_lat)
                const lng = parseFloat(formData.location_lng)

                if (isNaN(lat) || isNaN(lng)) {
                    throw new Error('Tọa độ GPS không hợp lệ')
                }

                lotData.location_lat = lat
                lotData.location_lng = lng
            } else {
                // Clear GPS if empty
                lotData.location_lat = null
                lotData.location_lng = null
            }

            // Update
            const { error: updateError } = await supabase
                .from('lots')
                .update(lotData)
                .eq('id', lot.id)

            if (updateError) throw updateError

            onSuccess()
            onClose()
        } catch (err) {
            console.error('Error updating lot:', err)
            setError(
                err instanceof Error ? err.message : 'Không thể cập nhật lô cây'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Chỉnh Sửa Lô Cây
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
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tên Lô <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Region */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Khu Vực <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.region}
                                onChange={(e) =>
                                    setFormData({ ...formData, region: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Total Trees */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sức Chứa (số cây) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.total_trees}
                                onChange={(e) =>
                                    setFormData({ ...formData, total_trees: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                                min={lot.planted}
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Đã trồng: {lot.planted} cây (không thể giảm sức chứa xuống dưới số này)
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mô Tả
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                            />
                        </div>

                        {/* GPS Coordinates */}
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-3">
                                Tọa Độ GPS (Tùy chọn)
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Vĩ Độ (Latitude)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location_lat}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                location_lat: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                                        placeholder="10.762622"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kinh Độ (Longitude)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location_lng}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                location_lng: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                                        placeholder="106.660172"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                </div>
            </div>
        </div>
    )
}
