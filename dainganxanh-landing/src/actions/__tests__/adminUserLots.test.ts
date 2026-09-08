/**
 * Unit Tests: adminUserLots
 *
 * [P1] Lot-scoped admin role assignment — super_admin only operations.
 */

import {
    fetchUserLotAssignments,
    assignLotToUser,
    removeLotFromUser,
} from '../adminUserLots'

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

const { getAdminUserLots } = require('@/lib/admin/permissions')
jest.mock('@/lib/admin/permissions', () => ({
    getAdminUserLots: jest.fn(),
}))

function mockSuperAdmin() {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })
    mockServiceFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { role: 'super_admin' }, error: null }),
    })
}

function mockNonSuperAdmin() {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-2' } }, error: null })
    mockServiceFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
    })
}

function mockUnauthenticated() {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })
}

beforeEach(() => {
    jest.clearAllMocks()
    getAdminUserLots.mockReset()
})

describe('[P1] fetchUserLotAssignments', () => {
    test('returns Unauthorized when not authenticated', async () => {
        mockUnauthenticated()

        const result = await fetchUserLotAssignments('target-user')

        expect(result.assignments).toEqual([])
        expect(result.error).toBe('Unauthorized')
    })

    test('returns error for non-super_admin', async () => {
        mockNonSuperAdmin()

        const result = await fetchUserLotAssignments('target-user')

        expect(result.assignments).toEqual([])
        expect(result.error).toMatch(/super_admin/)
    })

    test('returns assignments for super_admin', async () => {
        mockSuperAdmin()
        getAdminUserLots.mockResolvedValue([
            {
                id: 'aul-1',
                user_id: 'target-user',
                lot_id: 'lot-1',
                role: 'resort_manager',
                created_by: null,
                created_at: '',
                updated_at: '',
            },
        ])

        mockServiceFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
                data: [{ id: 'lot-1', name: 'Vườn A', region: 'south' }],
                error: null,
            }),
        })

        const result = await fetchUserLotAssignments('target-user')

        expect(result.assignments).toHaveLength(1)
        expect(result.assignments[0].lot_name).toBe('Vườn A')
    })
})

describe('[P1] assignLotToUser', () => {
    test('returns error when unauthenticated', async () => {
        mockUnauthenticated()

        const result = await assignLotToUser('u1', 'l1', 'resort_manager')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Unauthorized')
    })

    test('returns error for non-super_admin', async () => {
        mockNonSuperAdmin()

        const result = await assignLotToUser('u1', 'l1', 'resort_manager')

        expect(result.success).toBe(false)
        expect(result.error).toMatch(/super_admin/)
    })

    test('returns error for invalid role', async () => {
        mockSuperAdmin()

        const result = await assignLotToUser('u1', 'l1', 'invalid' as any)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Role không hợp lệ')
    })

    test('assigns lot successfully', async () => {
        mockSuperAdmin()

        // target user check
        mockServiceFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'u1' }, error: null }),
        })
        // lot check
        mockServiceFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'l1' }, error: null }),
        })
        // existing assignment check
        mockServiceFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
        })
        // upsert
        mockServiceFrom.mockReturnValueOnce({
            upsert: jest.fn().mockResolvedValue({ error: null }),
        })
        // audit log
        mockServiceFrom.mockReturnValueOnce({
            insert: jest.fn().mockResolvedValue({ error: null }),
        })

        const result = await assignLotToUser('u1', 'l1', 'resort_manager')

        expect(result.success).toBe(true)
    })
})

describe('[P1] removeLotFromUser', () => {
    test('returns error when unauthenticated', async () => {
        mockUnauthenticated()

        const result = await removeLotFromUser('u1', 'l1')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Unauthorized')
    })

    test('returns error for non-super_admin', async () => {
        mockNonSuperAdmin()

        const result = await removeLotFromUser('u1', 'l1')

        expect(result.success).toBe(false)
        expect(result.error).toMatch(/super_admin/)
    })

    test('removes lot successfully', async () => {
        mockSuperAdmin()

        // existing assignment check (select().eq().eq().single() chain)
        mockServiceFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { role: 'resort_manager' }, error: null }),
        })
        // delete
        mockServiceFrom.mockReturnValueOnce({
            delete: jest.fn().mockReturnThis(),
            match: jest.fn().mockResolvedValue({ error: null }),
        })
        // audit log
        mockServiceFrom.mockReturnValueOnce({
            insert: jest.fn().mockResolvedValue({ error: null }),
        })

        const result = await removeLotFromUser('u1', 'l1')

        expect(result.success).toBe(true)
    })
})
