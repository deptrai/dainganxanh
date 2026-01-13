'use client'

import { useState } from 'react'

interface QuarterSelectorProps {
    selectedQuarter: string // Format: '2026-Q1'
    onQuarterChange: (quarter: string) => void
    year?: number
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const
const QUARTER_DUE_DATES: Record<string, string> = {
    Q1: '31 Tháng 3',
    Q2: '30 Tháng 6',
    Q3: '30 Tháng 9',
    Q4: '31 Tháng 12',
}

export function QuarterSelector({
    selectedQuarter,
    onQuarterChange,
    year,
}: QuarterSelectorProps) {
    const currentYear = year || new Date().getFullYear()
    const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`
    const [selectedYear, setSelectedYear] = useState(currentYear)

    const handleQuarterClick = (quarter: string) => {
        const fullQuarter = `${selectedYear}-${quarter}`
        onQuarterChange(fullQuarter)
    }

    const handleYearChange = (direction: 'prev' | 'next') => {
        const newYear = direction === 'prev' ? selectedYear - 1 : selectedYear + 1
        setSelectedYear(newYear)
        // Auto-select Q1 of new year
        onQuarterChange(`${newYear}-Q1`)
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {/* Year Selector */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => handleYearChange('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Previous year"
                >
                    <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Năm {selectedYear}</h3>
                <button
                    onClick={() => handleYearChange('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Next year"
                >
                    <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>

            {/* Quarter Tabs */}
            <div className="grid grid-cols-4 gap-2">
                {QUARTERS.map((quarter) => {
                    const fullQuarter = `${selectedYear}-${quarter}`
                    const isSelected = selectedQuarter === fullQuarter
                    const isCurrent =
                        selectedYear === currentYear && quarter === currentQuarter

                    return (
                        <button
                            key={quarter}
                            onClick={() => handleQuarterClick(quarter)}
                            className={`
                relative px-4 py-3 rounded-lg font-medium transition-all
                ${isSelected
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }
              `}
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-bold">{quarter}</span>
                                <span className="text-xs mt-1 opacity-90">
                                    {QUARTER_DUE_DATES[quarter]}
                                </span>
                            </div>
                            {isCurrent && !isSelected && (
                                <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Selected Quarter Info */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                    <span className="font-medium">Hạn chót:</span>{' '}
                    {QUARTER_DUE_DATES[selectedQuarter.split('-')[1]]} {selectedYear}
                </p>
            </div>
        </div>
    )
}
