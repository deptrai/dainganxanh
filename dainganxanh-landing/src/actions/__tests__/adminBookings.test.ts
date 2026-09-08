/**
 * Unit Tests: adminBookings.ts (fetchAdminBookings, fetchAdminBookingDetail, confirmBooking, adminCancelBooking)
 */

import { fetchAdminBookings, fetchAdminBookingDetail, confirmBooking, adminCancelBooking } from '../adminBookings'

const mockServiceFrom = jest.fn()
const mockServerFrom = jest.fn()
const mockGetUser = jest.fn()

const mockServerClient = {
  auth: { getUser: mockGetUser },
  from: mockServerFrom,
}

const mockServiceClient = {
  from: mockServiceFrom,
}

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => Promise.resolve(mockServerClient)),
  createServiceRoleClient: jest.fn(() => mockServiceClient),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/monitoring', () => ({
  captureError: jest.fn(),
}))

function makeQueryChain(resolveValue: any) {
  const chain: any = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    gte: jest.fn(() => chain),
    lte: jest.fn(() => chain),
    in: jest.fn(() => chain),
    or: jest.fn(() => chain),
    ilike: jest.fn(() => chain),
    not: jest.fn(() => chain),
    order: jest.fn(() => chain),
    range: jest.fn(() => chain),
    single: jest.fn(() => Promise.resolve(resolveValue)),
    update: jest.fn(() => chain),
    then: (resolve: any, reject: any) => Promise.resolve(resolveValue).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(resolveValue).catch(reject),
  }
  return chain
}

describe('adminBookings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns unauthorized when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await fetchAdminBookings({}, 1, 20)
    expect(result.error).toBe('Unauthorized')
    expect(result.bookings).toHaveLength(0)
  })

  it('returns forbidden when user lacks admin role', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom.mockReturnValueOnce(makeQueryChain({ data: { role: 'user' }, error: null }))
    const result = await fetchAdminBookings({}, 1, 20)
    expect(result.error).toBe('Forbidden: admin role required')
  })

  it('returns bookings for admin role', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ count: 1, data: null, error: null }))
      .mockReturnValueOnce(makeQueryChain({
        data: [{
          id: 'b1', code: 'BK1', guest_name: 'Test', guest_phone: '090',
          check_in_date: '2026-09-15', check_out_date: '2026-09-16',
          guests_count: 2, total_amount: 1000000, status: 'pending',
          rooms: { name: 'Deluxe', lot_id: 'l1', lots: { name: 'Ba Vì', region: 'MB', description: 'desc' } }
        }],
        error: null
      }))

    const result = await fetchAdminBookings({}, 1, 20)
    expect(result.error).toBeUndefined()
    expect(result.totalCount).toBe(1)
    expect(result.bookings[0].code).toBe('BK1')
    expect(result.bookings[0].lotName).toBe('Ba Vì')
  })

  it('fetchAdminBookingDetail returns booking detail', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({
        data: {
          id: 'b1', code: 'BK1', guest_name: 'Test', guest_phone: '090',
          check_in_date: '2026-09-15', check_out_date: '2026-09-16',
          guests_count: 2, total_amount: 1000000, status: 'pending',
          rooms: { name: 'Deluxe', lot_id: 'l1', lots: { name: 'Ba Vì', region: 'MB', description: 'desc' } }
        },
        error: null
      }))

    const result = await fetchAdminBookingDetail('b1')
    expect(result.error).toBeUndefined()
    expect(result.booking.code).toBe('BK1')
    expect(result.booking.lotName).toBe('Ba Vì')
  })

  it('confirmBooking updates pending booking', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: { id: 'b1', status: 'pending' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [{ id: 'b1' }], error: null }))

    const result = await confirmBooking('b1')
    expect(result.error).toBeUndefined()
  })

  it('adminCancelBooking updates pending booking', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: { id: 'b1', status: 'pending' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [{ id: 'b1' }], error: null }))

    const result = await adminCancelBooking('b1', 'No room available')
    expect(result.error).toBeUndefined()
  })

  it('adminCancelBooking rejects non-pending/confirmed', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: { id: 'b1', status: 'cancelled' }, error: null }))

    const result = await adminCancelBooking('b1')
    expect(result.error).toBe('Chỉ có thể hủy đơn đang chờ hoặc đã xác nhận')
  })
})
