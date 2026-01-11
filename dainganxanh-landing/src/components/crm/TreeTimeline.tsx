'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'

interface TimelineStage {
    month: number
    label: string
    icon: string
    placeholder?: boolean
}

interface TreePhoto {
    id: string
    photo_url: string
    caption?: string
    uploaded_at: string
}

interface TreeTimelineProps {
    plantedAt: string | null
    createdAt: string
    ageInMonths: number
    photos?: TreePhoto[]
}

// Translations - extracted for future i18n support
const T = {
    title: 'Hành Trình Cây',
    currentIndicator: '← Bạn đang ở đây',
    completed: 'Hoàn thành',
    inProgress: 'Đang diễn ra',
    upcoming: 'Sắp tới',
    estimated: 'Dự kiến',
    inThisStage: 'Đang trong giai đoạn này',
    month: 'Tháng',
    currentAge: 'Tuổi cây hiện tại',
    progressToHarvest: 'Tiến độ đến thu hoạch',
    monthUnit: 'tháng',
    photoError: '📷 Lỗi',
    photoAlt: 'Ảnh cây',
    stagesAriaLabel: 'Các giai đoạn phát triển cây',
} as const

const TIMELINE_STAGES: TimelineStage[] = [
    { month: 0, label: 'Đặt hàng thành công', icon: '✅' },
    { month: 1, label: 'Đang ươm giống', icon: '🌱', placeholder: true },
    { month: 3, label: 'Cây giống sẵn sàng', icon: '🌿', placeholder: true },
    { month: 6, label: 'Trồng xuống đất', icon: '🌲' },
    { month: 12, label: 'Năm 1: Bám rễ', icon: '🌳' },
    { month: 24, label: 'Năm 2: Phát triển', icon: '🌳' },
    { month: 36, label: 'Năm 3: Trưởng thành', icon: '🎋' },
    { month: 48, label: 'Năm 4: Sắp thu hoạch', icon: '🎋' },
    { month: 60, label: 'Năm 5: Thu hoạch', icon: '✨' },
]

// Utility function for robust date arithmetic (handles edge cases like month overflow)
function addMonths(date: Date, months: number): Date {
    const result = new Date(date)
    const targetMonth = result.getMonth() + months
    result.setMonth(targetMonth)
    // Handle edge case where adding months overshoots (e.g., Jan 31 + 1 month = Mar 3)
    // If the day changed, it means we overflowed - go back to last day of target month
    if (result.getDate() !== date.getDate()) {
        result.setDate(0) // Set to last day of previous month
    }
    return result
}

