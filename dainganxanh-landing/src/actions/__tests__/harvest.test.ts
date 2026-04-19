/**
 * Unit Tests: harvest actions
 *
 * [P0] Harvest decision actions — auth guard, status transitions, validation.
 */

import { submitSellBack, submitKeepGrowing, submitReceiveProduct } from '../harvest'
import type { ShippingAddress } from '../harvest'

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

const validAddress: ShippingAddress = {
    fullName: 'Nguyễn Văn A',
    phone: '0912345678',
    address: '123 Đường ABC',
    city: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
}

function mockAuth(orderId = 'order-1', status = 'assigned') {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockServerFrom.mockReturnValue({
        select: () => ({
            eq: () => ({
                eq: () => ({
                    single: () => Promise.resolve({
                        data: { id: orderId, user_id: 'user-1', status, total_amount: 1000000, code: 'DNG001', created_at: '2024-01-01' },
                        error: null,
                    }),
                }),
            }),
        }),
    })
}

function mockUnauthenticated() {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
}

beforeEach(() => jest.clearAllMocks())

// ─── submitSellBack ──────────────────────────────────────────────────────────

describe('[P0] submitSellBack', () => {
    test('[P0] returns error when not authenticated', async () => {
        mockUnauthenticated()
        const result = await submitSellBack('order-1')
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/đăng nhập/i)
    })

    test('[P0] returns error when order not found', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
        mockServerFrom.mockReturnValue({
            select: () => ({
                eq: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({ data: null, error: new Error('Not found') }),
                    }),
                }),
            }),
        })
        const result = await submitSellBack('bad-order')
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/đơn hàng/i)
    })

    test('[P0] succeeds and returns buyback price', async () => {
        mockAuth('order-1', 'assigned')
        mockServiceFrom.mockReturnValue({
            update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        })
        const result = await submitSellBack('order-1')
        expect(result.success).toBe(true)
        expect(result.buybackPrice).toBe(2000000) // 2x total_amount
    })

    test('[P1] returns error if already harvested', async () => {
        mockAuth('order-1', 'harvested')
        const result = await submitSellBack('order-1')
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/đã được thu hoạch/i)
    })

    test('[P1] returns error if already harvested_sellback', async () => {
        mockAuth('order-1', 'harvested_sellback')
        const result = await submitSellBack('order-1')
        expect(result.success).toBe(false)
    })
})

// ─── submitKeepGrowing ───────────────────────────────────────────────────────

describe('[P0] submitKeepGrowing', () => {
    test('[P0] returns error when not authenticated', async () => {
        mockUnauthenticated()
        const result = await submitKeepGrowing('order-1')
        expect(result.success).toBe(false)
    })

    test('[P1] returns error if already keep_growing', async () => {
        mockAuth('order-1', 'keep_growing')
        const result = await submitKeepGrowing('order-1')
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/đã được đăng ký/i)
    })

    test('[P1] returns error if already harvested', async () => {
        mockAuth('order-1', 'harvested')
        const result = await submitKeepGrowing('order-1')
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/đã được thu hoạch/i)
    })

    test('[P1] succeeds for valid assigned order', async () => {
        mockAuth('order-1', 'assigned')
        mockServiceFrom
            .mockReturnValueOnce({
                update: () => ({ eq: () => Promise.resolve({ error: null }) }),
            })
            .mockReturnValue({
                update: () => ({ eq: () => Promise.resolve({ error: null }) }),
            })
        const result = await submitKeepGrowing('order-1')
        expect(result.success).toBe(true)
    })
})

// ─── submitReceiveProduct ────────────────────────────────────────────────────

describe('[P0] submitReceiveProduct', () => {
    test('[P0] returns error when not authenticated', async () => {
        mockUnauthenticated()
        const result = await submitReceiveProduct('order-1', 'tinh-dau-tram-huong', validAddress)
        expect(result.success).toBe(false)
    })

    test('[P1] returns error for invalid product type', async () => {
        mockAuth()
        const result = await submitReceiveProduct('order-1', 'invalid-product', validAddress)
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/không hợp lệ/i)
    })

    test('[P1] returns error for missing shipping address fields', async () => {
        mockAuth()
        const incompleteAddress = { ...validAddress, ward: '' }
        const result = await submitReceiveProduct('order-1', 'tinh-dau-tram-huong', incompleteAddress)
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/đầy đủ thông tin/i)
    })

    test('[P1] returns error for invalid phone number', async () => {
        mockAuth()
        const badPhone = { ...validAddress, phone: '12345' }
        const result = await submitReceiveProduct('order-1', 'tinh-dau-tram-huong', badPhone)
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/số điện thoại/i)
    })

    test('[P1] succeeds for valid product and address', async () => {
        mockAuth()
        mockServiceFrom.mockReturnValue({
            update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        })
        const result = await submitReceiveProduct('order-1', 'tinh-dau-tram-huong', validAddress)
        expect(result.success).toBe(true)
    })

    test('[P2] accepts +84 phone format', async () => {
        mockAuth()
        mockServiceFrom.mockReturnValue({
            update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        })
        const plus84Phone = { ...validAddress, phone: '+84912345678' }
        const result = await submitReceiveProduct('order-1', 'go-tram-tho', plus84Phone)
        expect(result.success).toBe(true)
    })

    test('[P2] accepts all valid product types', async () => {
        const products = ['tinh-dau-tram-huong', 'go-tram-tho', 'vong-tay-tram-huong', 'nhang-tram']
        for (const product of products) {
            mockAuth()
            mockServiceFrom.mockReturnValue({
                update: () => ({ eq: () => Promise.resolve({ error: null }) }),
            })
            const result = await submitReceiveProduct('order-1', product, validAddress)
            expect(result.success).toBe(true)
        }
    })
})
