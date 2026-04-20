/**
 * @jest-environment node
 *
 * Unit Tests: POST /api/orders/cancel  (Story 5-5 + 5-7)
 *
 * P0 BLOCKER for production launch — financial flow with refund-state semantics.
 *
 * Architecture (updated Story 5-7):
 *   1. Auth guard (session user)
 *   2. Input validation
 *   3. Role lookup: from('users').select('role').eq('id', userId).single()
 *   4. If orderId provided: fetch order to check status
 *      - status === 'completed' + non-admin → 403
 *      - status === 'completed' + admin → update to 'cancelled_refunded' + audit log → 200
 *      - order not found → 404
 *   5. Regular cancel: from('orders').update({status:'cancelled'}).eq(user_id).eq(status=pending).eq(id|code).select('id')
 */
import { NextRequest } from 'next/server'
import { POST } from '../route'

jest.mock('@/lib/rate-limit', () => ({
    rateLimit: jest.fn(() => ({ ok: true, retryAfterSec: 0 })),
}))

jest.mock('@/lib/monitoring', () => ({
    captureError: jest.fn(),
    trackLatency: jest.fn(),
}))

const mockGetUser = jest.fn()
const mockServiceFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn(() => Promise.resolve({
        auth: { getUser: mockGetUser },
    })),
    createServiceRoleClient: jest.fn(() => ({
        from: mockServiceFrom,
    })),
}))

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/orders/cancel', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })
}

function mockAuthenticated(userId = 'user-1') {
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null })
}

function mockUnauthenticated() {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })
}

/**
 * Sets up the service client mock to handle the new multi-call pattern.
 *
 * Call order when orderId is provided:
 *   1. from('users').select('role').eq('id', userId).single() → role lookup
 *   2. from('orders').select('...').eq('id', orderId).single() → order status check
 *   3a. from('orders').update({status:'cancelled_refunded'}).eq(...) → admin refund
 *   3b. from('admin_audit_log').insert({...}) → audit log (non-blocking)
 *   OR
 *   3. from('orders').update({status:'cancelled'}).eq(user_id).eq(status).eq(id).select('id') → regular cancel
 */
function mockServiceCalls(opts: {
    role?: string
    existingOrder?: { id: string; code: string; total_amount: number; user_id: string; status: string } | null
    /**
     * Result of the admin refund UPDATE … RETURNING id.
     * Default: 1 row updated (success). Pass [] to simulate TOCTOU race (0 rows).
     */
    refundUpdateResult?: { data: Array<{ id: string }> | null; error: Error | null }
    /** Result of the regular pending-cancel UPDATE … RETURNING id. */
    cancelResult?: { data: Array<{ id: string }> | null; error: Error | null }
    refundError?: Error | null
    /** If set, makes admin_audit_log.insert resolve with { error } instead of throwing. */
    auditInsertError?: Error | null
}) {
    const {
        role = 'user',
        existingOrder = null,
        refundUpdateResult = { data: [{ id: 'updated' }], error: null },
        cancelResult = { data: [], error: null },
        refundError = null,
        auditInsertError = null,
    } = opts

    const eqCalls: Array<[string, unknown]> = []
    const auditInsertSpy = jest.fn(() => Promise.resolve({ error: auditInsertError }))

    function makeChain(finalResult: unknown) {
        const chain: Record<string, unknown> = {}
        chain.eq = jest.fn((col: string, val: unknown) => {
            eqCalls.push([col, val])
            return chain
        })
        chain.select = jest.fn(() => {
            // Make .select() chainable too — refund path does .eq().eq().select() then awaits.
            return Object.assign(Promise.resolve(finalResult), chain)
        })
        chain.single = jest.fn(() => Promise.resolve(finalResult))
        return chain
    }

    const userChain = makeChain({ data: { role }, error: null })
    const orderFetchChain = makeChain({ data: existingOrder, error: null })

    // Route only fetches the order (the SELECT) when caller is admin AND orderId is present.
    // For non-admin orderId callers, the only orders call is the regular cancel UPDATE.
    const adminPathTaken = ['admin', 'super_admin'].includes(role)
    let ordersCallCount = 0

    mockServiceFrom.mockImplementation((table: string) => {
        if (table === 'users') {
            return { select: jest.fn(() => userChain) }
        }
        if (table === 'admin_audit_log') {
            return { insert: auditInsertSpy }
        }
        if (table === 'orders') {
            ordersCallCount += 1
            if (adminPathTaken && ordersCallCount === 1) {
                // First orders call (admin only): select for status check
                return { select: jest.fn(() => orderFetchChain) }
            }
            // Otherwise: this is an UPDATE (refund or regular cancel)
            if (refundError) {
                const errChain = makeChain({ data: null, error: refundError })
                return { update: jest.fn(() => errChain) }
            }
            const useRefund = existingOrder?.status === 'completed' && adminPathTaken
            const result = useRefund ? refundUpdateResult : cancelResult
            const updateChain = makeChain(result)
            return { update: jest.fn(() => updateChain) }
        }
        return { from: jest.fn() }
    })

    return { eqCalls, auditInsertSpy }
}

