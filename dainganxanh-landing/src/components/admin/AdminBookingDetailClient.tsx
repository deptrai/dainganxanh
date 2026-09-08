'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import BookingStatusBadge from '@/components/crm/BookingStatusBadge'
import BookingDetail from '@/components/crm/BookingDetail'
import { confirmBooking, adminCancelBooking } from '@/actions/adminBookings'

interface AdminBookingDetailClientProps {
    booking: any
}

export default function AdminBookingDetailClient({ booking }: AdminBookingDetailClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [cancelReason, setCancelReason] = useState('')

    const canConfirm = booking.status === 'pending'
    const canCancel = ['pending', 'confirmed'].includes(booking.status)

    const handleConfirm = async () => {
        setError(null)
        startTransition(async () => {
            const result = await confirmBooking(booking.id)
            if (result.error) {
                setError(result.error)
            } else {
                router.refresh()
            }
        })
    }

    const handleCancel = async () => {
        setError(null)
        startTransition(async () => {
            const result = await adminCancelBooking(booking.id, cancelReason)
            if (result.error) {
                setError(result.error)
            } else {
                setShowCancelModal(false)
                router.refresh()
            }
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Link
                    href="/crm/admin/bookings"
                    className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại danh sách</span>
                </Link>

                <div className="flex items-center gap-2">
                    {canConfirm && (
                        <button
                            onClick={handleConfirm}
                            disabled={isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            <CheckCircle className="w-4 h-4" />
                            <span>Xác nhận</span>
                        </button>
                    )}
                    {canCancel && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            disabled={isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            <XCircle className="w-4 h-4" />
                            <span>Hủy đặt phòng</span>
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <BookingDetail booking={booking} hideCustomerActions hideCheckInInstructions />

            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
                        <h2 className="text-lg font-bold text-gray-900">Hủy đặt phòng</h2>
                        <p className="text-sm text-gray-600">
                            Vui lòng nhập lý do hủy đặt phòng <strong>{booking.code}</strong>.
                        </p>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Lý do hủy..."
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[100px]"
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isPending}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
                            >
                                {isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
