import { render, screen } from '@testing-library/react'
import BookingSuccessPage from '../page'
import { redirect } from 'next/navigation'

const mockMaybeSingle = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()
const mockFrom = jest.fn()

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
  }),
}))

describe('BookingSuccessPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })
  })

  it('redirects if code is missing', async () => {
    const params = Promise.resolve({ lotId: 'lot-1' })
    const searchParams = Promise.resolve({})

    await BookingSuccessPage({ params, searchParams })
    expect(redirect).toHaveBeenCalledWith('/eco-tourism/lot-1')
  })

  it('redirects if booking not found', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const params = Promise.resolve({ lotId: 'lot-1' })
    const searchParams = Promise.resolve({ code: 'BKUNKNOWN' })

    await BookingSuccessPage({ params, searchParams })
    expect(redirect).toHaveBeenCalledWith('/eco-tourism/lot-1')
  })

  it('redirects if booking is not confirmed or completed', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'b1',
        code: 'BKABC123',
        status: 'pending',
        check_in_date: '2026-10-01',
        check_out_date: '2026-10-03',
        nights_count: 2,
        guests_count: 2,
        total_amount: 2400000,
        guest_name: 'Nguyễn Văn A',
        guest_phone: '0901234567',
        rooms: { name: 'Phòng Sen', lot_id: 'lot-1', lots: { name: 'Vườn Trầm A', region: 'Miền Bắc' } },
      },
      error: null,
    })
    const params = Promise.resolve({ lotId: 'lot-1' })
    const searchParams = Promise.resolve({ code: 'BKABC123' })

    await BookingSuccessPage({ params, searchParams })
    expect(redirect).toHaveBeenCalledWith('/eco-tourism/lot-1')
  })

  it('renders booking details when booking is found', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'b1',
        code: 'BKABC123',
        status: 'confirmed',
        check_in_date: '2026-10-01',
        check_out_date: '2026-10-03',
        nights_count: 2,
        guests_count: 2,
        total_amount: 2400000,
        guest_name: 'Nguyễn Văn A',
        guest_phone: '0901234567',
        rooms: {
          name: 'Phòng Sen',
          lot_id: 'lot-1',
          lots: { name: 'Vườn Trầm A', region: 'Miền Bắc' },
        },
      },
      error: null,
    })

    const params = Promise.resolve({ lotId: 'lot-1' })
    const searchParams = Promise.resolve({ code: 'BKABC123' })

    const element = await BookingSuccessPage({ params, searchParams })
    render(element as React.ReactElement)

    expect(screen.getByText('Đặt phòng thành công!')).toBeInTheDocument()
    expect(screen.getByText('BKABC123')).toBeInTheDocument()
    expect(screen.getByText('Phòng Sen')).toBeInTheDocument()
    expect(screen.getByText('2.400.000 ₫')).toBeInTheDocument()
    expect(screen.getByText('0901234567')).toBeInTheDocument()

    const voucherCta = screen.getByRole('link', { name: /Xem vé offline/i })
    expect(voucherCta).toHaveAttribute('href', '/eco-tourism/voucher/BKABC123')
    expect(voucherCta).toHaveAttribute('target', '_blank')
  })
})
