'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Bed,
    User,
    Phone,
    Mail,
    CreditCard,
    Clock,
    FileText,
    XCircle,
    ExternalLink,
} from 'lucide-react'
import BookingStatusBadge from './BookingStatusBadge'
import CancelBookingButton from './CancelBookingButton'
import CheckInInstructions from './CheckInInstructions'
import { formatDateVN, formatVND } from '@/lib/date'

export interface MyBookingDetail {
    id: string
    code: string
    roomId?: string
    roomName: string
    lotName: string
    lotRegion?: string
    lotDescription?: string
    guestName?: string
    guestPhone?: string
    guestEmail?: string | null
    checkInDate: string
    checkOutDate: string
    guestsCount?: number
    nightsCount?: number
    totalAmount: number
    paymentMethod?: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | string
    specialRequests?: string | null
    cancellationReason?: string | null
    expiresAt?: string | null
    createdAt?: string
    lotId?: string
}

export interface BookingDetailProps {
    booking: MyBookingDetail
    /** Ẩn action của khách (tiếp tục thanh toán / hủy) — dùng trong admin view. */
    hideCustomerActions?: boolean
    /** Ẩn hướng dẫn nhận phòng — dùng trong admin view. */
    hideCheckInInstructions?: boolean
}

export default function BookingDetail({ booking, hideCustomerActions = false, hideCheckInInstructions = false }: BookingDetailProps) {
    const router = useRouter()

    const [now, setNow] = useState(Date.now())

    useEffect(() => {
        setNow(Date.now())
        const id = setInterval(() => setNow(Date.now()), 60_000)
        return () => clearInterval(id)
    }, [])

    const isPending = booking.status === 'pending'
    const isConfirmed = booking.status === 'confirmed'
    const isFuture = booking.expiresAt
        ? new Date(booking.expiresAt).getTime() > now
        : false
    const showPaymentAction = (isPending || isConfirmed) && isFuture
    const isConfirmedOrCompleted =
        booking.status === 'confirmed' || booking.status === 'completed'
    const isCancelledOrNoShow =
        booking.status === 'cancelled' || booking.status === 'no_show'

    const paymentMethodLabel =
        booking.paymentMethod === 'banking'
            ? 'Chuyển khoản ngân hàng (VietQR)'
            : booking.paymentMethod || 'Chuyển khoản'

    const continuePaymentUrl = booking.lotId
        ? `/eco-tourism/${booking.lotId}/book?code=${encodeURIComponent(booking.code)}`
        : '/eco-tourism'

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Back to list navigation */}
            <div>
                <Link
                    href="/crm/my-bookings"
                    className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại danh sách</span>
                </Link>
            </div>

            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-extrabold font-mono text-gray-900 tracking-tight">
                            {booking.code}
                        </h1>
                        <BookingStatusBadge status={booking.status} />
                    </div>
                    {booking.createdAt && (
                        <p className="text-xs text-gray-500">
                            Ngày đặt: {formatDateVN(booking.createdAt)}
                        </p>
                    )}
                </div>

                {/* Conditional Pending/Confirmed Actions */}
                {showPaymentAction && !hideCustomerActions && (
                    <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0">
                        {isPending && (
                            <CancelBookingButton
                                bookingCode={booking.code}
                                onCancel={() => router.push('/crm/my-bookings?cancelled=1')}
                            />
                        )}
                        <Link
                            href={continuePaymentUrl}
                            className="inline-flex items-center justify-center gap-2 py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
                        >
                            <span>Tiếp tục thanh toán</span>
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>

            {/* Expired pending notice */}
            {isPending && !isFuture && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3 text-amber-900">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-sm">
                        <p className="font-semibold">Thời gian giữ chỗ cho đơn này đã hết hạn</p>
                        <p className="text-xs text-amber-800 leading-relaxed">
                            Phòng đã được giải phóng để phục vụ các khách hàng khác. Quý khách vui lòng tạo đặt phòng mới nếu vẫn có nhu cầu lưu trú.
                        </p>
                        <div className="pt-2">
                            <Link
                                href="/eco-tourism"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                            >
                                <span>Đặt phòng mới</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancellation reason if cancelled or no_show */}
            {isCancelledOrNoShow && Boolean(booking.cancellationReason) && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-2">
                    <div className="flex items-center gap-2 text-red-800 font-semibold text-sm">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span>Thông tin hủy đặt phòng</span>
                    </div>
                    <p className="text-sm text-red-700">
                        <span className="font-medium">Lý do hủy: </span>
                        {booking.cancellationReason}
                    </p>
                </div>
            )}

            {/* Check-in instructions when confirmed or completed */}
            {isConfirmedOrCompleted && !hideCheckInInstructions && (
                <CheckInInstructions
                    roomName={booking.roomName}
                    lotName={booking.lotName}
                    lotRegion={booking.lotRegion || ''}
                    lotDescription={booking.lotDescription || ''}
                    checkInDate={booking.checkInDate}
                    checkOutDate={booking.checkOutDate}
                    guestPhone={booking.guestPhone || ''}
                    specialRequests={booking.specialRequests}
                />
            )}

            {/* Main Booking Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stay & Room Details */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <Bed className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-base font-bold text-gray-900">Thông tin phòng & nghỉ dưỡng</h2>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div>
                            <span className="text-xs text-gray-500 uppercase font-semibold">Phòng nghỉ</span>
                            <p className="font-bold text-gray-900 text-base">{booking.roomName}</p>
                        </div>

                        <div>
                            <span className="text-xs text-gray-500 uppercase font-semibold">Khu vườn</span>
                            <p className="font-semibold text-emerald-800">{booking.lotName}</p>
                            {booking.lotRegion && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span>{booking.lotRegion}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-3">
                            <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">Nhận phòng</span>
                                <div className="flex items-center gap-1.5 text-gray-900 font-semibold mt-0.5">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{formatDateVN(booking.checkInDate)}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">Trả phòng</span>
                                <div className="flex items-center gap-1.5 text-gray-900 font-semibold mt-0.5">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{formatDateVN(booking.checkOutDate)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-600">
                            <span>Thời gian lưu trú:</span>
                            <span className="font-semibold text-gray-900">
                                {booking.nightsCount ?? 1} đêm
                            </span>
                        </div>
                    </div>
                </div>

                {/* Guest & Payment Details */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <User className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-base font-bold text-gray-900">Thông tin khách & thanh toán</h2>
                    </div>

                    <div className="space-y-3 text-sm">
                        {booking.guestName && (
                            <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">Khách đại diện</span>
                                <p className="font-semibold text-gray-900">{booking.guestName}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {booking.guestPhone && (
                                <div>
                                    <span className="text-xs text-gray-500 uppercase font-semibold">Số điện thoại</span>
                                    <div className="flex items-center gap-1.5 text-gray-800 font-medium mt-0.5">
                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{booking.guestPhone}</span>
                                    </div>
                                </div>
                            )}

                            {booking.guestEmail && (
                                <div>
                                    <span className="text-xs text-gray-500 uppercase font-semibold">Email</span>
                                    <div className="flex items-center gap-1.5 text-gray-800 font-medium mt-0.5 truncate">
                                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <span className="truncate">{booking.guestEmail}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {booking.guestsCount && (
                            <div className="text-xs text-gray-600">
                                Số lượng khách: <span className="font-semibold text-gray-900">{booking.guestsCount} khách</span>
                            </div>
                        )}

                        <div className="pt-3 border-t border-gray-100 space-y-2">
                            <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">Hình thức thanh toán</span>
                                <div className="flex items-center gap-1.5 text-gray-800 font-medium mt-0.5">
                                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{paymentMethodLabel}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="font-semibold text-gray-700">Tổng thanh toán:</span>
                                <span className="text-xl font-extrabold text-emerald-700">
                                    {formatVND(booking.totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Special requests display if any */}
            {booking.specialRequests && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>Yêu cầu đặc biệt</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {booking.specialRequests}
                    </p>
                </div>
            )}
        </div>
    )
}

export { BookingDetail }
