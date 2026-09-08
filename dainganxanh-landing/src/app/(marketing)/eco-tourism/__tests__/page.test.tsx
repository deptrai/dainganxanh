import { render, screen } from '@testing-library/react'
import EcoTourismPage from '../page'

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
        const { container } = render(PageComponent)
        expect(container.textContent).toContain('Vườn A')
    })
})
