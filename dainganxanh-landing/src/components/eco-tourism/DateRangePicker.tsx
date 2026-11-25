'use client'

import { useTranslations } from 'next-intl'

interface DateRangePickerProps {
    checkIn: string
    checkOut: string
    onCheckInChange: (v: string) => void
    onCheckOutChange: (v: string) => void
}

export function DateRangePicker({ checkIn, checkOut, onCheckInChange, onCheckOutChange }: DateRangePickerProps) {
    const t = useTranslations('eco')
    const today = new Date().toISOString().split('T')[0]
    const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('datePicker.title')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="check-in" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('datePicker.checkIn')}
                    </label>
                    <input
                        id="check-in"
                        type="date"
                        value={checkIn}
                        min={today}
                        max={maxDate}
                        onChange={(e) => onCheckInChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label htmlFor="check-out" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('datePicker.checkOut')}
                    </label>
                    <input
                        id="check-out"
                        type="date"
                        value={checkOut}
                        min={checkIn || today}
                        max={maxDate}
                        onChange={(e) => onCheckOutChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
            </div>
            {checkIn && checkOut && (
                <p className="mt-3 text-sm text-gray-500">
                    {(() => {
                        const nights = Math.ceil(
                            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
                        )
                        return nights > 0 ? t('datePicker.nights', { count: nights }) : t('datePicker.invalidDates')
                    })()}
                </p>
            )}
        </div>
    )
}

