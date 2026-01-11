'use client'

import { format, isValid } from 'date-fns'
import { vi } from 'date-fns/locale'

interface GrowthTimelineProps {
    plantedAt: string | null
    createdAt: string
    treeStatus: string
    ageInMonths: number
}

interface Milestone {
    month: number
    title: string
    description: string
    icon: string
    completed: boolean
}

export default function GrowthTimeline({ plantedAt, createdAt, treeStatus, ageInMonths }: GrowthTimelineProps) {
    const milestones: Milestone[] = [
        {
            month: 0,
            title: 'Đặt Hàng',
            description: 'Đơn hàng được xác nhận',
            icon: '📦',
            completed: true
        },
        {
            month: 3,
            title: 'Ươm Giống',
            description: 'Cây đang được ươm trong vườn ươm',
            icon: '🌱',
            completed: ageInMonths >= 3
        },
        {
            month: 9,
            title: 'Trồng Xuống Đất',
            description: 'Cây được trồng vào lô đất',
            icon: '🌿',
            completed: ageInMonths >= 9
        },
        {
            month: 12,
            title: 'Năm Đầu Tiên',
            description: 'Cây đã 1 tuổi, bắt đầu phát triển mạnh',
            icon: '🌲',
            completed: ageInMonths >= 12
        },
        {
            month: 24,
            title: 'Năm Thứ Hai',
            description: 'Cây tiếp tục lớn, hấp thụ CO₂ tăng',
            icon: '🎋',
            completed: ageInMonths >= 24
        },
        {
            month: 60,
            title: 'Thu Hoạch',
            description: 'Cây đã trưởng thành, sẵn sàng thu hoạch',
            icon: '✨',
            completed: ageInMonths >= 60
        }
    ]

    const orderDate = new Date(createdAt)

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📅</span>
                <h2 className="text-2xl font-bold text-gray-800">Lịch Sử Phát Triển</h2>
            </div>

            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-emerald-200" />

                {/* Milestones */}
                <div className="space-y-8">
                    {milestones.map((milestone, index) => (
                        <div key={index} className="relative flex items-start gap-6">
                            {/* Icon */}
                            <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full text-2xl ${milestone.completed
                                    ? 'bg-emerald-500 text-white shadow-lg'
                                    : 'bg-gray-200 text-gray-400'
                                }`}>
                                {milestone.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className={`text-lg font-bold ${milestone.completed ? 'text-emerald-700' : 'text-gray-400'
                                        }`}>
                                        {milestone.title}
                                    </h3>
                                    {milestone.completed && (
                                        <span className="text-sm text-emerald-600 font-medium">
                                            ✓ Hoàn thành
                                        </span>
                                    )}
                                </div>
                                <p className={`text-sm ${milestone.completed ? 'text-gray-600' : 'text-gray-400'
                                    }`}>
                                    {milestone.description}
                                </p>
                                {milestone.month === 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {format(orderDate, 'dd/MM/yyyy', { locale: vi })}
                                    </p>
                                )}
                                {!milestone.completed && milestone.month > ageInMonths && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Dự kiến: Tháng {milestone.month}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
