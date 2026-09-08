import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import BookingVoucherPage, { generateMetadata } from '../page'

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
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr'),
}))

describe('BookingVoucherPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

    const element = await BookingVoucherPage({ params: Promise.resolve({ code: 'BKABC123' }) })
    render(element)

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
    await expect(BookingVoucherPage({ params: Promise.resolve({ code: 'INVALID' }) })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('calls notFound when booking not found', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    await expect(BookingVoucherPage({ params: Promise.resolve({ code: 'BKABC123' }) })).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('calls notFound when booking is not confirmed or completed', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    await expect(BookingVoucherPage({ params: Promise.resolve({ code: 'BKABC123' }) })).rejects.toThrow('NEXT_NOT_FOUND')
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

    const element = await BookingVoucherPage({ params: Promise.resolve({ code: 'BKABC123' }) })
    const { container } = render(element)
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

    const element = await BookingVoucherPage({ params: Promise.resolve({ code: 'bkabc123' }) })
    render(element)

    expect(mockEq).toHaveBeenCalledWith('code', 'BKABC123')
    const printButton = screen.getByRole('button', { name: /In vé \/ Lưu PDF/i })
    expect(printButton).toBeInTheDocument()
    fireEvent.click(printButton)
    expect(printSpy).toHaveBeenCalled()

    printSpy.mockRestore()
  })

  it('generates metadata with dynamic booking code and noindex tags', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ code: 'bkabc123' }) })
    expect(meta.title).toBe('Vé đặt phòng BKABC123 - Đại Ngàn Xanh')
    expect(meta.robots).toEqual({ index: false, follow: false })
  })
})
