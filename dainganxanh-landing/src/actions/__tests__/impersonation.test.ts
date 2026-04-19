/**
 * Unit Tests: impersonation
 *
 * [P0] Admin impersonation — security-critical privilege escalation feature.
 * Covers: auth guard, role guard, self-impersonation prevention, target existence,
 * super_admin-only guard for privileged targets, audit logging, cookie state.
 *
 * Mock strategy: mock @/lib/supabase/server (createServerClient + createServiceRoleClient)
 * and next/headers (cookies()).
 */

import { startImpersonation, stopImpersonation } from '../impersonation'

// ── Supabase mocks ───────────────────────────────────────────────────────────

const mockGetUser = jest.fn()
const mockServerFrom = jest.fn()

const mockAuditInsert = jest.fn().mockResolvedValue({ error: null })
const mockTargetSingle = jest.fn()
const mockServiceFrom = jest.fn((table: string) => {
    if (table === 'admin_audit_log') {
        return { insert: mockAuditInsert }
    }
    return {
        select: () => ({
            eq: () => ({
                single: mockTargetSingle,
            }),
        }),
    }
})

jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn(() =>
        Promise.resolve({
            auth: { getUser: mockGetUser },
            from: mockServerFrom,
        })
    ),
    createServiceRoleClient: jest.fn(() => ({
        from: mockServiceFrom,
    })),
}))

// ── next/headers cookies() mock ──────────────────────────────────────────────

const mockCookieSet = jest.fn()
const mockCookieDelete = jest.fn()
const mockCookieGet = jest.fn()

jest.mock('next/headers', () => ({
    cookies: jest.fn(() =>
        Promise.resolve({
            get: mockCookieGet,
            set: mockCookieSet,
            delete: mockCookieDelete,
        })
    ),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockUnauthenticated() {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })
}

function mockCallerWithRole(role: string, callerId = 'admin-id') {
    mockGetUser.mockResolvedValue({ data: { user: { id: callerId } }, error: null })
    mockServerFrom.mockReturnValue({
        select: () => ({
            eq: () => ({
                single: () => Promise.resolve({ data: { role } }),
            }),
        }),
    })
}

function mockTargetUser(targetData: { id: string; role?: string } | null) {
    mockTargetSingle.mockResolvedValue({ data: targetData })
}

beforeEach(() => {
    jest.clearAllMocks()
    mockAuditInsert.mockResolvedValue({ error: null })
    mockCookieGet.mockReturnValue(undefined)
})

// ── startImpersonation ───────────────────────────────────────────────────────

describe('[P0] startImpersonation — auth guard', () => {
    test('[P0] returns Unauthorized when caller is not authenticated', async () => {
        mockUnauthenticated()
        const result = await startImpersonation('target-id')
        expect(result.error).toMatch(/unauthorized/i)
        expect(mockCookieSet).not.toHaveBeenCalled()
        expect(mockAuditInsert).not.toHaveBeenCalled()
    })

    test('[P0] returns Unauthorized when caller has no profile row', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'ghost-id' } }, error: null })
        mockServerFrom.mockReturnValue({
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
        })
        const result = await startImpersonation('target-id')
        expect(result.error).toMatch(/unauthorized/i)
        expect(mockCookieSet).not.toHaveBeenCalled()
    })
})

describe('[P0] startImpersonation — role guard', () => {
    test('[P0] rejects non-admin (customer) caller', async () => {
        mockCallerWithRole('customer', 'user-id')
        const result = await startImpersonation('target-id')
        expect(result.error).toMatch(/admin role required/i)
        expect(mockCookieSet).not.toHaveBeenCalled()
        expect(mockAuditInsert).not.toHaveBeenCalled()
    })

    test('[P0] rejects "user" role caller', async () => {
        mockCallerWithRole('user', 'user-id')
        const result = await startImpersonation('target-id')
        expect(result.error).toMatch(/admin role required/i)
    })

    test('[P0] allows admin caller to impersonate a non-privileged target', async () => {
        mockCallerWithRole('admin', 'admin-id')
        mockTargetUser({ id: 'target-id', role: 'customer' })
        const result = await startImpersonation('target-id')
        expect(result.error).toBeUndefined()
        expect(mockCookieSet).toHaveBeenCalledTimes(1)
    })

    test('[P0] allows super_admin caller to impersonate a non-privileged target', async () => {
        mockCallerWithRole('super_admin', 'sadmin-id')
        mockTargetUser({ id: 'target-id', role: 'customer' })
        const result = await startImpersonation('target-id')
        expect(result.error).toBeUndefined()
        expect(mockCookieSet).toHaveBeenCalledTimes(1)
    })
})

describe('[P1] startImpersonation — target validation', () => {
    test('[P1] returns "User not found" when target user does not exist', async () => {
        mockCallerWithRole('admin', 'admin-id')
        mockTargetUser(null)
        const result = await startImpersonation('missing-id')
        expect(result.error).toMatch(/user not found/i)
        expect(mockCookieSet).not.toHaveBeenCalled()
        expect(mockAuditInsert).not.toHaveBeenCalled()
    })
})

describe('[P0] startImpersonation — self-impersonation prevention', () => {
    test('[P0] rejects when admin tries to impersonate themselves', async () => {
        mockCallerWithRole('admin', 'admin-id')
        mockTargetUser({ id: 'admin-id', role: 'admin' })
        const result = await startImpersonation('admin-id')
        expect(result.error).toMatch(/chính mình/i)
        expect(mockCookieSet).not.toHaveBeenCalled()
    })

    test('[P0] rejects when super_admin tries to impersonate themselves', async () => {
        mockCallerWithRole('super_admin', 'sadmin-id')
        mockTargetUser({ id: 'sadmin-id', role: 'super_admin' })
        const result = await startImpersonation('sadmin-id')
        expect(result.error).toMatch(/chính mình/i)
    })
})