/**
 * Simpler mock for orderCode path (no orderId → skips order fetch).
 * Sequence: users.role → orders.update chain
 */
function mockServiceCallsOrderCodePath(opts: {
    role?: string
    cancelResult: { data: Array<{ id: string }> | null; error: Error | null }
}) {
    const { role = 'user', cancelResult } = opts

    const eqCalls: Array<[string, unknown]> = []
    const updateSpy = jest.fn()

    const userSingleChain = { eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { role }, error: null }) }

    function makeUpdateChain() {
        const chain: Record<string, unknown> = {}
        chain.eq = jest.fn((col: string, val: unknown) => {
            eqCalls.push([col, val])
            return chain
        })
        chain.select = jest.fn(() => Promise.resolve(cancelResult))
        return chain
    }

    updateSpy.mockReturnValue(makeUpdateChain())

    mockServiceFrom.mockImplementation((table: string) => {
        if (table === 'users') return { select: jest.fn(() => userSingleChain) }
        return { update: updateSpy }
    })

    return { eqCalls, updateSpy }
}

beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
    jest.restoreAllMocks()
})

// ─── [P0] Auth guard ─────────────────────────────────────────────────────────

describe('[P0] POST /api/orders/cancel — auth guard', () => {
    test('[P0] returns 401 Unauthorized when no session', async () => {
        mockUnauthenticated()
        const res = await POST(makeRequest({ orderId: 'order-1' }))
        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body.error).toMatch(/unauthorized/i)
    })

    test('[P0] returns 401 when getUser returns an error', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('JWT expired') })
        const res = await POST(makeRequest({ orderId: 'order-1' }))
        expect(res.status).toBe(401)
    })

    test('[P0] does NOT touch the orders table when unauthenticated', async () => {
        mockUnauthenticated()
        await POST(makeRequest({ orderId: 'order-1' }))
        expect(mockServiceFrom).not.toHaveBeenCalled()
    })
})

// ─── [P0] Input validation ───────────────────────────────────────────────────

describe('[P0] POST /api/orders/cancel — input validation', () => {
    beforeEach(() => mockAuthenticated())

    test('[P0] returns 400 when neither orderId nor orderCode supplied', async () => {
        const res = await POST(makeRequest({}))
        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body.error).toMatch(/missing/i)
    })

    test('[P0] returns 400 when orderCode has invalid format', async () => {
        const res = await POST(makeRequest({ orderCode: 'INVALID' }))
        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body.error).toMatch(/invalid order code/i)
    })

    test('[P0] does NOT execute an update when validation fails', async () => {
        await POST(makeRequest({ orderCode: 'BAD' }))
        expect(mockServiceFrom).not.toHaveBeenCalled()
    })
})

