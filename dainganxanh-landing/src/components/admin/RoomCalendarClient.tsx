'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Calendar, Wrench, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
    fetchRoomCalendarData,
    blockRoomForMaintenance,
    unblockRoom,
    moveBooking,
    RoomCalendarData,
} from '@/actions/adminRooms'
import { BOOKING_STATUS_CONFIG } from '@/components/crm/BookingStatusBadge'
import {
    getWeekBounds,
    getMonthCalendarDays,
    filterActiveCalendarBookings,
    calculateShiftedDates,
    CalendarDay,
} from './calendarHelpers'

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

interface DraggedBookingPayload {
    id: string
    roomId: string
    roomName: string
    checkInDate: string
    checkOutDate: string
    code: string
    guestName?: string
}

function getNextDay(dateString: string): string {
    const [y, m, d] = dateString.split('-').map(Number)
    const nextUtc = Date.UTC(y, m - 1, d) + 86400000
    const nextDate = new Date(nextUtc)
    const ny = nextDate.getUTCFullYear()
    const nm = String(nextDate.getUTCMonth() + 1).padStart(2, '0')
    const nd = String(nextDate.getUTCDate()).padStart(2, '0')
    return `${ny}-${nm}-${nd}`
}

export default function RoomCalendarClient({ userId: _userId }: RoomCalendarClientProps) {
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
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

    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState<DraggedBookingPayload | null>(null)
    const [dragOverTarget, setDragOverTarget] = useState<{
        roomId: string
        dayDate: string | null
    } | null>(null)
    const [movingBookingId, setMovingBookingId] = useState<string | null>(null)
    const [notification, setNotification] = useState<{
        type: 'success' | 'error'
        message: string
    } | null>(null)

    // Tự động đóng thông báo sau 5s
    useEffect(() => {
        if (!notification) return
        const t = setTimeout(() => setNotification(null), 5000)
        return () => clearTimeout(t)
    }, [notification])

    const monthData = useMemo(() => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        return getMonthCalendarDays(year, month)
    }, [currentDate])

    const weekData = useMemo(() => {
        return getWeekBounds(currentDate)
    }, [currentDate])

    const { startDate, endDate, days, currentLabel } = useMemo(() => {
        if (viewMode === 'week') {
            return {
                startDate: weekData.startDate,
                endDate: weekData.endDate,
                days: weekData.days,
                currentLabel: weekData.weekLabel,
            }
        }
        return {
            startDate: monthData.startDate,
            endDate: monthData.endDate,
            days: monthData.days,
            currentLabel: monthData.monthLabel,
        }
    }, [viewMode, weekData, monthData])

    const load = useCallback(async (signal?: AbortSignal) => {
        setLoading(true)
        setError(null)
        const result = await fetchRoomCalendarData(startDate, endDate)
        if (signal?.aborted) return
        if (result.error) {
            setError(result.error)
        } else {
            setCalendarData(result)
        }
        setLoading(false)
    }, [startDate, endDate])

    useEffect(() => {
        const controller = new AbortController()
        load(controller.signal)
        return () => controller.abort()
    }, [load])

    const changeMonth = (delta: number) => {
        setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
    }

    const changeWeek = (delta: number) => {
        setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + delta * 7))
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
            setNotification({ type: 'error', message: `Lỗi mở khóa: ${result.error}` })
        } else {
            setNotification({ type: 'success', message: 'Mở khóa phòng thành công' })
            await load()
        }
    }

    // Drag and Drop handlers
    const handleDragStart = (
        e: React.DragEvent,
        item: CalendarItem,
        roomId: string,
        roomName: string
    ) => {
        const payload: DraggedBookingPayload = {
            id: item.id,
            roomId,
            roomName,
            checkInDate: item.startDate,
            checkOutDate: item.endDate,
            code: item.label,
            guestName: item.sublabel,
        }
        setDraggedItem(payload)
        e.dataTransfer.setData('text/plain', JSON.stringify(payload))
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragEnd = () => {
        setDraggedItem(null)
        setDragOverTarget(null)
    }

    const handleDragOver = (e: React.DragEvent, roomId: string, dayDate: string | null) => {
        if (!draggedItem) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (dragOverTarget?.roomId !== roomId || dragOverTarget?.dayDate !== dayDate) {
            setDragOverTarget({ roomId, dayDate })
        }
    }

    const executeMove = async (params: {
        bookingId: string
        newRoomId?: string
        newCheckInDate?: string
    }) => {
        setMovingBookingId(params.bookingId)
        setNotification(null)

        // Optimistic update
        const previousData = calendarData
        if (!previousData) return

        const currentLots = previousData.lots
        const allRooms = currentLots.flatMap((l) => l.rooms)
        const sourceRoomId = allRooms.find((r) => r.bookings.some((b) => b.id === params.bookingId))?.id
        const targetBooking = allRooms.flatMap((r) => r.bookings).find((b) => b.id === params.bookingId)

        const updatedLots = currentLots.map((lot) => ({
            ...lot,
            rooms: lot.rooms.map((room) => {
                let bookings = [...room.bookings]

                if (params.newRoomId && room.id === sourceRoomId && room.id !== params.newRoomId) {
                    bookings = bookings.filter((b) => b.id !== params.bookingId)
                }
                if (params.newRoomId && room.id === params.newRoomId) {
                    if (targetBooking && !bookings.some((b) => b.id === params.bookingId)) {
                        bookings.push(targetBooking)
                    }
                }
                if (params.newCheckInDate) {
                    bookings = bookings.map((b) => {
                        if (b.id !== params.bookingId) return b
                        const shifted = calculateShiftedDates(
                            b.check_in_date,
                            b.check_out_date,
                            params.newCheckInDate!
                        )
                        return {
                            ...b,
                            check_in_date: shifted.newCheckInDate,
                            check_out_date: shifted.newCheckOutDate,
                        }
                    })
                }
                return { ...room, bookings }
            }),
        }))
        setCalendarData({ ...previousData, lots: updatedLots })

        const result = await moveBooking(params)
        setMovingBookingId(null)

        if (result.error) {
            setCalendarData(previousData)
            setNotification({
                type: 'error',
                message: result.error,
            })
        } else {
            setNotification({
                type: 'success',
                message: 'Di chuyển đơn đặt phòng thành công',
            })
            await load()
        }
    }

    const handleDrop = async (
        e: React.DragEvent,
        targetRoomId: string,
        targetRoomName: string,
        targetDayDate: string | null
    ) => {
        e.preventDefault()
        setDragOverTarget(null)

        let item = draggedItem
        if (!item) {
            try {
                const raw = e.dataTransfer.getData('text/plain')
                if (raw) item = JSON.parse(raw)
            } catch {
                // Ignore parse errors
            }
        }
        if (!item) return
        setDraggedItem(null)

        // Case A: Thả vào phòng khác -> Đổi phòng (giữ nguyên ngày)
        if (item.roomId !== targetRoomId) {
            const confirmed = window.confirm(
                `Xác nhận chuyển đơn đặt ${item.code} (${item.guestName || 'Khách'}) sang phòng "${targetRoomName}"?`
            )
            if (!confirmed) return

            await executeMove({
                bookingId: item.id,
                newRoomId: targetRoomId,
            })
            return
        }

        // Case B: Thả vào ngày khác trong cùng phòng -> Dịch chuyển ngày (giữ duration)
        if (targetDayDate && targetDayDate !== item.checkInDate) {
            await executeMove({
                bookingId: item.id,
                newCheckInDate: targetDayDate,
            })
        }
    }

    const lotsWithRooms = useMemo(() => {
        if (!calendarData) return []
        return calendarData.lots.map((lot) => ({
            ...lot,
            rooms: lot.rooms.map((room) => ({
                ...room,
                lotName: lot.name,
                lotRegion: lot.region,
            })),
        }))
    }, [calendarData])

    const itemsByRoom = useMemo(() => {
        const map = new Map<string, CalendarItem[]>()
        if (!calendarData) return map
        for (const lot of calendarData.lots) {
            for (const room of lot.rooms) {
                const items: CalendarItem[] = []
                // TD-11: Lọc bỏ booking cancelled và expired
                const activeBookings = filterActiveCalendarBookings(room.bookings || [])
                for (const b of activeBookings) {
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
                for (const bl of room.blocks || []) {
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

    const getItemColorClass = (item: CalendarItem) => {
        if (item.type === 'block') {
            return 'bg-gray-200 text-gray-700 border border-gray-300'
        }
        const config = BOOKING_STATUS_CONFIG[item.status as keyof typeof BOOKING_STATUS_CONFIG]
        if (!config) return 'bg-gray-100 text-gray-700'
        const cls = config.className
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
                    onClick={() => load()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Thử lại
                </button>
            </div>
        )
    }

    const minCellWidth = viewMode === 'week' ? '120px' : '36px'
    const gridStyle = { gridTemplateColumns: `160px repeat(${days.length}, minmax(${minCellWidth}, 1fr))` }

    return (
        <div className="space-y-6">
            {notification && (
                <div
                    className={`p-3 rounded-xl border flex items-center justify-between text-sm ${
                        notification.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                    role="status"
                >
                    <div className="flex items-center gap-2">
                        {notification.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                        <span>{notification.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setNotification(null)}
                        className="p-1 hover:opacity-75"
                        aria-label="Đóng thông báo"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Lịch phòng</h1>
                    <p className="mt-2 text-gray-600">
                        {viewMode === 'month'
                            ? 'Xem và quản lý lịch đặt phòng theo tháng'
                            : 'Xem và quản lý lịch đặt phòng theo tuần'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Toggle Tháng / Tuần */}
                    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                        <button
                            type="button"
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                viewMode === 'month'
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                            aria-pressed={viewMode === 'month'}
                        >
                            Tháng
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                viewMode === 'week'
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                            aria-pressed={viewMode === 'week'}
                        >
                            Tuần
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => (viewMode === 'month' ? changeMonth(-1) : changeWeek(-1))}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                            aria-label={viewMode === 'month' ? 'Tháng trước' : 'Tuần trước'}
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <span className="text-lg font-semibold text-gray-900 min-w-[160px] text-center capitalize">
                            {currentLabel}
                        </span>
                        <button
                            onClick={() => (viewMode === 'month' ? changeMonth(1) : changeWeek(1))}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                            aria-label={viewMode === 'month' ? 'Tháng sau' : 'Tuần sau'}
                        >
                            <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        <div className="grid border-b border-gray-200" style={gridStyle}>
                            <div className="p-3 text-sm font-semibold text-gray-700 border-r border-gray-100 bg-gray-50 sticky left-0 z-10">
                                Phòng
                            </div>
                            {days.map((day: CalendarDay) => (
                                <div
                                    key={day.dateString}
                                    className={`text-center py-2 border-r border-gray-100 ${
                                        day.isToday ? 'bg-emerald-50/50 text-emerald-700 font-bold' : 'text-gray-500'
                                    }`}
                                >
                                    <div className="text-[11px] font-semibold">{day.dayLabel}</div>
                                    {viewMode === 'week' && (
                                        <div className="text-[10px] text-gray-400">{day.dayOfWeek}</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {lotsWithRooms.map((lot) => (
                            <div key={lot.id}>
                                <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-100 sticky left-0 z-10">
                                    <h3 className="text-sm font-semibold text-emerald-900">
                                        {lot.name}
                                        {lot.region && (
                                            <span className="ml-2 text-xs text-emerald-700 font-normal">
                                                ({lot.region})
                                            </span>
                                        )}
                                    </h3>
                                </div>

                                {lot.rooms.map((room) => {
                                    const items = itemsByRoom.get(room.id) || []
                                    const isRowTargetOver =
                                        dragOverTarget?.roomId === room.id && dragOverTarget?.dayDate === null

                                    return (
                                        <div
                                            key={room.id}
                                            className="grid border-b border-gray-100 min-h-[80px]"
                                            style={gridStyle}
                                        >
                                            {/* Cột thông tin phòng - cũng là drop target để chuyển phòng */}
                                            <div
                                                onDragOver={(e) => handleDragOver(e, room.id, null)}
                                                onDrop={(e) => handleDrop(e, room.id, room.name, null)}
                                                className={`p-3 bg-gray-50 border-r border-gray-100 sticky left-0 z-10 flex flex-col justify-between transition-colors ${
                                                    isRowTargetOver ? 'bg-emerald-100 ring-2 ring-emerald-500 ring-inset' : ''
                                                }`}
                                            >
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-900">{room.name}</p>
                                                    <p className="text-xs text-emerald-700">{room.lotName}</p>
                                                    {room.lotRegion && (
                                                        <p className="text-[10px] text-gray-500">{room.lotRegion}</p>
                                                    )}
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

                                            {/* Các ô ngày */}
                                            {days.map((day: CalendarDay) => {
                                                const dayDate = day.dateString
                                                const isTodayClass = day.isToday ? 'bg-emerald-50/50' : ''
                                                const isDragOverCell =
                                                    dragOverTarget?.roomId === room.id &&
                                                    dragOverTarget?.dayDate === dayDate

                                                // Lọc các item bao gồm ngày này
                                                const dayItems = items.filter(
                                                    (item) => item.startDate <= dayDate && item.endDate > dayDate
                                                )

                                                return (
                                                    <div
                                                        key={dayDate}
                                                        data-date={dayDate}
                                                        onDragOver={(e) => handleDragOver(e, room.id, dayDate)}
                                                        onDrop={(e) => handleDrop(e, room.id, room.name, dayDate)}
                                                        className={`border-r border-gray-100 p-1 relative min-h-[80px] transition-colors ${isTodayClass} ${
                                                            isDragOverCell
                                                                ? 'bg-emerald-100 ring-2 ring-emerald-500 ring-inset'
                                                                : ''
                                                        }`}
                                                    >
                                                        <div className="text-[10px] text-gray-400 text-right mb-1">
                                                            {day.dayNumber}
                                                        </div>
                                                        <div className="space-y-1">
                                                            {dayItems.slice(0, 2).map((item) => {
                                                                const isStart = item.startDate === dayDate
                                                                const nextDayDate = getNextDay(dayDate)
                                                                const isEnd = item.endDate === nextDayDate
                                                                const linkTarget =
                                                                    item.type === 'booking'
                                                                        ? `/crm/admin/bookings/${item.id}`
                                                                        : undefined

                                                                const isDraggable =
                                                                    item.type === 'booking' &&
                                                                    item.status !== 'cancelled' &&
                                                                    item.status !== 'expired' &&
                                                                    movingBookingId !== item.id
                                                                const isCurrentlyDragging = draggedItem?.id === item.id

                                                                const content = (
                                                                    <div
                                                                        draggable={isDraggable}
                                                                        onDragStart={(e) =>
                                                                            isDraggable &&
                                                                            handleDragStart(e, item, room.id, room.name)
                                                                        }
                                                                        onDragEnd={handleDragEnd}
                                                                        className={`text-[10px] truncate px-1.5 py-0.5 rounded select-none ${getItemColorClass(
                                                                            item
                                                                        )} ${isStart ? 'rounded-l-md' : ''} ${
                                                                            isEnd ? 'rounded-r-md' : ''
                                                                        } ${
                                                                            isDraggable
                                                                                ? 'cursor-grab active:cursor-grabbing hover:shadow-sm'
                                                                                : ''
                                                                        } ${isCurrentlyDragging ? 'opacity-40' : ''}`}
                                                                        title={`${item.label}${
                                                                            item.sublabel ? ` - ${item.sublabel}` : ''
                                                                        }${item.reason ? ` - ${item.reason}` : ''}${
                                                                            isDraggable ? ' (Kéo để đổi phòng/ngày)' : ''
                                                                        }`}
                                                                    >
                                                                        <span className="font-semibold">{item.label}</span>
                                                                        {item.type === 'booking' && item.sublabel && (
                                                                            <span className="ml-1 opacity-80 truncate max-w-[60px]">
                                                                                {item.sublabel}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )

                                                                if (item.type === 'block') {
                                                                    return (
                                                                        <button
                                                                            key={item.id}
                                                                            type="button"
                                                                            onClick={() => handleUnblock(item.id, room.name)}
                                                                            className="text-left w-full"
                                                                            aria-label={`Mở khóa block ${
                                                                                item.reason || item.label
                                                                            }`}
                                                                            title="Bấm để mở khóa bảo trì"
                                                                        >
                                                                            {content}
                                                                        </button>
                                                                    )
                                                                }

                                                                return linkTarget ? (
                                                                    <Link key={item.id} href={linkTarget} className="block">
                                                                        {content}
                                                                    </Link>
                                                                ) : (
                                                                    <div key={item.id}>{content}</div>
                                                                )
                                                            })}
                                                            {dayItems.length > 2 && (
                                                                <div className="text-[10px] text-gray-500 pl-1">
                                                                    +{dayItems.length - 2}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}

                        {lotsWithRooms.length === 0 && (
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
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowBlockModal(false)
                    }}
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
                                <label htmlFor="block-start" className="block text-sm font-medium text-gray-700">
                                    Ngày bắt đầu
                                </label>
                                <input
                                    id="block-start"
                                    type="date"
                                    value={blockStart}
                                    onChange={(e) => setBlockStart(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="block-end" className="block text-sm font-medium text-gray-700">
                                    Ngày kết thúc
                                </label>
                                <input
                                    id="block-end"
                                    type="date"
                                    value={blockEnd}
                                    onChange={(e) => setBlockEnd(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="block-reason" className="block text-sm font-medium text-gray-700">
                                    Lý do
                                </label>
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
                                disabled={blockPending || !blockStart || !blockEnd || !blockReason.trim() || blockStart >= blockEnd}
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
