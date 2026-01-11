'use client'

import { useState } from 'react'

type SortOption = 'date-desc' | 'date-asc' | 'status' | 'co2'

export default function TreeSortFilter() {
    const [sortBy, setSortBy] = useState<SortOption>('date-desc')

    const handleSortChange = (value: SortOption) => {
        setSortBy(value)
        // TODO: Implement actual sorting logic with URL params or state management
        console.log('Sort by:', value)
    }

    return (
        <div className="flex items-center gap-3">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                Sắp xếp:
            </label>
            <select
                id="sort"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
                <option value="date-desc">Ngày trồng (Mới nhất)</option>
                <option value="date-asc">Ngày trồng (Cũ nhất)</option>
                <option value="status">Trạng thái</option>
                <option value="co2">CO₂ hấp thụ</option>
            </select>
        </div>
    )
}