// ─── [P0] Regular cancel: pending → cancelled ────────────────────────────────

describe('[P0] POST /api/orders/cancel — regular user cancels pending order', () => {
    beforeEach(() => mockAuthenticated('user-1'))

    test('[P0] succeeds for own pending order (orderId path)', async () => {
        mockServiceCalls({
            role: 'user',
            existingOrder: { id: 'order-1', code: 'DH123ABC', total_amount: 100, user_id: 'user-1', status: 'pending' },
            cancelResult: { data: [{ id: 'order-1' }], error: null },
        })

        const res = await POST(makeRequest({ orderId: 'order-1' }))
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toEqual({ success: true })
    })

    test('[P0] update query is constrained to status=pending', async () => {
        const { eqCalls } = mockServiceCalls({
            role: 'user',
            existingOrder: { id: 'order-1', code: 'DH123ABC', total_amount: 100, user_id: 'user-1', status: 'pending' },
            cancelResult: { data: [{ id: 'order-1' }], error: null },
        })

        await POST(makeRequest({ orderId: 'order-1' }))

        expect(eqCalls).toEqual(
            expect.arrayContaining([
                ['user_id', 'user-1'],
                ['status', 'pending'],
                ['id', 'order-1'],
            ]),
        )
    })

    test('[P0] returns 404 when no matching pending order', async () => {
        mockServiceCalls({
            role: 'user',
            existingOrder: { id: 'order-1', code: 'DH123ABC', total_amount: 100, user_id: 'user-1', status: 'pending' },
            cancelResult: { data: [], error: null },
        })

        const res = await POST(makeRequest({ orderId: 'order-1' }))
        expect(res.status).toBe(404)
        const body = await res.json()
        expect(body.error).toMatch(/không tìm thấy|đã xử lý/i)
    })

    test('[P0] returns 404 when orderId not found in DB', async () => {
        mockServiceCalls({
            role: 'user',
            existingOrder: null,
            cancelResult: { data: [], error: null },
        })

        const res = await POST(makeRequest({ orderId: 'nonexistent' }))
        expect(res.status).toBe(404)
    })
})

// ─── [P0] Admin refund: completed → cancelled_refunded ────────────────────────

