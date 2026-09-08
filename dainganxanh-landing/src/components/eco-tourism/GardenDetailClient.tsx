'use client'

import { useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, BedDouble, CheckCircle2, X } from 'lucide-react'
import { ImageGallery } from './ImageGallery'
import { MapSection } from './MapSection'
import { DateRangePicker } from './DateRangePicker'
import { RoomCard, type Room } from './RoomCard'
import { getBlockingBookings, getOverlappingBlocks, type RoomBooking, type RoomBlock } from '@/lib/eco-tourism/availability'

function CancelledFeedbackBanner() {
    const searchParams = useSearchParams()
    const isCancelled = searchParams.get('cancelled') === '1'
    const [dismissed, setDismissed] = useState(false)

    if (!isCancelled || dismissed) return null

    return (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-sm font-medium">
                    Đã hủy đơn đặt phòng thành công. Thời gian giữ chỗ đã kết thúc và phòng đã được giải phóng cho khách hàng khác.
                </p>
            </div>
            <button
                type="button"
                onClick={() => setDismissed(true)}
                className="p-1 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors shrink-0"
                aria-label="Đóng thông báo"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

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
    blocks: RoomBlock[]
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
        const overlapping = getOverlappingBlocks(garden.blocks, checkIn, checkOut)
        return new Set([...blocking.map((b) => b.room_id), ...overlapping.map((b) => b.room_id)])
    }, [garden.bookings, garden.blocks, checkIn, checkOut])

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

            <Suspense fallback={null}>
                <CancelledFeedbackBanner />
            </Suspense>

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
