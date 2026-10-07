import { render, screen } from '@testing-library/react'
import EcoTourismPage from '../page'

jest.mock('next/navigation', () => ({
    useRouter: () => ({ replace: jest.fn() }),
    usePathname: () => '/eco-tourism',
    useSearchParams: () => new URLSearchParams(),
}))

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
                                rooms: [{ status: 'active', price_per_night: 800000 }],
                            },
                            {
                                id: 'lot-2',
                                name: 'Vườn B',
                                region: 'Miền Nam',
                                images: ['https://example.com/b.jpg'],
                                rooms: [{ status: 'active', price_per_night: 900000 }],
                            },
                        ],
                        error: null,
                    }),
                }
            }
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }
        }),
    })),
}))

describe('EcoTourismPage', () => {
    test('renders page with garden data', async () => {
        const PageComponent = await EcoTourismPage()
        render(PageComponent)
        expect(screen.getByRole('heading', { name: 'Vườn A' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Vườn B' })).toBeInTheDocument()
    })

    test('pre-selects region from searchParams', async () => {
        const PageComponent = await EcoTourismPage({
            searchParams: Promise.resolve({ region: 'Miền Bắc' }),
        })
        render(PageComponent)
        expect(screen.getByRole('heading', { name: 'Vườn A' })).toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Vườn B' })).not.toBeInTheDocument()
    })
})
