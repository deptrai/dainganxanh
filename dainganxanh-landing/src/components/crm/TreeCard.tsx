'use client'

import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import HarvestBadge from './HarvestBadge'
import { HARVEST_MONTHS, PHOTO_PLACEHOLDER_MONTHS, TREE_STATUS_CONFIG } from '@/lib/constants'

interface TreeCardProps {
    tree: {
        id: string
        tree_code: string
        order_id?: string
        status: string
        planted_at: string
        co2_absorbed: number
        latest_photo: string | null
    }
}

export default function TreeCard({ tree }: TreeCardProps) {
    const statusConfig = TREE_STATUS_CONFIG[tree.status as keyof typeof TREE_STATUS_CONFIG] || TREE_STATUS_CONFIG.seedling

    // Safely parse planted date with fallback
    let plantedDate = new Date()
    let isValidDate = false

    if (tree.planted_at) {
        const parsed = new Date(tree.planted_at)
        if (!isNaN(parsed.getTime())) {
            plantedDate = parsed
            isValidDate = true
        }
    }

    // Check if tree is less than 9 months old
    const monthsOld = isValidDate ? (Date.now() - plantedDate.getTime()) / (1000 * 60 * 60 * 24 * 30) : 0
    const showPlaceholder = !tree.latest_photo || monthsOld < PHOTO_PLACEHOLDER_MONTHS

    // Check if tree is ready for harvest (configurable via environment)
    const minutesOld = isValidDate ? (Date.now() - plantedDate.getTime()) / (1000 * 60) : 0
    const isDev = process.env.NODE_ENV !== 'production'
    const isHarvestReady = isDev ? minutesOld >= 3 : monthsOld >= HARVEST_MONTHS

    return (
        <Link
            href={`/crm/my-garden/${tree.order_id || tree.id}`}
            className={`block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group ${isHarvestReady ? 'ring-4 ring-yellow-400' : ''
                }`}
        >
            {/* Image */}
            <div className="relative h-48 bg-gradient-to-br from-emerald-50 to-green-100">
                {showPlaceholder ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <span className="text-6xl">🌱</span>
                            <p className="text-sm text-gray-600 mt-2">Cây đang lớn...</p>
                        </div>
                    </div>
                ) : (
                    <Image
                        src={tree.latest_photo!}
                        alt={`Cây ${tree.tree_code}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Tree Code */}
                <h3 className="font-bold text-lg text-emerald-800 mb-2">
                    {tree.tree_code}
                </h3>

                {/* Harvest Badge (if ready) */}
                {isHarvestReady && (
                    <div className="mb-3">
                        <HarvestBadge ageInMonths={monthsOld} />
                    </div>
                )}

                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                        <span>{statusConfig.emoji}</span>
                        <span>{statusConfig.label}</span>
                    </span>
                </div>

                {/* Planted Date */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <span>📅</span>
                    <span>Trồng: {isValidDate ? format(plantedDate, 'dd/MM/yyyy', { locale: vi }) : 'Chưa xác định'}</span>
                </div>

                {/* CO2 Absorbed */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>💨</span>
                    <span className="font-semibold text-emerald-600">
                        {(tree.co2_absorbed ?? 0).toFixed(1)} kg CO₂
                    </span>
                </div>
            </div>
        </Link>
    )
}