describe('[P0] POST /api/orders/cancel — admin refunds completed order (Story 5-7)', () => {
    test('[P0] admin can cancel a completed order → returns refundStatus: manual_pending', async () => {
        mockAuthenticated('admin-1')
        mockServiceCalls({
            role: 'admin',
            existingOrder: { id: 'order-1', code: 'DH123ABC', total_amount: 500000, user_id: 'user-1', status: 'completed' },
        })

        const res = await POST(makeRequest({ orderId: 'order-1' }))
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toEqual({ success: true, refundStatus: 'manual_pending' })
    })

    test('[P0] super_admin can also refund completed orders', async () => {
        mockAuthenticated('admin-2')
        mockServiceCalls({
            role: 'super_admin',
            existingOrder: { id: 'order-2', code: 'DH999ZZZ', total_amount: 200000, user_id: 'user-2', status: 'completed' },
        })

        const res = await POST(makeRequest({ orderId: 'order-2' }))
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.refundStatus).toBe('manual_pending')
    })

    // P4 (oracle leak): non-admin must NOT receive 403 for completed orders —
    // doing so would let them probe which UUIDs map to other users' completed
    // orders. They should fall through to the user-scoped pending-cancel path
    // and receive 404, identical to a non-existent UUID.
    test('[P0] non-admin targeting a completed order falls through to 404 (no oracle leak)', async () => {
        mockAuthenticated('user-1')
        mockServiceCalls({
            role: 'user',
            existingOrder: { id: 'order-1', code: 'DH123ABC', total_amount: 100, user_id: 'user-1', status: 'completed' },
            cancelResult: { data: [], error: null },
        })

        const res = await POST(makeRequest({ orderId: 'order-1' }))
        expect(res.status).toBe(404)
        const body = await res.json()
        expect(body.error).toMatch(/không tìm thấy|đã xử lý/i)
    })

    test('[P0] customer role targeting a completed order also gets 404, not 403', async () => {
        mockAuthenticated('customer-1')
        mockServiceCalls({
            role: 'customer',
            existingOrder: { id: 'order-3', code: 'DH456DEF', total_amount: 300000, user_id: 'customer-1', status: 'completed' },
            cancelResult: { data: [], error: null },
        })

        const res = await POST(makeRequest({ orderId: 'order-3' }))
        expect(res.status).toBe(404)
    })

    // P1 (TOCTOU): UPDATE matching 0 rows because of a concurrent refund must
    // return 404, NOT a false success with a spurious audit log entry.
    test('[P0] TOCTOU: when refund UPDATE matches 0 rows (race lost), returns 404 and writes NO audit log', async () => {
        mockAuthenticated('admin-1')
        const { auditInsertSpy } = mockServiceCalls({
            role: 'admin',
            existingOrder: { id: 'order-1', code: 'DH123ABC', total_amount: 500000, user_id: 'user-1', status: 'completed' },
            refundUpdateResult: { data: [], error: null },
        })

        const res = await POST(makeRequest({ orderId: 'order-1' }))
        expect(res.status).toBe(404)
        const body = await res.json()
        expect(body).not.toHaveProperty('success', true)
        expect(auditInsertSpy).not.toHaveBeenCalled()
    })

    // P5 (audit log assertion): AC4 requires writing admin_audit_log with the
    // documented payload. Verify the call shape directly.
    test('[P0] writes admin_audit_log with action, target_id, and metadata on successful refund', async () => {
        mockAuthenticated('admin-1')
        const { auditInsertSpy } = mockServiceCalls({
            role: 'admin',
            existingOrder: { id: 'order-1', code: 'DH123ABC', total_amount: 500000, user_id: 'customer-1', status: 'completed' },
        })

        await POST(makeRequest({ orderId: 'order-1' }))

        expect(auditInsertSpy).toHaveBeenCalledTimes(1)
        expect(auditInsertSpy).toHaveBeenCalledWith({
            admin_id: 'admin-1',
            action: 'order_refund_initiated',
            target_id: 'order-1',
            metadata: {
                order_code: 'DH123ABC',
                amount: 500000,
                user_id: 'customer-1',
            },
        })
    })

    // P8 (non-blocking audit): audit log soft errors must NOT fail the request.
    test('[P0] audit log soft error does NOT fail the refund request', async () => {
        mockAuthenticated('admin-1')
        mockServiceCalls({
            role: 'admin',
            existingOrder: { id: 'order-1', code: 'DH123ABC', total_amount: 500000, user_id: 'customer-1', status: 'completed' },
            auditInsertError: new Error('FK violation: admin not in public.users'),
        })

        const res = await POST(makeRequest({ orderId: 'order-1' }))
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toEqual({ success: true, refundStatus: 'manual_pending' })
    })
})

// ─── [P0] Idempotency ────────────────────────────────────────────────────────

describe('[P0] POST /api/orders/cancel — idempotency (orderCode path)', () => {
    beforeEach(() => mockAuthenticated('user-1'))

    test('[P0] cancelling twice: second call is a safe 404', async () => {
        // 1st: success
        mockServiceCallsOrderCodePath({
            role: 'user',
            cancelResult: { data: [{ id: 'order-1' }], error: null },
        })
        const first = await POST(makeRequest({ orderCode: 'DH123ABC' }))
        expect(first.status).toBe(200)
        expect(await first.json()).toEqual({ success: true })

        // 2nd: order now cancelled → no pending rows → 404
        mockServiceCallsOrderCodePath({
            role: 'user',
            cancelResult: { data: [], error: null },
        })
        const second = await POST(makeRequest({ orderCode: 'DH123ABC' }))
        expect(second.status).toBe(404)
        const body = await second.json()
        expect(body.error).toMatch(/không tìm thấy|đã xử lý/i)
        expect(body).not.toHaveProperty('success', true)
    })
})

