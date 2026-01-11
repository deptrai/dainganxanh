'use client'

import Image from 'next/image'
import Link from 'next/link'
import { format, isValid } from 'date-fns'
import { vi } from 'date-fns/locale'

interface PackageCardProps {
    order: {
        id: string
        order_code: string | null
        quantity: number
        status: string
        tree_status: string | null
        planted_at: string | null
        co2_absorbed: number | null
        latest_photo_url: string | null
        created_at: string
    }
}

const TREE_STATUS_CONFIG = {
    pending: { label: 'Chờ xử lý', emoji: '⏳', color: 'bg-gray-100 text-gray-800' },
    seedling: { label: 'Đang ươm', emoji: '🌱', color: 'bg-green-100 text-green-800' },
    planted: { label: 'Đã trồng', emoji: '🌿', color: 'bg-emerald-100 text-emerald-800' },
    growing: { label: 'Đang lớn', emoji: '🌲', color: 'bg-green-600 text-white' },
    mature: { label: 'Trưởng thành', emoji: '🎋', color: 'bg-yellow-100 text-yellow-800' },
    harvested: { label: 'Thu hoạch', emoji: '✨', color: 'bg-purple-100 text-purple-800' },
    dead: { label: 'Chết', emoji: '⚫', color: 'bg-gray-100 text-gray-800' },
}

function generatePackageCode(orderId: string, orderCode: string | null): string {
    if (orderCode) return orderCode
    // Generate user-friendly code from order ID
    const year = new Date().getFullYear()
    const shortId = orderId.slice(0, 6).toUpperCase()
    return `PKG-${year}-${shortId}`
}

export default function PackageCard({ order }: PackageCardProps) {
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
    const showPlaceholder = !order.latest_photo_url || monthsOld < 9

    // Calculate CO2 (default: quantity * 20kg per tree per year)
    const co2Total = order.co2_absorbed ?? (order.quantity * 20)

    const packageCode = generatePackageCode(order.id, order.order_code)

    return (
        <Link
            href={`/crm/my-garden/${order.id}`}
            className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
        >
            {/* Image */}
            <div className="relative h-48 bg-gradient-to-br from-emerald-50 to-green-100">
                {showPlaceholder ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <span className="text-6xl">🌱</span>
                            <p className="text-sm text-gray-600 mt-2">Cây đang được ươm...</p>
                        </div>
                    </div>
                ) : (
                    <Image
                        src={order.latest_photo_url!}
                        alt={`Package ${packageCode}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                )}

                {/* Quantity Badge */}
                <div className="absolute top-3 right-3 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    {order.quantity} cây
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Package Code */}
                <h3 className="font-bold text-lg text-emerald-800 mb-2">
                    {packageCode}
                </h3>

                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                        <span>{statusConfig.emoji}</span>
                        <span>{statusConfig.label}</span>
                    </span>
                </div>

                {/* Planted/Order Date */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <span>📅</span>
                    <span>
                        {order.planted_at && isValid(plantedDate)
                            ? `Trồng: ${format(plantedDate!, 'dd/MM/yyyy', { locale: vi })}`
                            : `Đặt: ${format(createdDate, 'dd/MM/yyyy', { locale: vi })}`
                        }
                    </span>
                </div>

                {/* CO2 Absorbed */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>💨</span>
                    <span className="font-semibold text-emerald-600">
                        {co2Total.toFixed(1)} kg CO₂/năm
                    </span>
                </div>
            </div>
        </Link>
    )
}
