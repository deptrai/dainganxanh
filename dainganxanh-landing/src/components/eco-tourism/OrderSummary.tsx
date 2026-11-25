'use client'

import { useEffect, useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { formatCurrency, formatDate as formatDateHelper } from '@/lib/format'

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
    const t = useTranslations('eco')
    const locale = useLocale()
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
                    const errMsg = data.error || t('summary.errors.priceCalcError')
                    setError(errMsg)
                    onError(errMsg)
                    setPrice(null)
                } else {
                    setPrice(data)
                    setError(null)
                    onError(null)
                }
            } catch {
                const errMsg = t('summary.errors.connectionError')
                setError(errMsg)
                onError(errMsg)
                setPrice(null)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [roomId, checkIn, checkOut, guestsCount, onError, t])

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00')
        return formatDateHelper(d, locale, { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-900">{t('summary.title')}</h2>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">{t('summary.room')}</span>
                    <span className="font-medium text-gray-900">{roomName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">{t('summary.garden')}</span>
                    <span className="font-medium text-gray-900">{lotName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">{t('summary.checkIn')}</span>
                    <span className="font-medium text-gray-900">{formatDate(checkIn)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">{t('summary.checkOut')}</span>
                    <span className="font-medium text-gray-900">{formatDate(checkOut)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">{t('summary.guests')}</span>
                    <span className="font-medium text-gray-900">{t('summary.guestsCount', { count: guestsCount })}</span>
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
                            <span className="text-gray-600">{t('summary.nights')}</span>
                            <span className="font-medium text-gray-900">{t('summary.nightsCount', { count: price.nights })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{t('summary.basePrice')}</span>
                            <span className="font-medium text-gray-900">{t('summary.pricePerNight', { price: formatCurrency(price.basePricePerNight, locale) })}</span>
                        </div>
                    </div>

                    {price.nightBreakdown.some((n) => n.isCustomRule) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                            <p className="text-xs font-semibold text-amber-800">{t('summary.specialPriceNotice')}</p>
                            {price.nightBreakdown
                                .filter((n) => n.isCustomRule)
                                .map((n) => (
                                    <div key={n.date} className="flex justify-between text-xs text-amber-700">
                                        <span>{formatDate(n.date)}</span>
                                        <span>{formatCurrency(n.price, locale)}</span>
                                    </div>
                                ))}
                        </div>
                    )}

                    <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900">{t('summary.total')}</span>
                            <span className="text-2xl font-bold text-emerald-600">{formatCurrency(price.totalAmount, locale)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-right">{t('summary.taxNotice')}</p>
                    </div>
                </>
            )}
        </div>
    )
}
