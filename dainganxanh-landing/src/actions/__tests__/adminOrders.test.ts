// Mock modules BEFORE importing the function under test
jest.mock('@/lib/supabase/server', () => ({
    createServiceRoleClient: jest.fn(),
    createServerClient: jest.fn(),
}))

import { fetchAdminOrders, verifyAdminOrder } from '../adminOrders'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'

describe('fetchAdminOrders', () => {
    let mockSupabase: any
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
        jest.clearAllMocks()

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

        // Default Supabase mock
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
            single: jest.fn(),
        }
        ;(createServiceRoleClient as jest.MockedFunction<typeof createServiceRoleClient>).mockReturnValue(mockSupabase)
    })

    afterEach(() => {
        consoleErrorSpy.mockRestore()
    })

    it('should fetch orders with referrer data correctly', async () => {
        // Arrange
        const mockOrders = [
            {
                id: 'order-1',
                user_id: 'user-1',
                referred_by: 'referrer-1',
                quantity: 5,
                total_amount: 5000000,
                status: 'pending',
                created_at: '2026-01-01T00:00:00Z',
            },
            {
                id: 'order-2',
                user_id: 'user-2',
                referred_by: 'referrer-2',
                quantity: 10,
                total_amount: 10000000,
                status: 'verified',
                created_at: '2026-01-02T00:00:00Z',
            },
        ]

        const mockUsers = [
            { id: 'user-1', email: 'user1@example.com', phone: '0123456789', referral_code: 'USER1' },
            { id: 'user-2', email: 'user2@example.com', phone: '0987654321', referral_code: 'USER2' },
            { id: 'referrer-1', email: 'ref1@example.com', phone: null, referral_code: 'REF1' },
            { id: 'referrer-2', email: 'ref2@example.com', phone: null, referral_code: 'REF2' },
        ]

        // Reset the mock to create separate chains
        jest.clearAllMocks()

        // Create count query chain
        const countChain = {
            select: jest.fn().mockReturnValue({
                count: 2,
                error: null,
            }),
        }

        // Create orders query chain
        const ordersChain = {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({ data: mockOrders, error: null }),
        }

        // Create users query chain
        const usersChain = {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
        }

        // Mock from() to return different chains in sequence
        const mockFrom = jest.fn()
            .mockReturnValueOnce(countChain)  // First call: count query
            .mockReturnValueOnce(ordersChain) // Second call: orders query
            .mockReturnValueOnce(usersChain)  // Third call: users query

        mockSupabase.from = mockFrom
        ;(createServiceRoleClient as jest.MockedFunction<typeof createServiceRoleClient>).mockReturnValue(mockSupabase)

        // Act
        const result = await fetchAdminOrders({}, 1, 20)

        // Assert
        expect(result.totalCount).toBe(2)
        expect(result.orders).toHaveLength(2)

        // Check referrer mapping
        expect(result.orders[0].referrer).toEqual({
            email: 'ref1@example.com',
            referral_code: 'REF1',
        })
        expect(result.orders[1].referrer).toEqual({
            email: 'ref2@example.com',
            referral_code: 'REF2',
        })

        // Check user mapping
        expect(result.orders[0].user_email).toBe('user1@example.com')
        expect(result.orders[0].user_phone).toBe('0123456789')
    })

    it('should handle orders without referrer (referrer = null)', async () => {
        // Arrange
        const mockOrders = [
            {
                id: 'order-1',
                user_id: 'user-1',
                referred_by: null, // No referrer
                quantity: 5,
                total_amount: 5000000,
                status: 'pending',
                created_at: '2026-01-01T00:00:00Z',
            },
        ]

        const mockUsers = [
            { id: 'user-1', email: 'user1@example.com', phone: '0123456789', referral_code: 'USER1' },
        ]

        // Mock count query
        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ count: 1, error: null }),
        })

        // Mock orders query
        const ordersChain = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({ data: mockOrders, error: null }),
        }
        mockSupabase.from.mockReturnValueOnce(ordersChain)

        // Mock users query
        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
        })

        // Act
        const result = await fetchAdminOrders({}, 1, 20)

        // Assert
        expect(result.orders[0].referrer).toBeNull()
        expect(result.orders[0].user_email).toBe('user1@example.com')
    })

    it('should apply status filter correctly', async () => {
        // Arrange
        const mockOrders = []

        // Mock count query with status filter
        const countChain = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
        }
        mockSupabase.from.mockReturnValueOnce(countChain)

        // Mock orders query with status filter
        const ordersChain = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockOrders, error: null }),
        }
        mockSupabase.from.mockReturnValueOnce(ordersChain)

        // Act
        const result = await fetchAdminOrders({ status: 'verified' }, 1, 20)

        // Assert
        expect(countChain.eq).toHaveBeenCalledWith('status', 'verified')
    })

    it('should handle search by email correctly', async () => {
        // Arrange
        const mockMatchedUsers = [{ id: 'user-1' }]

        // Mock user search
        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockResolvedValue({ data: mockMatchedUsers, error: null }),
        })

        // Mock count query
        const countChain = {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({ count: 1, error: null }),
        }
        mockSupabase.from.mockReturnValueOnce(countChain)

        // Mock orders query
        const ordersChain = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
        }
        mockSupabase.from.mockReturnValueOnce(ordersChain)

        // Act
        const result = await fetchAdminOrders({ search: 'test@example.com' }, 1, 20)

        // Assert - check that user search was performed
        expect(mockSupabase.from).toHaveBeenCalledWith('users')
        expect(countChain.in).toHaveBeenCalledWith('user_id', ['user-1'])
        expect(ordersChain.in).toHaveBeenCalledWith('user_id', ['user-1'])
    })

    it('should handle date filters correctly', async () => {
        // Arrange
        const dateFrom = '2026-01-01'
        const dateTo = '2026-01-31'

        // Mock count query
        const countChain = {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockResolvedValue({ count: 0, error: null }),
        }
        mockSupabase.from.mockReturnValueOnce(countChain)

        // Mock orders query
        const ordersChain = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockResolvedValue({ data: [], error: null }),
        }
        mockSupabase.from.mockReturnValueOnce(ordersChain)

        // Act
        await fetchAdminOrders({ dateFrom, dateTo }, 1, 20)

        // Assert
        expect(countChain.gte).toHaveBeenCalledWith('created_at', dateFrom)
        expect(countChain.lte).toHaveBeenCalledWith('created_at', dateTo)
        expect(ordersChain.gte).toHaveBeenCalledWith('created_at', dateFrom)
        expect(ordersChain.lte).toHaveBeenCalledWith('created_at', dateTo)
    })

    it('should handle fetch error gracefully', async () => {
        // Arrange
        const errorMessage = 'Database connection failed'

        jest.clearAllMocks()

        // Mock count query (success)
        const countChain = {
            select: jest.fn().mockReturnValue({
                count: 0,
                error: null,
            }),
        }

        // Mock orders query with error
        const ordersChain = {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({ data: null, error: { message: errorMessage } }),
        }

        // Mock from() to return different chains
        const mockFrom = jest.fn()
            .mockReturnValueOnce(countChain)  // First call: count query
            .mockReturnValueOnce(ordersChain) // Second call: orders query (throws)

        mockSupabase.from = mockFrom
        ;(createServiceRoleClient as jest.MockedFunction<typeof createServiceRoleClient>).mockReturnValue(mockSupabase)

        // Act
        const result = await fetchAdminOrders({}, 1, 20)

        // Assert
        expect(result.error).toBe('Không thể tải danh sách đơn hàng') // Generic error message
        expect(result.orders).toEqual([])
        expect(result.totalCount).toBe(0)
        expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should handle pagination correctly', async () => {
        // Arrange
        const page = 2
        const pageSize = 10

        // Mock count query
        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ count: 25, error: null }),
        })

        // Mock orders query
        const ordersChain = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({ data: [], error: null }),
        }
        mockSupabase.from.mockReturnValueOnce(ordersChain)

        // Act
        await fetchAdminOrders({}, page, pageSize)

        // Assert - page 2, pageSize 10 → range(10, 19)
        expect(ordersChain.range).toHaveBeenCalledWith(10, 19)
    })
})

