'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BookingForm } from '@/components/eco-tourism/BookingForm'
import { OrderSummary } from '@/components/eco-tourism/OrderSummary'
import { VietQRDisplay } from '@/components/eco-tourism/VietQRDisplay'
import { Loader2, CheckCircle2, Clock } from 'lucide-react'

export interface BookingResponse {
    bookingId: string
    bookingCode: string
    roomName: string
    checkInDate: string
    checkOutDate: string
    nightsCount: number
    totalAmount: number
    expiresAt: string
    status: string
}

interface Room {
    id: string
    name: string
    description: string | null
    capacity: number
    amenities: string[] | null
    price_per_night: number
    images: string[]
    status: 'active' | 'inactive' | 'maintenance'
}

interface Lot {
    id: string
    name: string
    region: string
}

interface BookingPageClientProps {
    room: Room
    lot: Lot
    checkIn: string
    checkOut: string
}

type Step = 'form' | 'payment' | 'success' | 'expired'

export default function BookingPageClient({ room, lot, checkIn, checkOut }: BookingPageClientProps) {
    const router = useRouter()
    const [step, setStep] = useState<Step>('form')
    const [booking, setBooking] = useState<BookingResponse | null>(null)
    const [pricingError, setPricingError] = useState<string | null>(null)
    const [guestsCount, setGuestsCount] = useState(1)

    const handleBookingSuccess = useCallback((data: BookingResponse) => {
        setBooking(data)
        setStep('payment')
    }, [])

    const handlePaymentSuccess = useCallback(() => {
        setStep('success')
        setTimeout(() => {
            router.push(`/eco-tourism/${lot.id}/book/success?code=${booking?.bookingCode}`)
        }, 2000)
    }, [router, lot.id, booking?.bookingCode])

    const handleExpired = useCallback(() => {
        setStep('expired')
    }, [])

    const handleCancel = useCallback(() => {
        router.push(`/eco-tourism/${lot.id}`)
    }, [router, lot.id])

    const handleGuestsCountChange = useCallback((count: number) => {
        setGuestsCount(count)
    }, [])

    const handlePricingError = useCallback((message: string | null) => {
        setPricingError(message)
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <a href={`/eco-tourism/${lot.id}`} className="text-sm text-emerald-600 hover:underline mb-2 inline-block">
                        ← Quay lại trang vườn
                    </a>
                    <h1 className="text-3xl font-bold text-gray-900">Đặt phòng tại {lot.name}</h1>
                    <p className="text-gray-600 mt-1">Vùng {lot.region} • Check-in {checkIn} • Check-out {checkOut}</p>
                </div>

                {step === 'form' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <BookingForm
                                roomId={room.id}
                                checkIn={checkIn}
                                checkOut={checkOut}
                                capacity={room.capacity}
                                guestsCount={guestsCount}
                                onGuestsCountChange={handleGuestsCountChange}
                                onSuccess={handleBookingSuccess}
                                pricingError={pricingError}
                            />
                        </div>
                        <div>
                            <OrderSummary
                                roomId={room.id}
                                checkIn={checkIn}
                                checkOut={checkOut}
                                guestsCount={guestsCount}
                                roomName={room.name}
                                lotName={lot.name}
                                onError={handlePricingError}
                            />
                        </div>
                    </div>
                )}

                {step === 'payment' && booking && (
                    <div className="max-w-2xl mx-auto">
                        <VietQRDisplay
                            booking={booking}
                            onSuccess={handlePaymentSuccess}
                            onExpired={handleExpired}
                            onCancel={handleCancel}
                            lotId={lot.id}
                        />
                    </div>
                )}

                {step === 'success' && (
                    <div className="max-w-md mx-auto bg-emerald-50 rounded-2xl p-8 text-center border border-emerald-200">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-emerald-900 mb-2">Thanh toán thành công!</h2>
                        <p className="text-emerald-700">Đang chuyển hướng đến trang xác nhận...</p>
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto mt-4" />
                    </div>
                )}

                {step === 'expired' && (
                    <div className="max-w-md mx-auto bg-amber-50 rounded-2xl p-8 text-center border border-amber-200">
                        <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-amber-900 mb-2">Đơn đặt phòng đã hết hạn</h2>
                        <p className="text-amber-700 mb-4">Thời gian giữ chỗ 15 phút đã hết. Vui lòng chọn ngày khác.</p>
                        <a
                            href={`/eco-tourism/${lot.id}`}
                            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700"
                        >
                            Chọn ngày khác
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}
