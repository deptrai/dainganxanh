import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { CRMHeader } from '../CRMHeader'

let mockPathname = '/crm/my-bookings'

jest.mock('@/i18n/navigation', () => ({
    usePathname: () => mockPathname,
    Link: ({ children, href, className, ...rest }: any) => (
        <a href={href} className={className} {...rest}>
            {children}
        </a>
    ),
}))

jest.mock('@/lib/supabase/client', () => ({
    createBrowserClient: () => ({
        auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
        },
    }),
}))

jest.mock('../UserHeader', () => ({
    UserHeader: () => <div data-testid="user-header">User Header</div>,
}))

describe('CRMHeader', () => {
    it('renders navigation items in Vietnamese by default', () => {
        mockPathname = '/crm/my-bookings'
        renderWithIntl(<CRMHeader />, { locale: 'vi' })

        expect(screen.getByText('Trang chủ')).toBeInTheDocument()
        expect(screen.getByText('Vườn của tôi')).toBeInTheDocument()
        expect(screen.getByText('Lịch đặt')).toBeInTheDocument()
        expect(screen.getByText('Hồ sơ')).toBeInTheDocument()
    })

    it('renders navigation items in English when locale is en', () => {
        mockPathname = '/crm/my-bookings'
        renderWithIntl(<CRMHeader />, { locale: 'en' })

        expect(screen.getByText('Home')).toBeInTheDocument()
        expect(screen.getByText('My Garden')).toBeInTheDocument()
        expect(screen.getByText('Bookings')).toBeInTheDocument()
        expect(screen.getByText('Profile')).toBeInTheDocument()
    })

    it('highlights active item matching stripped pathname', () => {
        mockPathname = '/crm/my-bookings'
        renderWithIntl(<CRMHeader />, { locale: 'vi' })

        const bookingLink = screen.getByText('Lịch đặt').closest('a')
        expect(bookingLink).toHaveClass('border-emerald-500')
    })
})
