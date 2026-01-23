import { getAvailableBalance, requestWithdrawal, approveWithdrawal, rejectWithdrawal } from '../withdrawals'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'

// Mock Supabase clients
jest.mock('@/lib/supabase/server', () => ({
    createServiceRoleClient: jest.fn(),
    createServerClient: jest.fn(),
}))

describe('Withdrawal Actions', () => {
    let mockServiceClient: any
    let mockServerClient: any

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
                admin: {
                    listUsers: jest.fn().mockResolvedValue({
                        data: {
                            users: [{ id: 'admin-1', email: 'admin@example.com' }]
                        },
                        error: null
                    }),
                    getUserById: jest.fn().mockResolvedValue({
                        data: {
                            user: {
                                email: 'user@example.com',
                                user_metadata: { full_name: 'User A' }
                            }
                        },
                        error: null
                    }),
                }
            },
        }
            ; (createServerClient as jest.Mock).mockResolvedValue(mockServerClient)
    })

    describe('getAvailableBalance', () => {
        it('should call createServerClient', async () => {
            // Mock balance calculation chain
            mockServerClient.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ data: [] })
                    })
                })
            })

            await getAvailableBalance('test-user')
            expect(createServerClient).toHaveBeenCalled()
        })
    })

    describe('requestWithdrawal', () => {
        beforeAll(() => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true }),
                })
            ) as jest.Mock;
        })

        it('should call fetch to edge function on success', async () => {
            mockServerClient.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123', email: 'test@example.com', full_name: 'Nguyen Van A' } },
                error: null
            })

            mockServerClient.from = jest.fn().mockImplementation((table) => {
                // console.log('MOCK FROM CALLED WITH:', table)

                if (table === 'users') {
                    const usersChain = {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        in: jest.fn().mockResolvedValue({ data: [{ id: 'admin-1' }] }),
                        single: jest.fn().mockResolvedValue({ data: { full_name: 'Nguyen Van A' } }),
                        then: (resolve: any) => resolve({ data: [] })
                    }
                    return usersChain
                }
                // Orders mock: returns high balance
                if (table === 'orders') {
                    const ordersChain = {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        in: jest.fn().mockImplementation(() => {
                            // console.log('Orders IN called, returning 10M')
                            return Promise.resolve({ data: [{ total_amount: 10000000 }] })
                        }),
                        then: (resolve: any) => resolve({ data: [] })
                    }
                    return ordersChain
                }

                // Withdrawals mock: returns empty list for balance, inserts for request
                if (table === 'withdrawals') {
                    const mockInsertChain = {
                        select: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: { id: 'w-123' }, error: null }),
                        then: (resolve: any) => resolve({ data: { id: 'w-123' }, error: null })
                    }

                    const withdrawalsChain = {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        in: jest.fn().mockResolvedValue({ data: [] }),
                        single: jest.fn().mockResolvedValue({ data: [] }),
                        insert: jest.fn().mockReturnValue(mockInsertChain),
                        then: (resolve: any) => resolve({ data: [] })
                    }
                    return withdrawalsChain
                }

                // Referral clicks: returns mock order ID
                if (table === 'referral_clicks') {
                    const clicksChain = {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        then: (resolve: any) => resolve({ data: [{ order_id: 'order-1' }] })
                    }
                    return clicksChain
                }

                // Commission withdrawals: returns empty list
                if (table === 'commission_withdrawals') {
                    const commWithdrawalsChain = {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        in: jest.fn().mockResolvedValue({ data: [] }),
                        then: (resolve: any) => resolve({ data: [] })
                    }
                    return commWithdrawalsChain
                }

                // Default fallback
                const fallbackInsertChain = {
                    select: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { id: 'w-123' }, error: null }),
                    then: (resolve: any) => resolve({ data: { id: 'w-123' }, error: null })
                }

                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    in: jest.fn().mockReturnThis(),
                    single: jest.fn().mockReturnThis(),
                    insert: jest.fn().mockReturnValue(fallbackInsertChain),
                    then: (resolve: any) => resolve({ data: [] })
                }
            })

            const result = await requestWithdrawal({
                amount: 200000,
                bankName: 'VCB',
                bankAccountNumber: '123',
                bankAccountName: 'Nguyen Van A'
            })

            expect(result.success).toBe(true)
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('send-withdrawal-email'),
                expect.any(Object)
            )
        })
    })

    describe('approveWithdrawal', () => {
        it('should call fetch to edge function on success', async () => {
            mockServerClient.auth.getUser.mockResolvedValue({
                data: { user: { id: 'admin-1' } },
                error: null
            })

            // Chain for approve
            mockServerClient.from = jest.fn().mockImplementation((table) => {
                if (table === 'withdrawals') {
                    const withdrawalsChain = {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: 'w-123',
                                amount: 200000,
                                user_id: 'user-123',
                                bank_name: 'VCB',
                                bank_account_number: '123',
                                bank_account_name: 'Nguyen Van A'
                            }
                        }),
                        update: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                select: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({
                                        data: {
                                            id: 'w-123',
                                            status: 'approved',
                                            user_id: 'user-123',
                                            amount: 200000,
                                            bank_name: 'VCB',
                                            bank_account_number: '123',
                                            bank_account_name: 'Nguyen Van A'
                                        }
                                    })
                                })
                            })
                        }),
                        then: (resolve: any) => resolve({ data: [] })
                    }
                    return withdrawalsChain
                }
                if (table === 'users') {
                    const usersChain = {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                full_name: 'Nguyen Van A',
                                email: 'test@example.com',
                                role: 'admin',
                                user_metadata: { full_name: 'Nguyen Van A' }
                            }
                        }),
                        then: (resolve: any) => resolve({ data: [] })
                    }
                    return usersChain
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    in: jest.fn().mockReturnThis(),
                    single: jest.fn().mockReturnThis(),
                    insert: jest.fn().mockResolvedValue({ data: { id: 'w-123' }, error: null }),
                    then: (resolve: any) => resolve({ data: [] })
                }
            })

            await approveWithdrawal('w-123', 'https://proof.url/img.png')

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('send-withdrawal-email'),
                expect.objectContaining({
                    body: expect.stringContaining('request_approved')
                })
            )
        })
    })

    describe('rejectWithdrawal', () => {
        it('should call fetch to edge function on rejection', async () => {
            mockServerClient.auth.getUser.mockResolvedValue({
                data: { user: { id: 'admin-1' } },
                error: null
            })

            mockServerClient.from = jest.fn().mockImplementation((table) => {
                if (table === 'withdrawals') {
                    const withdrawalsChain = {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: 'w-123',
                                amount: 200000,
                                user_id: 'user-123',
                                bank_name: 'VCB',
                                bank_account_number: '123',
                                bank_account_name: 'Nguyen Van A'
                            }
                        }),
                        update: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                select: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({
                                        data: {
                                            id: 'w-123',
                                            status: 'rejected',
                                            user_id: 'user-123',
                                            amount: 200000,
                                            bank_name: 'VCB',
                                            bank_account_number: '123',
                                            bank_account_name: 'Nguyen Van A'
                                        }
                                    })
                                })
                            })
                        }),
                        then: (resolve: any) => resolve({ data: [] })
                    }
                    return withdrawalsChain
                }
                if (table === 'users') {
                    const usersChain = {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                full_name: 'Nguyen Van A',
                                email: 'test@example.com',
                                role: 'admin',
                                user_metadata: { full_name: 'Nguyen Van A' }
                            }
                        }),
                        then: (resolve: any) => resolve({ data: [] })
                    }
                    return usersChain
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    in: jest.fn().mockReturnThis(),
                    single: jest.fn().mockReturnThis(),
                    insert: jest.fn().mockResolvedValue({ data: { id: 'w-123' }, error: null }),
                    then: (resolve: any) => resolve({ data: [] })
                }
            })

            await rejectWithdrawal('w-123', 'Invalid bank info')

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('send-withdrawal-email'),
                expect.objectContaining({
                    body: expect.stringContaining('request_rejected')
                })
            )
        })
    })
})
