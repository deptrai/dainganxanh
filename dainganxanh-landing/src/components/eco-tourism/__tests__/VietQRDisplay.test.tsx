import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { VietQRDisplay } from '../VietQRDisplay'

describe('VietQRDisplay Component', () => {
  const futureExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  const defaultProps = {
    booking: {
      bookingId: 'b-1',
      bookingCode: 'BKABC123',
      roomName: 'Bungalow Hoa Mai',
      checkInDate: '2026-10-01',
      checkOutDate: '2026-10-03',
      nightsCount: 2,
      totalAmount: 3000000,
      expiresAt: futureExpiresAt,
      status: 'pending',
    },
    onSuccess: jest.fn(),
    onExpired: jest.fn(),
    onCancel: jest.fn(),
    lotId: 'lot-1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    global.fetch = jest.fn()
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders booking code, bank details, and VietQR image', () => {
    render(<VietQRDisplay {...defaultProps} />)
    const codes = screen.getAllByText('BKABC123')
    expect(codes.length).toBeGreaterThanOrEqual(1)
    expect(codes[0]).toBeInTheDocument()
    expect(screen.getByText('Bungalow Hoa Mai')).toBeInTheDocument()
    expect(screen.getByText('3.000.000 ₫')).toBeInTheDocument()
    const img = screen.getByAltText('QR Code thanh toán') as HTMLImageElement
    expect(img.src).toContain('BKABC123')
    expect(img.src).toContain('3000000')
  })

  it('allows copying bank info to clipboard', async () => {
    render(<VietQRDisplay {...defaultProps} />)
    const copyCodeBtn = screen.getByRole('button', { name: 'Sao chép nội dung CK' })
    await act(async () => {
      fireEvent.click(copyCodeBtn)
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('BKABC123')
  })

  it('handles "Đã chuyển tiền thành công" click and calls claim API', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })

    render(<VietQRDisplay {...defaultProps} />)
    const claimBtn = screen.getByRole('button', { name: /Đã chuyển tiền thành công/i })
    fireEvent.click(claimBtn)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/bookings/claim-payment', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ bookingCode: 'BKABC123' }),
      }))
      expect(screen.getByText(/Đã ghi nhận/i)).toBeInTheDocument()
    })
  })

  it('opens confirmation modal on "Hủy đặt phòng" click and can be dismissed', async () => {
    render(<VietQRDisplay {...defaultProps} />)
    const cancelBtn = screen.getByRole('button', { name: /Hủy đặt phòng/i })
    fireEvent.click(cancelBtn)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Xác nhận hủy đặt phòng')).toBeInTheDocument()

    const dismissBtn = screen.getByRole('button', { name: /Không, quay lại/i })
    fireEvent.click(dismissBtn)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('closes confirmation modal on Escape key', async () => {
    render(<VietQRDisplay {...defaultProps} />)
    const cancelBtn = screen.getByRole('button', { name: /Hủy đặt phòng/i })
    fireEvent.click(cancelBtn)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('handles "Xác nhận hủy" click and calls cancel API', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })

    render(<VietQRDisplay {...defaultProps} />)
    const cancelBtn = screen.getByRole('button', { name: /Hủy đặt phòng/i })
    fireEvent.click(cancelBtn)

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận hủy/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/bookings/cancel', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ bookingCode: 'BKABC123' }),
      }))
      expect(defaultProps.onCancel).toHaveBeenCalled()
    })
  })

  it('polls status every 5 seconds and calls onSuccess when confirmed', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'confirmed' }),
    })

    render(<VietQRDisplay {...defaultProps} />)

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/bookings/status?code=BKABC123')
      expect(defaultProps.onSuccess).toHaveBeenCalled()
    })
  })

  it('polls status every 5 seconds and calls onExpired when cancelled or expired', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'cancelled' }),
    })

    render(<VietQRDisplay {...defaultProps} />)

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(defaultProps.onExpired).toHaveBeenCalled()
    })
  })

  it('calls onExpired when timer reaches 0', () => {
    const pastProps = {
      ...defaultProps,
      booking: {
        ...defaultProps.booking,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      },
    }

    render(<VietQRDisplay {...pastProps} />)
    expect(defaultProps.onExpired).toHaveBeenCalled()
  })

  it('closes confirmation modal on backdrop click', () => {
    render(<VietQRDisplay {...defaultProps} />)
    const cancelBtn = screen.getByRole('button', { name: /Hủy đặt phòng/i })
    fireEvent.click(cancelBtn)

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const modal = screen.getByRole('dialog').parentElement
    if (modal) fireEvent.click(modal)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('displays cancel error and keeps modal open when API fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: 'Đơn đặt phòng không còn ở trạng thái chờ thanh toán' }),
    })

    render(<VietQRDisplay {...defaultProps} />)
    const cancelBtn = screen.getByRole('button', { name: /Hủy đặt phòng/i })
    fireEvent.click(cancelBtn)

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận hủy/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText(/Đơn đặt phòng không còn ở trạng thái chờ thanh toán/i)).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(defaultProps.onCancel).not.toHaveBeenCalled()
    })
  })

  it('cleans up intervals on unmount', () => {
    const { unmount } = render(<VietQRDisplay {...defaultProps} />)
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
    unmount()
    expect(clearIntervalSpy).toHaveBeenCalledTimes(2)
    clearIntervalSpy.mockRestore()
  })
})
