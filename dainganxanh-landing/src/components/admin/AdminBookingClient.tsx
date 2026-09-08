'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchAdminBookings, AdminBookingFilters } from '@/actions/adminBookings'
import AdminBookingTable from './AdminBookingTable'
import BookingFilterBar from './BookingFilterBar'

interface AdminBookingClientProps {
    userId: string
    initialPage: number
    initialFilters: AdminBookingFilters
}

export default function AdminBookingClient({
    userId,
    initialPage,
    initialFilters,
}: AdminBookingClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(initialPage)
    const [filters, setFilters] = useState<AdminBookingFilters>(initialFilters)
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    const pageSize = 20

    const loadBookings = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await fetchAdminBookings(filters, page, pageSize)
            if (result.error) {
                setError(result.error)
            } else {
                setBookings(result.bookings)
                setTotalCount(result.totalCount)
                setTotalPages(Math.ceil(result.totalCount / pageSize))
            }
        } catch (err) {
            setError('Failed to load bookings')
        } finally {
            setLoading(false)
        }
    }, [filters, page, pageSize])

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const result = await fetchAdminBookings(filters, page, pageSize)
                if (cancelled) return
                if (result.error) {
                    setError(result.error)
                } else {
                    setBookings(result.bookings)
                    setTotalCount(result.totalCount)
                    setTotalPages(Math.ceil(result.totalCount / pageSize))
                }
            } catch (err) {
                if (!cancelled) setError('Failed to load bookings')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [filters, page, pageSize])

    const handleFilterChange = (newFilters: AdminBookingFilters) => {
        setFilters(newFilters)
        setPage(1)
        const params = new URLSearchParams(searchParams.toString())
        if (newFilters.status) params.set('status', newFilters.status)
        else params.delete('status')
        if (newFilters.search) params.set('search', newFilters.search)
        else params.delete('search')
        if (newFilters.dateFrom) params.set('dateFrom', newFilters.dateFrom)
        else params.delete('dateFrom')
        if (newFilters.dateTo) params.set('dateTo', newFilters.dateTo)
        else params.delete('dateTo')
        if (newFilters.lotId) params.set('lotId', newFilters.lotId)
        else params.delete('lotId')
        params.delete('page')
        router.replace(`/crm/admin/bookings?${params.toString()}`)
    }

    const handlePageChange = (newPage: number) => {
        setPage(newPage)
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', String(newPage))
        router.replace(`/crm/admin/bookings?${params.toString()}`)
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">❌ {error}</p>
                <button
                    onClick={loadBookings}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Thử lại
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Quản lý đặt phòng</h1>
                <p className="mt-2 text-gray-600">
                    Xem và quản lý tất cả đơn đặt phòng
                </p>
            </div>

            <BookingFilterBar filters={filters} onFiltersChange={handleFilterChange} />

            {loading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải đơn đặt phòng...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Tải lại trang
                    </button>
                </div>
            ) : bookings.length === 0 ? (
                <AdminBookingTable bookings={bookings} />
            ) : (
                <>
                    <AdminBookingTable bookings={bookings} />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
                            <div className="text-sm text-gray-700">
                                Hiển thị <span className="font-medium">{bookings.length}</span> trong tổng số{' '}
                                <span className="font-medium">{totalCount}</span> đơn
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-700">
                                    Trang {page} / {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page <= 1}
                                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        Trước
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page >= totalPages}
                                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        Sau
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
