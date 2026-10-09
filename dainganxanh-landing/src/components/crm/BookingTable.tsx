'use client'

import { Link, useRouter } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, Calendar, MapPin, Bed, ArrowRight } from 'lucide-react'
import BookingStatusBadge from './BookingStatusBadge'
import { formatDate, formatCurrency } from '@/lib/format'

export interface MyBooking {
    id: string
    code: string
    roomName: string
    lotName: string
    lotRegion?: string
    lotDescription?: string
    checkInDate: string
    checkOutDate: string
    guestsCount?: number
    nightsCount?: number
    totalAmount: number
    paymentMethod?: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | string
    specialRequests?: string | null
    expiresAt?: string | null
    createdAt?: string
}

export interface BookingTableProps {
    bookings: MyBooking[]
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    onPageChange: (p: number) => void
}

export default function BookingTable({
    bookings,
    page,
    totalCount,
    totalPages,
    onPageChange,
}: BookingTableProps) {
    const router = useRouter()
    const locale = useLocale()
    const t = useTranslations('crm.bookings')

    if (!bookings || bookings.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-emerald-100 p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <Bed className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('emptyTitle')}</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                    {t('emptyDesc')}
                </p>
                <Link
                    href="/eco-tourism"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-emerald-200"
                >
                    <span>{t('exploreButton')}</span>
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        )
    }

    const safeTotalPages = Math.max(1, totalPages)

    return (
        <div className="space-y-6">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-4">{t('table.code')}</th>
                                <th scope="col" className="px-6 py-4">{t('table.room')}</th>
                                <th scope="col" className="px-6 py-4">{t('table.lot')}</th>
                                <th scope="col" className="px-6 py-4">{t('table.checkIn')}</th>
                                <th scope="col" className="px-6 py-4">{t('table.checkOut')}</th>
                                <th scope="col" className="px-6 py-4">{t('table.status')}</th>
                                <th scope="col" className="px-6 py-4 text-right">{t('table.totalAmount')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bookings.map((booking) => (
                                <tr
                                    key={booking.id}
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement
                                        if (target.closest('a') || target.closest('button')) return
                                        router.push(`/crm/my-bookings/${booking.id}`)
                                    }}
                                    className="hover:bg-emerald-50/40 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/crm/my-bookings/${booking.id}`}
                                            className="font-mono font-bold text-emerald-700 group-hover:underline block"
                                        >
                                            {booking.code}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-900 block">
                                            {booking.roomName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-600 block">
                                            {booking.lotName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-700 block whitespace-nowrap">
                                            {formatDate(booking.checkInDate, locale)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-700 block whitespace-nowrap">
                                            {formatDate(booking.checkOutDate, locale)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <BookingStatusBadge status={booking.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-bold text-emerald-700 block whitespace-nowrap">
                                            {formatCurrency(booking.totalAmount, locale)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card List View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                {bookings.map((booking) => (
                    <Link
                        key={booking.id}
                        href={`/crm/my-bookings/${booking.id}`}
                        className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                    >
                        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                            <span className="font-mono font-bold text-emerald-700 text-sm">
                                {booking.code}
                            </span>
                            <BookingStatusBadge status={booking.status} />
                        </div>

                        <div className="space-y-1.5 text-sm">
                            <div className="flex items-center gap-2 text-gray-900 font-semibold">
                                <Bed className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{booking.roomName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 text-xs">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>{booking.lotName}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg">
                            <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span>
                                {formatDate(booking.checkInDate, locale)} - {formatDate(booking.checkOutDate, locale)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                            <span className="text-xs text-gray-500">{t('totalAmount')}</span>
                            <span className="font-bold text-emerald-700 text-base">
                                {formatCurrency(booking.totalAmount, locale)}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Pagination Controls */}
            {safeTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                        {t('pagination.showing', { count: bookings.length, total: totalCount, page, totalPages: safeTotalPages })}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label={t('pagination.prev')}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>{t('pagination.prev')}</span>
                        </button>
                        <span className="text-xs font-medium text-gray-700 px-2">
                            {page} / {safeTotalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= safeTotalPages}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label={t('pagination.next')}
                        >
                            <span>{t('pagination.next')}</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export { BookingTable }
