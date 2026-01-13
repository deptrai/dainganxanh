'use client'

import { useState } from 'react'
import { MapPin, Edit2, Check, X } from 'lucide-react'
import type { GPSData } from '@/lib/imageProcessing'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with Leaflet
const MiniMap = dynamic(() => import('./MiniMap'), { ssr: false })

interface GPSPreviewProps {
    gps: GPSData | null
    onGPSChange?: (gps: GPSData) => void
    readonly?: boolean
}

export function GPSPreview({ gps, onGPSChange, readonly = false }: GPSPreviewProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editLat, setEditLat] = useState(gps?.lat.toString() || '')
    const [editLng, setEditLng] = useState(gps?.lng.toString() || '')
    const [error, setError] = useState('')

    const handleSave = () => {
        const lat = parseFloat(editLat)
        const lng = parseFloat(editLng)

        // Validate coordinates
        if (isNaN(lat) || isNaN(lng)) {
            setError('Tọa độ không hợp lệ')
            return
        }

        if (lat < -90 || lat > 90) {
            setError('Latitude phải từ -90 đến 90')
            return
        }

        if (lng < -180 || lng > 180) {
            setError('Longitude phải từ -180 đến 180')
            return
        }

        setError('')
        onGPSChange?.({ lat, lng })
        setIsEditing(false)
    }

    const handleCancel = () => {
        setEditLat(gps?.lat.toString() || '')
        setEditLng(gps?.lng.toString() || '')
        setError('')
        setIsEditing(false)
    }

    const handleStartEdit = () => {
        if (!readonly) {
            setIsEditing(true)
        }
    }

    if (!gps && !isEditing && readonly) {
        return (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
                <MapPin className="w-4 h-4" />
                <span>Không có dữ liệu GPS</span>
            </div>
        )
    }

    if (!gps && !isEditing && !readonly) {
        return (
            <button
                onClick={handleStartEdit}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
            >
                <MapPin className="w-4 h-4" />
                <span>Thêm GPS thủ công</span>
            </button>
        )
    }

    return (
        <div className="space-y-2">
            {/* Display Mode */}
            {!isEditing && gps && (
                <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">
                                GPS: {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
                            </span>
                            {!readonly && (
                                <button
                                    onClick={handleStartEdit}
                                    className="text-blue-600 hover:text-blue-700"
                                    aria-label="Edit GPS"
                                >
                                    <Edit2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        {gps.accuracy && (
                            <p className="text-xs text-gray-500">
                                Độ chính xác: ±{gps.accuracy.toFixed(1)}m
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Mini Map Display */}
            {!isEditing && gps && (
                <div className="mt-3">
                    <MiniMap lat={gps.lat} lng={gps.lng} accuracy={gps.accuracy} height={200} />
                </div>
            )}

            {/* Edit Mode */}
            {isEditing && (
                <div className="space-y-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Latitude (-90 to 90)
                            </label>
                            <input
                                type="number"
                                step="0.000001"
                                value={editLat}
                                onChange={(e) => setEditLat(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="10.762622"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Longitude (-180 to 180)
                            </label>
                            <input
                                type="number"
                                step="0.000001"
                                value={editLng}
                                onChange={(e) => setEditLng(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="106.660172"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-red-600">{error}</p>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                            <Check className="w-3 h-3" />
                            Lưu
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                        >
                            <X className="w-3 h-3" />
                            Hủy
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
