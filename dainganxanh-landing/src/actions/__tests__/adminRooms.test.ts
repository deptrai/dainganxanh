/**
 * Unit Tests: adminRooms.ts
 */

import { blockRoomForMaintenance, unblockRoom, fetchRoomCalendarData, getAssignedLotIds, moveBooking } from '../adminRooms'

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

jest.mock('@/lib/eco-tourism/availability', () => ({
  isBookingBlocking: jest.fn((b: any) => b.status === 'confirmed' || b.status === 'pending' || b.status === 'completed'),
  RoomBooking: {},
}))

function makeQueryChain(resolveValue: any) {
  const chain: any = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    neq: jest.fn(() => chain),
    gte: jest.fn(() => chain),
    lte: jest.fn(() => chain),
    lt: jest.fn(() => chain),
    gt: jest.fn(() => chain),
    in: jest.fn(() => chain),
    or: jest.fn(() => chain),
    ilike: jest.fn(() => chain),
    not: jest.fn(() => chain),
    order: jest.fn(() => chain),
    range: jest.fn(() => chain),
    limit: jest.fn(() => Promise.resolve(resolveValue)),
    single: jest.fn(() => Promise.resolve(resolveValue)),
    insert: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    update: jest.fn(() => chain),
    then: (resolve: any, reject: any) => Promise.resolve(resolveValue).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(resolveValue).catch(reject),
  }
  return chain
}

