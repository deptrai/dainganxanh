'use client'

import { MapPin, Calendar, Clock, Phone, FileText, Info } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { formatDate } from '@/lib/format'
import { SUPPORT_HOTLINE } from '@/lib/constants'

export interface CheckInInstructionsProps {
    roomName: string
    lotName: string
    lotRegion: string
    lotDescription: string
    checkInDate: string
    checkOutDate: string
    guestPhone: string
    specialRequests?: string | null
}

export default function CheckInInstructions({
    roomName,
    lotName,
    lotRegion,
    lotDescription,
    checkInDate,
    checkOutDate,
    guestPhone,
    specialRequests,
}: CheckInInstructionsProps) {
    const locale = useLocale()
    const t = useTranslations('crm.checkInInstructions')

    const formattedCheckIn = formatDate(checkInDate, locale)
    const formattedCheckOut = formatDate(checkOutDate, locale)

    return (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-emerald-200/80 pb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Info className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-emerald-950">{t('title')}</h3>
                    <p className="text-xs text-emerald-700">{t('subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Garden and Room details */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-emerald-100">
                    <div className="flex items-start gap-2.5">
                        <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('destination')}</p>
                            <p className="text-sm font-bold text-gray-900">{lotName}</p>
                            {lotRegion && (
                                <p className="text-xs text-emerald-700 font-medium">{lotRegion}</p>
                            )}
                            {lotDescription && (
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{lotDescription}</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-start gap-2.5">
                        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('room')}</p>
                            <p className="text-sm font-semibold text-gray-900">{roomName}</p>
                        </div>
                    </div>
                </div>

                {/* Times and Contact */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-emerald-100">
                    <div className="flex items-start gap-2.5">
                        <Calendar className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('stayTime')}</p>
                            <p className="text-sm text-gray-800">
                                {t('checkIn')}: <span className="font-semibold text-gray-900">{formattedCheckIn}</span>
                            </p>
                            <p className="text-sm text-gray-800">
                                {t('checkOut')}: <span className="font-semibold text-gray-900">{formattedCheckOut}</span>
                            </p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-start gap-2.5">
                        <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('hoursPolicy')}</p>
                            <p className="text-xs text-gray-600">{t('hoursDesc')}</p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-start gap-2.5">
                        <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('supportHotline')}</p>
                            <p className="text-sm font-semibold text-emerald-700">{SUPPORT_HOTLINE}</p>
                            {guestPhone && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {t('guestPhone')}: <span className="font-medium text-gray-700">{guestPhone}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Special requests if any */}
            {specialRequests && (
                <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('specialRequests')}</p>
                        <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{specialRequests}</p>
                    </div>
                </div>
            )}

            {/* General notes */}
            <div className="bg-emerald-100/50 rounded-xl p-3 text-xs text-emerald-900 leading-relaxed space-y-1">
                <p className="font-semibold">{t('noticeTitle')}</p>
                <ul className="list-disc list-inside space-y-0.5 text-emerald-800">
                    <li>{t('notice1')}</li>
                    <li>{t('notice2')}</li>
                </ul>
            </div>
        </div>
    )
}

export { CheckInInstructions }
