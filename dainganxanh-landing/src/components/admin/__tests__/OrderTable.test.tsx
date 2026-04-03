import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
    ChevronDownIcon: () => <div>ChevronDown</div>,
    ChevronUpIcon: () => <div>ChevronUp</div>,
}))

import OrderTable from '../OrderTable'
import { Order } from '@/hooks/useAdminOrders'

const mockOrders: Order[] = [
    {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-1',
        quantity: 5,
        total_amount: 5000000,
        payment_method: 'banking',
        status: 'pending',
        verified_at: null,
        created_at: '2026-01-12T10:00:00Z',
        user_email: 'test@example.com',
        referred_by: 'referrer-1',
        referrer: {
            email: 'referrer@example.com',
            referral_code: 'REF123',
        },
    },
    {
        id: '223e4567-e89b-12d3-a456-426614174001',
        user_id: 'user-2',
        quantity: 10,
        total_amount: 10000000,
        payment_method: 'banking',
        status: 'verified',
        verified_at: '2026-01-12T11:00:00Z',
        created_at: '2026-01-12T09:00:00Z',
        user_email: 'test2@example.com',
        referred_by: null,
        referrer: null,
    },
]

/**
 * The component renders both a mobile card view (block lg:hidden) and
 * a desktop table view (hidden lg:block). JSDOM doesn't evaluate CSS
 * media queries, so both views are present in the DOM simultaneously.
 * Tests use getAllBy* and scope queries to the desktop table where needed.
 */
describe('OrderTable', () => {
    const mockVerifyOrder = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    /**
     * Helper: returns the desktop table container (hidden lg:block).
     */
    function getDesktopTable(container: HTMLElement) {
        // The desktop wrapper is the div with class "hidden lg:block ..."
        return container.querySelector('.hidden.lg\\:block') as HTMLElement
    }

    it('renders desktop table with correct column headers', () => {
        const { container } = render(<OrderTable orders={mockOrders} verifyOrder={mockVerifyOrder} />)
        const desktop = getDesktopTable(container)

        expect(desktop).toBeInTheDocument()

        // All column headers exist in the desktop table
        const headers = desktop.querySelectorAll('th')
        const headerTexts = Array.from(headers).map((h) => h.textContent?.trim())

        expect(headerTexts).toContain('Order ID')
        expect(headerTexts).toContain('User')
        expect(headerTexts).toContain('Người Giới Thiệu')
        expect(headerTexts).toContain('Thanh toán')
        expect(headerTexts).toContain('Trạng thái')
        expect(headerTexts).toContain('Hành động')
        // Sortable columns contain the text (may also include sort icon)
        expect(headerTexts.some((t) => t?.includes('Số lượng'))).toBe(true)
        expect(headerTexts.some((t) => t?.includes('Tổng tiền'))).toBe(true)
        expect(headerTexts.some((t) => t?.includes('Ngày tạo'))).toBe(true)
    })

    it('displays order data correctly', () => {
        render(<OrderTable orders={mockOrders} verifyOrder={mockVerifyOrder} />)

        // Email appears in both mobile and desktop views
        const emails = screen.getAllByText('test@example.com')
        expect(emails.length).toBeGreaterThanOrEqual(1)

        // Quantity with unit
        const qty = screen.getAllByText('5 cây')
        expect(qty.length).toBeGreaterThanOrEqual(1)

        // Payment method shown in desktop table
        const banking = screen.getAllByText('banking')
        expect(banking.length).toBeGreaterThanOrEqual(1)
    })

    it('shows status badges with correct colors', () => {
        render(<OrderTable orders={mockOrders} verifyOrder={mockVerifyOrder} />)

        // Both mobile and desktop render status badges — grab all and verify at least one has correct classes
        const pendingBadges = screen.getAllByText('Chờ xác minh')
        const verifiedBadges = screen.getAllByText('Đã xác minh')

        expect(pendingBadges.some((el) => el.classList.contains('bg-yellow-100') && el.classList.contains('text-yellow-800'))).toBe(true)
        expect(verifiedBadges.some((el) => el.classList.contains('bg-green-100') && el.classList.contains('text-green-800'))).toBe(true)
    })

    it('shows verify button only for pending/paid orders', () => {
        render(<OrderTable orders={mockOrders} verifyOrder={mockVerifyOrder} />)

        // VerifyOrderButton renders "Xác minh" for the pending order
        // Both mobile and desktop views render it, so expect 2 (one per view)
        const verifyButtons = screen.getAllByText('Xác minh')
        // There is 1 pending order, rendered in 2 views = 2 buttons
        expect(verifyButtons).toHaveLength(2)
    })

    it('formats currency correctly', () => {
        render(<OrderTable orders={mockOrders} verifyOrder={mockVerifyOrder} />)

        // Currency formatted as Vietnamese dong — appears in both views
        const amount5m = screen.getAllByText(/5\.000\.000/)
        const amount10m = screen.getAllByText(/10\.000\.000/)
        expect(amount5m.length).toBeGreaterThanOrEqual(1)
        expect(amount10m.length).toBeGreaterThanOrEqual(1)
    })

    describe('Referrer Column', () => {
        it('should display referral_code and email when referrer exists', () => {
            render(<OrderTable orders={mockOrders} verifyOrder={mockVerifyOrder} />)

            // Referral code appears in both mobile card and desktop table
            const refCodes = screen.getAllByText('REF123')
            expect(refCodes.length).toBeGreaterThanOrEqual(1)

            // Referrer email appears only in the desktop table
            expect(screen.getByText('referrer@example.com')).toBeInTheDocument()
        })

        it('should display "Không có" when referrer is null', () => {
            render(<OrderTable orders={mockOrders} verifyOrder={mockVerifyOrder} />)

            // Second order has no referrer — desktop shows "Không có"
            const noReferrerTexts = screen.getAllByText('Không có')
            expect(noReferrerTexts.length).toBeGreaterThan(0)
        })

        it('should use correct colSpan in expanded rows', async () => {
            const { container } = render(<OrderTable orders={mockOrders} verifyOrder={mockVerifyOrder} />)

            const { fireEvent } = await import('@testing-library/react')
            // Click the first desktop table row to expand it
            const desktop = getDesktopTable(container)
            const firstRow = desktop?.querySelector('tbody tr')

            if (firstRow) {
                await fireEvent.click(firstRow)
            }

            // Expanded row has colSpan=9
            const expandedCell = container.querySelector('td[colspan="9"]')
            expect(expandedCell).toBeInTheDocument()
        })
    })
})
