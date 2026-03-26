import { assignOrderToLot } from '../assignOrderToLot'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
    createServiceRoleClient: jest.fn(),
}))

// Mock tree code generation
jest.mock('@/lib/utils/treeCode', () => ({
    generateTreeCodes: jest.fn((orderId: string, quantity: number) => {
        return Array.from({ length: quantity }, (_, i) =>
            `TREE-2026-${orderId.slice(0, 5).toUpperCase()}${String(i + 1).padStart(3, '0')}-123456`
        )
    }),
}))

describe('assignOrderToLot', () => {
    let mockSupabase: any

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks()

        // Create mock Supabase client
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            single: jest.fn(),
        }

            ; (createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)
    })

    describe('Happy Path', () => {
        it('should successfully assign order to lot', async () => {
            const orderId = 'order-123'
            const lotId = 'lot-456'

            // Mock order query
            mockSupabase.single.mockResolvedValueOnce({
                data: {
                    id: orderId,
                    quantity: 5,
                    user_id: 'user-789',
                    status: 'verified',
                },
                error: null,
            })

            // Mock lot query
            mockSupabase.single.mockResolvedValueOnce({
                data: {
                    id: lotId,
                    name: 'Lô A1',
                    region: 'Đắk Lắk',
                    description: 'Test lot',
                    location_lat: 12.5,
                    location_lng: 108.5,
                    total_trees: 100,
                    planted: 10,
                },
                error: null,
            })

            // Mock trees insert - need to return mockSupabase for chaining
            mockSupabase.insert.mockReturnValueOnce({ error: null })

            // Mock order update - need to chain eq()
            const mockOrderUpdate = { error: null }
            mockSupabase.update.mockReturnValueOnce({
                eq: jest.fn().mockResolvedValue(mockOrderUpdate)
            })

            // Mock lot update - need to chain eq()
            const mockLotUpdate = { error: null }
            mockSupabase.update.mockReturnValueOnce({
                eq: jest.fn().mockResolvedValue(mockLotUpdate)
            })

            // Mock user query for email
            mockSupabase.single.mockResolvedValueOnce({
                data: {
                    email: 'test@example.com',
                    full_name: 'Test User',
                },
                error: null,
            })

            // Mock fetch for email
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            })

            const result = await assignOrderToLot(orderId, lotId)

            expect(result.success).toBe(true)
            expect(result.treeCodes).toHaveLength(5)
            expect(result.treeCodes![0]).toMatch(/^TREE-2026-ORDER\d{3}-\d{6}$/)
        })
    })

    describe('Validation', () => {
        it('should reject order that is not verified', async () => {
            const orderId = 'order-123'
            const lotId = 'lot-456'

            mockSupabase.single.mockResolvedValueOnce({
                data: {
                    id: orderId,
                    quantity: 5,
                    user_id: 'user-789',
                    status: 'pending', // Not verified
                },
                error: null,
            })

            const result = await assignOrderToLot(orderId, lotId)

            expect(result.success).toBe(false)
            expect(result.error).toContain('chưa được xác minh')
        })

        it('should reject when lot capacity is exceeded', async () => {
            const orderId = 'order-123'
            const lotId = 'lot-456'

            // Mock order query
            mockSupabase.single.mockResolvedValueOnce({
                data: {
                    id: orderId,
                    quantity: 50, // Need 50 trees
                    user_id: 'user-789',
                    status: 'verified',
                },
                error: null,
            })

            // Mock lot query - only 10 spaces left
            mockSupabase.single.mockResolvedValueOnce({
                data: {
                    id: lotId,
                    name: 'Lô A1',
                    region: 'Đắk Lắk',
                    total_trees: 100,
                    planted: 90, // Only 10 spaces left
                },
                error: null,
            })

            const result = await assignOrderToLot(orderId, lotId)

            expect(result.success).toBe(false)
            expect(result.error).toContain('không đủ sức chứa')
            expect(result.error).toContain('Còn trống: 10 cây')
        })
    })

    describe('Error Handling', () => {
        it('should handle order not found', async () => {
            const orderId = 'non-existent'
            const lotId = 'lot-456'

            mockSupabase.single.mockResolvedValueOnce({
                data: null,
                error: { message: 'Not found' },
            })

            const result = await assignOrderToLot(orderId, lotId)

            expect(result.success).toBe(false)
            expect(result.error).toContain('Không tìm thấy đơn hàng')
        })

        it('should handle lot not found', async () => {
            const orderId = 'order-123'
            const lotId = 'non-existent'

            // Mock order query
            mockSupabase.single.mockResolvedValueOnce({
                data: {
                    id: orderId,
                    quantity: 5,
                    user_id: 'user-789',
                    status: 'verified',
                },
                error: null,
            })

            // Mock lot query - not found
            mockSupabase.single.mockResolvedValueOnce({
                data: null,
                error: { message: 'Not found' },
            })

            const result = await assignOrderToLot(orderId, lotId)

            expect(result.success).toBe(false)
            expect(result.error).toContain('Không tìm thấy lô cây')
        })

        it('should handle trees creation error', async () => {
            const orderId = 'order-123'
            const lotId = 'lot-456'

            // Mock order query
            mockSupabase.single.mockResolvedValueOnce({
                data: {
                    id: orderId,
                    quantity: 5,
                    user_id: 'user-789',
                    status: 'verified',
                },
                error: null,
            })

            // Mock lot query
            mockSupabase.single.mockResolvedValueOnce({
                data: {
                    id: lotId,
                    name: 'Lô A1',
                    region: 'Đắk Lắk',
                    total_trees: 100,
                    planted: 10,
                },
                error: null,
            })

            // Mock trees insert - error
            mockSupabase.insert.mockResolvedValueOnce({
                error: { message: 'Duplicate key', code: '23505' },
            })

            const result = await assignOrderToLot(orderId, lotId)

            expect(result.success).toBe(false)
            expect(result.error).toContain('Không thể tạo mã cây')
        })
    })

    describe('Email Notification', () => {
        it('should not fail assignment if email fails', async () => {
            const orderId = 'order-123'
            const lotId = 'lot-456'

            // Mock successful assignment flow
            mockSupabase.single.mockResolvedValueOnce({
                data: {
                    id: orderId,
                    quantity: 5,
                    user_id: 'user-789',
                    status: 'verified',
                },
                error: null,
            })

            mockSupabase.single.mockResolvedValueOnce({
                data: {
                    id: lotId,
                    name: 'Lô A1',
                    region: 'Đắk Lắk',
                    total_trees: 100,
                    planted: 10,
                },
                error: null,
            })

            mockSupabase.insert.mockReturnValueOnce({ error: null })

            // Mock order update - need to chain eq()
            mockSupabase.update.mockReturnValueOnce({
                eq: jest.fn().mockResolvedValue({ error: null })
            })

            // Mock lot update - need to chain eq()
            mockSupabase.update.mockReturnValueOnce({
                eq: jest.fn().mockResolvedValue({ error: null })
            })

            // Mock user query
            mockSupabase.single.mockResolvedValueOnce({
                data: {
                    email: 'test@example.com',
                    full_name: 'Test User',
                },
                error: null,
            })

            // Mock fetch - email fails
            global.fetch = jest.fn().mockRejectedValue(new Error('Email service down'))

            const result = await assignOrderToLot(orderId, lotId)

            // Should still succeed even if email fails
            expect(result.success).toBe(true)
            expect(result.treeCodes).toHaveLength(5)
        })
    })
})
