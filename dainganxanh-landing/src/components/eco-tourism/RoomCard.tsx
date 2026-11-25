'use client'

import { Link } from '@/i18n/navigation'
import { Users } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { formatCurrency } from '@/lib/format'

export interface Room {
    id: string
    name: string
    description: string | null
    capacity: number
    amenities: string[] | null
    price_per_night: number
    images: string[] | null
    status: 'active' | 'inactive' | 'maintenance'
}

export type RoomCardState = 'available' | 'booked' | 'blocked'


interface RoomCardProps {
    room: Room
    lotId: string
    checkIn?: string
    checkOut?: string
    state?: RoomCardState
}

export function RoomCard({ room, lotId, checkIn, checkOut, state = 'available' }: RoomCardProps) {
    const t = useTranslations('eco')
    const locale = useLocale()
    const bookUrl = `/eco-tourism/${lotId}/book?room_id=${room.id}&check_in=${checkIn ?? ''}&check_out=${checkOut ?? ''}`

    const stateBadge = {
        available: null,
        booked: { label: t('card.stateBooked'), className: 'bg-red-100 text-red-700' },
        blocked: { label: t('card.stateBlocked'), className: 'bg-amber-100 text-amber-700' },
    }[state]


    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center">
                {Array.isArray(room.images) && room.images.length > 0 ? (
                    <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-4xl">🛏️</span>
                )}
                {stateBadge && (
                    <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${stateBadge.className}`}>
                        {stateBadge.label}
                    </span>
                )}
            </div>
            <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{room.name}</h3>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{t('card.guestsCount', { count: room.capacity })}</span>
                    </div>
                    {room.amenities && room.amenities.length > 0 && (
                        <span className="text-gray-400 text-xs line-clamp-1">
                            {room.amenities.join(' • ')}
                        </span>
                    )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400">{t('card.pricePerNight')}</p>
                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(room.price_per_night, locale)}</p>
                    </div>
                    {state === 'available' ? (
                        <Link
                            href={bookUrl}
                            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            {t('card.bookRoom')}
                        </Link>
                    ) : (
                        <button
                            disabled
                            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
                        >
                            {state === 'blocked' ? t('card.maintenance') : t('card.booked')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
