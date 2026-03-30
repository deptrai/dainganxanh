'use client'

import Image from 'next/image'
import { format, isValid } from 'date-fns'
import { vi } from 'date-fns/locale'
import { PHOTO_PLACEHOLDER_MONTHS, TREE_STATUS_CONFIG } from '@/lib/constants'

interface PackageDetailHeaderProps {
    order: {
        quantity: number
        tree_status: string | null
        planted_at: string | null
        latest_photo_url: string | null
        created_at: string
        lots?: {
            name: string
            region: string
        } | null
    }
    packageCode: string
}

export default function PackageDetailHeader({ order, packageCode }: PackageDetailHeaderProps) {
    const treeStatus = order.tree_status || 'pending'
    const statusConfig = TREE_STATUS_CONFIG[treeStatus as keyof typeof TREE_STATUS_CONFIG] || TREE_STATUS_CONFIG.pending

    // Parse dates safely
    const plantedDate = order.planted_at ? new Date(order.planted_at) : null
    const createdDate = new Date(order.created_at)
    const displayDate = plantedDate && isValid(plantedDate) ? plantedDate : createdDate
    const isValidDisplayDate = isValid(displayDate)

    // Calculate months old for placeholder logic
    const monthsOld = isValidDisplayDate
        ? (Date.now() - displayDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        : 0
    const showPlaceholder = !order.latest_photo_url || monthsOld < PHOTO_PLACEHOLDER_MONTHS

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            {/* Hero Image */}
            <div className="relative h-80 bg-gradient-to-br from-emerald-100 to-green-200">
                {showPlaceholder ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <span className="text-9xl">🌱</span>
                            <p className="text-xl text-gray-700 mt-4 font-medium">Cây đang được ươm...</p>
                        </div>
                    </div>
                ) : (
                    <Image
                        src={order.latest_photo_url!}
                        alt={`Package ${packageCode}`}
                        fill
                        className="object-cover"
                        priority
                    />
                )}

                {/* Quantity Badge */}
                <div className="absolute top-6 right-6 bg-emerald-600 text-white px-6 py-3 rounded-full text-lg font-bold shadow-2xl">
                    {order.quantity} cây
                </div>
            </div>

            {/* Package Info */}
            <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-emerald-800 mb-2">
                            {packageCode}
                        </h1>
                        {order.lots && (
                            <p className="text-gray-600 text-lg">
                                📍 {order.lots.name} • {order.lots.region}
                            </p>
                        )}
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-medium ${statusConfig.color}`}>
                        <span className="text-2xl">{statusConfig.emoji}</span>
                        <span>{statusConfig.label}</span>
                    </div>
                </div>

                {/* Date Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📅</span>
                        <div>
                            <p className="text-sm text-gray-500">Ngày đặt hàng</p>
                            <p className="font-semibold">
                                {format(createdDate, 'dd/MM/yyyy', { locale: vi })}
                            </p>
                        </div>
                    </div>
                    {order.planted_at && isValid(plantedDate) && (
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🌱</span>
                            <div>
                                <p className="text-sm text-gray-500">Ngày trồng</p>
                                <p className="font-semibold">
                                    {format(plantedDate!, 'dd/MM/yyyy', { locale: vi })}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
