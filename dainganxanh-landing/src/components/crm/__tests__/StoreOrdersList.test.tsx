import { render, screen, fireEvent } from '@testing-library/react'
import StoreOrdersList, { type StoreOrder } from '../StoreOrdersList'

describe('StoreOrdersList', () => {
    const mockOrder1: StoreOrder = {
        id: 'order-1',
        code: 'ORD-001',
        status: 'pending',
        totalAmount: 500000,
        shippingFee: 30000,
        paymentMethod: 'banking',
        shippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
        trackingNumber: 'VNPOST123456',
        createdAt: '2026-09-01T10:00:00Z',
        items: [
            {
                id: 'item-1',
                name: 'Nhang Trầm Hương Cao Cấp',
                slug: 'nhang-tram-huong-cao-cap',
                image: 'https://example.com/item1.jpg',
                quantity: 2,
                unitPrice: 235000,
            },
        ],
    }

    const mockOrder2: StoreOrder = {
        id: 'order-2',
        code: 'ORD-002',
        status: 'delivered',
        totalAmount: 1200000,
        shippingFee: 0,
        paymentMethod: 'cod',
        shippingAddress: '456 Đường XYZ, Quận 3, TP.HCM',
        trackingNumber: null,
        createdAt: '2026-08-15T08:30:00Z',
        items: [
            {
                id: 'item-2',
                name: 'Vòng Tay Trầm Hương',
                slug: 'vong-tay-tram-huong',
                image: null,
                quantity: 1,
                unitPrice: 1200000,
            },
        ],
    }

    it('renders empty state when orders is empty', () => {
        render(
            <StoreOrdersList
                orders={[]}
                page={1}
                pageSize={20}
                totalCount={0}
                totalPages={0}
            />
        )

        expect(screen.getByText('Bạn chưa có đơn hàng nào')).toBeInTheDocument()
        const ctaLink = screen.getByRole('link', { name: /mua sắm ngay/i })
        expect(ctaLink).toBeInTheDocument()
        expect(ctaLink).toHaveAttribute('href', '/store')
    })

    it('renders order cards in collapsed state by default', () => {
        render(
            <StoreOrdersList
                orders={[mockOrder1, mockOrder2]}
                page={1}
                pageSize={20}
                totalCount={2}
                totalPages={1}
            />
        )

        expect(screen.getByText('#ORD-001')).toBeInTheDocument()
        expect(screen.getByText('#ORD-002')).toBeInTheDocument()

        const toggleButtons = screen.getAllByRole('button', { expanded: false })
        expect(toggleButtons).toHaveLength(2)

        // Detail elements should not be visible initially
        expect(screen.queryByText('123 Đường ABC, Quận 1, TP.HCM')).not.toBeInTheDocument()
        expect(screen.queryByText('Nhang Trầm Hương Cao Cấp')).not.toBeInTheDocument()
    })

    it('toggles expand and collapse on header button click', () => {
        render(
            <StoreOrdersList
                orders={[mockOrder1]}
                page={1}
                pageSize={20}
                totalCount={1}
                totalPages={1}
            />
        )

        const toggleBtn = screen.getByRole('button', { expanded: false })
        expect(toggleBtn).toBeInTheDocument()

        // Click to expand
        fireEvent.click(toggleBtn)
        expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')
        expect(screen.getByText('Nhang Trầm Hương Cao Cấp')).toBeInTheDocument()
        expect(screen.getByText('123 Đường ABC, Quận 1, TP.HCM')).toBeInTheDocument()
        expect(screen.getByText('VNPOST123456')).toBeInTheDocument()
        expect(screen.getByText(/Chuyển khoản ngân hàng/i)).toBeInTheDocument()
        expect(screen.getByText(/Phí ship: 30\.000/i)).toBeInTheDocument()

        // Product link
        const productLink = screen.getByRole('link', { name: 'Nhang Trầm Hương Cao Cấp' })
        expect(productLink).toHaveAttribute('href', '/store/nhang-tram-huong-cao-cap')

        // Click to collapse
        fireEvent.click(toggleBtn)
        expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')
        expect(screen.queryByText('Nhang Trầm Hương Cao Cấp')).not.toBeInTheDocument()
    })

    it('supports independent expansion of multiple orders', () => {
        render(
            <StoreOrdersList
                orders={[mockOrder1, mockOrder2]}
                page={1}
                pageSize={20}
                totalCount={2}
                totalPages={1}
            />
        )

        const buttons = screen.getAllByRole('button')
        // Expand first order
        fireEvent.click(buttons[0])
        expect(screen.getByText('Nhang Trầm Hương Cao Cấp')).toBeInTheDocument()
        expect(screen.queryByText('Vòng Tay Trầm Hương')).not.toBeInTheDocument()

        // Expand second order
        fireEvent.click(buttons[1])
        expect(screen.getByText('Nhang Trầm Hương Cao Cấp')).toBeInTheDocument()
        expect(screen.getByText('Vòng Tay Trầm Hương')).toBeInTheDocument()

        // Collapse first order
        fireEvent.click(buttons[0])
        expect(screen.queryByText('Nhang Trầm Hương Cao Cấp')).not.toBeInTheDocument()
        expect(screen.getByText('Vòng Tay Trầm Hương')).toBeInTheDocument()
    })

    it('hides tracking number when null or undefined', () => {
        render(
            <StoreOrdersList
                orders={[mockOrder2]}
                page={1}
                pageSize={20}
                totalCount={1}
                totalPages={1}
            />
        )

        const toggleBtn = screen.getByRole('button')
        fireEvent.click(toggleBtn)

        expect(screen.queryByText(/mã vận đơn/i)).not.toBeInTheDocument()
        expect(screen.getByText('Miễn phí vận chuyển')).toBeInTheDocument()
        expect(screen.getByText('Thanh toán khi nhận hàng')).toBeInTheDocument()
    })

    it('does not render pagination when totalPages is 1', () => {
        render(
            <StoreOrdersList
                orders={[mockOrder1]}
                page={1}
                pageSize={20}
                totalCount={1}
                totalPages={1}
            />
        )

        expect(screen.queryByText(/Hiển thị 1 \/ 1 đơn/i)).not.toBeInTheDocument()
    })

    it('renders pagination controls and handles boundaries when totalPages > 1', () => {
        const { rerender } = render(
            <StoreOrdersList
                orders={[mockOrder1]}
                page={1}
                pageSize={1}
                totalCount={2}
                totalPages={2}
            />
        )

        expect(screen.getByText(/Hiển thị 1 \/ 2 đơn \(Trang 1 \/ 2\)/i)).toBeInTheDocument()
        const prevLink = screen.getByLabelText('Trang trước')
        const nextLink = screen.getByLabelText('Trang sau')

        expect(prevLink).toHaveAttribute('aria-disabled', 'true')
        expect(prevLink).toHaveClass('cursor-not-allowed')
        expect(nextLink).not.toHaveClass('cursor-not-allowed')

        // Page 2
        rerender(
            <StoreOrdersList
                orders={[mockOrder2]}
                page={2}
                pageSize={1}
                totalCount={2}
                totalPages={2}
            />
        )

        expect(screen.getByText(/Hiển thị 1 \/ 2 đơn \(Trang 2 \/ 2\)/i)).toBeInTheDocument()
        const prevLinkP2 = screen.getByLabelText('Trang trước')
        const nextLinkP2 = screen.getByLabelText('Trang sau')

        expect(prevLinkP2).not.toHaveClass('cursor-not-allowed')
        expect(nextLinkP2).toHaveAttribute('aria-disabled', 'true')
        expect(nextLinkP2).toHaveClass('cursor-not-allowed')
    })
})
