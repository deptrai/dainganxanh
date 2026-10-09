import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AdminSidebar from '../AdminSidebar'

let mockPathname = '/crm/admin/analytics'

jest.mock('@/i18n/navigation', () => ({
    usePathname: () => mockPathname,
    Link: ({ children, href, className, onClick, ...rest }: any) => (
        <a href={href} className={className} onClick={onClick} {...rest}>
            {children}
        </a>
    ),
}))

describe('AdminSidebar', () => {
    it('renders admin navigation in Vietnamese by default', () => {
        mockPathname = '/crm/admin/analytics'
        renderWithIntl(<AdminSidebar />, { locale: 'vi' })

        expect(screen.getAllByText('Thống kê').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Lô cây').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Đặt phòng').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Cài đặt').length).toBeGreaterThanOrEqual(1)
    })

    it('renders admin navigation in English when locale is en', () => {
        mockPathname = '/crm/admin/analytics'
        renderWithIntl(<AdminSidebar />, { locale: 'en' })

        expect(screen.getAllByText('Analytics').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Tree Lots').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Bookings').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1)
    })

    it('highlights active item matching stripped pathname', () => {
        mockPathname = '/crm/admin/analytics'
        renderWithIntl(<AdminSidebar />, { locale: 'vi' })

        const analyticsLinks = screen.getAllByText('Thống kê').map((el) => el.closest('a'))
        const activeLink = analyticsLinks.find((link) => link?.classList.contains('bg-green-50'))
        expect(activeLink).toBeDefined()
    })
})