describe('[P0] startImpersonation — privilege escalation guard (super_admin only)', () => {
    test('[P0] rejects when admin tries to impersonate another admin', async () => {
        mockCallerWithRole('admin', 'admin-1')
        mockTargetUser({ id: 'admin-2', role: 'admin' })
        const result = await startImpersonation('admin-2')
        expect(result.error).toMatch(/super_admin/i)
        expect(mockCookieSet).not.toHaveBeenCalled()
        expect(mockAuditInsert).not.toHaveBeenCalled()
    })

    test('[P0] rejects when admin tries to impersonate a super_admin', async () => {
        mockCallerWithRole('admin', 'admin-1')
        mockTargetUser({ id: 'sadmin-9', role: 'super_admin' })
        const result = await startImpersonation('sadmin-9')
        expect(result.error).toMatch(/super_admin/i)
        expect(mockCookieSet).not.toHaveBeenCalled()
    })

    test('[P0] allows super_admin to impersonate another admin', async () => {
        mockCallerWithRole('super_admin', 'sadmin-1')
        mockTargetUser({ id: 'admin-2', role: 'admin' })
        const result = await startImpersonation('admin-2')
        expect(result.error).toBeUndefined()
        expect(mockCookieSet).toHaveBeenCalledTimes(1)
    })
})

describe('[P1] startImpersonation — cookie state', () => {
    test('[P1] sets admin_impersonate cookie with httpOnly + sameSite=strict + path=/', async () => {
        mockCallerWithRole('admin', 'admin-id')
        mockTargetUser({ id: 'target-id', role: 'customer' })
        await startImpersonation('target-id')
        expect(mockCookieSet).toHaveBeenCalledTimes(1)
        const [cookieName, cookieValue, cookieOpts] = mockCookieSet.mock.calls[0]
        expect(cookieName).toBe('admin_impersonate')
        expect(JSON.parse(cookieValue)).toEqual({ userId: 'target-id', adminId: 'admin-id' })
        expect(cookieOpts).toMatchObject({ httpOnly: true, sameSite: 'strict', path: '/' })
        expect(cookieOpts.maxAge).toBe(60 * 60 * 8)
    })

    test('[P1] cookie payload links target userId and acting adminId', async () => {
        mockCallerWithRole('super_admin', 'sadmin-id')
        mockTargetUser({ id: 'target-xyz', role: 'customer' })
        await startImpersonation('target-xyz')
        const cookieValue = mockCookieSet.mock.calls[0][1]
        expect(JSON.parse(cookieValue)).toEqual({ userId: 'target-xyz', adminId: 'sadmin-id' })
    })
})

describe('[P1] startImpersonation — audit log', () => {
    test('[P1] writes admin_audit_log row on successful start', async () => {
        mockCallerWithRole('admin', 'admin-id')
        mockTargetUser({ id: 'target-id', role: 'customer' })
        await startImpersonation('target-id')
        expect(mockAuditInsert).toHaveBeenCalledTimes(1)
        const row = mockAuditInsert.mock.calls[0][0]
        expect(row).toMatchObject({
            admin_id: 'admin-id',
            action: 'impersonate_start',
            target_id: 'target-id',
            target_role: 'customer',
        })
    })

    test('[P2] audit log failure does not block impersonation (non-blocking)', async () => {
        mockCallerWithRole('admin', 'admin-id')
        mockTargetUser({ id: 'target-id', role: 'customer' })
        mockAuditInsert.mockRejectedValueOnce(new Error('DB down'))
        const result = await startImpersonation('target-id')
        expect(result.error).toBeUndefined()
        expect(mockCookieSet).toHaveBeenCalledTimes(1)
    })
})

// ── stopImpersonation ────────────────────────────────────────────────────────

describe('[P1] stopImpersonation — clears state', () => {
    test('[P1] deletes admin_impersonate cookie when caller is authenticated with active session', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })
        mockCookieGet.mockReturnValue({ value: JSON.stringify({ userId: 'target-id', adminId: 'admin-id' }) })
        await stopImpersonation()
        expect(mockCookieDelete).toHaveBeenCalledTimes(1)
        expect(mockCookieDelete).toHaveBeenCalledWith('admin_impersonate')
    })

    test('[P1] silently no-ops when caller is unauthenticated (does not leak)', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
        await expect(stopImpersonation()).resolves.toBeUndefined()
        expect(mockCookieDelete).not.toHaveBeenCalled()
        expect(mockAuditInsert).not.toHaveBeenCalled()
    })

    test('[P1] idempotent when no active impersonation cookie present', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })
        mockCookieGet.mockReturnValue(undefined)
        await expect(stopImpersonation()).resolves.toBeUndefined()
        expect(mockAuditInsert).not.toHaveBeenCalled()
    })
})

describe('[P1] stopImpersonation — audit log', () => {
    test('[P1] writes impersonate_stop row when session was active', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })
        mockCookieGet.mockReturnValue({ value: JSON.stringify({ userId: 'target-999', adminId: 'admin-id' }) })
        await stopImpersonation()
        expect(mockAuditInsert).toHaveBeenCalledTimes(1)
        const row = mockAuditInsert.mock.calls[0][0]
        expect(row).toMatchObject({
            admin_id: 'admin-id',
            action: 'impersonate_stop',
            target_id: 'target-999',
        })
    })
})