describe('verifyAdminOrder', () => {
    let mockSupabase: any
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
        jest.clearAllMocks()

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null }),
        }
        ;(createServerClient as jest.MockedFunction<typeof createServerClient>).mockResolvedValue(mockSupabase)
    })

    afterEach(() => {
        consoleErrorSpy.mockRestore()
    })

    it('should verify order successfully', async () => {
        // Arrange
        const orderId = 'order-123'

        // Act
        const result = await verifyAdminOrder(orderId)

        // Assert
        expect(mockSupabase.from).toHaveBeenCalledWith('orders')
        expect(mockSupabase.update).toHaveBeenCalledWith({
            status: 'verified',
            verified_at: expect.any(String),
        })
        expect(mockSupabase.eq).toHaveBeenCalledWith('id', orderId)
        expect(result.error).toBeUndefined()
    })

    it('should handle verification error', async () => {
        // Arrange
        const orderId = 'order-123'
        const errorMessage = 'Update failed'

        mockSupabase.eq.mockResolvedValue({ error: { message: errorMessage } })

        // Act
        const result = await verifyAdminOrder(orderId)

        // Assert
        expect(result.error).toBe(errorMessage)
        expect(consoleErrorSpy).toHaveBeenCalledWith('verifyAdminOrder error:', expect.any(Object))
    })
})
