/**
 * Unit Tests: RoomCalendarClient
 * TD-11: Month view, Week view, Hide cancelled bookings, Native DnD & date shift helpers
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import RoomCalendarClient from '../RoomCalendarClient'
import {
  calculateShiftedDates,
  getWeekBounds,
  filterActiveCalendarBookings,
} from '../calendarHelpers'

const mockFetch = jest.fn()
const mockBlock = jest.fn()
const mockUnblock = jest.fn()
const mockMove = jest.fn()

jest.mock('@/actions/adminRooms', () => ({
  fetchRoomCalendarData: (...args: any[]) => mockFetch(...args),
  blockRoomForMaintenance: (...args: any[]) => mockBlock(...args),
  unblockRoom: (...args: any[]) => mockUnblock(...args),
  moveBooking: (...args: any[]) => mockMove(...args),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
  }
})

describe('calendarHelpers', () => {
  describe('calculateShiftedDates', () => {
    it('preserves stay duration when shifting dates forward within same month', () => {
      // 3 nights stay: 10th to 13th
      const result = calculateShiftedDates('2026-10-10', '2026-10-13', '2026-10-15')
      expect(result.newCheckInDate).toBe('2026-10-15')
      expect(result.newCheckOutDate).toBe('2026-10-18')
      expect(result.durationDays).toBe(3)
    })

    it('preserves stay duration when crossing month boundary', () => {
      // 2 nights stay: Oct 30 to Nov 1
      const result = calculateShiftedDates('2026-10-30', '2026-11-01', '2026-11-29')
      expect(result.newCheckInDate).toBe('2026-11-29')
      expect(result.newCheckOutDate).toBe('2026-12-01')
      expect(result.durationDays).toBe(2)
    })

    it('correctly calculates 1-night stay', () => {
      const result = calculateShiftedDates('2026-05-01', '2026-05-02', '2026-05-20')
      expect(result.newCheckInDate).toBe('2026-05-20')
      expect(result.newCheckOutDate).toBe('2026-05-21')
      expect(result.durationDays).toBe(1)
    })
  })

  describe('getWeekBounds', () => {
    it('returns exactly 7 days starting from Monday to Sunday', () => {
      // Wednesday, Oct 14, 2026
      const date = new Date(2026, 9, 14)
      const week = getWeekBounds(date)

      expect(week.days).toHaveLength(7)
      expect(week.days[0].dayOfWeek).toBe('Thứ 2')
      expect(week.days[0].dateString).toBe('2026-10-12')
      expect(week.days[6].dayOfWeek).toBe('Chủ nhật')
      expect(week.days[6].dateString).toBe('2026-10-18')
      expect(week.startDate).toBe('2026-10-12')
      expect(week.endDate).toBe('2026-10-18')
      expect(week.weekLabel).toContain('Tuần')
    })
  })

  describe('filterActiveCalendarBookings', () => {
    it('filters out cancelled and expired bookings while preserving active ones', () => {
      const bookings = [
        { id: '1', status: 'confirmed' },
        { id: '2', status: 'cancelled' },
        { id: '3', status: 'pending' },
        { id: '4', status: 'expired' },
      ]
      const active = filterActiveCalendarBookings(bookings)
      expect(active).toHaveLength(2)
      expect(active.map((b) => b.id)).toEqual(['1', '3'])
    })
  })
})

describe('RoomCalendarClient', () => {
  // Booking dates must fall inside the month the calendar initially renders
  // (the current month), so derive them from `new Date()` instead of
  // hardcoding — otherwise the suite breaks when the calendar flips month.
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const curYear = now.getFullYear()
  const curMonth = now.getMonth() + 1 // 1-based
  const nextMonth = curMonth === 12 ? 1 : curMonth + 1
  const monthLabel = (m: number) => new RegExp(`tháng ${m}\\b`, 'i')

  const mockData = {
    lots: [{
      id: 'l1',
      name: 'Ba Vì',
      region: 'MB',
      rooms: [{
        id: 'r1',
        name: 'Deluxe',
        status: 'active',
        bookings: [{
          id: 'b1',
          code: 'BK1',
          guest_name: 'Nguyễn A',
          check_in_date: `${curYear}-${pad(curMonth)}-10`,
          check_out_date: `${curYear}-${pad(curMonth)}-12`,
          status: 'confirmed',
        }],
        blocks: [],
      }],
    }],
  }

  const multiRoomData = {
    lots: [{
      id: 'l1',
      name: 'Ba Vì',
      region: 'MB',
      rooms: [
        {
          id: 'r1',
          name: 'Deluxe',
          status: 'active',
          bookings: [{
            id: 'b1',
            code: 'BK1',
            guest_name: 'Nguyễn A',
            check_in_date: `${curYear}-${pad(curMonth)}-10`,
            check_out_date: `${curYear}-${pad(curMonth)}-12`,
            status: 'confirmed',
          }],
          blocks: [],
        },
        {
          id: 'r2',
          name: 'Standard',
          status: 'active',
          bookings: [],
          blocks: [],
        },
      ],
    }],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    window.confirm = jest.fn(() => true)
  })

  it('renders loading then calendar with room', async () => {
    mockFetch.mockResolvedValue(mockData)
    render(<RoomCalendarClient userId="u1" />)
    expect(screen.getByText('Đang tải lịch phòng...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Lịch phòng')).toBeInTheDocument()
    })

    expect(screen.getByText('Deluxe')).toBeInTheDocument()
    expect(screen.getAllByText('Ba Vì').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('BK1').length).toBeGreaterThanOrEqual(1)
  })

  it('changes month on navigation', async () => {
    mockFetch.mockResolvedValue(mockData)
    render(<RoomCalendarClient userId="u1" />)

    await waitFor(() => {
      expect(screen.getByText(monthLabel(curMonth))).toBeInTheDocument()
    })

    const nextBtn = screen.getByLabelText('Tháng sau')
    fireEvent.click(nextBtn)

    await waitFor(() => {
      expect(screen.getByText(monthLabel(nextMonth))).toBeInTheDocument()
    })

    const prevBtn = screen.getByLabelText('Tháng trước')
    fireEvent.click(prevBtn)

    await waitFor(() => {
      expect(screen.getByText(monthLabel(curMonth))).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    mockFetch.mockResolvedValue({ lots: [], error: 'Không thể tải dữ liệu' })
    render(<RoomCalendarClient userId="u1" />)

    await waitFor(() => {
      expect(screen.getByText('Không thể tải dữ liệu')).toBeInTheDocument()
    })
  })

  it('opens block modal and submits', async () => {
    mockFetch.mockResolvedValue(mockData)
    mockBlock.mockResolvedValue({ blockId: 'rb1' })
    render(<RoomCalendarClient userId="u1" />)

    await waitFor(() => {
      expect(screen.getByText('Deluxe')).toBeInTheDocument()
    })

    const blockBtn = screen.getByTitle('Khóa phòng bảo trì')
    fireEvent.click(blockBtn)

    await waitFor(() => {
      expect(screen.getByText('Khóa phòng bảo trì')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Ngày bắt đầu'), { target: { value: '2026-09-20' } })
    fireEvent.change(screen.getByLabelText('Ngày kết thúc'), { target: { value: '2026-09-22' } })
    fireEvent.change(screen.getByLabelText('Lý do'), { target: { value: 'Sửa chữa' } })

    const submitBtn = screen.getByText('Khóa phòng')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockBlock).toHaveBeenCalledWith('r1', '2026-09-20', '2026-09-22', 'Sửa chữa')
    })
  })

  // TD-11: Ẩn booking đã hủy / hết hạn
  it('hides cancelled and expired bookings from calendar display', async () => {
    const dataWithCancelled = {
      lots: [{
        id: 'l1',
        name: 'Ba Vì',
        region: 'MB',
        rooms: [{
          id: 'r1',
          name: 'Deluxe',
          status: 'active',
          bookings: [
            {
              id: 'b1',
              code: 'BK_CONFIRMED',
              guest_name: 'Khách A',
              check_in_date: `${curYear}-${pad(curMonth)}-10`,
              check_out_date: `${curYear}-${pad(curMonth)}-12`,
              status: 'confirmed',
            },
            {
              id: 'b2',
              code: 'BK_CANCELLED',
              guest_name: 'Khách B',
              check_in_date: `${curYear}-${pad(curMonth)}-10`,
              check_out_date: `${curYear}-${pad(curMonth)}-12`,
              status: 'cancelled',
            },
            {
              id: 'b3',
              code: 'BK_EXPIRED',
              guest_name: 'Khách C',
              check_in_date: `${curYear}-${pad(curMonth)}-10`,
              check_out_date: `${curYear}-${pad(curMonth)}-12`,
              status: 'expired',
            },
          ],
          blocks: [],
        }],
      }],
    }

    mockFetch.mockResolvedValue(dataWithCancelled)
    render(<RoomCalendarClient userId="u1" />)

    await waitFor(() => {
      expect(screen.getByText('Deluxe')).toBeInTheDocument()
    })

    // BK_CONFIRMED phải hiển thị
    expect(screen.getAllByText('BK_CONFIRMED').length).toBeGreaterThanOrEqual(1)
    // BK_CANCELLED và BK_EXPIRED không được hiển thị
    expect(screen.queryByText('BK_CANCELLED')).not.toBeInTheDocument()
    expect(screen.queryByText('BK_EXPIRED')).not.toBeInTheDocument()
  })

  // TD-11: Week View toggle & navigation
  it('toggles to week view and allows navigation', async () => {
    mockFetch.mockResolvedValue(mockData)
    render(<RoomCalendarClient userId="u1" />)

    await waitFor(() => {
      expect(screen.getByText('Lịch phòng')).toBeInTheDocument()
    })

    // Nút toggle Tuần
    const weekToggleBtn = screen.getByRole('button', { name: 'Tuần' })
    expect(weekToggleBtn).toBeInTheDocument()
    fireEvent.click(weekToggleBtn)

    // View chuyển sang tuần: header hiển thị "Tuần ..."
    await waitFor(() => {
      expect(screen.getByText(/Tuần \d+/i)).toBeInTheDocument()
    })

    // Nút điều hướng tuần
    const nextWeekBtn = screen.getByLabelText('Tuần sau')
    expect(nextWeekBtn).toBeInTheDocument()
    fireEvent.click(nextWeekBtn)

    // Kiểm tra fetch được gọi lại cho tuần mới
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    // Nút chuyển lại Tháng
    const monthToggleBtn = screen.getByRole('button', { name: 'Tháng' })
    fireEvent.click(monthToggleBtn)

    await waitFor(() => {
      expect(screen.getByText(monthLabel(curMonth))).toBeInTheDocument()
    })
  })

  // TD-11: Drag & drop - Đổi phòng
  it('moves booking to another room on drag and drop', async () => {
    mockFetch.mockResolvedValue(multiRoomData)
    mockMove.mockResolvedValue({ success: true })
    render(<RoomCalendarClient userId="u1" />)

    await waitFor(() => {
      expect(screen.getByText('Standard')).toBeInTheDocument()
    })

    // Booking BK1
    const bookingCard = screen.getAllByText('BK1')[0].closest('div[draggable="true"]')
    expect(bookingCard).toBeInTheDocument()
    expect(bookingCard).toHaveAttribute('draggable', 'true')

    // Bắt đầu drag booking card
    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(key: string, val: string) {
        this.data[key] = val
      },
      getData(key: string) {
        return this.data[key]
      },
      effectAllowed: 'all',
      dropEffect: 'none',
    }

    fireEvent.dragStart(bookingCard!, { dataTransfer })

    // Thả vào ô phòng Standard (r2)
    const standardRoomHeader = screen.getByText('Standard').closest('div')
    expect(standardRoomHeader).toBeInTheDocument()

    fireEvent.drop(standardRoomHeader!, { dataTransfer })

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled()
      expect(mockMove).toHaveBeenCalledWith({
        bookingId: 'b1',
        newRoomId: 'r2',
      })
    })

    // Hiển thị toast thành công
    await waitFor(() => {
      expect(screen.getByText('Di chuyển đơn đặt phòng thành công')).toBeInTheDocument()
    })
  })

  // TD-11: Drag & drop - Dịch chuyển ngày trong cùng phòng
  it('shifts booking dates on drag and drop to another day in same room', async () => {
    mockFetch.mockResolvedValue(mockData)
    mockMove.mockResolvedValue({ success: true })
    render(<RoomCalendarClient userId="u1" />)

    await waitFor(() => {
      expect(screen.getByText('Deluxe')).toBeInTheDocument()
    })

    const bookingCard = screen.getAllByText('BK1')[0].closest('div[draggable="true"]')
    expect(bookingCard).toBeInTheDocument()

    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(key: string, val: string) {
        this.data[key] = val
      },
      getData(key: string) {
        return this.data[key]
      },
      effectAllowed: 'all',
      dropEffect: 'none',
    }

    fireEvent.dragStart(bookingCard!, { dataTransfer })

    // Target date cell e.g. day 15
    const targetDayDate = `${curYear}-${pad(curMonth)}-15`
    const targetCell = document.querySelector(`[data-date="${targetDayDate}"]`)
    expect(targetCell).toBeInTheDocument()

    fireEvent.drop(targetCell!, { dataTransfer })

    await waitFor(() => {
      expect(mockMove).toHaveBeenCalledWith({
        bookingId: 'b1',
        newCheckInDate: targetDayDate,
      })
    })
  })

  // TD-11: Drag & drop error handling
  it('displays error message when moveBooking fails', async () => {
    mockFetch.mockResolvedValue(multiRoomData)
    mockMove.mockResolvedValue({
      success: false,
      error: 'Phòng đã có khách đặt trong khoảng thời gian này',
    })
    render(<RoomCalendarClient userId="u1" />)

    await waitFor(() => {
      expect(screen.getByText('Standard')).toBeInTheDocument()
    })

    const bookingCard = screen.getAllByText('BK1')[0].closest('div[draggable="true"]')
    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(key: string, val: string) {
        this.data[key] = val
      },
      getData(key: string) {
        return this.data[key]
      },
      effectAllowed: 'all',
      dropEffect: 'none',
    }

    fireEvent.dragStart(bookingCard!, { dataTransfer })
    const standardRoomHeader = screen.getByText('Standard').closest('div')
    fireEvent.drop(standardRoomHeader!, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText('Phòng đã có khách đặt trong khoảng thời gian này')).toBeInTheDocument()
    })
  })
})
