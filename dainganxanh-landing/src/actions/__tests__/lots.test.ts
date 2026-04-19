/**
 * Unit Tests: lots.ts (createLot, updateLot)
 *
 * [P1] Admin-only lot management — create and update tree lots.
 * Covers: auth guard (verifyAdminRole), happy paths, DB errors, optional fields.
 *
 * Mock strategy: mock @/lib/supabase/server for both server client and service role client.
 */

import { createLot, updateLot } from '../lots'

// ── Mock state ───────────────────────────────────────────────────────────────

const mockGetUser = jest.fn()
const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockEqUpdate = jest.fn()

// Service role client — used by verifyAdminRole (profile check) + CRUD
const mockServiceSingle = jest.fn()
const mockServiceFrom = jest.fn()

// Server client — used by verifyAdminRole (getUser)
const mockServerClient = {
    auth: { getUser: mockGetUser },
}

const mockServiceClient = {
    from: mockServiceFrom,
}

jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn(() => Promise.resolve(mockServerClient)),
    createServiceRoleClient: jest.fn(() => mockServiceClient),
}))

// ── Setup helpers ─────────────────────────────────────────────────────────────

function setupAdminUser(role: 'admin' | 'super_admin' | 'customer' = 'admin') {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-user-id' } }, error: null })

    // verifyAdminRole calls serviceClient.from('users').select().eq().single()
    mockServiceFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { role }, error: null }),
    })
}

function setupUnauthenticated() {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } })
}

function setupInsertSuccess() {
    mockServiceFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
    })
}

function setupInsertError(message: string) {
    mockServiceFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: { message } }),
    })
}

function setupUpdateSuccess() {
    mockServiceFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
        }),
    })
}

function setupUpdateError(message: string) {
    mockServiceFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: { message } }),
        }),
    })
}

const baseLotData = {
    name: 'Lô A1',
    region: 'Tây Nguyên',
    description: 'Lô cây sầu riêng',
    total_trees: 100,
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks()
})

describe('[P1] createLot', () => {
    test('[P0] returns error when user is not authenticated', async () => {
        setupUnauthenticated()

        const result = await createLot(baseLotData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Unauthorized')
    })

    test('[P0] returns error when user is not admin', async () => {
        setupAdminUser('customer')

        const result = await createLot(baseLotData)

        expect(result.success).toBe(false)
        expect(result.error).toMatch(/quyền/)
    })

    test('[P1] creates lot successfully with admin role', async () => {
        setupAdminUser('admin')
        setupInsertSuccess()

        const result = await createLot(baseLotData)

        expect(result.success).toBe(true)
        expect(result.error).toBeUndefined()
    })

    test('[P1] creates lot successfully with super_admin role', async () => {
        setupAdminUser('super_admin')
        setupInsertSuccess()

        const result = await createLot(baseLotData)

        expect(result.success).toBe(true)
    })

    test('[P1] includes location when provided', async () => {
        setupAdminUser('admin')
        let capturedData: any
        mockServiceFrom.mockReturnValueOnce({
            insert: jest.fn().mockImplementation((data) => {
                capturedData = data[0]
                return Promise.resolve({ error: null })
            }),
        })

        await createLot({ ...baseLotData, location_lat: 12.345, location_lng: 108.678 })

        expect(capturedData.location_lat).toBe(12.345)
        expect(capturedData.location_lng).toBe(108.678)
    })

    test('[P2] omits location fields when null', async () => {
        setupAdminUser('admin')
        let capturedData: any
        mockServiceFrom.mockReturnValueOnce({
            insert: jest.fn().mockImplementation((data) => {
                capturedData = data[0]
                return Promise.resolve({ error: null })
            }),
        })

        await createLot({ ...baseLotData, location_lat: null, location_lng: null })

        expect(capturedData.location_lat).toBeUndefined()
        expect(capturedData.location_lng).toBeUndefined()
    })

    test('[P1] trims whitespace from name and region', async () => {
        setupAdminUser('admin')
        let capturedData: any
        mockServiceFrom.mockReturnValueOnce({
            insert: jest.fn().mockImplementation((data) => {
                capturedData = data[0]
                return Promise.resolve({ error: null })
            }),
        })

        await createLot({ ...baseLotData, name: '  Lô B  ', region: '  Hà Giang  ' })

        expect(capturedData.name).toBe('Lô B')
        expect(capturedData.region).toBe('Hà Giang')
    })

    test('[P1] returns error on DB failure', async () => {
        setupAdminUser('admin')
        setupInsertError('unique_violation on lots.name')

        const result = await createLot(baseLotData)

        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
    })

    test('[P2] initializes planted to 0', async () => {
        setupAdminUser('admin')
        let capturedData: any
        mockServiceFrom.mockReturnValueOnce({
            insert: jest.fn().mockImplementation((data) => {
                capturedData = data[0]
                return Promise.resolve({ error: null })
            }),
        })

        await createLot(baseLotData)

        expect(capturedData.planted).toBe(0)
    })
})

describe('[P1] updateLot', () => {
    test('[P0] returns error when user is not authenticated', async () => {
        setupUnauthenticated()

        const result = await updateLot('lot-id-123', baseLotData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Unauthorized')
    })

    test('[P1] updates lot successfully', async () => {
        setupAdminUser('admin')
        setupUpdateSuccess()

        const result = await updateLot('lot-id-123', baseLotData)

        expect(result.success).toBe(true)
    })

    test('[P1] nullifies location when not provided', async () => {
        setupAdminUser('admin')
        let capturedData: any
        mockServiceFrom.mockReturnValueOnce({
            update: jest.fn().mockImplementation((data) => {
                capturedData = data
                return { eq: jest.fn().mockResolvedValue({ error: null }) }
            }),
        })

        await updateLot('lot-id-123', { ...baseLotData, location_lat: null, location_lng: null })

        expect(capturedData.location_lat).toBeNull()
        expect(capturedData.location_lng).toBeNull()
    })

    test('[P1] returns error on DB failure', async () => {
        setupAdminUser('admin')
        setupUpdateError('record not found')

        const result = await updateLot('lot-id-123', baseLotData)

        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
    })
})
