'use client'

import { useState, useEffect } from 'react'
import { AdminBookingFilters } from '@/actions/adminBookings'
import { useDebounce } from '@/hooks/useDebounce'

interface BookingFilterBarProps {
    filters: AdminBookingFilters
    onFiltersChange: (filters: AdminBookingFilters) => void
}

const statusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ thanh toán' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'cancelled', label: 'Đã hủy' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'no_show', label: 'Khách không đến' },
]

export default function BookingFilterBar({ filters, onFiltersChange }: BookingFilterBarProps) {
    const [localFilters, setLocalFilters] = useState(filters)
    const debouncedSearch = useDebounce(localFilters.search || '', 300)

    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            onFiltersChange({ ...localFilters, search: debouncedSearch || undefined })
        }
    }, [debouncedSearch])

    const handleChange = (key: keyof AdminBookingFilters, value: string | undefined) => {
        const newFilters = { ...localFilters, [key]: value }
        setLocalFilters(newFilters)

        if (key !== 'search') {
            onFiltersChange(newFilters)
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Trạng thái
                    </label>
                    <select
                        value={localFilters.status || 'all'}
                        onChange={(e) => handleChange('status', e.target.value === 'all' ? undefined : e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Tìm kiếm
                    </label>
                    <input
                        type="text"
                        placeholder="Mã, tên khách, SĐT, email"
                        value={localFilters.search || ''}
                        onChange={(e) => handleChange('search', e.target.value || undefined)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Từ ngày
                    </label>
                    <input
                        type="date"
                        value={localFilters.dateFrom || ''}
                        onChange={(e) => handleChange('dateFrom', e.target.value || undefined)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Đến ngày
                    </label>
                    <input
                        type="date"
                        value={localFilters.dateTo || ''}
                        onChange={(e) => handleChange('dateTo', e.target.value || undefined)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                </div>
            </div>
        </div>
    )
}
