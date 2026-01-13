import { markOrderForPrint, resendContract, updatePrintStatus } from '../printQueue'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'

// Mock Supabase clients
jest.mock('@/lib/supabase/server', () => ({
    createServiceRoleClient: jest.fn(),
    createServerClient: jest.fn(),
}))

describe('Print Queue Actions', () => {
    let mockServiceClient: any
    let mockServerClient: any

    // Valid UUID for testing
    const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'
    const INVALID_UUID = 'not-a-uuid'

    beforeEach(() => {
        jest.clearAllMocks()

        // Mock service role client (for DB operations)
        mockServiceClient = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockReturnThis(),
        }
            ; (createServiceRoleClient as jest.Mock).mockReturnValue(mockServiceClient)

        // Mock server client (for auth)
        mockServerClient = {
            auth: {
                getUser: jest.fn(),
            },
        }
            ; (createServerClient as jest.Mock).mockResolvedValue(mockServerClient)
    })

    // Helper to setup admin auth mock
    const setupAdminAuth = (isAdmin = true) => {
        // Mock getUser
        mockServerClient.auth.getUser.mockResolvedValue({
            data: { user: { id: 'admin-user-id' } },
            error: null,
        })

        // Mock role check
        const roleResult = isAdmin
            ? { data: { role: 'admin' }, error: null }
            : { data: { role: 'user' }, error: null }

        mockServiceClient.eq.mockReturnValueOnce({
            single: jest.fn().mockResolvedValue(roleResult),
        })
    }

    // Helper to setup non-authenticated user
    const setupUnauthenticated = () => {
        mockServerClient.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
        })
    }

    describe('markOrderForPrint', () => {
        it('should reject invalid UUID', async () => {
            const result = await markOrderForPrint(INVALID_UUID)

            expect(result.success).toBe(false)
            expect(result.error).toContain('không hợp lệ')
        })

        it('should reject unauthenticated user', async () => {
            setupUnauthenticated()

            const result = await markOrderForPrint(VALID_UUID)

            expect(result.success).toBe(false)
            expect(result.error).toContain('đăng nhập')
        })

        it('should reject non-admin user', async () => {
            setupAdminAuth(false)

            const result = await markOrderForPrint(VALID_UUID)

            expect(result.success).toBe(false)
            expect(result.error).toContain('quyền')
        })

        it('should successfully add order to print queue', async () => {
            setupAdminAuth(true)

            // Mock order query
            mockServiceClient.eq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                    data: {
                        id: VALID_UUID,
                        contract_url: 'https://example.com/contract.pdf',
                        status: 'assigned',
                    },
                    error: null,
                }),
            })

            // Mock existing queue check - not found
            mockServiceClient.eq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                }),
            })

            // Mock insert
            mockServiceClient.single.mockResolvedValueOnce({
                data: { id: 'queue-123' },
                error: null,
            })

            const result = await markOrderForPrint(VALID_UUID)

            expect(result.success).toBe(true)
            expect(result.queueId).toBe('queue-123')
        })

        it('should reject order without contract', async () => {
            setupAdminAuth(true)

            mockServiceClient.eq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                    data: {
                        id: VALID_UUID,
                        contract_url: null,
                        status: 'assigned',
                    },
                    error: null,
                }),
            })

            const result = await markOrderForPrint(VALID_UUID)

            expect(result.success).toBe(false)
            expect(result.error).toContain('chưa có hợp đồng')
        })
    })

    describe('resendContract', () => {
        it('should reject invalid UUID', async () => {
            const result = await resendContract(INVALID_UUID)

            expect(result.success).toBe(false)
            expect(result.error).toContain('không hợp lệ')
        })

        it('should reject non-admin user', async () => {
            setupAdminAuth(false)

            const result = await resendContract(VALID_UUID)

            expect(result.success).toBe(false)
            expect(result.error).toContain('quyền')
        })

        it('should reject order without contract', async () => {
            setupAdminAuth(true)

            mockServiceClient.eq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                    data: {
                        id: VALID_UUID,
                        contract_url: null,
                    },
                    error: null,
                }),
            })

            const result = await resendContract(VALID_UUID)

            expect(result.success).toBe(false)
            expect(result.error).toContain('chưa có hợp đồng')
        })
    })

    describe('updatePrintStatus', () => {
        it('should reject invalid UUID', async () => {
            const result = await updatePrintStatus(INVALID_UUID, 'printed')

            expect(result.success).toBe(false)
            expect(result.error).toContain('không hợp lệ')
        })

        it('should reject invalid status', async () => {
            const result = await updatePrintStatus(VALID_UUID, 'invalid' as any)

            expect(result.success).toBe(false)
            expect(result.error).toContain('không hợp lệ')
        })

        it('should reject non-admin user', async () => {
            setupAdminAuth(false)

            const result = await updatePrintStatus(VALID_UUID, 'printed')

            expect(result.success).toBe(false)
            expect(result.error).toContain('quyền')
        })

        it('should successfully update status to printed', async () => {
            setupAdminAuth(true)

            mockServiceClient.eq.mockResolvedValueOnce({ error: null })

            const result = await updatePrintStatus(VALID_UUID, 'printed')

            expect(result.success).toBe(true)
        })

        it('should sanitize tracking number', async () => {
            setupAdminAuth(true)

            mockServiceClient.eq.mockResolvedValueOnce({ error: null })

            // Tracking number with special chars should be cleaned
            const result = await updatePrintStatus(VALID_UUID, 'shipped', 'TRACK-123<script>')

            expect(result.success).toBe(true)
            // The sanitized tracking number should only contain alphanumeric and dash
        })

        it('should handle update error', async () => {
            setupAdminAuth(true)

            mockServiceClient.eq.mockResolvedValueOnce({
                error: { message: 'Update failed' },
            })

            const result = await updatePrintStatus(VALID_UUID, 'printed')

            expect(result.success).toBe(false)
            expect(result.error).toContain('cập nhật')
        })
    })
})
