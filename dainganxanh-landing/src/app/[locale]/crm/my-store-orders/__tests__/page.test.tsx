/**
 * @jest-environment jsdom
 */
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import MyStoreOrdersPage from '../page'
import { getScopedCrmClient } from '@/lib/supabase/scopedClient'
import { redirect } from '@/i18n/navigation'
import { captureError } from '@/lib/monitoring'

jest.mock('@/i18n/navigation', () => ({
    redirect: jest.fn().mockImplementation((target: any) => {
        const url = typeof target === 'string' ? target : target.href
        throw new Error(`NEXT_REDIRECT: ${url}`)
    }),
    Link: ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
    useRouter: () => ({ push: jest.fn() }),
    usePathname: () => '/crm/my-store-orders',
}))

jest.mock('next/navigation', () => ({
    redirect: jest.fn().mockImplementation((url: string) => {
        throw new Error(`NEXT_REDIRECT: ${url}`)
    }),
    useRouter: () => ({ push: jest.fn() }),
    usePathname: () => '/crm/my-store-orders',
    useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/lib/supabase/scopedClient', () => ({
    getScopedCrmClient: jest.fn(),
}))

jest.mock('@/lib/monitoring', () => ({
    captureError: jest.fn(),
}))

describe('MyStoreOrdersPage', () => {
    let mockSupabase: {
        rpc: jest.Mock
        from: jest.Mock
        select: jest.Mock
        eq: jest.Mock
        order: jest.Mock
        range: jest.Mock
    }

    const mockOrderRow = {
        id: 'so-1',
        code: 'ORD-TEST01',
        status: 'pending',
        total_amount: 450000,
        shipping_fee: 30000,
        payment_method: 'banking',
        shipping_address: '123 Phố Huế, Hà Nội',
        tracking_number: 'TRK12345',
        created_at: '2026-09-01T12:00:00Z',
        store_order_items: [
            {
                id: 'soi-1',
                quantity: 2,
                unit_price: 210000,
                products: {
                    name: 'Nhang Trầm Tự Nhiên',
                    slug: 'nhang-tram-tu-nhien',
                    images: ['https://example.com/nhang.jpg'],
                },
            },
        ],
    }

    beforeEach(() => {
        jest.clearAllMocks()

        mockSupabase = {
            rpc: jest.fn().mockResolvedValue({ error: null }),
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({
                data: [mockOrderRow],
                error: null,
                count: 1,
            }),
        }
    })

    it('redirects to login when not authenticated', async () => {
        ;(getScopedCrmClient as jest.Mock).mockResolvedValue(null)

        await expect(
            MyStoreOrdersPage({ searchParams: Promise.resolve({}) })
        ).rejects.toThrow('NEXT_REDIRECT: /login?redirect=/crm/my-store-orders')

        expect(redirect).toHaveBeenCalledWith(
            expect.objectContaining({ href: '/login?redirect=/crm/my-store-orders' })
        )
    })

    it('calls rpc("expire_pending_store_orders") before querying store orders', async () => {
        ;(getScopedCrmClient as jest.Mock).mockResolvedValue({
            client: mockSupabase,
            effectiveUserId: 'user-456',
        })

        const Page = await MyStoreOrdersPage({ searchParams: Promise.resolve({}) })
        renderWithIntl(Page)

        expect(mockSupabase.rpc).toHaveBeenCalledWith('expire_pending_store_orders')
        expect(mockSupabase.from).toHaveBeenCalledWith('store_orders')
        expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-456')
        expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
        expect(mockSupabase.range).toHaveBeenCalledWith(0, 19)
    })

    it('handles expire_pending_store_orders error gracefully and logs to sentry', async () => {
        mockSupabase.rpc.mockResolvedValue({
            error: { message: 'RPC execution failed' },
        })

        ;(getScopedCrmClient as jest.Mock).mockResolvedValue({
            client: mockSupabase,
            effectiveUserId: 'user-456',
        })

        const Page = await MyStoreOrdersPage({ searchParams: Promise.resolve({}) })
        renderWithIntl(Page)

        expect(captureError).toHaveBeenCalledWith(
            expect.any(Error),
            { context: 'MyStoreOrdersPage.lazyExpire', effectiveUserId: 'user-456' }
        )
        expect(screen.getByText('ORD-TEST01', { exact: false })).toBeInTheDocument()
    })

    it('renders error state on Supabase fetch failure', async () => {
        ;(getScopedCrmClient as jest.Mock).mockResolvedValue({
            client: mockSupabase,
            effectiveUserId: 'user-456',
        })
        mockSupabase.range.mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
            count: null,
        })

        const Page = await MyStoreOrdersPage({ searchParams: Promise.resolve({}) })
        renderWithIntl(Page)

        expect(
            screen.getByText('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.')
        ).toBeInTheDocument()
        expect(captureError).toHaveBeenCalledWith(
            expect.any(Error),
            { context: 'MyStoreOrdersPage', effectiveUserId: 'user-456' }
        )
    })

    it('handles pagination parameters correctly', async () => {
        ;(getScopedCrmClient as jest.Mock).mockResolvedValue({
            client: mockSupabase,
            effectiveUserId: 'user-456',
        })

        await MyStoreOrdersPage({ searchParams: Promise.resolve({ page: '3' }) })

        expect(mockSupabase.range).toHaveBeenCalledWith(40, 59)
    })

    it('handles product.images as an array or product as an array', async () => {
        const orderWithArrayProduct = {
            ...mockOrderRow,
            id: 'so-2',
            code: 'ORD-ARRAY',
            store_order_items: [
                {
                    id: 'soi-2',
                    quantity: 1,
                    unit_price: 100000,
                    products: [
                        {
                            name: 'Sản phẩm mảng',
                            slug: 'san-pham-mang',
                            images: ['https://example.com/p.jpg'],
                        },
                    ],
                },
            ],
        }

        mockSupabase.range.mockResolvedValue({
            data: [orderWithArrayProduct],
            error: null,
            count: 1,
        })

        ;(getScopedCrmClient as jest.Mock).mockResolvedValue({
            client: mockSupabase,
            effectiveUserId: 'user-456',
        })

        const Page = await MyStoreOrdersPage({ searchParams: Promise.resolve({}) })
        renderWithIntl(Page)

        expect(screen.getByText('ORD-ARRAY', { exact: false })).toBeInTheDocument()
    })
})
