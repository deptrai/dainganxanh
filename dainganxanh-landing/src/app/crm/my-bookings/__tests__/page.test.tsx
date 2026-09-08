/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import MyBookingsPage from '../page'

jest.mock('next/navigation', () => ({
  redirect: jest.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`)
  }),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/crm/my-bookings',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/lib/getImpersonationContext', () => ({
  getImpersonationContext: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}))

import { getImpersonationContext } from '@/lib/getImpersonationContext'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

describe('MyBookingsPage', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  }

  const mockBooking = {
    id: 'b-1',
    code: 'BKABC123',
    check_in_date: '2026-09-10',
    check_out_date: '2026-09-12',
    guests_count: 2,
    nights_count: 2,
    total_amount: 2400000,
    payment_method: 'banking',
    status: 'confirmed',
    special_requests: null,
    cancellation_reason: null,
    expires_at: null,
    created_at: '2026-09-07T10:00:00Z',
    rooms: { name: 'Deluxe', lots: { name: 'Ba Vì', region: 'Miền Bắc', description: 'Vườn đẹp' } },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it('redirects to login when not authenticated', async () => {
    ;(getImpersonationContext as jest.Mock).mockResolvedValue(null)
    await expect(MyBookingsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      'NEXT_REDIRECT: /login?redirect=/crm/my-bookings'
    )
    expect(redirect).toHaveBeenCalledWith('/login?redirect=/crm/my-bookings')
  })

  it('renders bookings list', async () => {
    ;(getImpersonationContext as jest.Mock).mockResolvedValue({
      effectiveUserId: 'user-123',
      isImpersonating: false,
    })
    mockSupabase.range.mockResolvedValue({
      data: [mockBooking],
      error: null,
      count: 1,
    })

    const Page = await MyBookingsPage({ searchParams: Promise.resolve({}) })
    render(Page)
    expect(screen.getByText('Lịch sử đặt phòng')).toBeInTheDocument()
    expect(screen.getAllByText('BKABC123').length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state when no bookings', async () => {
    ;(getImpersonationContext as jest.Mock).mockResolvedValue({
      effectiveUserId: 'user-123',
      isImpersonating: false,
    })
    mockSupabase.range.mockResolvedValue({ data: [], error: null, count: 0 })

    const Page = await MyBookingsPage({ searchParams: Promise.resolve({}) })
    render(Page)
    expect(screen.getByText(/Bạn chưa có đặt phòng nào/i)).toBeInTheDocument()
  })

  it('shows cancelled banner when cancelled=1', async () => {
    ;(getImpersonationContext as jest.Mock).mockResolvedValue({
      effectiveUserId: 'user-123',
      isImpersonating: false,
    })
    mockSupabase.range.mockResolvedValue({ data: [], error: null, count: 0 })

    const Page = await MyBookingsPage({ searchParams: Promise.resolve({ cancelled: '1' }) })
    render(Page)
    expect(screen.getByText(/Đã hủy đặt phòng thành công/i)).toBeInTheDocument()
  })

  it('returns error UI on database error', async () => {
    ;(getImpersonationContext as jest.Mock).mockResolvedValue({
      effectiveUserId: 'user-123',
      isImpersonating: false,
    })
    mockSupabase.range.mockResolvedValue({ data: null, error: { message: 'DB fail' }, count: null })

    const Page = await MyBookingsPage({ searchParams: Promise.resolve({}) })
    render(Page)
    expect(screen.getByText(/Không thể tải danh sách đặt phòng/i)).toBeInTheDocument()
  })
})
