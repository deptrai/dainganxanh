'use client'

import { useState, useEffect } from 'react'
import { QuarterSelector } from '@/components/admin/QuarterSelector'
import { ChecklistProgress } from '@/components/admin/ChecklistProgress'
import { ChecklistItem } from '@/components/admin/ChecklistItem'
import {
    getLotsWithChecklistStatus,
    getChecklistProgress,
    updateChecklistItem,
    type LotWithChecklist,
} from '@/actions/fieldChecklist'

export default function ChecklistPage() {
    const currentYear = new Date().getFullYear()
    const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`
    const [selectedQuarter, setSelectedQuarter] = useState(
        `${currentYear}-${currentQuarter}`
    )
    const [lots, setLots] = useState<LotWithChecklist[]>([])
    const [expandedLotId, setExpandedLotId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [overallProgress, setOverallProgress] = useState({
        totalLots: 0,
        completedLots: 0,
        overallPercentage: 0,
    })

    // Load lots and progress when quarter changes
    useEffect(() => {
        loadData()
    }, [selectedQuarter])

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [lotsResult, progressResult] = await Promise.all([
                getLotsWithChecklistStatus(selectedQuarter),
                getChecklistProgress(selectedQuarter),
            ])

            if (lotsResult.data) {
                setLots(lotsResult.data)
            }

            if (progressResult.data) {
                setOverallProgress(progressResult.data)
            }
        } catch (error) {
            console.error('Error loading checklist data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleItem = async (
        lotId: string,
        checklistId: string,
        itemId: string,
        completed: boolean
    ) => {
        // Optimistic update
        setLots((prevLots) =>
            prevLots.map((lot) => {
                if (lot.lot_id === lotId && lot.checklist) {
                    const updatedItems = lot.checklist.checklist_items.map((item) =>
                        item.id === itemId
                            ? {
                                ...item,
                                completed,
                                completed_at: completed ? new Date().toISOString() : null,
                                completed_by: completed ? 'admin' : null,
                            }
                            : item
                    )

                    const completedCount = updatedItems.filter((i) => i.completed).length
                    const newPercentage = Math.round(
                        (completedCount / updatedItems.length) * 100
                    )

                    return {
                        ...lot,
                        checklist: {
                            ...lot.checklist,
                            checklist_items: updatedItems,
                        },
                        completion_percentage: newPercentage,
                    }
                }
                return lot
            })
        )

        // Server update
        const result = await updateChecklistItem(checklistId, itemId, { completed })

        if (result.error) {
            console.error('Error updating checklist item:', result.error)
            // Revert optimistic update on error
            loadData()
        } else {
            // Reload progress after successful update
            const progressResult = await getChecklistProgress(selectedQuarter)
            if (progressResult.data) {
                setOverallProgress(progressResult.data)
            }
        }
    }

    const handleNotesChange = async (
        lotId: string,
        checklistId: string,
        itemId: string,
        notes: string
    ) => {
        // Optimistic update
        setLots((prevLots) =>
            prevLots.map((lot) => {
                if (lot.lot_id === lotId && lot.checklist) {
                    const updatedItems = lot.checklist.checklist_items.map((item) =>
                        item.id === itemId ? { ...item, notes } : item
                    )

                    return {
                        ...lot,
                        checklist: {
                            ...lot.checklist,
                            checklist_items: updatedItems,
                        },
                    }
                }
                return lot
            })
        )

        // Server update
        const result = await updateChecklistItem(checklistId, itemId, { notes })

        if (result.error) {
            console.error('Error updating checklist notes:', result.error)
            // Revert optimistic update on error
            loadData()
        }
    }

    const toggleLotExpansion = (lotId: string) => {
        setExpandedLotId(expandedLotId === lotId ? null : lotId)
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Checklist Trồng Cây Theo Quý
                    </h1>
                    <p className="text-gray-600">
                        Theo dõi và quản lý công việc trồng cây định kỳ cho từng lô
                    </p>
                </div>

                {/* Quarter Selector */}
                <div className="mb-6">
                    <QuarterSelector
                        selectedQuarter={selectedQuarter}
                        onQuarterChange={setSelectedQuarter}
                    />
                </div>

                {/* Overall Progress */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Tiến Độ Tổng Thể
                        </h2>
                        <span className="text-sm text-gray-600">
                            {overallProgress.completedLots}/{overallProgress.totalLots} lô hoàn thành
                        </span>
                    </div>
                    <ChecklistProgress
                        completed={overallProgress.completedLots}
                        total={overallProgress.totalLots}
                        size="lg"
                    />
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
                    </div>
                )}

                {/* Lots List */}
                {!isLoading && lots.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
                        <p className="text-gray-600">Chưa có lô nào trong hệ thống</p>
                    </div>
                )}

                {!isLoading && lots.length > 0 && (
                    <div className="space-y-4">
                        {lots.map((lot) => (
                            <div
                                key={lot.lot_id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                            >
                                {/* Lot Header */}
                                <button
                                    onClick={() => toggleLotExpansion(lot.lot_id)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex-1 text-left">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {lot.lot_name}
                                            </h3>
                                            <p className="text-sm text-gray-600">{lot.lot_region}</p>
                                        </div>
                                        <div className="w-64">
                                            <ChecklistProgress
                                                completed={
                                                    lot.checklist
                                                        ? lot.checklist.checklist_items.filter((i) => i.completed)
                                                            .length
                                                        : 0
                                                }
                                                total={lot.checklist?.checklist_items.length || 5}
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                    <svg
                                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedLotId === lot.lot_id ? 'rotate-180' : ''
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {/* Checklist Items */}
                                {expandedLotId === lot.lot_id && lot.checklist && (
                                    <div className="border-t border-gray-200">
                                        <div className="px-6 py-3 bg-gray-50">
                                            <h4 className="text-sm font-medium text-gray-700">
                                                Danh Sách Công Việc
                                            </h4>
                                        </div>
                                        <div>
                                            {lot.checklist.checklist_items.map((item) => (
                                                <ChecklistItem
                                                    key={item.id}
                                                    item={item}
                                                    checklistId={lot.checklist!.id}
                                                    onToggle={(itemId, completed) =>
                                                        handleToggleItem(
                                                            lot.lot_id,
                                                            lot.checklist!.id,
                                                            itemId,
                                                            completed
                                                        )
                                                    }
                                                    onNotesChange={(itemId, notes) =>
                                                        handleNotesChange(
                                                            lot.lot_id,
                                                            lot.checklist!.id,
                                                            itemId,
                                                            notes
                                                        )
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
