'use client'

import { Link } from '@/i18n/navigation'
import { Bed } from 'lucide-react'
import BookingStatusBadge from '@/components/crm/BookingStatusBadge'
import { formatDate, formatCurrency } from '@/lib/format'
import { useLocale, useTranslations } from 'next-intl'

export interface AdminBooking {
    id: string
    code: string
    guestName?: string
    guestPhone?: string
    guestEmail?: string
    roomName: string
    lotName: string
    checkInDate: string
    checkOutDate: string
    guestsCount?: number
    totalAmount: number
    status: string
    paymentMethod?: string
    createdAt?: string
}

export interface AdminBookingTableProps {
    bookings: AdminBooking[]
}

export default function AdminBookingTable({ bookings }: AdminBookingTableProps) {
    const locale = useLocale()
    const t = useTranslations('admin.bookingsTable')

    if (!bookings || bookings.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-emerald-100 p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <Bed className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('emptyTitle')}</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                    {t('emptyDescription')}
                </p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th scope="col" className="px-6 py-4">{t('thCode')}</th>
                            <th scope="col" className="px-6 py-4">{t('thGuest')}</th>
                            <th scope="col" className="px-6 py-4">{t('thRoom')}</th>
                            <th scope="col" className="px-6 py-4">{t('thGarden')}</th>
                            <th scope="col" className="px-6 py-4">{t('thCheckIn')}</th>
                            <th scope="col" className="px-6 py-4">{t('thCheckOut')}</th>
                            <th scope="col" className="px-6 py-4">{t('thStatus')}</th>
                            <th scope="col" className="px-6 py-4 text-right">{t('thTotal')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {bookings.map((booking) => (
                            <tr
                                key={booking.id}
                                className="hover:bg-gray-50 transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <Link
                                        href={`/crm/admin/bookings/${booking.id}`}
                                        className="font-mono font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                                    >
                                        {booking.code}
                                    </Link>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-0.5">
                                        <p className="font-medium text-gray-900">{booking.guestName || t('anonymousGuest')}</p>
                                        {booking.guestPhone && (
                                            <p className="text-xs text-gray-500">{booking.guestPhone}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-900">{booking.roomName}</td>
                                <td className="px-6 py-4 text-gray-700">{booking.lotName}</td>
                                <td className="px-6 py-4 text-gray-900">{formatDate(booking.checkInDate, locale)}</td>
                                <td className="px-6 py-4 text-gray-900">{formatDate(booking.checkOutDate, locale)}</td>
                                <td className="px-6 py-4">
                                    <BookingStatusBadge status={booking.status} />
                                </td>
                                <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                    {formatCurrency(booking.totalAmount, locale)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
