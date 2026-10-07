/**
 * Unit Tests: RoomCalendarClient
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import RoomCalendarClient from '../RoomCalendarClient'

const mockFetch = jest.fn()
const mockBlock = jest.fn()
const mockUnblock = jest.fn()

jest.mock('@/actions/adminRooms', () => ({
  fetchRoomCalendarData: (...args: any[]) => mockFetch(...args),
  blockRoomForMaintenance: (...args: any[]) => mockBlock(...args),
  unblockRoom: (...args: any[]) => mockUnblock(...args),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>
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

  beforeEach(() => {
    jest.clearAllMocks()
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
})
