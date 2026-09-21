/**
 * Unit tests: src/lib/admin/permissions.ts
 * Covers: canAccessLot, getAdminUserLots, getUserHighestRole, verifyLotAccess
 */

import { canAccessLot, getAdminUserLots, getUserHighestRole, verifyLotAccess } from '../permissions'

const mockFrom = jest.fn()
const mockServiceClient = { from: mockFrom }

jest.mock('@/lib/supabase/server', () => ({
    createServiceRoleClient: jest.fn(() => mockServiceClient),
}))

beforeEach(() => {
    jest.clearAllMocks()
})

function setupUserProfile(role: string) {
    mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { role }, error: null }),
    })
}

function setupNoUserProfile() {
    mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    })
}

function setupAdminUserLots(rows: { lot_id: string; role: string }[]) {
    mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        // from getAdminUserLots
    })
    // The second `from` in getAdminUserLots also needs a return
    mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: rows, error: null }),
    })
}

describe('canAccessLot', () => {
    test('returns true for admin role without checking lot assignment', async () => {
        setupUserProfile('admin')

        const result = await canAccessLot('user-1', 'lot-1')

        expect(result).toBe(true)
        expect(mockFrom).toHaveBeenCalledTimes(1)
    })

    test('returns true for super_admin role', async () => {
        setupUserProfile('super_admin')

        const result = await canAccessLot('user-1', 'lot-1')

        expect(result).toBe(true)
    })

    test('returns true when lot-scoped assignment exists', async () => {
        setupUserProfile('user')
        mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { role: 'resort_manager' }, error: null }),
        })

        const result = await canAccessLot('user-1', 'lot-1')

        expect(result).toBe(true)
    })

    test('returns false when lot-scoped assignment does not exist', async () => {
        setupUserProfile('user')
        mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
        })

        const result = await canAccessLot('user-1', 'lot-1')

        expect(result).toBe(false)
    })

    test('enforces required role', async () => {
        setupUserProfile('user')
        mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { role: 'store_staff' }, error: null }),
        })

        const result = await canAccessLot('user-1', 'lot-1', 'resort_manager')

        expect(result).toBe(false)
    })

    test('returns false on user lookup error', async () => {
        setupNoUserProfile()

        const result = await canAccessLot('user-1', 'lot-1')

        expect(result).toBe(false)
    })
})

describe('getUserHighestRole', () => {
    test('returns super_admin when users.role is super_admin', async () => {
        setupUserProfile('super_admin')

        const result = await getUserHighestRole('user-1')

        expect(result).toBe('super_admin')
    })

    test('returns admin when users.role is admin', async () => {
        setupUserProfile('admin')

        const result = await getUserHighestRole('user-1')

        expect(result).toBe('admin')
    })

    test('returns lot-scoped role when user has assignment', async () => {
        setupUserProfile('user')
        mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
                data: [{ id: 'aul-1', user_id: 'user-1', lot_id: 'lot-1', role: 'resort_manager', created_by: null, created_at: '', updated_at: '' }],
                error: null,
            }),
        })

        const result = await getUserHighestRole('user-1')

        expect(result).toBe('resort_manager')
    })

    test('falls back to user role when no assignment', async () => {
        setupUserProfile('user')
        mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
        })

        const result = await getUserHighestRole('user-1')

        expect(result).toBe('user')
    })
})

describe('verifyLotAccess', () => {
    test('returns userId for global admin', async () => {
        setupUserProfile('admin')

        const result = await verifyLotAccess('user-1', 'lot-1')

        expect(result.userId).toBe('user-1')
        expect(result.error).toBeNull()
    })

    test('returns error for non-admin without lot access', async () => {
        setupUserProfile('user')
        mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
        })

        const result = await verifyLotAccess('user-1', 'lot-1')

        expect(result.userId).toBeNull()
        expect(result.error).toMatch(/quyền/)
    })
})
