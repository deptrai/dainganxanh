'use client'

import { useState } from 'react'
import { ChecklistItem as ChecklistItemType } from '@/actions/fieldChecklist'

interface ChecklistItemProps {
    item: ChecklistItemType
    checklistId: string
    onToggle: (itemId: string, completed: boolean) => Promise<void>
    onNotesChange: (itemId: string, notes: string) => Promise<void>
}

export function ChecklistItem({
    item,
    checklistId,
    onToggle,
    onNotesChange,
}: ChecklistItemProps) {
    const [isTogglingLoading, setIsTogglingLoading] = useState(false)
    const [isNotesExpanded, setIsNotesExpanded] = useState(false)
    const [notesValue, setNotesValue] = useState(item.notes)
    const [isSavingNotes, setIsSavingNotes] = useState(false)

    const handleToggle = async () => {
        setIsTogglingLoading(true)
        try {
            await onToggle(item.id, !item.completed)
        } finally {
            setIsTogglingLoading(false)
        }
    }

    const handleSaveNotes = async () => {
        if (notesValue === item.notes) {
            setIsNotesExpanded(false)
            return
        }

        setIsSavingNotes(true)
        try {
            await onNotesChange(item.id, notesValue)
            setIsNotesExpanded(false)
        } finally {
            setIsSavingNotes(false)
        }
    }

    const handleCancelNotes = () => {
        setNotesValue(item.notes)
        setIsNotesExpanded(false)
    }

    return (
        <div className="border-b border-gray-100 last:border-0">
            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors">
                {/* Checkbox */}
                <button
                    onClick={handleToggle}
                    disabled={isTogglingLoading}
                    className={`
            flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center
            transition-all duration-200
            ${item.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-green-500'
                        }
            ${isTogglingLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
                >
                    {isTogglingLoading ? (
                        <svg
                            className="animate-spin h-3 w-3 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                    ) : (
                        item.completed && (
                            <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        )
                    )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Label */}
                    <div className="flex items-center justify-between">
                        <span
                            className={`
                text-sm font-medium
                ${item.completed ? 'text-gray-500 line-through' : 'text-gray-900'}
              `}
                        >
                            {item.label}
                        </span>

                        {/* Notes Toggle */}
                        <button
                            onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                            {item.notes ? 'Sửa ghi chú' : 'Thêm ghi chú'}
                        </button>
                    </div>

                    {/* Completed Info */}
                    {item.completed && item.completed_at && (
                        <div className="mt-1 text-xs text-gray-500">
                            Hoàn thành bởi {item.completed_by || 'Admin'} •{' '}
                            {new Date(item.completed_at).toLocaleString('vi-VN')}
                        </div>
                    )}

                    {/* Notes Field */}
                    {isNotesExpanded && (
                        <div className="mt-2 space-y-2">
                            <textarea
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
                                placeholder="Nhập ghi chú..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveNotes}
                                    disabled={isSavingNotes}
                                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSavingNotes ? 'Đang lưu...' : 'Lưu'}
                                </button>
                                <button
                                    onClick={handleCancelNotes}
                                    disabled={isSavingNotes}
                                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Show notes preview when collapsed */}
                    {!isNotesExpanded && item.notes && (
                        <div className="mt-1 text-xs text-gray-600 italic">
                            📝 {item.notes}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