// ─── [P1] Ownership check ────────────────────────────────────────────────────

describe('[P1] POST /api/orders/cancel — ownership (orderCode path)', () => {
    test("[P1] update is scoped to caller's user_id (cannot cancel someone else's order)", async () => {
        mockAuthenticated('user-A')
        const { eqCalls } = mockServiceCallsOrderCodePath({
            role: 'user',
            cancelResult: { data: [], error: null },
        })

        const res = await POST(makeRequest({ orderCode: 'DH123ABC' }))

        expect(eqCalls).toContainEqual(['user_id', 'user-A'])
        expect(eqCalls).not.toContainEqual(['user_id', 'user-B'])
        expect(res.status).toBe(404)
    })
})

// ─── [P1] Error handling ─────────────────────────────────────────────────────

describe('[P1] POST /api/orders/cancel — error handling', () => {
    beforeEach(() => mockAuthenticated())

    test('[P1] returns 500 on DB failure during cancel', async () => {
        mockServiceCallsOrderCodePath({
            role: 'user',
            cancelResult: { data: null, error: new Error('connection reset') },
        })

        const res = await POST(makeRequest({ orderCode: 'DH123ABC' }))
        expect(res.status).toBe(500)
        const body = await res.json()
        expect(body.error).toMatch(/không thể hủy đơn hàng/i)
    })

    test('[P1] returns 500 when JSON body is malformed (catch block)', async () => {
        mockAuthenticated()
        const req = new NextRequest('http://localhost/api/orders/cancel', {
            method: 'POST',
            body: 'not-json',
            headers: { 'Content-Type': 'application/json' },
        })
        const res = await POST(req)
        expect(res.status).toBe(500)
        const body = await res.json()
        expect(body.error).toMatch(/internal/i)
    })
})

// ─── [P2] orderCode lookup path ──────────────────────────────────────────────

describe('[P2] POST /api/orders/cancel — orderCode lookup branch', () => {
    beforeEach(() => mockAuthenticated('user-1'))

    test('[P2] uses code filter when only orderCode is supplied', async () => {
        const { eqCalls } = mockServiceCallsOrderCodePath({
            role: 'user',
            cancelResult: { data: [{ id: 'order-1' }], error: null },
        })

        const res = await POST(makeRequest({ orderCode: 'DH123ABC' }))
        expect(res.status).toBe(200)
        expect(eqCalls).toContainEqual(['code', 'DH123ABC'])
    })

    test('[P2] accepts lowercase order codes (regex is case-insensitive)', async () => {
        mockServiceCallsOrderCodePath({
            role: 'user',
            cancelResult: { data: [{ id: 'order-1' }], error: null },
        })
        const res = await POST(makeRequest({ orderCode: 'dh123abc' }))
        expect(res.status).toBe(200)
    })

    // P6 (regression guard): when both orderId and orderCode are supplied,
    // the route prefers orderId and never filters on `code`.
    test('[P2] prefers orderId over orderCode when both supplied', async () => {
        const { eqCalls } = mockServiceCalls({
            role: 'user',
            existingOrder: { id: 'order-1', code: 'DH123ABC', total_amount: 100, user_id: 'user-1', status: 'pending' },
            cancelResult: { data: [{ id: 'order-1' }], error: null },
        })

        await POST(makeRequest({ orderId: 'order-1', orderCode: 'DH123ABC' }))

        expect(eqCalls).toContainEqual(['id', 'order-1'])
        expect(eqCalls).not.toContainEqual(['code', 'DH123ABC'])
    })
})