// Sub-component for individual photo with error handling
function StagePhoto({ photo }: { photo: TreePhoto }) {
    const [hasError, setHasError] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    if (hasError) {
        return (
            <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                {T.photoError}
            </div>
        )
    }

    return (
        <div className="flex-shrink-0 relative group w-20 h-20">
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-200 rounded-lg animate-pulse motion-reduce:animate-none" />
            )}
            <Image
                src={photo.photo_url}
                alt={photo.caption || T.photoAlt}
                width={80}
                height={80}
                className={`w-20 h-20 object-cover rounded-lg border-2 border-green-200 hover:border-green-400 transition-all cursor-pointer ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                unoptimized // For external URLs
            />
            {photo.caption && isLoaded && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end p-1">
                    <span className="text-white text-xs truncate">{photo.caption}</span>
                </div>
            )}
        </div>
    )
}

export default function TreeTimeline({ plantedAt, createdAt, ageInMonths, photos = [] }: TreeTimelineProps) {
    const currentStageIndex = useMemo(() => {
        return TIMELINE_STAGES.findIndex((stage, index) => {
            const nextStage = TIMELINE_STAGES[index + 1]
            return ageInMonths >= stage.month && (!nextStage || ageInMonths < nextStage.month)
        })
    }, [ageInMonths])

    const getStageStatus = (stageIndex: number) => {
        if (stageIndex < currentStageIndex) return 'completed'
        if (stageIndex === currentStageIndex) return 'current'
        return 'future'
    }

    const getEstimatedDate = (monthsFromNow: number) => {
        const baseDate = plantedAt ? new Date(plantedAt) : new Date(createdAt)
        const estimatedDate = addMonths(baseDate, monthsFromNow)
        return estimatedDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    }

    // Memoize photos grouped by stage - prevents recalculation on each render
    const photosPerStage = useMemo(() => {
        if (photos.length === 0) return {}

        const baseDate = plantedAt ? new Date(plantedAt) : new Date(createdAt)
        const result: Record<number, TreePhoto[]> = {}

        TIMELINE_STAGES.forEach((stage, stageIndex) => {
            const nextStage = TIMELINE_STAGES[stageIndex + 1]

            const stageStartDate = addMonths(baseDate, stage.month)
            const stageEndDate = nextStage
                ? addMonths(baseDate, nextStage.month)
                : new Date(baseDate.getFullYear() + 10, baseDate.getMonth(), baseDate.getDate())

            result[stageIndex] = photos.filter(photo => {
                const uploadDate = new Date(photo.uploaded_at)
                return uploadDate >= stageStartDate && uploadDate < stageEndDate
            })
        })

        return result
    }, [photos, plantedAt, createdAt])

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📅</span>
                <h2 className="text-2xl font-bold text-gray-800">{T.title}</h2>
            </div>

            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Timeline stages */}
                <div className="space-y-8" role="list" aria-label={T.stagesAriaLabel}>
                    {TIMELINE_STAGES.map((stage, index) => {
                        const status = getStageStatus(index)
                        const isCurrent = status === 'current'
                        const isCompleted = status === 'completed'
                        const isFuture = status === 'future'

                        return (
                            <div
                                key={stage.month}
                                className="relative flex gap-6"
                                role="listitem"
                                aria-label={`${stage.label} - ${status === 'completed' ? T.completed : status === 'current' ? T.inProgress : T.upcoming}`}
                            >
                                {/* Icon */}
                                <div
                                    className={`
                                        relative z-10 flex items-center justify-center w-12 h-12 rounded-full text-2xl
                                        ${isCompleted ? 'bg-green-100 ring-4 ring-green-200' : ''}
                                        ${isCurrent ? 'bg-emerald-500 ring-4 ring-emerald-200 animate-pulse motion-reduce:animate-none' : ''}
                                        ${isFuture ? 'bg-gray-100' : ''}
                                    `}
                                    aria-hidden="true"
                                >
                                    {stage.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pb-8">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3
                                                className={`
                          text-lg font-semibold
                          ${isCompleted ? 'text-green-700' : ''}
                          ${isCurrent ? 'text-emerald-700' : ''}
                          ${isFuture ? 'text-gray-400' : ''}
                        `}
                                            >
                                                {stage.label}
                                                {isCurrent && (
                                                    <span className="ml-2 text-sm font-normal text-emerald-600">
                                                        {T.currentIndicator}
                                                    </span>
                                                )}
                                            </h3>

                                            {/* Placeholder indicator for young trees < 9 months */}
                                            {stage.placeholder && ageInMonths < 9 && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {ageInMonths < stage.month ? (
                                                        <>{T.estimated}: {getEstimatedDate(stage.month)}</>
                                                    ) : (
                                                        <>{T.inThisStage}</>
                                                    )}
                                                </p>
                                            )}

                                            {/* Status indicator for all non-placeholder or mature trees */}
                                            {(!stage.placeholder || ageInMonths >= 9) && (
                                                <p className={`text-sm mt-1 ${isFuture ? 'text-gray-400' : 'text-green-600'}`}>
                                                    {isCompleted && <>{T.completed}</>}
                                                    {isCurrent && <>{T.inProgress}</>}
                                                    {isFuture && <>{T.estimated}: {getEstimatedDate(stage.month)}</>}
                                                </p>
                                            )}

                                            {/* Photos for this stage */}
                                            {(() => {
                                                const stagePhotos = photosPerStage[index] || []
                                                if (stagePhotos.length === 0) return null

                                                return (
                                                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                                                        {stagePhotos.slice(0, 4).map((photo) => (
                                                            <StagePhoto key={photo.id} photo={photo} />
                                                        ))}
                                                        {stagePhotos.length > 4 && (
                                                            <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm font-medium">
                                                                +{stagePhotos.length - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })()}
                                        </div>

                                        {/* Month indicator */}
                                        <span
                                            className={`
                                                text-sm font-medium px-3 py-1 rounded-full
                                                ${isCompleted ? 'bg-green-100 text-green-700' : ''}
                                                ${isCurrent ? 'bg-emerald-100 text-emerald-700' : ''}
                                                ${isFuture ? 'bg-gray-100 text-gray-500' : ''}
                                            `}
                                        >
                                            {T.month} {stage.month}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Progress summary */}
            <div className="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">{T.currentAge}</p>
                        <p className="text-2xl font-bold text-emerald-700">{ageInMonths} {T.monthUnit}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">{T.progressToHarvest}</p>
                        <p className="text-2xl font-bold text-emerald-700">
                            {Math.min(Math.round((ageInMonths / 60) * 100), 100)}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
