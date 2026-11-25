import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { EcoTourismClient } from '../EcoTourismClient'

const mockReplace = jest.fn()
let mockSearchParams = new URLSearchParams()
let mockPathname = '/eco-tourism'

jest.mock('@/i18n/navigation', () => ({
    useRouter: () => ({
        replace: mockReplace,
    }),
    usePathname: () => mockPathname,
    Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

jest.mock('next/navigation', () => ({
    useSearchParams: () => mockSearchParams,
}))

const lots = [
    { id: 'lot-1', name: 'Vườn A', region: 'Miền Bắc', images: [], priceFrom: 800000 },
    { id: 'lot-2', name: 'Vườn B', region: 'Miền Nam', images: [], priceFrom: 900000 },
    { id: 'lot-3', name: 'Vườn C', region: 'Miền Bắc', images: [], priceFrom: 850000 },
]

describe('EcoTourismClient', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockSearchParams = new URLSearchParams()
        mockPathname = '/eco-tourism'
    })

    test('renders all lots on "Tất cả" tab', () => {
        renderWithIntl(<EcoTourismClient lots={lots} />)
        expect(screen.getByText('Vườn A')).toBeInTheDocument()
        expect(screen.getByText('Vườn B')).toBeInTheDocument()
        expect(screen.getByText('Vườn C')).toBeInTheDocument()
    })

    test('filters lots by selected region and syncs URL', () => {
        renderWithIntl(<EcoTourismClient lots={lots} />)
        const mienBacBtn = screen.getByRole('button', { name: /Miền Bắc/i })
        fireEvent.click(mienBacBtn)

        expect(screen.getByText('Vườn A')).toBeInTheDocument()
        expect(screen.getByText('Vườn C')).toBeInTheDocument()
        expect(screen.queryByText('Vườn B')).not.toBeInTheDocument()
        expect(mockReplace).toHaveBeenCalledWith(
            '/eco-tourism?region=Mi%E1%BB%81n+B%E1%BA%AFc',
            { scroll: false }
        )
    })

    test('removes region search param when clicking "Tất cả"', () => {
        mockSearchParams = new URLSearchParams('region=Miền Bắc')
        renderWithIntl(<EcoTourismClient lots={lots} />)
        const tatCaBtn = screen.getByRole('button', { name: /Tất cả/i })
        fireEvent.click(tatCaBtn)

        expect(screen.getByText('Vườn A')).toBeInTheDocument()
        expect(screen.getByText('Vườn B')).toBeInTheDocument()
        expect(screen.getByText('Vườn C')).toBeInTheDocument()
        expect(mockReplace).toHaveBeenCalledWith('/eco-tourism', { scroll: false })
    })

    test('pre-selects region from initialRegion prop', () => {
        renderWithIntl(<EcoTourismClient lots={lots} initialRegion="Miền Nam" />)
        expect(screen.getByText('Vườn B')).toBeInTheDocument()
        expect(screen.queryByText('Vườn A')).not.toBeInTheDocument()
        expect(screen.queryByText('Vườn C')).not.toBeInTheDocument()
    })

    test('pre-selects region from searchParams', () => {
        mockSearchParams = new URLSearchParams('region=Miền Nam')
        renderWithIntl(<EcoTourismClient lots={lots} />)
        expect(screen.getByText('Vườn B')).toBeInTheDocument()
        expect(screen.queryByText('Vườn A')).not.toBeInTheDocument()
        expect(screen.queryByText('Vườn C')).not.toBeInTheDocument()
    })

    test('preserves other query parameters when updating region', () => {
        mockSearchParams = new URLSearchParams('ref=promo123&utm_source=fb')
        renderWithIntl(<EcoTourismClient lots={lots} />)
        const mienBacBtn = screen.getByRole('button', { name: /Miền Bắc/i })
        fireEvent.click(mienBacBtn)

        expect(mockReplace).toHaveBeenCalledWith(
            expect.stringContaining('ref=promo123'),
            { scroll: false }
        )
        expect(mockReplace).toHaveBeenCalledWith(
            expect.stringContaining('region=Mi%E1%BB%81n+B%E1%BA%AFc'),
            { scroll: false }
        )
    })

    test('region matching is case-insensitive', () => {
        const mixedCase = [
            { id: 'lot-1', name: 'Vườn A', region: '  MIỀN BẮC  ', images: [], priceFrom: 800000 },
        ]
        renderWithIntl(<EcoTourismClient lots={mixedCase} />)
        const mienBacBtn = screen.getByRole('button', { name: /Miền Bắc/i })
        fireEvent.click(mienBacBtn)
        expect(screen.getByText('Vườn A')).toBeInTheDocument()
    })

    test('shows empty state when no lots', () => {
        renderWithIntl(<EcoTourismClient lots={[]} />)
        expect(screen.getByText(/Chưa có vườn nào mở phòng/i)).toBeInTheDocument()
    })

    test('shows empty state when filter yields no results', () => {
        renderWithIntl(<EcoTourismClient lots={lots} />)
        fireEvent.click(screen.getByRole('button', { name: /Miền Trung/i }))
        expect(screen.getByText(/Chưa có vườn nào mở phòng/i)).toBeInTheDocument()
    })
})
