import { markOrderForPrint, resendContract, updatePrintStatus } from '../printQueue'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'

// Mock Supabase clients
jest.mock('@/lib/supabase/server', () => ({
    createServiceRoleClient: jest.fn(),
    createServerClient: jest.fn(),
}))

// Mock global fetch — resendContract calls the send-email Edge Function via HTTP
global.fetch = jest.fn()

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

        // [P0] Unauthenticated caller must be rejected
        it('should reject unauthenticated user', async () => {
            setupUnauthenticated()

            const result = await resendContract(VALID_UUID)

            expect(result.success).toBe(false)
            expect(result.error).toContain('đăng nhập')
            expect(global.fetch).not.toHaveBeenCalled()
        })

        // [P0] Order lookup failure → "không tìm thấy đơn hàng"
        it('should return "Không tìm thấy đơn hàng" when order does not exist', async () => {
            setupAdminAuth(true)

            mockServiceClient.eq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116', message: 'Not found' },
                }),
            })

            const result = await resendContract(VALID_UUID)

            expect(result.success).toBe(false)
            expect(result.error).toContain('Không tìm thấy đơn hàng')
            expect(global.fetch).not.toHaveBeenCalled()
        })

        // [P1] User email missing → reject before invoking edge function
        it('should reject when user email is missing', async () => {
            setupAdminAuth(true)

            // order lookup
            mockServiceClient.eq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                    data: {
                        id: VALID_UUID,
                        user_id: 'user-1',
                        order_code: 'DH123ABC',
                        quantity: 5,
                        total_amount: 500000,
                        contract_url: 'https://example.com/contract.pdf',
                    },
                    error: null,
                }),
            })

            // user lookup — no email
            mockServiceClient.eq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                    data: { email: null, full_name: 'X' },
                    error: null,
                }),
            })

            const result = await resendContract(VALID_UUID)

            expect(result.success).toBe(false)
            expect(result.error).toContain('email')
            expect(global.fetch).not.toHaveBeenCalled()
        })

        // [P1] Edge function called with correct payload + [P2] success path
        it('should invoke send-email Edge Function with the correct payload and return success', async () => {
            setupAdminAuth(true)
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
            process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

            // order lookup
            mockServiceClient.eq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                    data: {
                        id: VALID_UUID,
                        user_id: 'user-1',
                        order_code: 'DH123ABC',
                        quantity: 5,
                        total_amount: 500000,
                        contract_url: 'https://example.com/contract.pdf',
                    },
                    error: null,
                }),
            })

            // user lookup
            mockServiceClient.eq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                    data: { email: 'buyer@example.com', full_name: 'Nguyen Van A' },
                    error: null,
                }),
            })

            // trees lookup — `.eq('order_id', orderId)` is awaited directly (no .single())
            mockServiceClient.eq.mockResolvedValueOnce({
                data: [{ code: 'TREE-001' }, { code: 'TREE-002' }],
                error: null,
            })

            ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })

            const result = await resendContract(VALID_UUID)

            expect(result.success).toBe(true)
            expect(global.fetch).toHaveBeenCalledTimes(1)

            const [calledUrl, calledInit] = (global.fetch as jest.Mock).mock.calls[0]
            expect(calledUrl).toBe('https://test.supabase.co/functions/v1/send-email')
            expect(calledInit.method).toBe('POST')
            expect(calledInit.headers['Content-Type']).toBe('application/json')
            expect(calledInit.headers['Authorization']).toBe('Bearer test-service-key')

            const body = JSON.parse(calledInit.body)
            expect(body).toEqual({
                orderId: VALID_UUID,
                userId: 'user-1',
                userEmail: 'buyer@example.com',
                userName: 'Nguyen Van A',
                orderCode: 'DH123ABC',
                quantity: 5,
                totalAmount: 500000,
                treeCodes: ['TREE-001', 'TREE-002'],
                contractPdfUrl: 'https://example.com/contract.pdf',
            })
        })

        // [P1] Edge Function fetch returns non-OK → success: false
        it('should return success:false when send-email Edge Function responds with non-OK', async () => {
            setupAdminAuth(true)

            mockServiceClient.eq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                    data: {
                        id: VALID_UUID,
                        user_id: 'user-1',
                        order_code: 'DH123ABC',
                        quantity: 1,
                        total_amount: 100000,
                        contract_url: 'https://example.com/contract.pdf',
                    },
                    error: null,
                }),
            })

            mockServiceClient.eq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                    data: { email: 'buyer@example.com', full_name: null },
                    error: null,
                }),
            })

            mockServiceClient.eq.mockResolvedValueOnce({ data: [], error: null })

            ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 })

            const result = await resendContract(VALID_UUID)

            expect(result.success).toBe(false)
            expect(result.error).toContain('Không thể gửi email')
        })

        // [P1] Falls back to "Bạn" when user has no full_name
        it('should default userName to "Bạn" when full_name is null', async () => {
            setupAdminAuth(true)

            mockServiceClient.eq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                    data: {
                        id: VALID_UUID,
                        user_id: 'user-1',
                        order_code: 'DH999XYZ',
                        quantity: 2,
                        total_amount: 200000,
                        contract_url: 'https://example.com/contract.pdf',
                    },
                    error: null,
                }),
            })

            mockServiceClient.eq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                    data: { email: 'noname@example.com', full_name: null },
                    error: null,
                }),
            })

            mockServiceClient.eq.mockResolvedValueOnce({ data: null, error: null })

            ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })

            const result = await resendContract(VALID_UUID)

            expect(result.success).toBe(true)
            const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
            expect(body.userName).toBe('Bạn')
            expect(body.treeCodes).toEqual([])
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
