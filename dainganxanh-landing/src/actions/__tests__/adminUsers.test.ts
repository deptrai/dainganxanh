/**
 * Unit Tests: adminUsers
 *
 * [P0] Admin user management — auth guard, role check, CRUD operations.
 */

import {
    fetchAdminUsers,
    updateUserRole,
    assignUserReferral,
} from '../adminUsers'

// Mock Supabase clients
const mockGetUser = jest.fn()
const mockServerFrom = jest.fn()
const mockServiceFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn(() => Promise.resolve({
        auth: { getUser: mockGetUser },
        from: mockServerFrom,
    })),
    createServiceRoleClient: jest.fn(() => ({
        from: mockServiceFrom,
    })),
}))

jest.mock('@/lib/utils/telegram', () => ({
    notifyReferralAssigned: jest.fn(() => Promise.resolve()),
}))

// ─── Helpers ────────────────────────────────────────────────────────────────

function mockAdminAuth(role = 'admin') {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })
    mockServerFrom.mockReturnValue({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role } }) }) }),
    })
}

function mockUnauthenticated() {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })
}

function mockCustomerRole() {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })
    mockServerFrom.mockReturnValue({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'customer' } }) }) }),
    })
}

// ─── fetchAdminUsers ─────────────────────────────────────────────────────────

describe('[P0] fetchAdminUsers — auth guard', () => {
    beforeEach(() => jest.clearAllMocks())

    test('[P0] returns Unauthorized when not authenticated', async () => {
        mockUnauthenticated()
        const result = await fetchAdminUsers({}, 1, 20)
        expect(result.error).toMatch(/unauthorized/i)
        expect(result.users).toHaveLength(0)
    })

    test('[P0] returns Unauthorized when role is not admin', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })
        mockServerFrom.mockReturnValue({
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'user' } }) }) }),
        })
        const result = await fetchAdminUsers({}, 1, 20)
        expect(result.error).toMatch(/unauthorized/i)
    })

    test('[P1] returns users list for admin', async () => {
        mockAdminAuth()
        const mockUsers = [
            { id: 'u1', email: 'a@b.com', phone: null, full_name: 'A', role: 'user', referral_code: 'REF1', created_at: '2024-01-01' },
        ]
        mockServiceFrom.mockReturnValue({
            select: () => ({
                order: () => ({
                    range: () => Promise.resolve({ data: mockUsers, count: 1, error: null }),
                }),
            }),
        })
        // Second service call for order counts
        mockServiceFrom
            .mockReturnValueOnce({
                select: () => ({
                    order: () => ({
                        range: () => Promise.resolve({ data: mockUsers, count: 1, error: null }),
                    }),
                }),
            })
            .mockReturnValue({
                select: () => ({
                    in: () => ({ in: () => Promise.resolve({ data: [], error: null }) }),
                }),
            })

        const result = await fetchAdminUsers({}, 1, 20)
        expect(result.error).toBeUndefined()
        expect(result.totalCount).toBe(1)
    })
})

// ─── updateUserRole ──────────────────────────────────────────────────────────

describe('[P0] updateUserRole — auth guard', () => {
    beforeEach(() => jest.clearAllMocks())

    test('[P0] returns Unauthorized when not authenticated', async () => {
        mockUnauthenticated()
        const result = await updateUserRole('target-id', 'admin')
        expect(result.error).toMatch(/unauthorized/i)
    })

    test('[P0] returns error when caller is not admin', async () => {
        mockCustomerRole()
        const result = await updateUserRole('target-id', 'admin')
        expect(result.error).toMatch(/unauthorized/i)
    })

    test('[P1] prevents non-super_admin from assigning super_admin role', async () => {
        mockAdminAuth('admin')
        const result = await updateUserRole('target-id', 'super_admin')
        expect(result.error).toMatch(/super_admin/i)
    })

    test('[P1] prevents self-demotion', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })
        mockServerFrom.mockReturnValue({
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }),
        })
        const result = await updateUserRole('admin-id', 'user')
        expect(result.error).toMatch(/tự hạ quyền/i)
    })

    test('[P1] super_admin can assign super_admin role', async () => {
        mockAdminAuth('super_admin')
        mockServiceFrom.mockReturnValue({
            update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        })
        const result = await updateUserRole('other-id', 'super_admin')
        expect(result.error).toBeUndefined()
    })

    test('[P1] admin can downgrade user role', async () => {
        mockAdminAuth('admin')
        mockServiceFrom.mockReturnValue({
            update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        })
        const result = await updateUserRole('other-user-id', 'user')
        expect(result.error).toBeUndefined()
    })
})

// ─── assignUserReferral ──────────────────────────────────────────────────────

describe('[P0] assignUserReferral — auth guard', () => {
    beforeEach(() => jest.clearAllMocks())

    test('[P0] returns Unauthorized when not authenticated', async () => {
        mockUnauthenticated()
        const result = await assignUserReferral('target-id', 'REF001')
        expect(result.error).toMatch(/unauthorized/i)
    })

    test('[P0] returns error when caller is not admin', async () => {
        mockCustomerRole()
        const result = await assignUserReferral('target-id', 'REF001')
        expect(result.error).toMatch(/unauthorized/i)
    })

    test('[P1] returns error when ref code not found', async () => {
        mockAdminAuth()
        mockServiceFrom.mockReturnValue({
            select: () => ({
                ilike: () => ({
                    single: () => Promise.resolve({ data: null, error: new Error('Not found') }),
                }),
            }),
        })
        const result = await assignUserReferral('target-id', 'INVALID')
        expect(result.error).toMatch(/không tìm thấy mã giới thiệu/i)
    })

    test('[P1] prevents self-referral', async () => {
        mockAdminAuth()
        mockServiceFrom.mockReturnValue({
            select: () => ({
                ilike: () => ({
                    single: () => Promise.resolve({
                        data: { id: 'target-id', email: 'ref@test.com', full_name: 'Ref', referral_code: 'REF001' },
                        error: null,
                    }),
                }),
            }),
        })
        const result = await assignUserReferral('target-id', 'REF001')
        expect(result.error).toMatch(/tự giới thiệu/i)
    })
})
