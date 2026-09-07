'use client'

import { useEffect, useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'

interface OrderSummaryProps {
    roomId: string
    checkIn: string
    checkOut: string
    guestsCount: number
    roomName: string
    lotName: string
    onError: (message: string | null) => void
}

interface PriceResult {
    roomId: string
    roomName: string
    nights: number
    basePricePerNight: number
    nightBreakdown: Array<{ date: string; price: number; isCustomRule: boolean }>
    totalAmount: number
}

export function OrderSummary({ roomId, checkIn, checkOut, guestsCount, roomName, lotName, onError }: OrderSummaryProps) {
    const [price, setPrice] = useState<PriceResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch('/api/bookings/calculate-price', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        room_id: roomId,
                        check_in_date: checkIn,
                        check_out_date: checkOut,
                        guests_count: guestsCount,
                    }),
                })
                const data = await res.json()
                if (!res.ok) {
                    setError(data.error || 'Lỗi tính giá')
                    onError(data.error || 'Lỗi tính giá')
                    setPrice(null)
                } else {
                    setPrice(data)
                    setError(null)
                    onError(null)
                }
            } catch {
                setError('Lỗi kết nối')
                onError('Lỗi kết nối')
                setPrice(null)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [roomId, checkIn, checkOut, guestsCount, onError])

    const formatVND = (value: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-900">Tóm tắt đơn</h2>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Phòng</span>
                    <span className="font-medium text-gray-900">{roomName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Vườn</span>
                    <span className="font-medium text-gray-900">{lotName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Nhận phòng</span>
                    <span className="font-medium text-gray-900">{formatDate(checkIn)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Trả phòng</span>
                    <span className="font-medium text-gray-900">{formatDate(checkOut)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Số khách</span>
                    <span className="font-medium text-gray-900">{guestsCount} khách</span>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
            )}

            {error && !loading && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            {price && !loading && (
                <>
                    <div className="border-t border-gray-200 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Số đêm</span>
                            <span className="font-medium text-gray-900">{price.nights} đêm</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Giá cơ bản</span>
                            <span className="font-medium text-gray-900">{formatVND(price.basePricePerNight)}/đêm</span>
                        </div>
                    </div>

                    {price.nightBreakdown.some((n) => n.isCustomRule) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                            <p className="text-xs font-semibold text-amber-800">Giá đặc biệt áp dụng:</p>
                            {price.nightBreakdown
                                .filter((n) => n.isCustomRule)
                                .map((n) => (
                                    <div key={n.date} className="flex justify-between text-xs text-amber-700">
                                        <span>{formatDate(n.date)}</span>
                                        <span>{formatVND(n.price)}</span>
                                    </div>
                                ))}
                        </div>
                    )}

                    <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900">Tổng cộng</span>
                            <span className="text-2xl font-bold text-emerald-600">{formatVND(price.totalAmount)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-right">Đã bao gồm thuế và phí</p>
                    </div>
                </>
            )}
        </div>
    )
}
