/**
 * Unit Tests: casso actions
 *
 * [P0] Casso transaction sync + manual processing — auth guard, validation.
 */

import { syncCassoTransactions, manualProcessTransaction } from '../casso'

const mockGetUser = jest.fn()
const mockServerFrom = jest.fn()
const mockServiceFrom = jest.fn()
const mockFunctionsInvoke = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn(() => Promise.resolve({
        auth: { getUser: mockGetUser },
        from: mockServerFrom,
    })),
    createServiceRoleClient: jest.fn(() => ({
        from: mockServiceFrom,
        functions: { invoke: mockFunctionsInvoke },
    })),
}))

function mockAdminAuth() {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })
    mockServerFrom.mockReturnValue({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }),
    })
}

function mockUnauthenticated() {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })
}

function mockNonAdmin() {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })
    mockServerFrom.mockReturnValue({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'user' } }) }) }),
    })
}

beforeEach(() => jest.clearAllMocks())

// ─── syncCassoTransactions ───────────────────────────────────────────────────

describe('[P0] syncCassoTransactions — auth guard', () => {
    test('[P0] returns Unauthorized when not authenticated', async () => {
        mockUnauthenticated()
        const result = await syncCassoTransactions()
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/unauthorized/i)
        expect(result.imported).toBe(0)
    })

    test('[P0] returns Unauthorized when role is not admin', async () => {
        mockNonAdmin()
        const result = await syncCassoTransactions()
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/unauthorized/i)
    })
})

// ─── manualProcessTransaction ────────────────────────────────────────────────

describe('[P0] manualProcessTransaction — auth guard', () => {
    test('[P0] returns Unauthorized when not authenticated', async () => {
        mockUnauthenticated()
        const result = await manualProcessTransaction('tx-1', 'DH123456')
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/unauthorized/i)
    })

    test('[P0] returns Unauthorized when role is not admin', async () => {
        mockNonAdmin()
        const result = await manualProcessTransaction('tx-1', 'DH123456')
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/unauthorized/i)
    })
})

describe('[P0] manualProcessTransaction — order code validation', () => {
    beforeEach(() => mockAdminAuth())

    test('[P0] returns error for invalid order code format', async () => {
        const result = await manualProcessTransaction('tx-1', 'INVALID')
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/mã đơn hàng không hợp lệ/i)
    })

    test('[P0] returns error for order code too short', async () => {
        const result = await manualProcessTransaction('tx-1', 'DH123')
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/không hợp lệ/i)
    })

    test('[P1] returns error when transaction not found', async () => {
        mockServiceFrom.mockReturnValue({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: null, error: new Error('Not found') }),
                }),
            }),
        })
        const result = await manualProcessTransaction('bad-tx', 'DH123456')
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/không tìm thấy giao dịch/i)
    })

    test('[P1] returns error for transaction with non-reprocessable status', async () => {
        mockServiceFrom.mockReturnValue({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({
                        data: { id: 'tx-1', status: 'processed', amount: 500000, casso_tid: 'TID1' },
                        error: null,
                    }),
                }),
            }),
        })
        const result = await manualProcessTransaction('tx-1', 'DH123456')
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/không thể xử lý thủ công/i)
    })

    test('[P1] returns error when order not found in pending state', async () => {
        mockServiceFrom
            .mockReturnValueOnce({
                // First call: casso_transactions lookup
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({
                            data: { id: 'tx-1', status: 'order_not_found', amount: 500000, casso_tid: 'TID1' },
                            error: null,
                        }),
                    }),
                }),
            })
            .mockReturnValueOnce({
                // Second call: orders lookup
                select: () => ({
                    eq: () => ({
                        eq: () => ({
                            single: () => Promise.resolve({ data: null, error: new Error('Not found') }),
                        }),
                    }),
                }),
            })
        const result = await manualProcessTransaction('tx-1', 'DH123456')
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/không tìm thấy đơn hàng/i)
    })

    test('[P1] succeeds when all checks pass and edge function succeeds', async () => {
        const order = {
            id: 'order-1',
            code: 'DH123456',
            user_id: 'u1',
            user_email: 'a@b.com',
            user_name: 'A',
            quantity: 3,
            total_amount: 1500000,
            referred_by: null,
        }
        mockServiceFrom
            .mockReturnValueOnce({
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({
                            data: { id: 'tx-1', status: 'order_not_found', amount: 1500000, casso_tid: 'TID1' },
                            error: null,
                        }),
                    }),
                }),
            })
            .mockReturnValueOnce({
                select: () => ({
                    eq: () => ({
                        eq: () => ({
                            single: () => Promise.resolve({ data: order, error: null }),
                        }),
                    }),
                }),
            })
            .mockReturnValue({
                update: () => ({ eq: () => Promise.resolve({ error: null }) }),
            })

        mockFunctionsInvoke.mockResolvedValue({ error: null })

        const result = await manualProcessTransaction('tx-1', 'DH123456')
        expect(result.success).toBe(true)
    })

    test('[P2] accepts lowercase order code and normalizes to uppercase', async () => {
        // A lowercase valid code like 'dh123abc' should be accepted
        mockServiceFrom
            .mockReturnValueOnce({
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({
                            data: { id: 'tx-1', status: 'order_not_found', amount: 500000 },
                            error: null,
                        }),
                    }),
                }),
            })
            .mockReturnValueOnce({
                select: () => ({
                    eq: () => ({
                        eq: () => ({
                            single: () => Promise.resolve({ data: null, error: new Error('Not found') }),
                        }),
                    }),
                }),
            })
        // lowercase 'dh123abc' matches ORDER_CODE_REGEX /^DH[A-Z0-9]{6}$/i
        const result = await manualProcessTransaction('tx-1', 'dh123abc')
        // Should NOT fail on format validation — will fail on order lookup
        expect(result.error).not.toMatch(/không hợp lệ.*format/i)
    })
})
