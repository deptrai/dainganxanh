import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock Supabase
const mockSupabase = {
    from: jest.fn(),
    auth: {
        getUser: jest.fn(),
        admin: {
            listUsers: jest.fn(),
            getUserById: jest.fn()
        }
    }
}

const mockSendEmail = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn(() => Promise.resolve(mockSupabase))
}))

jest.mock('@/lib/email', () => ({
    sendEmail: mockSendEmail
}))

// Import after mocks
import { getAvailableBalance, requestWithdrawal, approveWithdrawal, rejectWithdrawal } from '../withdrawals'

describe('Withdrawal Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getAvailableBalance', () => {
        it('should calculate balance correctly with no conversions', async () => {
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ data: [] })
                    })
                })
            })

            const balance = await getAvailableBalance('user-123')
            expect(balance).toBe(0)
        })

        it('should calculate balance with conversions and no withdrawals', async () => {
            // Mock referral clicks
            mockSupabase.from.mockImplementation((table) => {
                if (table === 'referral_clicks') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockResolvedValue({
                                    data: [
                                        { order_id: 'order-1' },
                                        { order_id: 'order-2' }
                                    ]
                                })
                            })
                        })
                    }
                }
                if (table === 'orders') {
                    return {
                        select: jest.fn().mockReturnValue({
                            in: jest.fn().mockResolvedValue({
                                data: [
                                    { total_amount: 1000000 },
                                    { total_amount: 2000000 }
                                ]
                            })
                        })
                    }
                }
                if (table === 'withdrawals') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockResolvedValue({ data: [] })
                            })
                        })
                    }
                }
            })

            const balance = await getAvailableBalance('user-123')
            // 5% of 3,000,000 = 150,000
            expect(balance).toBe(150000)
        })

        it('should subtract approved withdrawals from balance', async () => {
            mockSupabase.from.mockImplementation((table) => {
                if (table === 'referral_clicks') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockResolvedValue({
                                    data: [{ order_id: 'order-1' }]
                                })
                            })
                        })
                    }
                }
                if (table === 'orders') {
                    return {
                        select: jest.fn().mockReturnValue({
                            in: jest.fn().mockResolvedValue({
                                data: [{ total_amount: 4000000 }]
                            })
                        })
                    }
                }
                if (table === 'withdrawals') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockResolvedValue({
                                    data: [
                                        { amount: 100000 },
                                        { amount: 50000 }
                                    ]
                                })
                            })
                        })
                    }
                }
            })

            const balance = await getAvailableBalance('user-123')
            // 5% of 4,000,000 = 200,000 - 150,000 = 50,000
            expect(balance).toBe(50000)
        })
    })

    describe('requestWithdrawal', () => {
        it('should reject if user not authenticated', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Not authenticated')
            })

            const result = await requestWithdrawal({
                amount: 200000,
                bankName: 'Vietcombank',
                bankAccountNumber: '123456789',
                bankAccountName: 'NGUYEN VAN A'
            })

            expect(result.success).toBe(false)
            expect(result.error).toBe('Unauthorized')
        })

        it('should reject if bank account name does not match user full name', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123' } },
                error: null
            })

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: {
                                full_name: 'Nguyễn Văn A',
                                email: 'test@example.com'
                            }
                        })
                    })
                })
            })

            const result = await requestWithdrawal({
                amount: 200000,
                bankName: 'Vietcombank',
                bankAccountNumber: '123456789',
                bankAccountName: 'TRAN THI B' // Different name
            })

            expect(result.success).toBe(false)
            expect(result.error).toContain('không khớp')
        })

        it('should accept Vietnamese names with diacritics', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123' } },
                error: null
            })

            mockSupabase.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({
                                    data: {
                                        full_name: 'Nguyễn Văn A',
                                        email: 'test@example.com'
                                    }
                                })
                            })
                        })
                    }
                }
                if (table === 'referral_clicks') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockResolvedValue({ data: [] })
                            })
                        })
                    }
                }
                if (table === 'withdrawals') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockResolvedValue({ data: [] })
                            })
                        }),
                        insert: jest.fn().mockResolvedValue({ error: null })
                    }
                }
            })

            // Mock getAvailableBalance to return enough balance
            jest.spyOn(global, 'getAvailableBalance').mockResolvedValue(500000)

            const result = await requestWithdrawal({
                amount: 200000,
                bankName: 'Vietcombank',
                bankAccountNumber: '123456789',
                bankAccountName: 'Nguyen Van A' // No diacritics, but should match
            })

            expect(result.success).toBe(true)
        })

        it('should reject if amount is less than minimum', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123' } },
                error: null
            })

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: {
                                full_name: 'Nguyễn Văn A',
                                email: 'test@example.com'
                            }
                        })
                    })
                })
            })

            const result = await requestWithdrawal({
                amount: 100000, // Less than 200k minimum
                bankName: 'Vietcombank',
                bankAccountNumber: '123456789',
                bankAccountName: 'NGUYEN VAN A'
            })

            expect(result.success).toBe(false)
            expect(result.error).toContain('200,000')
        })
    })

    describe('approveWithdrawal', () => {
        it('should reject if user is not admin', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123' } },
                error: null
            })

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { role: 'user' } // Not admin
                        })
                    })
                })
            })

            const result = await approveWithdrawal('withdrawal-123', 'https://example.com/proof.jpg')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Unauthorized')
        })
    })

    describe('rejectWithdrawal', () => {
        it('should reject if user is not admin', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123' } },
                error: null
            })

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { role: 'user' } // Not admin
                        })
                    })
                })
            })

            const result = await rejectWithdrawal('withdrawal-123', 'Invalid request')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Unauthorized')
        })
    })
})
