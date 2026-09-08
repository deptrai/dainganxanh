'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { CheckCircle2, X } from 'lucide-react'
import BookingTable, { MyBooking } from './BookingTable'

export interface BookingsListProps {
    bookings: MyBooking[]
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    cancelled?: boolean
}

export default function BookingsList({
    bookings,
    page,
    pageSize,
    totalCount,
    totalPages,
    cancelled = false,
}: BookingsListProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [dismissAlert, setDismissAlert] = useState(false)

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', String(newPage))
        // One-shot flash params should not persist across pagination
        params.delete('cancelled')
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="space-y-6">
            {cancelled && !dismissAlert && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-medium">Đã hủy đặt phòng thành công.</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setDismissAlert(true)}
                        className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100 transition-colors"
                        aria-label="Đóng thông báo"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <BookingTable
                bookings={bookings}
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    )
}

export { BookingsList }
