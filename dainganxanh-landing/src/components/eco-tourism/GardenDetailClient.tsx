'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BedDouble } from 'lucide-react'
import { ImageGallery } from './ImageGallery'
import { MapSection } from './MapSection'
import { DateRangePicker } from './DateRangePicker'
import { RoomCard, type Room } from './RoomCard'
import { getBlockingBookings, type RoomBooking } from '@/lib/eco-tourism/availability'

export interface GardenDetail {
    id: string
    name: string
    region: string
    description: string | null
    location_lat: number | null
    location_lng: number | null
    images: string[] | null
    rooms: Room[]
    bookings: RoomBooking[]
}

interface GardenDetailClientProps {
    garden: GardenDetail
}

export function GardenDetailClient({ garden }: GardenDetailClientProps) {
    const [checkIn, setCheckIn] = useState('')
    const [checkOut, setCheckOut] = useState('')

    const activeRooms = useMemo(() => garden.rooms.filter((r) => r.status === 'active'), [garden.rooms])

    const bookedRoomIds = useMemo(() => {
        if (!checkIn || !checkOut) return new Set<string>()
        const blocking = getBlockingBookings(garden.bookings, checkIn, checkOut)
        return new Set(blocking.map((b) => b.room_id))
    }, [garden.bookings, checkIn, checkOut])

    const allImages = useMemo(() => {
        const lotImages = Array.isArray(garden.images) ? garden.images : []
        const roomImages = activeRooms.flatMap((r) => (Array.isArray(r.images) ? r.images : []))
        return [...new Set([...lotImages, ...roomImages])]
    }, [garden.images, activeRooms])

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <Link
                href="/eco-tourism"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Quay lại danh sách vườn
            </Link>

            <div className="mb-8">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            {garden.name}
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                                {garden.region}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <ImageGallery images={allImages} alt={garden.name} />
                    {garden.description && (
                        <div className="prose prose-gray max-w-none">
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">Giới thiệu</h2>
                            <p className="text-gray-600 whitespace-pre-line">{garden.description}</p>
                        </div>
                    )}
                </div>
                <div className="space-y-6">
                    <DateRangePicker
                        checkIn={checkIn}
                        checkOut={checkOut}
                        onCheckInChange={setCheckIn}
                        onCheckOutChange={setCheckOut}
                    />
                    <MapSection lat={garden.location_lat} lng={garden.location_lng} label={garden.region} />
                </div>
            </div>

            <section className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Phòng nghỉ</h2>
                {activeRooms.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl">
                        <BedDouble className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Vườn này chưa có phòng trống.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeRooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                lotId={garden.id}
                                checkIn={checkIn}
                                checkOut={checkOut}
                                isBooked={bookedRoomIds.has(room.id)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
