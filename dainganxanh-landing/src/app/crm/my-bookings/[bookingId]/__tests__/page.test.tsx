/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import BookingDetailPage from '../page'

jest.mock('next/navigation', () => ({
  redirect: jest.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`)
  }),
  notFound: jest.fn().mockImplementation(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/crm/my-bookings/b-1',
}))

jest.mock('@/lib/getImpersonationContext', () => ({
  getImpersonationContext: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}))

jest.mock('@/components/crm/BookingDetail', () => {
  const Mock = ({ booking }: { booking: Record<string, unknown> }) => (
    <div data-testid="booking-detail-mock">
      <span>{booking.code as string}</span>
      <span>{booking.guestName as string}</span>
      <span>{booking.specialRequests as string}</span>
      <span>{booking.lotId as string}</span>
    </div>
  )
  return { __esModule: true, default: Mock, BookingDetail: Mock }
})

import { getImpersonationContext } from '@/lib/getImpersonationContext'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

describe('BookingDetailPage', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  }

  const mockBooking = {
    id: 'b-1',
    code: 'BKABC123',
    room_id: 'room-1',
    guest_name: 'Nguyen Van A',
    guest_phone: '0901234567',
    guest_email: 'test@example.com',
    check_in_date: '2026-09-10',
    check_out_date: '2026-09-12',
    guests_count: 2,
    nights_count: 2,
    total_amount: 2400000,
    payment_method: 'banking',
    status: 'confirmed',
    special_requests: 'View vườn',
    cancellation_reason: null,
    expires_at: null,
    created_at: '2026-09-07T10:00:00Z',
    rooms: { name: 'Deluxe', lot_id: 'lot-1' },
    lots: { name: 'Ba Vì', region: 'Miền Bắc', description: 'Vườn đẹp' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it('redirects to login when not authenticated', async () => {
    ;(getImpersonationContext as jest.Mock).mockResolvedValue(null)
    await expect(BookingDetailPage({ params: Promise.resolve({ bookingId: 'b-1' }) })).rejects.toThrow(
      'NEXT_REDIRECT: /login?redirect=%2Fcrm%2Fmy-bookings%2Fb-1'
    )
    expect(redirect).toHaveBeenCalledWith('/login?redirect=%2Fcrm%2Fmy-bookings%2Fb-1')
  })

  it('renders booking details', async () => {
    ;(getImpersonationContext as jest.Mock).mockResolvedValue({
      effectiveUserId: 'user-123',
      isImpersonating: false,
    })
    mockSupabase.single.mockResolvedValue({ data: mockBooking, error: null })

    const Page = await BookingDetailPage({ params: Promise.resolve({ bookingId: 'b-1' }) })
    render(Page)
    expect(screen.getByText('BKABC123')).toBeInTheDocument()
    expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
    expect(screen.getByText('View vườn')).toBeInTheDocument()
    expect(screen.getByText('lot-1')).toBeInTheDocument()
  })

  it('returns 404 when booking not found or belongs to another user', async () => {
    ;(getImpersonationContext as jest.Mock).mockResolvedValue({
      effectiveUserId: 'user-123',
      isImpersonating: false,
    })
    mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

    await expect(BookingDetailPage({ params: Promise.resolve({ bookingId: 'b-2' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    )
    expect(notFound).toHaveBeenCalled()
  })
})
