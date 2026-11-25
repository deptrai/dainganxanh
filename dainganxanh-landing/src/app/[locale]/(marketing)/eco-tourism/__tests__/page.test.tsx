import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import EcoTourismPage from '../page'
import type { RoomPricingRule } from '@/lib/pricing'

jest.mock('next/navigation', () => ({
    useRouter: () => ({ replace: jest.fn() }),
    usePathname: () => '/eco-tourism',
    useSearchParams: () => new URLSearchParams(),
}))

let mockPricingRules: RoomPricingRule[] = []

jest.mock('@/lib/supabase/server', () => ({
    createServiceRoleClient: jest.fn(() => ({
        from: jest.fn().mockImplementation((table: string) => {
            if (table === 'lots') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    order: jest.fn().mockResolvedValue({
                        data: [
                            {
                                id: 'lot-1',
                                name: 'Vườn A',
                                region: 'Miền Bắc',
                                images: ['https://example.com/a.jpg'],
                                rooms: [{ id: 'room-1', status: 'active', price_per_night: 800000 }],
                            },
                            {
                                id: 'lot-2',
                                name: 'Vườn B',
                                region: 'Miền Nam',
                                images: ['https://example.com/b.jpg'],
                                rooms: [{ id: 'room-2', status: 'active', price_per_night: 900000 }],
                            },
                        ],
                        error: null,
                    }),
                }
            }
            if (table === 'room_pricing_rules') {
                return {
                    select: jest.fn().mockReturnValue({
                        in: jest.fn().mockResolvedValue({ data: mockPricingRules, error: null }),
                    }),
                }
            }
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                in: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }
        }),
    })),
}))

describe('EcoTourismPage', () => {
    beforeEach(() => {
        mockPricingRules = []
    })

    test('renders page with garden data', async () => {
        const PageComponent = await EcoTourismPage()
        renderWithIntl(PageComponent)
        expect(screen.getByRole('heading', { name: 'Vườn A' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Vườn B' })).toBeInTheDocument()
    })

    test('reflects effective seasonal starting price when room_pricing_rules applies', async () => {
        // Hôm nay + 10 ngày
        const today = new Date()
        const start = new Date(today)
        start.setDate(today.getDate() + 5)
        const end = new Date(today)
        end.setDate(today.getDate() + 20)

        mockPricingRules = [
            {
                id: 'rule-1',
                room_id: 'room-1',
                start_date: start.toISOString().split('T')[0],
                end_date: end.toISOString().split('T')[0],
                price_per_night: 650000,
            },
        ]

        const PageComponent = await EcoTourismPage()
        renderWithIntl(PageComponent)

        // Vườn A có base price 800.000đ nhưng có rule 650.000đ nên hiển thị giá từ 650.000 ₫
        expect(screen.getByText('650.000 ₫')).toBeInTheDocument()
    })

    test('pre-selects region from searchParams', async () => {
        const PageComponent = await EcoTourismPage({
            searchParams: Promise.resolve({ region: 'Miền Bắc' }),
        })
        renderWithIntl(PageComponent)
        expect(screen.getByRole('heading', { name: 'Vườn A' })).toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Vườn B' })).not.toBeInTheDocument()
    })
})
