'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Calendar, Wrench, X, AlertCircle } from 'lucide-react'
import { fetchRoomCalendarData, blockRoomForMaintenance, unblockRoom, RoomCalendarData } from '@/actions/adminRooms'
import { BOOKING_STATUS_CONFIG } from '@/components/crm/BookingStatusBadge'

interface RoomCalendarClientProps {
    userId: string
}

interface CalendarItem {
    id: string
    type: 'booking' | 'block'
    startDate: string
    endDate: string
    label: string
    sublabel?: string
    status?: string
    reason?: string | null
}

function getMonthBounds(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    return {
        year,
        month,
        startDay: start.getDay(),
        daysInMonth: end.getDate(),
    }
}

function pad(n: number) {
    return n < 10 ? `0${n}` : `${n}`
}

function getMonthDateString(year: number, month: number, day: number) {
    const d = new Date(year, month, day)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getMonthName(month: number, year: number) {
    return new Date(year, month).toLocaleString('vi-VN', { month: 'long', year: 'numeric' })
}

export default function RoomCalendarClient({ userId }: RoomCalendarClientProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [calendarData, setCalendarData] = useState<RoomCalendarData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
    const [showBlockModal, setShowBlockModal] = useState(false)
    const [blockStart, setBlockStart] = useState('')
    const [blockEnd, setBlockEnd] = useState('')
    const [blockReason, setBlockReason] = useState('')
    const [blockError, setBlockError] = useState<string | null>(null)
    const [blockPending, setBlockPending] = useState(false)

    const { year, month, startDay, daysInMonth } = useMemo(() => getMonthBounds(currentDate), [currentDate])

    const monthStartStr = getMonthDateString(year, month, 1)
    const monthEndStr = getMonthDateString(year, month, daysInMonth)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        const result = await fetchRoomCalendarData(monthStartStr, monthEndStr)
        if (result.error) {
            setError(result.error)
        } else {
            setCalendarData(result)
        }
        setLoading(false)
    }, [monthStartStr, monthEndStr])

    useEffect(() => {
        load()
    }, [load])

    const changeMonth = (delta: number) => {
        setCurrentDate(new Date(year, month + delta, 1))
    }

    const handleBlockRoom = (roomId: string) => {
        setSelectedRoomId(roomId)
        setBlockStart('')
        setBlockEnd('')
        setBlockReason('')
        setBlockError(null)
        setShowBlockModal(true)
    }

    const validateDate = (value: string) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
        const d = new Date(value + 'T00:00:00Z')
        return !isNaN(d.getTime()) && value === d.toISOString().slice(0, 10)
    }

    const submitBlock = async () => {
        if (!selectedRoomId) return
        setBlockError(null)
        if (!validateDate(blockStart) || !validateDate(blockEnd)) {
            setBlockError('Ngày không hợp lệ')
            return
        }
        setBlockPending(true)
        const result = await blockRoomForMaintenance(selectedRoomId, blockStart, blockEnd, blockReason)
        setBlockPending(false)
        if (result.error) {
            setBlockError(result.error)
        } else {
            setShowBlockModal(false)
            setSelectedRoomId(null)
            await load()
        }
    }

    const handleUnblock = async (blockId: string, roomName?: string) => {
        if (!window.confirm(`Xác nhận mở khóa phòng ${roomName || ''} cho thời gian bảo trì này?`)) {
            return
        }
        const result = await unblockRoom(blockId)
        if (result.error) {
            setError(result.error)
        } else {
            await load()
        }
    }

    const allRooms = useMemo(() => {
        const rooms: { id: string; name: string; lotName: string; lotRegion?: string; status: string }[] = []
        if (!calendarData) return rooms
        for (const lot of calendarData.lots) {
            for (const room of lot.rooms) {
                rooms.push({
                    id: room.id,
                    name: room.name,
                    lotName: lot.name,
                    lotRegion: lot.region,
                    status: room.status,
                })
            }
        }
        return rooms
    }, [calendarData])

    const itemsByRoom = useMemo(() => {
        const map = new Map<string, CalendarItem[]>()
        if (!calendarData) return map
        for (const lot of calendarData.lots) {
            for (const room of lot.rooms) {
                const items: CalendarItem[] = []
                for (const b of room.bookings) {
                    items.push({
                        id: b.id,
                        type: 'booking',
                        startDate: b.check_in_date,
                        endDate: b.check_out_date,
                        label: b.code,
                        sublabel: b.guest_name,
                        status: b.status,
                    })
                }
                for (const bl of room.blocks) {
                    items.push({
                        id: bl.id,
                        type: 'block',
                        startDate: bl.start_date,
                        endDate: bl.end_date,
                        label: 'Bảo trì',
                        sublabel: bl.reason || '',
                        status: bl.status,
                        reason: bl.reason,
                    })
                }
                map.set(room.id, items)
            }
        }
        return map
    }, [calendarData])

    const dayNumbers = useMemo(() => {
        return Array.from({ length: daysInMonth }, (_, i) => i + 1)
    }, [daysInMonth])

    const isToday = (day: number) => {
        const today = new Date()
        return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
    }

    const getDayDate = (day: number) => getMonthDateString(year, month, day)

    const getItemColorClass = (item: CalendarItem) => {
        if (item.type === 'block') {
            return 'bg-gray-200 text-gray-700 border border-gray-300'
        }
        const config = BOOKING_STATUS_CONFIG[item.status as keyof typeof BOOKING_STATUS_CONFIG]
        if (!config) return 'bg-gray-100 text-gray-700'
        const cls = config.className
        // Convert badge color classes to subtle bar colors
        const map: Record<string, string> = {
            'bg-amber-100 text-amber-800': 'bg-amber-100 text-amber-900 border border-amber-200',
            'bg-emerald-100 text-emerald-800': 'bg-emerald-100 text-emerald-900 border border-emerald-200',
            'bg-red-100 text-red-800': 'bg-red-100 text-red-900 border border-red-200',
            'bg-blue-100 text-blue-800': 'bg-blue-100 text-blue-900 border border-blue-200',
            'bg-gray-100 text-gray-800': 'bg-gray-100 text-gray-900 border border-gray-200',
        }
        return map[cls] || cls
    }

    if (loading) {
        return (
            <div className="p-6 bg-white rounded-2xl border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải lịch phòng...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
                <div className="flex items-center justify-center gap-2 text-red-800 font-semibold">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
                <button
                    onClick={load}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Thử lại
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Lịch phòng</h1>
                    <p className="mt-2 text-gray-600">Xem và quản lý lịch đặt phòng theo tháng</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                        aria-label="Tháng trước"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <span className="text-lg font-semibold text-gray-900 min-w-[160px] text-center capitalize">
                        {getMonthName(month, year)}
                    </span>
                    <button
                        onClick={() => changeMonth(1)}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                        aria-label="Tháng sau"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        <div className="grid grid-cols-[160px_repeat(auto-fill,minmax(36px,1fr))] border-b border-gray-200">
                            <div className="p-3 text-sm font-semibold text-gray-700 border-r border-gray-100 bg-gray-50 sticky left-0 z-10">
                                Phòng
                            </div>
                            {dayNumbers.map((d) => (
                                <div key={d} className="text-center text-[11px] font-semibold text-gray-500 py-2 border-r border-gray-100">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {allRooms.map((room) => {
                            const items = itemsByRoom.get(room.id) || []
                            return (
                                <div key={room.id} className="grid grid-cols-[160px_repeat(auto-fill,minmax(36px,1fr))] border-b border-gray-100 min-h-[80px]">
                                    <div className="p-3 bg-gray-50 border-r border-gray-100 sticky left-0 z-10 flex flex-col justify-between">
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900">{room.name}</p>
                                            <p className="text-xs text-emerald-700">{room.lotName}</p>
                                            {room.lotRegion && <p className="text-[10px] text-gray-500">{room.lotRegion}</p>}
                                        </div>
                                        <button
                                            onClick={() => handleBlockRoom(room.id)}
                                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                                            title="Khóa phòng bảo trì"
                                            aria-label={`Khóa phòng ${room.name} bảo trì`}
                                        >
                                            <Wrench className="w-3 h-3" />
                                            <span>Khóa</span>
                                        </button>
                                    </div>

                                    {dayNumbers.map((day) => {
                                        const dayDate = getDayDate(day)
                                        const isTodayClass = isToday(day) ? 'bg-emerald-50/50' : ''

                                        // Find items covering this day
                                        const dayItems = items.filter((item) =>
                                            item.startDate <= dayDate && item.endDate > dayDate
                                        )

                                        return (
                                            <div
                                                key={day}
                                                className={`border-r border-gray-100 p-1 relative min-h-[80px] ${isTodayClass}`}
                                            >
                                                <div className="text-[10px] text-gray-400 text-right mb-1">{day}</div>
                                                <div className="space-y-1">
                                                    {dayItems.slice(0, 2).map((item) => {
                                                        const isStart = item.startDate === dayDate
                                                        const nextDayDate = getMonthDateString(year, month, day + 1)
                                                        const isEnd = item.endDate === nextDayDate
                                                        const linkTarget = item.type === 'booking' ? `/crm/admin/bookings/${item.id}` : undefined
                                                        const content = (
                                                            <div
                                                                className={`text-[10px] truncate px-1.5 py-0.5 rounded ${getItemColorClass(item)} ${
                                                                    isStart ? 'rounded-l-md' : ''
                                                                } ${isEnd ? 'rounded-r-md' : ''}`}
                                                                title={`${item.label}${item.sublabel ? ` - ${item.sublabel}` : ''}${item.reason ? ` - ${item.reason}` : ''}`}
                                                            >
                                                                {isStart && (
                                                                    <span className="font-semibold">{item.label}</span>
                                                                )}
                                                                {item.type === 'booking' && item.sublabel && (
                                                                    <span className="ml-1 opacity-80 truncate max-w-[60px]">{item.sublabel}</span>
                                                                )}
                                                            </div>
                                                        )
                                                        if (item.type === 'block') {
                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    type="button"
                                                                    onClick={() => handleUnblock(item.id, room.name)}
                                                                    className="text-left"
                                                                    aria-label={`Mở khóa block ${item.reason || item.label}`}
                                                                    title="Bấm để mở khóa bảo trì"
                                                                >
                                                                    {content}
                                                                </button>
                                                            )
                                                        }
                                                        return linkTarget ? (
                                                            <Link key={item.id} href={linkTarget}>
                                                                {content}
                                                            </Link>
                                                        ) : (
                                                            <div key={item.id}>{content}</div>
                                                        )
                                                    })}
                                                    {dayItems.length > 2 && (
                                                        <div className="text-[10px] text-gray-500 pl-1">+{dayItems.length - 2}</div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })}

                        {allRooms.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                <p>Không có phòng nào trong hệ thống.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showBlockModal && selectedRoomId && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="block-modal-title"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowBlockModal(false) }}
                >
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h2 id="block-modal-title" className="text-lg font-bold text-gray-900">
                                Khóa phòng bảo trì
                            </h2>
                            <button
                                onClick={() => setShowBlockModal(false)}
                                className="p-1 rounded hover:bg-gray-100"
                                aria-label="Đóng"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {blockError && (
                            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                {blockError}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label htmlFor="block-start" className="block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
                                <input
                                    id="block-start"
                                    type="date"
                                    value={blockStart}
                                    onChange={(e) => setBlockStart(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="block-end" className="block text-sm font-medium text-gray-700">Ngày kết thúc</label>
                                <input
                                    id="block-end"
                                    type="date"
                                    value={blockEnd}
                                    onChange={(e) => setBlockEnd(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="block-reason" className="block text-sm font-medium text-gray-700">Lý do</label>
                                <textarea
                                    id="block-reason"
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    placeholder="Lý do bảo trì..."
                                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowBlockModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={submitBlock}
                                disabled={blockPending || !blockStart || !blockEnd || !blockReason.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg"
                            >
                                {blockPending ? 'Đang lưu...' : 'Khóa phòng'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
