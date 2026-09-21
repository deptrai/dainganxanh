/**
 * Unit Tests: adminBookings.ts
 */

import { fetchAdminBookings, confirmBooking, adminCancelBooking } from '../adminBookings'

const mockServiceFrom = jest.fn()
const mockServerFrom = jest.fn()
const mockGetUser = jest.fn()
const mockRevalidatePath = jest.fn()

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
  revalidatePath: jest.fn((...args: any[]) => mockRevalidatePath(...args)),
}))

jest.mock('@/lib/monitoring', () => ({
  captureError: jest.fn(),
}))

function makeQueryChain(resolveValue: any) {
  const chain: any = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    neq: jest.fn(() => chain),
    gte: jest.fn(() => chain),
    lte: jest.fn(() => chain),
    in: jest.fn(() => chain),
    or: jest.fn(() => chain),
    ilike: jest.fn(() => chain),
    not: jest.fn(() => chain),
    order: jest.fn(() => chain),
    range: jest.fn(() => chain),
    limit: jest.fn(() => Promise.resolve(resolveValue)),
    single: jest.fn(() => Promise.resolve(resolveValue)),
    update: jest.fn(() => chain),
    then: (resolve: any, reject: any) => Promise.resolve(resolveValue).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(resolveValue).catch(reject),
  }
  return chain
}

// Helper to capture the data passed to .update()
function makeUpdateChain(updateResult: any) {
  const calls: any[] = []
  const chain: any = {
    eq: jest.fn(() => chain),
    in: jest.fn(() => chain),
    select: jest.fn(() => chain),
    update: jest.fn((data: any) => { calls.push(data); return chain }),
    then: (resolve: any) => Promise.resolve(updateResult).then(resolve),
    _updateCalls: calls,
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

  it('returns forbidden when resort_manager has no lot assignment', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'resort_manager' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))
    const result = await fetchAdminBookings({}, 1, 20)
    expect(result.error).toBe('Forbidden: resort_manager requires lot assignment')
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

  it('applies status and lotId filters and pagination', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ count: 1, data: null, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))

    await fetchAdminBookings({ status: 'pending', lotId: 'l1', search: 'BK1', dateFrom: '2026-09-01', dateTo: '2026-09-30' }, 2, 20)
    const countQuery = mockServiceFrom.mock.results[1].value
    const dataQuery = mockServiceFrom.mock.results[2].value
    expect(countQuery.eq).toHaveBeenCalledWith('status', 'pending')
    expect(countQuery.eq).toHaveBeenCalledWith('rooms.lot_id', 'l1')
    expect(dataQuery.range).toHaveBeenCalledWith(20, 39)
  })

  it('escapes search metacharacters before building or filter', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ count: 0, data: null, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))

    await fetchAdminBookings({ search: 'a,b.c' }, 1, 20)
    const countQuery = mockServiceFrom.mock.results[1].value
    const orCall = countQuery.or.mock.calls[0][0]
    expect(orCall).toContain('ab')
    expect(orCall).not.toContain('a,b')
  })

  it('confirmBooking rejects non-pending booking', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: { id: 'b1', status: 'cancelled', room_id: 'r1', expires_at: null, check_in_date: '2026-09-15', check_out_date: '2026-09-16', code: 'BK1' }, error: null }))

    const result = await confirmBooking('b1')
    expect(result.error).toBe('Chỉ có thể xác nhận đơn đang chờ thanh toán')
  })

  it('confirmBooking rejects expired booking', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: { id: 'b1', status: 'pending', room_id: 'r1', expires_at: '2020-01-01T00:00:00Z', check_in_date: '2026-09-15', check_out_date: '2026-09-16', code: 'BK1' }, error: null }))

    const result = await confirmBooking('b1')
    expect(result.error).toContain('hết hạn')
  })

  it('adminCancelBooking rejects empty reason', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: { id: 'b1', status: 'pending', room_id: 'r1', code: 'BK1' }, error: null }))

    const result = await adminCancelBooking('b1', '   ')
    expect(result.error).toBe('Vui lòng nhập lý do hủy đặt phòng')
  })

  it('adminCancelBooking rejects non-pending/confirmed', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: { id: 'b1', status: 'completed', room_id: 'r1', code: 'BK1' }, error: null }))

    const result = await adminCancelBooking('b1', 'No show')
    expect(result.error).toBe('Chỉ có thể hủy đơn đang chờ hoặc đã xác nhận')
  })
})
