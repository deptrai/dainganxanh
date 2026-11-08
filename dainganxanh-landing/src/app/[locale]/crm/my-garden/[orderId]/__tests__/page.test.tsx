/**
 * @jest-environment jsdom
 */
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import PackageDetailPage from '../page'

jest.mock('@/i18n/navigation', () => ({
    redirect: jest.fn().mockImplementation((target: any) => {
        const url = typeof target === 'string' ? target : target.href
        throw new Error(`NEXT_REDIRECT: ${url}`)
    }),
    Link: ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
    useRouter: () => ({ push: jest.fn() }),
    usePathname: () => '/crm/my-garden/order-1',
}))

jest.mock('next/navigation', () => ({
    redirect: jest.fn().mockImplementation((url: string) => {
        throw new Error(`NEXT_REDIRECT: ${url}`)
    }),
    notFound: jest.fn().mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND')
    }),
    useRouter: () => ({ push: jest.fn() }),
    usePathname: () => '/crm/my-garden/order-1',
}))

jest.mock('@/lib/supabase/scopedClient', () => ({
    getScopedCrmClient: jest.fn(),
}))

jest.mock('@/components/crm/PackageDetailHeader', () => ({
    __esModule: true,
    default: ({ packageCode }: { packageCode: string }) => <div data-testid="package-header">{packageCode}</div>,
}))
jest.mock('@/components/crm/LotMap', () => ({
    __esModule: true,
    default: () => <div data-testid="lot-map" />,
}))
jest.mock('@/components/crm/TreeTimeline', () => ({
    __esModule: true,
    default: () => <div data-testid="tree-timeline" />,
}))
jest.mock('@/components/crm/PhotoGallery', () => ({
    __esModule: true,
    default: () => <div data-testid="photo-gallery" />,
}))
jest.mock('@/components/crm/QuarterlyReports', () => ({
    __esModule: true,
    default: () => <div data-testid="quarterly-reports" />,
}))
jest.mock('@/components/crm/GrowthMetrics', () => ({
    __esModule: true,
    default: () => <div data-testid="growth-metrics" />,
}))
jest.mock('@/components/crm/TreeCard', () => ({
    __esModule: true,
    default: () => <div data-testid="tree-card" />,
}))
jest.mock('@/components/crm/FarmCamera', () => ({
    __esModule: true,
    default: () => <div data-testid="farm-camera" />,
}))
jest.mock('@/components/crm/CertificateDownloadButton', () => ({
    CertificateDownloadButton: () => <div data-testid="cert-btn" />,
}))

import { getScopedCrmClient } from '@/lib/supabase/scopedClient'
import { notFound } from 'next/navigation'
import { redirect } from '@/i18n/navigation'

describe('PackageDetailPage (my-garden/[orderId])', () => {
    const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn(),
    }

    const mockOrder = {
        id: 'order-1',
        order_code: 'PKG-2026-ORD123',
        quantity: 5,
        status: 'paid',
        tree_status: 'growing',
        planted_at: '2026-01-01',
        co2_absorbed: 100,
        latest_photo_url: null,
        created_at: '2026-01-01T00:00:00Z',
        lot_id: null,
        unit_price: 15000000,
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('redirects to login when unauthenticated', async () => {
        ;(getScopedCrmClient as jest.Mock).mockResolvedValue(null)

        await expect(PackageDetailPage({ params: Promise.resolve({ orderId: 'order-1', locale: 'vi' }) })).rejects.toThrow(
            'NEXT_REDIRECT: /login?redirect=/crm/my-garden'
        )
        expect(redirect).toHaveBeenCalledWith(
            expect.objectContaining({ href: '/login?redirect=/crm/my-garden' })
        )
    })

    it('throws notFound() khi order không tồn tại hoặc không thuộc user', async () => {
        ;(getScopedCrmClient as jest.Mock).mockResolvedValue({
            client: mockSupabase,
            effectiveUserId: 'user-123',
        })
        mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Row not found' } })

        await expect(PackageDetailPage({ params: Promise.resolve({ orderId: 'order-999', locale: 'vi' }) })).rejects.toThrow(
            'NEXT_NOT_FOUND'
        )
        expect(notFound).toHaveBeenCalled()
    })

    it('renders chi tiết đơn hàng khi order hợp lệ và thuộc sở hữu của user', async () => {
        ;(getScopedCrmClient as jest.Mock).mockResolvedValue({
            client: mockSupabase,
            effectiveUserId: 'user-123',
        })
        mockSupabase.single.mockResolvedValue({ data: mockOrder, error: null })
        // Second call for trees: mock order resolves an array
        mockSupabase.order.mockResolvedValue({ data: [], error: null })

        const Page = await PackageDetailPage({ params: Promise.resolve({ orderId: 'order-1', locale: 'vi' }) })
        renderWithIntl(Page)
        expect(screen.getByTestId('package-header')).toHaveTextContent('PKG-2026-ORD123')
    })
})
