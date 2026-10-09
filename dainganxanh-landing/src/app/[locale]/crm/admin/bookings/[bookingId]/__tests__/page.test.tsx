/**
 * @jest-environment jsdom
 *
 * Unit Tests: AdminBookingDetailPage (TD-10)
 * Kiểm tra phân quyền truy cập chi tiết booking:
 * - admin / super_admin có toàn quyền (admin_full)
 * - resort_manager chỉ được xem booking thuộc lô được phân công (admin_user_lots)
 * - Không có quyền -> gọi notFound() (chuẩn 404)
 */

import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AdminBookingDetailPage from '../page'
import { notFound } from 'next/navigation'
import { redirect } from '@/i18n/navigation'
import { getAssignedLotIds } from '@/actions/adminRooms'

jest.mock('@/i18n/navigation', () => ({
  redirect: jest.fn().mockImplementation((target: any) => {
    const url = typeof target === 'string' ? target : target.href
    throw new Error(`NEXT_REDIRECT: ${url}`)
  }),
  Link: ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/crm/admin/bookings/b-100',
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`)
  }),
  notFound: jest.fn().mockImplementation(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

const mockGetUser = jest.fn()
const mockServiceFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() =>
    Promise.resolve({ auth: { getUser: mockGetUser } })
  ),
  createServiceRoleClient: jest.fn(() => ({ from: mockServiceFrom })),
}))

jest.mock('@/actions/adminRooms', () => ({
  getAssignedLotIds: jest.fn(),
}))

jest.mock('@/components/admin/AdminBookingDetailClient', () => {
  const Mock = ({ booking }: { booking: Record<string, unknown> }) => (
    <div data-testid="admin-booking-detail-client">
      <span>{booking.code as string}</span>
      <span>{booking.guestName as string}</span>
      <span>{booking.lotId as string}</span>
    </div>
  )
  return { __esModule: true, default: Mock }
})

function makeQueryChain(resolveValue: unknown) {
  const chain: Record<string, unknown> = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    single: jest.fn(() => Promise.resolve(resolveValue)),
    then: (resolve: (v: unknown) => unknown, reject: (v: unknown) => unknown) =>
      Promise.resolve(resolveValue).then(resolve, reject),
    catch: (reject: (v: unknown) => unknown) =>
      Promise.resolve(resolveValue).catch(reject),
  }
  return chain
}

describe('AdminBookingDetailPage — Phân quyền theo lô (TD-10)', () => {
  const mockBooking = {
    id: 'b-100',
    code: 'BK-100',
    room_id: 'room-1',
    guest_name: 'Trần Văn B',
    guest_phone: '0987654321',
    guest_email: 'b@example.com',
    check_in_date: '2026-10-10',
    check_out_date: '2026-10-12',
    guests_count: 2,
    nights_count: 2,
    total_amount: 3000000,
    payment_method: 'banking',
    status: 'pending',
    special_requests: null,
    cancellation_reason: null,
    expires_at: '2026-10-10T12:00:00Z',
    created_at: '2026-10-08T10:00:00Z',
    updated_at: '2026-10-08T10:00:00Z',
    rooms: {
      name: 'Phòng VIP 1',
      lot_id: 'lot-alpha',
      lots: { name: 'Khu A', region: 'Miền Trung', description: 'Vườn sinh thái' },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('chuyển hướng về login khi người dùng chưa đăng nhập', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('No user') })

    await expect(
      AdminBookingDetailPage({ params: Promise.resolve({ bookingId: 'b-100', locale: 'vi' }) })
    ).rejects.toThrow('NEXT_REDIRECT: /auth/login')
    expect(redirect).toHaveBeenCalledWith(
      expect.objectContaining({ href: '/auth/login' })
    )
  })

  it('chuyển hướng về my-bookings khi người dùng không có vai trò admin/manager', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-regular' } }, error: null })
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: { role: 'user' }, error: null })
    )

    await expect(
      AdminBookingDetailPage({ params: Promise.resolve({ bookingId: 'b-100', locale: 'vi' }) })
    ).rejects.toThrow('NEXT_REDIRECT: /crm/my-bookings')
    expect(redirect).toHaveBeenCalledWith(
      expect.objectContaining({ href: '/crm/my-bookings' })
    )
  })

  it('gọi notFound() khi không tìm thấy booking trong cơ sở dữ liệu', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } }, error: null })
    // Profile query
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: { role: 'admin' }, error: null })
    )
    // Booking query (không tìm thấy)
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: null, error: { message: 'Not found' } })
    )

    await expect(
      AdminBookingDetailPage({ params: Promise.resolve({ bookingId: 'b-999', locale: 'vi' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('cho phép admin_full (admin) xem booking mà không bị giới hạn lô', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } }, error: null })
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: { role: 'admin' }, error: null })
    )
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: mockBooking, error: null })
    )

    const Page = await AdminBookingDetailPage({ params: Promise.resolve({ bookingId: 'b-100', locale: 'vi' }) })
    renderWithIntl(Page)

    expect(screen.getByText('BK-100')).toBeInTheDocument()
    expect(screen.getByText('Trần Văn B')).toBeInTheDocument()
    expect(screen.getByText('lot-alpha')).toBeInTheDocument()
    expect(getAssignedLotIds).not.toHaveBeenCalled()
  })

  it('cho phép admin_full (super_admin) xem booking mà không bị giới hạn lô', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'super-admin-1' } }, error: null })
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: { role: 'super_admin' }, error: null })
    )
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: mockBooking, error: null })
    )

    const Page = await AdminBookingDetailPage({ params: Promise.resolve({ bookingId: 'b-100', locale: 'vi' }) })
    renderWithIntl(Page)

    expect(screen.getByText('BK-100')).toBeInTheDocument()
    expect(getAssignedLotIds).not.toHaveBeenCalled()
  })

  it('cho phép resort_manager xem booking khi thuộc lô được phân công', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'manager-1' } }, error: null })
    // Profile query
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: { role: 'resort_manager' }, error: null })
    )
    // Booking query
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: mockBooking, error: null })
    )
    // Assigned lots query: quản lý lô 'lot-alpha'
    ;(getAssignedLotIds as jest.Mock).mockResolvedValueOnce(['lot-alpha', 'lot-beta'])

    const Page = await AdminBookingDetailPage({ params: Promise.resolve({ bookingId: 'b-100', locale: 'vi' }) })
    renderWithIntl(Page)

    expect(screen.getByText('BK-100')).toBeInTheDocument()
    expect(screen.getByText('lot-alpha')).toBeInTheDocument()
    expect(getAssignedLotIds).toHaveBeenCalledWith('manager-1')
  })

  it('gọi notFound() khi resort_manager cố xem booking KHÔNG thuộc lô được phân công', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'manager-1' } }, error: null })
    // Profile query
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: { role: 'resort_manager' }, error: null })
    )
    // Booking query: thuộc lô 'lot-alpha'
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: mockBooking, error: null })
    )
    // Assigned lots query: chỉ quản lý 'lot-gamma', không có 'lot-alpha'
    ;(getAssignedLotIds as jest.Mock).mockResolvedValueOnce(['lot-gamma'])

    await expect(
      AdminBookingDetailPage({ params: Promise.resolve({ bookingId: 'b-100', locale: 'vi' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalled()
    expect(getAssignedLotIds).toHaveBeenCalledWith('manager-1')
  })

  it('gọi notFound() khi resort_manager xem booking mà room không có lot_id', async () => {
    const bookingWithoutLot = {
      ...mockBooking,
      rooms: { name: 'Phòng không lô', lot_id: null, lots: null },
    }

    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'manager-1' } }, error: null })
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: { role: 'resort_manager' }, error: null })
    )
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: bookingWithoutLot, error: null })
    )
    ;(getAssignedLotIds as jest.Mock).mockResolvedValueOnce(['lot-alpha'])

    await expect(
      AdminBookingDetailPage({ params: Promise.resolve({ bookingId: 'b-100', locale: 'vi' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalled()
  })
})
