"use client"

import { useState, useEffect } from 'react'
import { OrderFilters as Filters } from '@/hooks/useAdminOrders'
import { useDebounce } from '@/hooks/useDebounce'

interface OrderFiltersProps {
    filters: Filters
    setFilters: (filters: Filters) => void
}

const statusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xác minh' },
    { value: 'manual_payment_claimed', label: 'Chờ admin duyệt' },
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'verified', label: 'Đã xác minh' },
    { value: 'assigned', label: 'Đã gán cây' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
]

export default function OrderFilters({ filters, setFilters }: OrderFiltersProps) {
    // Local state for search input (updates immediately for UX)
    const [searchInput, setSearchInput] = useState(filters.search || '')

    // Debounce the search value (300ms delay)
    const debouncedSearch = useDebounce(searchInput, 300)

    // Update filters when debounced search changes
    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            setFilters({ ...filters, search: debouncedSearch })
        }
    }, [debouncedSearch, filters, setFilters])

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái
                    </label>
                    <select
                        value={filters.status || 'pending'}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search - with debounce */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tìm kiếm
                    </label>
                    <input
                        type="text"
                        placeholder="Order ID hoặc Email"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>

                {/* Date From */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Từ ngày
                    </label>
                    <input
                        type="date"
                        value={filters.dateFrom || ''}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>

                {/* Date To */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đến ngày
                    </label>
                    <input
                        type="date"
                        value={filters.dateTo || ''}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
                <button
                    onClick={() => {
                        setSearchInput('')
                        setFilters({ status: 'pending' })
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                >
                    Xóa bộ lọc
                </button>
            </div>
        </div>
    )
}