describe('adminRooms', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockReset()
    mockServiceFrom.mockReset()
  })

  it('blockRoomForMaintenance rejects invalid date format', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom.mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))

    const result = await blockRoomForMaintenance('r1', '2099-09-01', '2099-09-02', '')
    expect(result.error).toBe('Vui lòng nhập lý do khóa phòng')
  })

  it('blockRoomForMaintenance rejects non-admin user', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom.mockReturnValueOnce(makeQueryChain({ data: { role: 'user' }, error: null }))

    const result = await blockRoomForMaintenance('r1', '2099-09-01', '2099-09-02', 'Sửa chữa')
    expect(result.error).toBe('Forbidden: admin role required')
  })

  it('blockRoomForMaintenance rejects room in maintenance status', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: { id: 'r1', status: 'maintenance', name: 'Room A' }, error: null }))

    const result = await blockRoomForMaintenance('r1', '2099-09-01', '2099-09-05', 'Sửa chữa')
    expect(result.error).toBe('Phòng đang ở trạng thái bảo trì vĩnh viễn')
  })

  it('blockRoomForMaintenance rejects overlapping booking', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: { id: 'r1', status: 'active', name: 'Room A' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({
        data: [{ id: 'b1', room_id: 'r1', check_in_date: '2099-09-01', check_out_date: '2099-09-03', status: 'confirmed', expires_at: null }],
        error: null
      }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))

    const result = await blockRoomForMaintenance('r1', '2099-09-01', '2099-09-05', 'Sửa chữa')
    expect(result.error).toBe('Phòng có đơn đặt đang hoạt động trong khoảng thời gian này')
  })

  it('blockRoomForMaintenance inserts block when valid', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    const insertChain = makeQueryChain({ data: { id: 'rb1' }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: { id: 'r1', status: 'active', name: 'Room A' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))
      .mockReturnValueOnce(insertChain)

    const result = await blockRoomForMaintenance('r1', '2099-09-10', '2099-09-15', 'Sửa chữa')
    expect(result.error).toBeUndefined()
    expect(result.blockId).toBe('rb1')
  })

  it('unblockRoom deletes existing block', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    const deleteChain = makeQueryChain({ data: [{ id: 'rb1' }], error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: { id: 'rb1', room_id: 'r1', rooms: { lot_id: 'l1' } }, error: null }))
      .mockReturnValueOnce(deleteChain)

    const result = await unblockRoom('11111111-1111-1111-1111-111111111111')
    expect(result.error).toBeUndefined()
  })

  it('unblockRoom returns error when block not found', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: null, error: null }))

    const result = await unblockRoom('22222222-2222-2222-2222-222222222222')
    expect(result.error).toBe('Block không tồn tại hoặc đã bị xóa')
  })

  it('fetchRoomCalendarData returns lots with rooms', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [{ id: 'l1', name: 'Ba Vì', region: 'MB' }], error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [{ id: 'r1', name: 'Deluxe', status: 'active', lot_id: 'l1', translations: { en: { name: 'Deluxe Room' } } }], error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))

    const result = await fetchRoomCalendarData('2099-09-01', '2099-09-30')
    expect(result.error).toBeUndefined()
    expect(result.lots).toHaveLength(1)
    expect(result.lots[0].rooms[0].name).toBe('Deluxe')
    expect(result.lots[0].rooms[0].translations).toEqual({ en: { name: 'Deluxe Room' } })
  })

  it('getAssignedLotIds returns lot_id array for resort_manager', async () => {
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({
        data: [{ lot_id: 'lot-1' }, { lot_id: 'lot-2' }],
        error: null,
      })
    )

    const lots = await getAssignedLotIds('user-mgr-1')
    expect(lots).toEqual(['lot-1', 'lot-2'])
  })

  it('getAssignedLotIds returns empty array on error', async () => {
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({
        data: null,
        error: { message: 'Database error' },
      })
    )

    const lots = await getAssignedLotIds('user-mgr-1')
    expect(lots).toEqual([])
  })

  describe('moveBooking', () => {
    const validBookingId = '11111111-1111-1111-1111-111111111111'
    const validTargetRoomId = '22222222-2222-2222-2222-222222222222'

    it('rejects unauthenticated user', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
      const result = await moveBooking({ bookingId: validBookingId, newRoomId: validTargetRoomId })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('rejects invalid UUID bookingId', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
      mockServiceFrom.mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))

      const result = await moveBooking({ bookingId: 'invalid-uuid', newRoomId: validTargetRoomId })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Mã đơn đặt phòng không hợp lệ')
    })

    it('rejects missing booking', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
      mockServiceFrom
        .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
        .mockReturnValueOnce(makeQueryChain({ data: null, error: null }))

      const result = await moveBooking({ bookingId: validBookingId, newRoomId: validTargetRoomId })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Không tìm thấy đơn đặt phòng')
    })

    it('rejects moving a cancelled booking', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
      mockServiceFrom
        .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
        .mockReturnValueOnce(makeQueryChain({
          data: {
            id: validBookingId,
            room_id: '33333333-3333-3333-3333-333333333333',
            check_in_date: '2026-10-10',
            check_out_date: '2026-10-12',
            status: 'cancelled',
            rooms: { lot_id: 'l1' }
          },
          error: null
        }))

      const result = await moveBooking({ bookingId: validBookingId, newRoomId: validTargetRoomId })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Không thể di chuyển đơn đặt phòng đã hủy hoặc hết hạn')
    })

    it('rejects when target room has overlapping active booking', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
      mockServiceFrom
        .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
        .mockReturnValueOnce(makeQueryChain({
          data: {
            id: validBookingId,
            room_id: '33333333-3333-3333-3333-333333333333',
            check_in_date: '2026-10-10',
            check_out_date: '2026-10-12',
            status: 'confirmed',
            rooms: { lot_id: 'l1' }
          },
          error: null
        }))
        // room info
        .mockReturnValueOnce(makeQueryChain({ data: { id: validTargetRoomId, status: 'active', lot_id: 'l1' }, error: null }))
        // overlapping blocks (none)
        .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))
        // overlapping bookings (has one)
        .mockReturnValueOnce(makeQueryChain({
          data: [{ id: '44444444-4444-4444-4444-444444444444', room_id: validTargetRoomId, status: 'confirmed' }],
          error: null
        }))

      const result = await moveBooking({ bookingId: validBookingId, newRoomId: validTargetRoomId })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Phòng đã có khách đặt hoặc đang giữ chỗ trong khoảng thời gian này')
    })

    it('successfully moves booking to new room', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
      mockServiceFrom
        .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
        .mockReturnValueOnce(makeQueryChain({
          data: {
            id: validBookingId,
            room_id: '33333333-3333-3333-3333-333333333333',
            check_in_date: '2026-10-10',
            check_out_date: '2026-10-12',
            status: 'confirmed',
            rooms: { lot_id: 'l1' }
          },
          error: null
        }))
        // room info
        .mockReturnValueOnce(makeQueryChain({ data: { id: validTargetRoomId, status: 'active', lot_id: 'l1' }, error: null }))
        // overlapping blocks
        .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))
        // overlapping bookings
        .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))
        // update query
        .mockReturnValueOnce(makeQueryChain({ data: { id: validBookingId, room_id: validTargetRoomId }, error: null }))

      const result = await moveBooking({ bookingId: validBookingId, newRoomId: validTargetRoomId })
      expect(result.success).toBe(true)
      expect(mockRevalidatePath).toHaveBeenCalledWith('/crm/admin/rooms')
    })
  })
})
