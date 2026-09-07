import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BookingForm } from '../BookingForm'

describe('BookingForm Component', () => {
  const defaultProps = {
    roomId: 'room-1',
    checkIn: '2026-10-01',
    checkOut: '2026-10-03',
    capacity: 4,
    guestsCount: 2,
    onGuestsCountChange: jest.fn(),
    onSuccess: jest.fn(),
    pricingError: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('renders all form inputs and button', () => {
    render(<BookingForm {...defaultProps} />)
    expect(screen.getByPlaceholderText('Nguyễn Văn A')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0901234567')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument()
    expect(screen.getByText('Số khách tối đa: 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đặt phòng' })).toBeInTheDocument()
  })

  it('validates required fields on submit', async () => {
    render(<BookingForm {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Đặt phòng' }))

    expect(await screen.findByText('Vui lòng nhập họ tên')).toBeInTheDocument()
    expect(await screen.findByText('Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)')).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('validates invalid phone number format', async () => {
    render(<BookingForm {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), { target: { value: 'Trần Văn B' } })
    fireEvent.change(screen.getByPlaceholderText('0901234567'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đặt phòng' }))

    expect(await screen.findByText('Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)')).toBeInTheDocument()
  })

  it('submits valid data to /api/bookings/create and calls onSuccess', async () => {
    const mockBookingResponse = {
      bookingId: 'b-1',
      bookingCode: 'BKXYZ123',
      roomName: 'Phòng VIP',
      checkInDate: '2026-10-01',
      checkOutDate: '2026-10-03',
      nightsCount: 2,
      totalAmount: 2400000,
      expiresAt: '2026-10-01T10:15:00Z',
      status: 'pending',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBookingResponse,
    })

    render(<BookingForm {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), { target: { value: 'Nguyễn Văn A' } })
    fireEvent.change(screen.getByPlaceholderText('0901234567'), { target: { value: '0987654321' } })
    fireEvent.change(screen.getByPlaceholderText('email@example.com'), { target: { value: 'test@dainganxanh.vn' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đặt phòng' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/bookings/create', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"guest_name":"Nguyễn Văn A"'),
      }))
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(mockBookingResponse)
    })
  })

  it('displays error message when API returns 409 conflict', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Phòng đã có người đặt trong thời gian này.' }),
    })

    render(<BookingForm {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), { target: { value: 'Nguyễn Văn A' } })
    fireEvent.change(screen.getByPlaceholderText('0901234567'), { target: { value: '0987654321' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đặt phòng' }))

    expect(await screen.findByText('Phòng đã có người đặt trong thời gian này.')).toBeInTheDocument()
    expect(defaultProps.onSuccess).not.toHaveBeenCalled()
  })

  it('disables submit button and shows pricing error if provided', () => {
    render(<BookingForm {...defaultProps} pricingError="Yêu cầu đặt tối thiểu 2 đêm" />)
    expect(screen.getByText('Yêu cầu đặt tối thiểu 2 đêm')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đặt phòng' })).toBeDisabled()
  })
})
