/**
 * Unit Tests: adminRooms.ts
 */

import { blockRoomForMaintenance, unblockRoom, fetchRoomCalendarData } from '../adminRooms'

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

    const result = await blockRoomForMaintenance('r1', '2026-09-01', '2026-09-02', '')
    expect(result.error).toBe('Vui lòng nhập lý do khóa phòng')
  })

  it('blockRoomForMaintenance rejects non-admin user', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom.mockReturnValueOnce(makeQueryChain({ data: { role: 'user' }, error: null }))

    const result = await blockRoomForMaintenance('r1', '2026-09-01', '2026-09-02', 'Sửa chữa')
    expect(result.error).toBe('Forbidden: admin role required')
  })

  it('blockRoomForMaintenance rejects room in maintenance status', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: { id: 'r1', status: 'maintenance', name: 'Room A' }, error: null }))

    const result = await blockRoomForMaintenance('r1', '2026-09-01', '2026-09-05', 'Sửa chữa')
    expect(result.error).toBe('Phòng đang ở trạng thái bảo trì vĩnh viễn')
  })

  it('blockRoomForMaintenance rejects overlapping booking', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: { id: 'r1', status: 'active', name: 'Room A' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({
        data: [{ id: 'b1', room_id: 'r1', check_in_date: '2026-09-01', check_out_date: '2026-09-03', status: 'confirmed', expires_at: null }],
        error: null
      }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))

    const result = await blockRoomForMaintenance('r1', '2026-09-01', '2026-09-05', 'Sửa chữa')
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

    const result = await blockRoomForMaintenance('r1', '2026-09-10', '2026-09-15', 'Sửa chữa')
    expect(result.error).toBeUndefined()
    expect(result.blockId).toBe('rb1')
  })

  it('unblockRoom deletes existing block', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    const deleteChain = makeQueryChain({ data: [{ id: 'rb1' }], error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(deleteChain)

    const result = await unblockRoom('11111111-1111-1111-1111-111111111111')
    expect(result.error).toBeUndefined()
  })

  it('unblockRoom returns error when block not found', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))

    const result = await unblockRoom('22222222-2222-2222-2222-222222222222')
    expect(result.error).toBe('Block không tồn tại hoặc đã bị xóa')
  })

  it('fetchRoomCalendarData returns lots with rooms', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [{ id: 'l1', name: 'Ba Vì', region: 'MB' }], error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [{ id: 'r1', name: 'Deluxe', status: 'active', lot_id: 'l1' }], error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))

    const result = await fetchRoomCalendarData('2026-09-01', '2026-09-30')
    expect(result.error).toBeUndefined()
    expect(result.lots).toHaveLength(1)
    expect(result.lots[0].rooms[0].name).toBe('Deluxe')
  })
})
