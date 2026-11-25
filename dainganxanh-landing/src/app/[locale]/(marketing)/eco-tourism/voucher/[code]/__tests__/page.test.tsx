import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BookingVoucherPage, { generateMetadata } from '../page'
import { _resetRateLimitStore } from '@/lib/rate-limit'

const mockHeadersGet = jest.fn()
jest.mock('next/headers', () => ({
  headers: jest.fn(() =>
    Promise.resolve({
      get: (header: string) => mockHeadersGet(header),
    })
  ),
}))

const mockFrom = jest.fn()
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockIn = jest.fn()
const mockMaybeSingle = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    from: mockFrom,
  })),
}))

const mockNotFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}))

jest.mock('qrcode', () => ({
  default: {
    toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr'),
  },
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr'),
}))

describe('BookingVoucherPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    _resetRateLimitStore()
    mockHeadersGet.mockImplementation((header: string) => {
      if (header === 'x-forwarded-for') return '127.0.0.1'
      return null
    })
    mockFrom.mockImplementation(() => ({
      select: mockSelect,
    }))
    mockSelect.mockImplementation(() => ({
      eq: mockEq,
    }))
    mockEq.mockImplementation(() => ({
      in: mockIn,
    }))
    mockIn.mockImplementation(() => ({
      maybeSingle: mockMaybeSingle,
    }))
  })

  it('renders voucher for a confirmed booking', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        code: 'BKABC123',
        status: 'confirmed',
        check_in_date: '2026-10-01',
        check_out_date: '2026-10-03',
        nights_count: 2,
        guests_count: 2,
        total_amount: 2000000,
        guest_name: 'Nguyễn Văn A',
        guest_phone: '0901234567',
        rooms: {
          name: 'Phòng Sen',
          lots: { name: 'Vườn Trầm A', region: 'Miền Bắc' },
        },
      },
      error: null,
    })

    const element = await BookingVoucherPage({ params: Promise.resolve({ code: 'BKABC123', locale: 'vi' }) })
    renderWithIntl(element)

    expect(screen.getAllByText('BKABC123').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument()
    expect(screen.getByText('0901234567')).toBeInTheDocument()
    expect(screen.getByText('Phòng Sen')).toBeInTheDocument()
    expect(screen.getByText(/Vườn Trầm A/)).toBeInTheDocument()
    expect(screen.getByText(/2 đêm/)).toBeInTheDocument()
    expect(screen.getByText(/2 khách/)).toBeInTheDocument()
    expect(screen.getByText('2.000.000 ₫')).toBeInTheDocument()
    expect(screen.getByAltText('QR voucher BKABC123')).toHaveAttribute('src', 'data:image/png;base64,mock-qr')
  })

  it('calls notFound for invalid code format', async () => {
    await expect(BookingVoucherPage({ params: Promise.resolve({ code: 'INVALID', locale: 'vi' }) })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('calls notFound when booking not found', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    await expect(BookingVoucherPage({ params: Promise.resolve({ code: 'BKABC123', locale: 'vi' }) })).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('calls notFound when booking is not confirmed or completed', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    await expect(BookingVoucherPage({ params: Promise.resolve({ code: 'BKABC123', locale: 'vi' }) })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mockIn).toHaveBeenCalledWith('status', ['confirmed', 'completed'])
  })

  it('does not expose PII in HTML', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        code: 'BKABC123',
        status: 'confirmed',
        check_in_date: '2026-10-01',
        check_out_date: '2026-10-03',
        nights_count: 2,
        guests_count: 2,
        total_amount: 2000000,
        guest_name: 'Nguyễn Văn A',
        guest_phone: '0901234567',
        guest_email: 'secret@example.com',
        user_id: 'user-secret-uuid',
        payment_ref: 'cassoid-123',
        payment_claimed_at: '2026-09-07T00:00:00Z',
        cancellation_reason: 'none',
        rooms: { name: 'Phòng Sen', lots: { name: 'Vườn Trầm A', region: 'Miền Bắc' } },
      },
      error: null,
    })

    const element = await BookingVoucherPage({ params: Promise.resolve({ code: 'BKABC123', locale: 'vi' }) })
    const { container } = renderWithIntl(element)
    const html = container.innerHTML

    expect(html).not.toContain('secret@example.com')
    expect(html).not.toContain('user-secret-uuid')
    expect(html).not.toContain('cassoid-123')
    expect(html).not.toContain('payment_claimed')
    expect(html).not.toContain('cancellation_reason')
  })

  it('normalizes lowercase booking code and renders print button', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        code: 'BKABC123',
        status: 'confirmed',
        check_in_date: '2026-10-01',
        check_out_date: '2026-10-03',
        nights_count: 2,
        guests_count: 2,
        total_amount: 2000000,
        guest_name: 'Trần Thị B',
        guest_phone: '0912345678',
        rooms: {
          name: 'Phòng Mây',
          lots: { name: 'Vườn Trầm B', region: 'Tây Nguyên' },
        },
      },
      error: null,
    })

    const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {})

    const element = await BookingVoucherPage({ params: Promise.resolve({ code: 'bkabc123', locale: 'vi' }) })
    renderWithIntl(element)

    expect(mockEq).toHaveBeenCalledWith('code', 'BKABC123')
    const printButton = screen.getByRole('button', { name: /In vé \/ Lưu PDF/i })
    expect(printButton).toBeInTheDocument()
    expect(screen.getByText(/Hotline: 1900 8888/)).toBeInTheDocument()
    fireEvent.click(printButton)
    expect(printSpy).toHaveBeenCalled()

    printSpy.mockRestore()
  })

  it('renders rate-limit UI when exceeding request limit per IP without querying DB or crashing', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        code: 'BKABC123',
        status: 'confirmed',
        check_in_date: '2026-10-01',
        check_out_date: '2026-10-03',
        nights_count: 2,
        guests_count: 2,
        total_amount: 2000000,
        guest_name: 'Khách Test',
        guest_phone: '0901234567',
        rooms: { name: 'Phòng Sen', lots: { name: 'Vườn Trầm A', region: 'Miền Bắc' } },
      },
      error: null,
    })

    mockHeadersGet.mockImplementation((header: string) => {
      if (header === 'x-forwarded-for') return '192.168.1.100'
      return null
    })

    // Gửi 20 request hợp lệ (chạm quota)
    for (let i = 0; i < 20; i++) {
      const el = await BookingVoucherPage({ params: Promise.resolve({ code: 'BKABC123', locale: 'vi' }) })
      expect(el).toBeTruthy()
    }
    expect(mockFrom).toHaveBeenCalledTimes(20)

    // Request thứ 21 từ cùng IP bị rate-limit
    mockFrom.mockClear()
    const rateLimitedElement = await BookingVoucherPage({ params: Promise.resolve({ code: 'BKABC123', locale: 'vi' }) })
    renderWithIntl(rateLimitedElement)

    expect(screen.getByText('Quá nhiều yêu cầu')).toBeInTheDocument()
    expect(screen.getByText(/Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn/)).toBeInTheDocument()
    expect(screen.getByText(/Hotline: 1900 8888/)).toBeInTheDocument()
    // Không query DB thêm và không gọi notFound
    expect(mockFrom).not.toHaveBeenCalled()
    expect(mockNotFound).not.toHaveBeenCalled()
  })

  it('uses x-real-ip when x-forwarded-for is missing', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        code: 'BKABC123',
        status: 'confirmed',
        check_in_date: '2026-10-01',
        check_out_date: '2026-10-03',
        nights_count: 2,
        guests_count: 2,
        total_amount: 2000000,
        guest_name: 'Khách Real IP',
        guest_phone: '0901234567',
        rooms: { name: 'Phòng Sen', lots: { name: 'Vườn Trầm A', region: 'Miền Bắc' } },
      },
      error: null,
    })

    mockHeadersGet.mockImplementation((header: string) => {
      if (header === 'x-real-ip') return '10.0.0.5'
      return null
    })

    for (let i = 0; i < 20; i++) {
      await BookingVoucherPage({ params: Promise.resolve({ code: 'BKABC123', locale: 'vi' }) })
    }

    mockFrom.mockClear()
    const rlEl = await BookingVoucherPage({ params: Promise.resolve({ code: 'BKABC123', locale: 'vi' }) })
    renderWithIntl(rlEl)
    expect(screen.getByText('Quá nhiều yêu cầu')).toBeInTheDocument()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('generates metadata with dynamic booking code and noindex tags', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ code: 'bkabc123', locale: 'vi' }) })
    expect(meta.title).toBe('Vé đặt phòng BKABC123 - Đại Ngàn Xanh')
    expect(meta.robots).toEqual({ index: false, follow: false })
  })
})
