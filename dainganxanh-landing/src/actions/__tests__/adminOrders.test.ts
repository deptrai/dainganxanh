/**
 * Unit Tests: adminOrders.ts (fetchAdminOrders, verifyAdminOrder)
 *
 * Covers: service-role bypass, email search, pagination, user enrichment,
 *         referrer enrichment, error handling, verifyAdminOrder happy/error.
 */

import { fetchAdminOrders, verifyAdminOrder } from '../adminOrders'

// ── Mock state ───────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * A query chain that:
 * - Returns itself for all builder methods (select/eq/gte/lte/in/or/ilike/order/range)
 * - Is thenable: `await chain` resolves to `resolveValue`
 */
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
    // Thenable — allows `await chain` to work
    then: (resolve: any, reject: any) =>
      Promise.resolve(resolveValue).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(resolveValue).catch(reject),
  }
  return chain
}

// ── fetchAdminOrders ──────────────────────────────────────────────────────────

describe('fetchAdminOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('[P1] returns orders with user enrichment on happy path', async () => {
    const mockOrders = [
      { id: 'o1', user_id: 'u1', referred_by: null, status: 'completed' },
    ]
    const mockUsers = [
      { id: 'u1', email: 'buyer@test.com', phone: '0901', referral_code: null },
    ]

    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ count: 1, data: null, error: null })) // count
      .mockReturnValueOnce(makeQueryChain({ data: mockOrders, error: null }))     // data
      .mockReturnValueOnce(makeQueryChain({ data: mockUsers, error: null }))      // users

    const result = await fetchAdminOrders({}, 1, 10)

    expect(result.totalCount).toBe(1)
    expect(result.orders).toHaveLength(1)
    expect(result.orders[0].user_email).toBe('buyer@test.com')
    expect(result.error).toBeUndefined()
  })

  it('[P1] enriches referrer info when referred_by is set', async () => {
    const mockOrders = [
      { id: 'o1', user_id: 'u1', referred_by: 'ref1', status: 'completed' },
    ]
    const mockUsers = [
      { id: 'u1', email: 'buyer@test.com', phone: '0901', referral_code: null },
      { id: 'ref1', email: 'referrer@test.com', phone: '0902', referral_code: 'REF123' },
    ]

    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ count: 1, data: null, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: mockOrders, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: mockUsers, error: null }))

    const result = await fetchAdminOrders({}, 1, 10)

    expect(result.orders[0].referrer).toEqual({
      email: 'referrer@test.com',
      referral_code: 'REF123',
    })
  })

  it('[P1] filters by status when provided', async () => {
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ count: 0, data: null, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))
      // No users call when data is empty

    const result = await fetchAdminOrders({ status: 'pending' }, 1, 10)
    expect(result.totalCount).toBe(0)
    expect(result.orders).toHaveLength(0)
  })

  it('[P1] searches by email when search contains @', async () => {
    // email search → users.ilike → then count + data
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: [{ id: 'u1' }], error: null }))   // email search
      .mockReturnValueOnce(makeQueryChain({ count: 1, data: null, error: null }))   // count
      .mockReturnValueOnce(makeQueryChain({ data: [{ id: 'o1', user_id: 'u1', referred_by: null }], error: null })) // data
      .mockReturnValueOnce(makeQueryChain({ data: [{ id: 'u1', email: 'test@test.com', phone: null, referral_code: null }], error: null })) // users

    const result = await fetchAdminOrders({ search: 'test@test.com' }, 1, 10)
    expect(result.orders).toHaveLength(1)
  })

  it('[P1] returns empty orders when email search finds no matching users', async () => {
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))              // email search → empty
      .mockReturnValueOnce(makeQueryChain({ count: 0, data: null, error: null })) // count
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))              // data

    const result = await fetchAdminOrders({ search: 'ghost@test.com' }, 1, 10)
    expect(result.orders).toHaveLength(0)
    expect(result.totalCount).toBe(0)
  })

  it('[P0] returns error on DB failure in data query', async () => {
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ count: 0, data: null, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: null, error: { message: 'DB error' } }))

    const result = await fetchAdminOrders({}, 1, 10)
    expect(result.error).toBeDefined()
    expect(result.orders).toHaveLength(0)
  })

  it('[P2] skips user lookup when no orders returned', async () => {
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ count: 0, data: null, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))

    const result = await fetchAdminOrders({}, 1, 10)
    expect(result.orders).toHaveLength(0)
    // mockServiceFrom called only twice — no user lookup
    expect(mockServiceFrom).toHaveBeenCalledTimes(2)
  })

  it('[P1] handles dateFrom and dateTo filters', async () => {
    mockServiceFrom
      .mockReturnValueOnce(makeQueryChain({ count: 0, data: null, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: [], error: null }))

    const result = await fetchAdminOrders(
      { dateFrom: '2025-01-01', dateTo: '2025-12-31' },
      1,
      10
    )
    expect(result.error).toBeUndefined()
  })
})

// ── verifyAdminOrder ──────────────────────────────────────────────────────────

describe('verifyAdminOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })
  })

  it('[P0] returns empty object on success', async () => {
    const updateChain: any = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    }
    mockServerFrom.mockReturnValue(updateChain)

    const result = await verifyAdminOrder('order-123')
    expect(result).toEqual({})
    expect(result.error).toBeUndefined()
  })

  it('[P0] returns error message on DB failure', async () => {
    const updateChain: any = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
    }
    mockServerFrom.mockReturnValue(updateChain)

    const result = await verifyAdminOrder('order-bad')
    expect(result.error).toBe('Update failed')
  })
})
