/**
 * Unit Tests: analytics actions
 *
 * [P1] Analytics KPIs + chart data — auth guard, error shape, return contract.
 *
 * Note: Query chains are complex (count/filter/aggregate across 4 tables). These
 * tests focus on behavior contracts (auth + error paths + return shape) rather
 * than full DB mock chains. Full integration coverage requires Supabase test DB.
 */

import {
    getAnalyticsKPIs,
    getPlantingChartData,
    getRevenueChartData,
    getConversionFunnelData,
} from '../analytics'

const mockGetUser = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn(() => Promise.resolve({
        auth: { getUser: mockGetUser },
        from: mockFrom,
    })),
}))

// Query-builder mock that returns empty data on any terminal operation.
// Shared between all non-auth tables so aggregate operations don't crash.
function makeEmptyQueryBuilder(): any {
    const builder: any = {
        select: () => builder,
        eq: () => builder,
        neq: () => builder,
        gte: () => builder,
        lte: () => builder,
        lt: () => builder,
        not: () => builder,
        in: () => builder,
        is: () => builder,
        order: () => builder,
        limit: () => builder,
        // Terminal — behaves like a Promise resolving to empty dataset
        then: (resolve: any) => resolve({ data: [], count: 0, error: null }),
    }
    return builder
}

function mockUnauthenticated() {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })
    mockFrom.mockReturnValue(makeEmptyQueryBuilder())
}

function mockNonAdmin() {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
            return {
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({ data: { role: 'customer' }, error: null }),
                    }),
                }),
            }
        }
        return makeEmptyQueryBuilder()
    })
}

function mockAdmin() {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })
    mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
            return {
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({ data: { role: 'admin' }, error: null }),
                    }),
                }),
            }
        }
        return makeEmptyQueryBuilder()
    })
}

beforeEach(() => jest.clearAllMocks())

// ─── getAnalyticsKPIs ────────────────────────────────────────────────────────

describe('[P0] getAnalyticsKPIs — auth guard', () => {
    test('[P0] returns Unauthorized when not authenticated', async () => {
        mockUnauthenticated()
        const result = await getAnalyticsKPIs()
        expect(result.data).toBeNull()
        expect(result.error).toMatch(/unauthorized/i)
    })

    test('[P0] returns Forbidden when user is not admin', async () => {
        mockNonAdmin()
        const result = await getAnalyticsKPIs()
        expect(result.data).toBeNull()
        expect(result.error).toMatch(/forbidden/i)
    })
})

describe('[P1] getAnalyticsKPIs — return contract', () => {
    test('[P1] returns KPI shape for admin with zero values on empty DB', async () => {
        mockAdmin()
        const result = await getAnalyticsKPIs()
        // Admin with empty DB should get zeros, not an error
        expect(result.error).toBeNull()
        expect(result.data).toBeDefined()
        expect(result.data).toEqual(
            expect.objectContaining({
                totalTrees: 0,
                activeUsers: 0,
                totalRevenue: 0,
                carbonOffset: 0,
            })
        )
    })

    test('[P2] includes trends object with all 4 metrics', async () => {
        mockAdmin()
        const result = await getAnalyticsKPIs()
        expect(result.data?.trends).toBeDefined()
        expect(result.data?.trends).toEqual(
            expect.objectContaining({
                trees: expect.objectContaining({
                    value: expect.any(Number),
                    isPositive: expect.any(Boolean),
                }),
                users: expect.objectContaining({ value: expect.any(Number) }),
                revenue: expect.objectContaining({ value: expect.any(Number) }),
                carbon: expect.objectContaining({ value: expect.any(Number) }),
            })
        )
    })
})

// ─── getPlantingChartData ────────────────────────────────────────────────────

describe('[P1] getPlantingChartData — auth + contract', () => {
    test('[P0] returns Unauthorized when not authenticated', async () => {
        mockUnauthenticated()
        const result = await getPlantingChartData()
        expect(result.data).toBeNull()
        expect(result.error).toMatch(/unauthorized/i)
    })

    test('[P1] returns array shape for admin', async () => {
        mockAdmin()
        const result = await getPlantingChartData()
        expect(result.error).toBeNull()
        expect(Array.isArray(result.data)).toBe(true)
    })
})

// ─── getRevenueChartData ─────────────────────────────────────────────────────

describe('[P1] getRevenueChartData — auth + contract', () => {
    test('[P0] returns Unauthorized when not authenticated', async () => {
        mockUnauthenticated()
        const result = await getRevenueChartData()
        expect(result.data).toBeNull()
        expect(result.error).toMatch(/unauthorized/i)
    })

    test('[P1] returns array shape for admin', async () => {
        mockAdmin()
        const result = await getRevenueChartData()
        expect(result.error).toBeNull()
        expect(Array.isArray(result.data)).toBe(true)
    })
})

// ─── getConversionFunnelData ─────────────────────────────────────────────────

describe('[P1] getConversionFunnelData — auth + contract', () => {
    test('[P0] returns Unauthorized when not authenticated', async () => {
        mockUnauthenticated()
        const result = await getConversionFunnelData()
        expect(result.data).toBeNull()
        expect(result.error).toMatch(/unauthorized/i)
    })

    test('[P1] returns funnel array for admin with stage/count/percentage shape', async () => {
        mockAdmin()
        const result = await getConversionFunnelData()
        expect(result.error).toBeNull()
        expect(Array.isArray(result.data)).toBe(true)
        if (result.data && result.data.length > 0) {
            expect(result.data[0]).toEqual(
                expect.objectContaining({
                    stage: expect.any(String),
                    count: expect.any(Number),
                    percentage: expect.any(Number),
                })
            )
        }
    })
})
