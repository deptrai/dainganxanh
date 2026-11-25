'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

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

interface BookingFormProps {
    roomId: string
    checkIn: string
    checkOut: string
    capacity: number
    guestsCount: number
    onGuestsCountChange: (count: number) => void
    onSuccess: (booking: BookingResponse) => void
    pricingError: string | null
}

export function BookingForm({
    roomId,
    checkIn,
    checkOut,
    capacity,
    guestsCount,
    onGuestsCountChange,
    onSuccess,
    pricingError,
}: BookingFormProps) {
    const t = useTranslations('eco')
    const [form, setForm] = useState({
        guest_name: '',
        guest_phone: '',
        guest_email: '',
        special_requests: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    const validate = (): boolean => {
        const next: Record<string, string> = {}
        if (!form.guest_name.trim()) next.guest_name = t('form.errors.nameRequired')
        if (!/^0\d{9}$/.test(form.guest_phone)) next.guest_phone = t('form.errors.phoneInvalid')
        if (form.guest_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guest_email)) next.guest_email = t('form.errors.emailInvalid')
        if (guestsCount < 1 || guestsCount > capacity) next.guests_count = t('form.errors.guestsRange', { capacity })
        if (form.special_requests.length > 500) next.special_requests = t('form.errors.specialRequestsTooLong')
        setErrors(next)
        return Object.keys(next).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        setIsSubmitting(true)
        setSubmitError('')

        try {
            const res = await fetch('/api/bookings/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: roomId,
                    check_in_date: checkIn,
                    check_out_date: checkOut,
                    guests_count: guestsCount,
                    guest_name: form.guest_name.trim(),
                    guest_phone: form.guest_phone.trim(),
                    guest_email: form.guest_email.trim() || undefined,
                    special_requests: form.special_requests.trim() || undefined,
                    payment_method: 'banking',
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || t('form.errors.generalError'))
            }

            onSuccess(data)
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : t('form.errors.generalError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const inputClass = (field: string) =>
        `w-full px-4 py-3 rounded-lg border ${errors[field] ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'} focus:outline-none focus:ring-2 ${errors[field] ? 'focus:ring-red-100' : 'focus:ring-emerald-100'} transition-colors`

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">{t('form.title')}</h2>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.name')}</label>
                <input
                    type="text"
                    value={form.guest_name}
                    onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                    className={inputClass('guest_name')}
                    placeholder={t('form.namePlaceholder')}
                />
                {errors.guest_name && <p className="text-sm text-red-600 mt-1">{errors.guest_name}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.phone')}</label>
                <input
                    type="tel"
                    value={form.guest_phone}
                    onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
                    className={inputClass('guest_phone')}
                    placeholder={t('form.phonePlaceholder')}
                />
                {errors.guest_phone && <p className="text-sm text-red-600 mt-1">{errors.guest_phone}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.email')}</label>
                <input
                    type="email"
                    value={form.guest_email}
                    onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
                    className={inputClass('guest_email')}
                    placeholder={t('form.emailPlaceholder')}
                />
                {errors.guest_email && <p className="text-sm text-red-600 mt-1">{errors.guest_email}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.guests')}</label>
                <input
                    type="number"
                    min={1}
                    max={capacity}
                    value={guestsCount}
                    onChange={(e) => onGuestsCountChange(parseInt(e.target.value, 10) || 1)}
                    className={inputClass('guests_count')}
                />
                <p className="text-xs text-gray-500 mt-1">{t('form.maxGuests', { count: capacity })}</p>
                {errors.guests_count && <p className="text-sm text-red-600 mt-1">{errors.guests_count}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.specialRequests')}</label>
                <textarea
                    value={form.special_requests}
                    onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
                    rows={3}
                    maxLength={500}
                    className={inputClass('special_requests')}
                    placeholder={t('form.specialRequestsPlaceholder')}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.special_requests.length}/500</p>
                {errors.special_requests && <p className="text-sm text-red-600 mt-1">{errors.special_requests}</p>}
            </div>

            {(submitError || pricingError) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {submitError || pricingError}
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting || !!pricingError}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('form.processing')}
                    </>
                ) : (
                    t('form.submit')
                )}
            </button>
        </form>
    )
}
