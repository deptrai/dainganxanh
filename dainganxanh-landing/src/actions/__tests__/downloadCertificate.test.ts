import { downloadCertificate } from '../downloadCertificate'
import { createServerClient } from '@/lib/supabase/server'

// Mock the Supabase server client (for auth check)
jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn(),
}))

// Mock @supabase/supabase-js createClient (used for admin/service-role queries)
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(),
}))

import { createClient } from '@supabase/supabase-js'

// Mock fetch
global.fetch = jest.fn()

describe('downloadCertificate', () => {
    let mockAuthClient: any   // createServerClient — auth only
    let mockAdminClient: any  // createClient (service role) — order query + storage

    beforeEach(() => {
        jest.clearAllMocks()

        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
        process.env.NEXT_PUBLIC_BASE_URL = 'https://dainganxanh.com.vn'

        // Admin client mock — handles order query chain + storage
        const mockSingle = jest.fn()
        const mockAdminFrom = jest.fn(() => ({
            select: () => mockAdminFrom(),
            eq: () => mockAdminFrom(),
            single: mockSingle,
            _single: mockSingle, // expose for setup
        }))

        const mockCreateSignedUrl = jest.fn()

        mockAdminClient = {
            from: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: mockSingle,
            })),
            storage: {
                from: jest.fn(() => ({
                    createSignedUrl: mockCreateSignedUrl,
                })),
            },
            _single: mockSingle,
            _createSignedUrl: mockCreateSignedUrl,
        }

        ;(createClient as jest.Mock).mockReturnValue(mockAdminClient)

        // Auth client mock — createServerClient — only needs auth.getUser
        mockAuthClient = {
            auth: {
                getUser: jest.fn(),
            },
        }
        ;(createServerClient as jest.Mock).mockResolvedValue(mockAuthClient)
    })

    // Helper: get the shared single mock from admin client
    function adminSingle() {
        return mockAdminClient._single
    }
    function adminSignedUrl() {
        return mockAdminClient._createSignedUrl
    }

    describe('Happy Path', () => {
        it('should successfully generate certificate and return signed URL', async () => {
            const orderId = 'order-123'
            const userId = 'user-456'

            mockAuthClient.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
            })

            adminSingle().mockResolvedValue({
                data: {
                    id: orderId,
                    order_code: 'DNX-2026-001',
                    quantity: 5,
                    created_at: '2026-01-01',
                    user_id: userId,
                    users: { full_name: 'Nguyen Van A', email: 'test@example.com' },
                    lots: { name: 'Lo A1', region: 'Khu vuc Dong Bac' },
                    trees: [
                        { code: 'TREE-001', planted_at: '2026-01-15' },
                        { code: 'TREE-002', planted_at: '2026-01-15' },
                    ],
                },
                error: null,
            })

            ;(global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    success: true,
                    filePath: `${userId}/certificate-DNX-2026-001-1234567890.pdf`,
                }),
            })

            adminSignedUrl().mockResolvedValue({
                data: { signedUrl: 'https://test.supabase.co/storage/v1/object/sign/certificates/test.pdf?token=xxx' },
                error: null,
            })

            const result = await downloadCertificate(orderId)

            expect(result.success).toBe(true)
            expect(result.pdfUrl).toContain('https://test.supabase.co/storage')
            expect(global.fetch).toHaveBeenCalledWith(
                'https://test.supabase.co/functions/v1/generate-certificate',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer test-service-key',
                    },
                })
            )
        })
    })

    describe('Error Handling', () => {
        it('should return error when user is not authenticated', async () => {
            mockAuthClient.auth.getUser.mockResolvedValue({
                data: { user: null },
            })

            const result = await downloadCertificate('order-123')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Chưa đăng nhập')
        })

        it('should return error when order is not found', async () => {
            mockAuthClient.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-456' } },
            })

            adminSingle().mockResolvedValue({
                data: null,
                error: { message: 'Order not found' },
            })

            const result = await downloadCertificate('order-123')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Không tìm thấy đơn hàng')
        })

        it('should return error when Edge Function fails', async () => {
            mockAuthClient.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-456' } },
            })

            adminSingle().mockResolvedValue({
                data: {
                    id: 'order-123',
                    order_code: 'DNX-2026-001',
                    quantity: 5,
                    user_id: 'user-456',
                    users: { full_name: 'Test', email: 'test@example.com' },
                    trees: [],
                },
                error: null,
            })

            ;(global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                json: jest.fn().mockResolvedValue({ success: false, error: 'PDF generation failed' }),
            })

            const result = await downloadCertificate('order-123')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Không thể tạo chứng chỉ')
        })

        it('should return error when signed URL generation fails', async () => {
            mockAuthClient.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-456' } },
            })

            adminSingle().mockResolvedValue({
                data: {
                    id: 'order-123',
                    order_code: 'DNX-2026-001',
                    quantity: 5,
                    user_id: 'user-456',
                    users: { full_name: 'Test', email: 'test@example.com' },
                    trees: [],
                },
                error: null,
            })

            ;(global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true, filePath: 'user-456/certificate-test.pdf' }),
            })

            adminSignedUrl().mockResolvedValue({
                data: null,
                error: { message: 'Failed to create signed URL' },
            })

            const result = await downloadCertificate('order-123')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Không thể tạo liên kết tải xuống')
        })

        it('should handle missing environment variables', async () => {
            const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            delete process.env.NEXT_PUBLIC_SUPABASE_URL

            mockAuthClient.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-456' } },
            })

            adminSingle().mockResolvedValue({
                data: {
                    id: 'order-123',
                    order_code: 'DNX-2026-001',
                    quantity: 5,
                    user_id: 'user-456',
                    users: { full_name: 'Test', email: 'test@example.com' },
                    trees: [],
                },
                error: null,
            })

            const result = await downloadCertificate('order-123')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Cấu hình hệ thống không hợp lệ')

            process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl
        })
    })

    describe('Edge Cases', () => {
        it('should handle order with no trees assigned', async () => {
            const orderId = 'order-123'
            const userId = 'user-456'

            mockAuthClient.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
            })

            adminSingle().mockResolvedValue({
                data: {
                    id: orderId,
                    order_code: 'DNX-2026-001',
                    quantity: 5,
                    user_id: userId,
                    users: { full_name: 'Test', email: 'test@example.com' },
                    trees: [],
                },
                error: null,
            })

            ;(global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true, filePath: 'test.pdf' }),
            })

            adminSignedUrl().mockResolvedValue({
                data: { signedUrl: 'https://test.com/pdf' },
                error: null,
            })

            const result = await downloadCertificate(orderId)

            expect(result.success).toBe(true)
        })

        it('should handle order without lot assignment', async () => {
            const orderId = 'order-123'
            const userId = 'user-456'

            mockAuthClient.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
            })

            adminSingle().mockResolvedValue({
                data: {
                    id: orderId,
                    order_code: 'DNX-2026-001',
                    quantity: 5,
                    user_id: userId,
                    users: { full_name: 'Test', email: 'test@example.com' },
                    lots: null,
                    trees: [{ code: 'TREE-001' }],
                },
                error: null,
            })

            ;(global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true, filePath: 'test.pdf' }),
            })

            adminSignedUrl().mockResolvedValue({
                data: { signedUrl: 'https://test.com/pdf' },
                error: null,
            })

            const result = await downloadCertificate(orderId)

            expect(result.success).toBe(true)
        })
    })
})
