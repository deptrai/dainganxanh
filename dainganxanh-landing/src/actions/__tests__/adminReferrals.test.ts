/**
 * Unit Tests: adminReferrals.ts (fetchAdminReferrals)
 *
 * Covers: happy path aggregation, commission calculation (10%),
 *         available_balance = commission - withdrawn, empty orders,
 *         DB errors from each of the 3 queries.
 */

import { fetchAdminReferrals } from '../adminReferrals'

// ── Mock state ───────────────────────────────────────────────────────────────

const mockServiceFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({ from: mockServiceFrom })),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOrdersChain(data: any[], error: any = null) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data, error }),
  }
}

function makeUsersChain(data: any[], error: any = null) {
  return {
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockResolvedValue({ data, error }),
  }
}

function makeWithdrawalsChain(data: any[], error: any = null) {
  return {
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data, error }),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('fetchAdminReferrals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('[P0] returns aggregated referrer summaries on happy path', async () => {
    const orders = [
      {
        id: 'o1', code: 'DH001', referred_by: 'ref1',
        total_amount: 1_000_000, quantity: 1,
        created_at: '2025-01-01', user_email: 'buyer@test.com',
        user_name: 'Buyer', user_id: 'u1',
      },
    ]
    const users = [{ id: 'ref1', email: 'referrer@test.com', full_name: 'Ref User', referral_code: 'REF1' }]
    const withdrawals: any[] = []

    mockServiceFrom
      .mockReturnValueOnce(makeOrdersChain(orders))
      .mockReturnValueOnce(makeUsersChain(users))
      .mockReturnValueOnce(makeWithdrawalsChain(withdrawals))

    const result = await fetchAdminReferrals()

    expect(result.error).toBeUndefined()
    expect(result.data).toHaveLength(1)
    const summary = result.data[0]
    expect(summary.user_id).toBe('ref1')
    expect(summary.email).toBe('referrer@test.com')
    expect(summary.total_orders).toBe(1)
    expect(summary.total_sales).toBe(1_000_000)
    expect(summary.total_commission).toBe(100_000) // 10%
    expect(summary.total_withdrawn).toBe(0)
    expect(summary.available_balance).toBe(100_000)
  })

  it('[P1] calculates available_balance as commission minus withdrawals', async () => {
    const orders = [
      {
        id: 'o1', code: 'DH001', referred_by: 'ref1',
        total_amount: 2_000_000, quantity: 2,
        created_at: '2025-01-01', user_email: 'buyer@test.com',
        user_name: null, user_id: 'u1',
      },
    ]
    const users = [{ id: 'ref1', email: 'ref@test.com', full_name: null, referral_code: 'REF2' }]
    const withdrawals = [{ user_id: 'ref1', amount: 150_000 }]

    mockServiceFrom
      .mockReturnValueOnce(makeOrdersChain(orders))
      .mockReturnValueOnce(makeUsersChain(users))
      .mockReturnValueOnce(makeWithdrawalsChain(withdrawals))

    const result = await fetchAdminReferrals()
    const summary = result.data[0]
    expect(summary.total_commission).toBe(200_000) // 10% of 2M
    expect(summary.total_withdrawn).toBe(150_000)
    expect(summary.available_balance).toBe(50_000)
  })

  it('[P1] aggregates multiple orders per referrer', async () => {
    const orders = [
      { id: 'o1', code: 'DH001', referred_by: 'ref1', total_amount: 500_000, quantity: 1, created_at: '2025-01-01', user_email: 'a@test.com', user_name: 'A', user_id: 'u1' },
      { id: 'o2', code: 'DH002', referred_by: 'ref1', total_amount: 500_000, quantity: 1, created_at: '2025-01-02', user_email: 'b@test.com', user_name: 'B', user_id: 'u2' },
    ]
    const users = [{ id: 'ref1', email: 'ref@test.com', full_name: 'Ref', referral_code: 'REF3' }]

    mockServiceFrom
      .mockReturnValueOnce(makeOrdersChain(orders))
      .mockReturnValueOnce(makeUsersChain(users))
      .mockReturnValueOnce(makeWithdrawalsChain([]))

    const result = await fetchAdminReferrals()
    const summary = result.data[0]
    expect(summary.total_orders).toBe(2)
    expect(summary.total_sales).toBe(1_000_000)
    expect(summary.total_commission).toBe(100_000)
    expect(summary.orders).toHaveLength(2)
  })

  it('[P1] returns empty data when no completed referral orders exist', async () => {
    mockServiceFrom.mockReturnValueOnce(makeOrdersChain([]))

    const result = await fetchAdminReferrals()
    expect(result.data).toHaveLength(0)
    expect(result.error).toBeUndefined()
  })

  it('[P0] returns error on orders DB failure', async () => {
    mockServiceFrom.mockReturnValueOnce(makeOrdersChain(null as any, { message: 'DB error' }))

    const result = await fetchAdminReferrals()
    expect(result.error).toBeDefined()
    expect(result.data).toHaveLength(0)
  })

  it('[P0] returns error on users DB failure', async () => {
    const orders = [
      { id: 'o1', code: 'DH001', referred_by: 'ref1', total_amount: 500_000, quantity: 1, created_at: '2025-01-01', user_email: 'a@test.com', user_name: null, user_id: 'u1' },
    ]
    mockServiceFrom
      .mockReturnValueOnce(makeOrdersChain(orders))
      .mockReturnValueOnce(makeUsersChain(null as any, { message: 'Users error' }))

    const result = await fetchAdminReferrals()
    expect(result.error).toBeDefined()
  })

  it('[P0] returns error on withdrawals DB failure', async () => {
    const orders = [
      { id: 'o1', code: 'DH001', referred_by: 'ref1', total_amount: 500_000, quantity: 1, created_at: '2025-01-01', user_email: 'a@test.com', user_name: null, user_id: 'u1' },
    ]
    const users = [{ id: 'ref1', email: 'ref@test.com', full_name: null, referral_code: null }]

    mockServiceFrom
      .mockReturnValueOnce(makeOrdersChain(orders))
      .mockReturnValueOnce(makeUsersChain(users))
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Withdraw error' } }),
      })

    const result = await fetchAdminReferrals()
    expect(result.error).toBeDefined()
  })

  it('[P2] sorts results by commission descending', async () => {
    const orders = [
      { id: 'o1', code: 'DH001', referred_by: 'ref1', total_amount: 500_000, quantity: 1, created_at: '2025-01-01', user_email: 'a@test.com', user_name: null, user_id: 'u1' },
      { id: 'o2', code: 'DH002', referred_by: 'ref2', total_amount: 2_000_000, quantity: 1, created_at: '2025-01-02', user_email: 'b@test.com', user_name: null, user_id: 'u2' },
    ]
    const users = [
      { id: 'ref1', email: 'low@test.com', full_name: null, referral_code: 'R1' },
      { id: 'ref2', email: 'high@test.com', full_name: null, referral_code: 'R2' },
    ]

    mockServiceFrom
      .mockReturnValueOnce(makeOrdersChain(orders))
      .mockReturnValueOnce(makeUsersChain(users))
      .mockReturnValueOnce(makeWithdrawalsChain([]))

    const result = await fetchAdminReferrals()
    expect(result.data[0].email).toBe('high@test.com') // 200k commission first
    expect(result.data[1].email).toBe('low@test.com')
  })
})
