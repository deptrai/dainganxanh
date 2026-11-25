/**
 * Calendar Helper Functions: Room Calendar (Month & Week view, DnD helpers)
 * TD-11: Tuần/Tháng bounds, chuyển đổi ngày khi drag & drop, lọc booking hoạt động
 */

export interface CalendarDay {
    dateString: string
    dayNumber: number
    dayLabel: string
    dayOfWeek: string
    isToday: boolean
}

const VN_DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
const VN_SHORT_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`
}

export function parseYMD(ymd: string): [number, number, number] {
    const [y, m, d] = ymd.split('-').map(Number)
    return [y, m, d]
}

export function formatYMD(year: number, month: number, day: number): string {
    return `${year}-${pad(month)}-${pad(day)}`
}

/**
 * Tính toán ngày check-in và check-out mới khi dịch chuyển ngày nhận phòng,
 * bảo toàn thời lượng lưu trú (duration = check_out - check_in).
 */
export function calculateShiftedDates(
    currentCheckIn: string,
    currentCheckOut: string,
    newCheckIn: string
): { newCheckInDate: string; newCheckOutDate: string; durationDays: number } {
    const [y1, m1, d1] = parseYMD(currentCheckIn)
    const [y2, m2, d2] = parseYMD(currentCheckOut)
    const inUtc = Date.UTC(y1, m1 - 1, d1)
    const outUtc = Date.UTC(y2, m2 - 1, d2)
    const durationDays = Math.max(1, Math.round((outUtc - inUtc) / 86400000))

    const [ny, nm, nd] = parseYMD(newCheckIn)
    const newInUtc = Date.UTC(ny, nm - 1, nd)
    const newOutUtc = newInUtc + durationDays * 86400000
    const newOutDate = new Date(newOutUtc)

    const newCheckOutDate = `${newOutDate.getUTCFullYear()}-${pad(newOutDate.getUTCMonth() + 1)}-${pad(newOutDate.getUTCDate())}`

    return {
        newCheckInDate: newCheckIn,
        newCheckOutDate,
        durationDays,
    }
}

/**
 * Lấy danh sách 7 ngày trong tuần (bắt đầu từ Thứ 2) dựa trên ngày đang chọn.
 */
export function getWeekBounds(currentDate: Date): {
    startDate: string
    endDate: string
    days: CalendarDay[]
    weekLabel: string
} {
    const d = new Date(currentDate)
    const day = d.getDay() // 0 = CN, 1 = T2, ...
    const diffToMonday = day === 0 ? -6 : 1 - day

    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday)

    const today = new Date()
    const todayStr = formatYMD(today.getFullYear(), today.getMonth() + 1, today.getDate())

    const days: CalendarDay[] = []
    for (let i = 0; i < 7; i++) {
        const cur = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
        const y = cur.getFullYear()
        const m = cur.getMonth() + 1
        const dayNum = cur.getDate()
        const dateStr = formatYMD(y, m, dayNum)
        const dayOfWeekIdx = cur.getDay()

        days.push({
            dateString: dateStr,
            dayNumber: dayNum,
            dayLabel: `${VN_SHORT_DAYS[dayOfWeekIdx]} ${dayNum}/${m}`,
            dayOfWeek: VN_DAY_NAMES[dayOfWeekIdx],
            isToday: dateStr === todayStr,
        })
    }

    const startDay = days[0]
    const endDay = days[6]
    const weekLabel = `Tuần ${startDay.dayNumber}/${startDay.dateString.slice(5, 7)} - ${endDay.dayNumber}/${endDay.dateString.slice(5, 7)}/${endDay.dateString.slice(0, 4)}`

    return {
        startDate: startDay.dateString,
        endDate: endDay.dateString,
        days,
        weekLabel,
    }
}

/**
 * Lấy danh sách các ngày trong tháng.
 */
export function getMonthCalendarDays(year: number, month: number, locale = 'vi'): {
    startDate: string
    endDate: string
    days: CalendarDay[]
    daysInMonth: number
    monthLabel: string
} {
    const end = new Date(year, month + 1, 0)
    const daysInMonth = end.getDate()
    const today = new Date()
    const todayStr = formatYMD(today.getFullYear(), today.getMonth() + 1, today.getDate())

    const days: CalendarDay[] = []
    for (let d = 1; d <= daysInMonth; d++) {
        const cur = new Date(year, month, d)
        const dateStr = formatYMD(year, month + 1, d)
        const dayOfWeekIdx = cur.getDay()

        days.push({
            dateString: dateStr,
            dayNumber: d,
            dayLabel: String(d),
            dayOfWeek: VN_DAY_NAMES[dayOfWeekIdx],
            isToday: dateStr === todayStr,
        })
    }

    const startDate = formatYMD(year, month + 1, 1)
    const endDate = formatYMD(year, month + 1, daysInMonth)
    const monthLabel = new Date(year, month).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN', { month: 'long', year: 'numeric' })

    return {
        startDate,
        endDate,
        days,
        daysInMonth,
        monthLabel,
    }
}

/**
 * Lọc bỏ booking đã hủy ('cancelled') hoặc hết hạn ('expired')
 * Không xóa dữ liệu, chỉ không hiển thị trên lịch.
 */
export function filterActiveCalendarBookings<T extends { status?: string }>(bookings: T[]): T[] {
    return bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'expired')
}
