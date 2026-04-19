/**
 * @jest-environment node
 *
 * Unit Tests: POST /api/orders/cancel  (Story 5-5 — order cancellation)
 *
 * P0 BLOCKER for production launch — financial flow with refund-state semantics.
 * Cancellation is gated by RLS-equivalent filters (user_id + status='pending')
 * applied inside a single UPDATE … RETURNING; idempotency, ownership and the
 * state-transition rule (only pending → cancelled) are therefore enforced by
 * the database query itself.
 */
import { NextRequest } from 'next/server'
import { POST } from '../route'

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
 * Builds the chained mock for:
 *   .from('orders').update(...).eq(user_id).eq(status).eq(id|code).select('id')
 * Captures the arguments passed to update + each eq for assertion.
 */
function mockOrdersUpdateChain(opts: {
    selectResult: { data: Array<{ id: string }> | null; error: Error | null }
}) {
    const updateSpy = jest.fn()
    const eqCalls: Array<[string, unknown]> = []
    const selectSpy = jest.fn(() => Promise.resolve(opts.selectResult))

    const chain: Record<string, unknown> = {
        eq: jest.fn((col: string, val: unknown) => {
            eqCalls.push([col, val])
            return chain
        }),
        select: selectSpy,
    }
    updateSpy.mockReturnValue(chain)
    mockServiceFrom.mockReturnValue({ update: updateSpy })

    return { updateSpy, eqCalls, selectSpy }
}

beforeEach(() => {
    jest.clearAllMocks()
    // Silence expected console.error noise from the route's catch blocks
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

// ─── [P0] State transition: only pending → cancelled ─────────────────────────

describe('[P0] POST /api/orders/cancel — state transition guard', () => {
    beforeEach(() => mockAuthenticated('user-1'))

    test('[P0] update query is constrained to status=pending (blocks completed/cancelled)', async () => {
        const { eqCalls, updateSpy } = mockOrdersUpdateChain({
            selectResult: { data: [{ id: 'order-1' }], error: null },
        })

        await POST(makeRequest({ orderId: 'order-1' }))

        expect(updateSpy).toHaveBeenCalledWith({ status: 'cancelled' })
        // The route MUST filter by status='pending' so a completed/cancelled order
        // is invisible to the UPDATE and produces zero rows ≡ a 404.
        expect(eqCalls).toEqual(
            expect.arrayContaining([
                ['user_id', 'user-1'],
                ['status', 'pending'],
                ['id', 'order-1'],
            ]),
        )
    })

    test('[P0] returns 404 when order is NOT in pending state (e.g. already completed)', async () => {
        // Simulating: order exists but status != 'pending', so UPDATE … RETURNING
        // yields zero rows.
        mockOrdersUpdateChain({ selectResult: { data: [], error: null } })

        const res = await POST(makeRequest({ orderId: 'order-completed' }))
        expect(res.status).toBe(404)
        const body = await res.json()
        expect(body.error).toMatch(/không tìm thấy|đã xử lý/i)
    })

    test('[P0] succeeds when order is pending', async () => {
        mockOrdersUpdateChain({
            selectResult: { data: [{ id: 'order-1' }], error: null },
        })

        const res = await POST(makeRequest({ orderId: 'order-1' }))
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toEqual({ success: true })
    })
})

// ─── [P0] Idempotency ────────────────────────────────────────────────────────

describe('[P0] POST /api/orders/cancel — idempotency', () => {
    beforeEach(() => mockAuthenticated('user-1'))

    test('[P0] cancelling twice does not double-process; second call is a safe 404', async () => {
        // 1st call: order is pending → success.
        mockOrdersUpdateChain({
            selectResult: { data: [{ id: 'order-1' }], error: null },
        })
        const first = await POST(makeRequest({ orderId: 'order-1' }))
        expect(first.status).toBe(200)
        expect(await first.json()).toEqual({ success: true })

        // 2nd call: same order, but now its status='cancelled', so the
        // pending-status filter excludes it → empty result set → 404.
        mockOrdersUpdateChain({ selectResult: { data: [], error: null } })
        const second = await POST(makeRequest({ orderId: 'order-1' }))
        expect(second.status).toBe(404)
        const body = await second.json()
        expect(body.error).toMatch(/không tìm thấy|đã xử lý/i)
        // Critically, success:true is NOT returned the second time.
        expect(body).not.toHaveProperty('success', true)
    })
})

// ─── [P1] Ownership check ────────────────────────────────────────────────────

describe('[P1] POST /api/orders/cancel — ownership', () => {
    test("[P1] update query is scoped to the caller's user_id (cannot cancel someone else's order)", async () => {
        mockAuthenticated('user-A')
        const { eqCalls } = mockOrdersUpdateChain({
            selectResult: { data: [], error: null },
        })

        const res = await POST(makeRequest({ orderId: 'order-belongs-to-user-B' }))

        // The UPDATE is filtered by user_id = current caller, so a foreign
        // order yields zero rows → 404 (no privilege escalation).
        expect(eqCalls).toContainEqual(['user_id', 'user-A'])
        expect(eqCalls).not.toContainEqual(['user_id', 'user-B'])
        expect(res.status).toBe(404)
    })
})

// ─── [P1] Order not found / DB error paths ───────────────────────────────────

describe('[P1] POST /api/orders/cancel — not found & error handling', () => {
    beforeEach(() => mockAuthenticated())

    test('[P1] returns 404 with Vietnamese error when no matching pending order', async () => {
        mockOrdersUpdateChain({ selectResult: { data: null, error: null } })

        const res = await POST(makeRequest({ orderCode: 'DH123ABC' }))
        expect(res.status).toBe(404)
        const body = await res.json()
        expect(body.error).toMatch(/không tìm thấy|đã xử lý/i)
    })

    test('[P1] returns 500 with Vietnamese error on DB failure (does not throw)', async () => {
        mockOrdersUpdateChain({
            selectResult: { data: null, error: new Error('connection reset') },
        })

        const res = await POST(makeRequest({ orderId: 'order-1' }))
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
        const { eqCalls } = mockOrdersUpdateChain({
            selectResult: { data: [{ id: 'order-1' }], error: null },
        })

        const res = await POST(makeRequest({ orderCode: 'DH123ABC' }))
        expect(res.status).toBe(200)
        expect(eqCalls).toContainEqual(['code', 'DH123ABC'])
        expect(eqCalls).not.toContainEqual(expect.arrayContaining(['id']))
    })

    test('[P2] accepts lowercase order codes (regex is case-insensitive)', async () => {
        mockOrdersUpdateChain({
            selectResult: { data: [{ id: 'order-1' }], error: null },
        })
        const res = await POST(makeRequest({ orderCode: 'dh123abc' }))
        expect(res.status).toBe(200)
    })

    test('[P2] prefers orderId over orderCode when both supplied', async () => {
        const { eqCalls } = mockOrdersUpdateChain({
            selectResult: { data: [{ id: 'order-1' }], error: null },
        })
        await POST(makeRequest({ orderId: 'order-1', orderCode: 'DH123ABC' }))
        expect(eqCalls).toContainEqual(['id', 'order-1'])
        expect(eqCalls).not.toContainEqual(['code', 'DH123ABC'])
    })
})
