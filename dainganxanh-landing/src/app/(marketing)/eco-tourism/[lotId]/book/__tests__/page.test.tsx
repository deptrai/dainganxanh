import { render, screen } from '@testing-library/react'
import BookingPage from '../page'
import { redirect, notFound } from 'next/navigation'

const mockMaybeSingle = jest.fn()
const mockIn = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()
const mockFrom = jest.fn()

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
  }),
}))

jest.mock('../BookingPageClient', () => {
  return function MockBookingPageClient(props: { room: { name: string }; lot: { name: string }; checkIn: string; checkOut: string }) {
    return (
      <div data-testid="booking-page-client">
        <h1>{props.lot.name}</h1>
        <h2>{props.room.name}</h2>
        <span>{props.checkIn}</span>
        <span>{props.checkOut}</span>
      </div>
    )
  }
})

describe('BookingPage SSR', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFrom.mockImplementation(() => ({
      select: mockSelect,
    }))
    mockSelect.mockImplementation((cols: string) => {
      if (cols.includes('capacity')) {
        return { eq: mockEq }
      }
      return {
        eq: jest.fn().mockReturnValue({ in: mockIn }),
      }
    })
    mockEq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
    })
    mockIn.mockResolvedValue({ data: [] })
  })

  it('redirects to /eco-tourism/[lotId] if query parameters are missing or dates invalid', async () => {
    const params = Promise.resolve({ lotId: 'lot-1' })
    const searchParams = Promise.resolve({ room_id: '', check_in: '', check_out: '' })

    await BookingPage({ params, searchParams })
    expect(redirect).toHaveBeenCalledWith('/eco-tourism/lot-1')

    const invalidDates = Promise.resolve({
      room_id: 'r1',
      check_in: '2026-10-05',
      check_out: '2026-10-02',
    })
    await BookingPage({ params, searchParams: invalidDates })
    expect(redirect).toHaveBeenCalledWith('/eco-tourism/lot-1')
  })

  it('renders room not found when room query returns null', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const params = Promise.resolve({ lotId: 'lot-1' })
    const searchParams = Promise.resolve({
      room_id: 'r1',
      check_in: '2026-10-01',
      check_out: '2026-10-03',
    })

    const element = await BookingPage({ params, searchParams })
    render(element as React.ReactElement)
    expect(screen.getByText('Không tìm thấy phòng')).toBeInTheDocument()
  })

  it('calls notFound when room is inactive or from another lot', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'r1',
        name: 'Phòng Sen',
        capacity: 2,
        status: 'inactive',
        lot_id: 'lot-2',
        lots: { id: 'lot-2', name: 'Vườn khác', region: 'Miền Bắc' },
      },
      error: null,
    })
    const params = Promise.resolve({ lotId: 'lot-1' })
    const searchParams = Promise.resolve({
      room_id: 'r1',
      check_in: '2026-10-01',
      check_out: '2026-10-03',
    })

    await BookingPage({ params, searchParams })
    expect(notFound).toHaveBeenCalled()
  })

  it('renders "Phòng đã được đặt" when blocking booking overlaps dates', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'r1',
        name: 'Phòng Sen',
        capacity: 2,
        amenities: ['wifi'],
        price_per_night: 1000000,
        images: ['img.jpg'],
        status: 'active',
        lot_id: 'lot-1',
        lots: { id: 'lot-1', name: 'Vườn Trầm A', region: 'Miền Bắc' },
      },
      error: null,
    })

    mockIn.mockResolvedValue({
      data: [
        {
          id: 'b1',
          room_id: 'r1',
          check_in_date: '2026-10-01',
          check_out_date: '2026-10-03',
          status: 'confirmed',
          expires_at: null,
        },
      ],
    })

    const params = Promise.resolve({ lotId: 'lot-1' })
    const searchParams = Promise.resolve({
      room_id: 'r1',
      check_in: '2026-10-01',
      check_out: '2026-10-03',
    })

    const element = await BookingPage({ params, searchParams })
    render(element as React.ReactElement)
    expect(screen.getByText('Phòng đã được đặt')).toBeInTheDocument()
  })

  it('renders BookingPageClient when room is available', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'r1',
        name: 'Phòng Sen',
        capacity: 2,
        amenities: ['wifi'],
        price_per_night: 1000000,
        images: ['img.jpg'],
        status: 'active',
        lot_id: 'lot-1',
        lots: { id: 'lot-1', name: 'Vườn Trầm A', region: 'Miền Bắc' },
      },
      error: null,
    })

    mockIn.mockResolvedValue({ data: [] })

    const params = Promise.resolve({ lotId: 'lot-1' })
    const searchParams = Promise.resolve({
      room_id: 'r1',
      check_in: '2026-10-01',
      check_out: '2026-10-03',
    })

    const element = await BookingPage({ params, searchParams })
    render(element as React.ReactElement)
    expect(screen.getByTestId('booking-page-client')).toBeInTheDocument()
    expect(screen.getByText('Vườn Trầm A')).toBeInTheDocument()
    expect(screen.getByText('Phòng Sen')).toBeInTheDocument()
  })

  describe('Revisit booking via ?code=', () => {
    it('redirects if code is malformed', async () => {
      const params = Promise.resolve({ lotId: 'lot-1' })
      const searchParams = Promise.resolve({ code: 'INVALID' })

      await BookingPage({ params, searchParams })
      expect(redirect).toHaveBeenCalledWith('/eco-tourism/lot-1')
    })

    it('redirects if booking not found', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })
      const params = Promise.resolve({ lotId: 'lot-1' })
      const searchParams = Promise.resolve({ code: 'BKABC123' })

      await BookingPage({ params, searchParams })
      expect(redirect).toHaveBeenCalledWith('/eco-tourism/lot-1')
    })

    it('redirects to correct lot if booking belongs to a different lot', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'b1',
          code: 'BKABC123',
          status: 'pending',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          rooms: {
            lot_id: 'lot-2',
            lots: { id: 'lot-2', name: 'Vườn khác', region: 'Miền Trung' },
          },
        },
        error: null,
      })
      const params = Promise.resolve({ lotId: 'lot-1' })
      const searchParams = Promise.resolve({ code: 'bkabc123' })

      await BookingPage({ params, searchParams })
      expect(redirect).toHaveBeenCalledWith('/eco-tourism/lot-2/book?code=BKABC123')
    })

    it('redirects to success page if booking is already confirmed', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'b1',
          code: 'BKABC123',
          status: 'confirmed',
          rooms: {
            lot_id: 'lot-1',
            lots: { id: 'lot-1', name: 'Vườn Trầm A', region: 'Miền Bắc' },
          },
        },
        error: null,
      })
      const params = Promise.resolve({ lotId: 'lot-1' })
      const searchParams = Promise.resolve({ code: 'BKABC123' })

      await BookingPage({ params, searchParams })
      expect(redirect).toHaveBeenCalledWith('/eco-tourism/lot-1/book/success?code=BKABC123')
    })

    it('renders "Đơn đặt phòng đã bị hủy" if status is cancelled', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'b1',
          code: 'BKABC123',
          status: 'cancelled',
          rooms: {
            lot_id: 'lot-1',
            lots: { id: 'lot-1', name: 'Vườn Trầm A', region: 'Miền Bắc' },
          },
        },
        error: null,
      })
      const params = Promise.resolve({ lotId: 'lot-1' })
      const searchParams = Promise.resolve({ code: 'BKABC123' })

      const element = await BookingPage({ params, searchParams })
      render(element as React.ReactElement)
      expect(screen.getByText('Đơn đặt phòng đã bị hủy')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Tạo đặt phòng mới/i })).toHaveAttribute('href', '/eco-tourism/lot-1')
    })

    it('renders "Đơn đặt phòng đã hết hạn" if pending but expired', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'b1',
          code: 'BKABC123',
          status: 'pending',
          expires_at: new Date(Date.now() - 60 * 1000).toISOString(),
          rooms: {
            lot_id: 'lot-1',
            lots: { id: 'lot-1', name: 'Vườn Trầm A', region: 'Miền Bắc' },
          },
        },
        error: null,
      })
      const params = Promise.resolve({ lotId: 'lot-1' })
      const searchParams = Promise.resolve({ code: 'BKABC123' })

      const element = await BookingPage({ params, searchParams })
      render(element as React.ReactElement)
      expect(screen.getByText('Đơn đặt phòng đã hết hạn')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Tạo đặt phòng mới/i })).toHaveAttribute('href', '/eco-tourism/lot-1')
    })

    it('resumes payment flow when pending booking is still valid', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'b1',
          code: 'BKABC123',
          status: 'pending',
          check_in_date: '2026-10-01',
          check_out_date: '2026-10-03',
          nights_count: 2,
          guests_count: 2,
          total_amount: 2000000,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          rooms: {
            id: 'r1',
            name: 'Phòng Sen',
            capacity: 2,
            amenities: ['wifi'],
            price_per_night: 1000000,
            images: [],
            status: 'active',
            lot_id: 'lot-1',
            lots: { id: 'lot-1', name: 'Vườn Trầm A', region: 'Miền Bắc' },
          },
        },
        error: null,
      })
      const params = Promise.resolve({ lotId: 'lot-1' })
      const searchParams = Promise.resolve({ code: 'BKABC123' })

      const element = await BookingPage({ params, searchParams })
      render(element as React.ReactElement)
      expect(screen.getByTestId('booking-page-client')).toBeInTheDocument()
    })
  })
})
