import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminStoreOrdersPage from '../page'
import { redirect } from 'next/navigation'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { captureError } from '@/lib/monitoring'

jest.mock('next/navigation', () => ({
    redirect: jest.fn((url: string) => {
        throw new Error(`NEXT_REDIRECT: ${url}`)
    }),
}))

jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn(),
    createServiceRoleClient: jest.fn(),
}))

jest.mock('@/lib/monitoring', () => ({
    captureError: jest.fn(),
}))

jest.mock('@/components/admin/AdminStoreOrdersTable', () => {
    return function MockAdminStoreOrdersTable(props: any) {
        return (
            <div data-testid="mock-store-orders-table">
                <span data-testid="orders-count">{props.orders.length}</span>
                <span data-testid="current-status">{props.currentStatus || 'all'}</span>
            </div>
        )
    }
})

describe('AdminStoreOrdersPage', () => {
    let mockServerSupabase: any
    let mockServiceSupabase: any

    beforeEach(() => {
        jest.clearAllMocks()

        mockServerSupabase = {
            auth: {
                getUser: jest.fn().mockResolvedValue({
                    data: { user: { id: 'admin-1', email: 'admin@example.com' } },
                    error: null,
                }),
            },
        }
        ;(createServerClient as jest.Mock).mockResolvedValue(mockServerSupabase)

        mockServiceSupabase = {
            from: jest.fn(),
            rpc: jest.fn().mockResolvedValue({ error: null }),
        }
        ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockServiceSupabase)
    })

    it('redirects unauthenticated users to /auth/login', async () => {
        mockServerSupabase.auth.getUser.mockResolvedValueOnce({
            data: { user: null },
            error: null,
        })

        await expect(
            AdminStoreOrdersPage({ searchParams: Promise.resolve({}) })
        ).rejects.toThrow('NEXT_REDIRECT: /auth/login')
        expect(redirect).toHaveBeenCalledWith('/auth/login')
    })

    it('redirects non-admin users to /crm', async () => {
        mockServiceSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: { role: 'member' },
                        error: null,
                    }),
                }),
            }),
        })

        await expect(
            AdminStoreOrdersPage({ searchParams: Promise.resolve({}) })
        ).rejects.toThrow('NEXT_REDIRECT: /crm')
        expect(redirect).toHaveBeenCalledWith('/crm')
    })

    it('runs expire_pending_store_orders and renders orders table for admin', async () => {
        const mockOrders = [
            { id: 'ord-1', code: 'ORD-001', status: 'pending' },
            { id: 'ord-2', code: 'ORD-002', status: 'confirmed' },
        ]

        const queryChain: any = {
            select: jest.fn(() => queryChain),
            order: jest.fn(() => Promise.resolve({ data: mockOrders, error: null })),
        }

        mockServiceSupabase.from.mockImplementation((table: string) => {
            if (table === 'users') {
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { role: 'admin' },
                                error: null,
                            }),
                        }),
                    }),
                }
            }
            if (table === 'store_orders') {
                return queryChain
            }
            return {}
        })

        const ui = await AdminStoreOrdersPage({ searchParams: Promise.resolve({}) })
        render(ui)

        expect(mockServiceSupabase.rpc).toHaveBeenCalledWith('expire_pending_store_orders')
        expect(screen.getByText('Đơn hàng shop')).toBeInTheDocument()
        expect(screen.getByTestId('orders-count')).toHaveTextContent('2')
        expect(screen.getByTestId('current-status')).toHaveTextContent('all')
    })

    it('filters orders by valid status param and ignores invalid status param', async () => {
        const queryChainWithFilter: any = {
            select: jest.fn(() => queryChainWithFilter),
            order: jest.fn(() => queryChainWithFilter),
            eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        }

        mockServiceSupabase.from.mockImplementation((table: string) => {
            if (table === 'users') {
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { role: 'super_admin' },
                                error: null,
                            }),
                        }),
                    }),
                }
            }
            if (table === 'store_orders') {
                return queryChainWithFilter
            }
            return {}
        })

        const ui = await AdminStoreOrdersPage({
            searchParams: Promise.resolve({ status: 'confirmed' }),
        })
        render(ui)

        expect(queryChainWithFilter.eq).toHaveBeenCalledWith('status', 'confirmed')
        expect(screen.getByTestId('current-status')).toHaveTextContent('confirmed')
    })

    it('ignores invalid status param and lists all orders', async () => {
        const queryChain: any = {
            select: jest.fn(() => queryChain),
            order: jest.fn(() => Promise.resolve({ data: [], error: null })),
            eq: jest.fn(() => queryChain),
        }

        mockServiceSupabase.from.mockImplementation((table: string) => {
            if (table === 'users') {
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { role: 'admin' },
                                error: null,
                            }),
                        }),
                    }),
                }
            }
            if (table === 'store_orders') {
                return queryChain
            }
            return {}
        })

        const ui = await AdminStoreOrdersPage({
            searchParams: Promise.resolve({ status: 'unknown' }),
        })
        render(ui)

        expect(queryChain.eq).not.toHaveBeenCalled()
        expect(screen.getByTestId('current-status')).toHaveTextContent('all')
    })

    it('renders generic error banner and hides table when orders query fails', async () => {
        const queryChain: any = {
            select: jest.fn(() => queryChain),
            order: jest.fn(() =>
                Promise.resolve({ data: null, error: { message: 'DB connection failed' } })
            ),
        }

        mockServiceSupabase.from.mockImplementation((table: string) => {
            if (table === 'users') {
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { role: 'admin' },
                                error: null,
                            }),
                        }),
                    }),
                }
            }
            if (table === 'store_orders') {
                return queryChain
            }
            return {}
        })

        const ui = await AdminStoreOrdersPage({ searchParams: Promise.resolve({}) })
        render(ui)

        expect(captureError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({ context: 'AdminStoreOrdersPage.fetchOrders' })
        )
        expect(screen.getByText('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.')).toBeInTheDocument()
        expect(screen.queryByTestId('mock-store-orders-table')).not.toBeInTheDocument()
        // Raw PostgREST error must not leak to the UI
        expect(screen.queryByText(/DB connection failed/)).not.toBeInTheDocument()
    })

    it('captures error if expire_pending_store_orders fails without breaking page render', async () => {
        mockServiceSupabase.rpc.mockResolvedValueOnce({
            error: new Error('RPC timeout'),
        })

        const queryChain: any = {
            select: jest.fn(() => queryChain),
            order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        }

        mockServiceSupabase.from.mockImplementation((table: string) => {
            if (table === 'users') {
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { role: 'admin' },
                                error: null,
                            }),
                        }),
                    }),
                }
            }
            if (table === 'store_orders') {
                return queryChain
            }
            return {}
        })

        const ui = await AdminStoreOrdersPage({ searchParams: Promise.resolve({}) })
        render(ui)

        expect(captureError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({ context: 'AdminStoreOrdersPage.lazyExpire' })
        )
        expect(screen.getByText('Đơn hàng shop')).toBeInTheDocument()
    })
})
