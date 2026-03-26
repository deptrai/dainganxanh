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
    },
]

describe('OrderTable', () => {
    const mockVerifyOrder = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders table with correct columns', () => {
        render(<OrderTable orders={mockOrders} verifyOrder={mockVerifyOrder} />)

        expect(screen.getByText('Order ID')).toBeInTheDocument()
        expect(screen.getByText('User')).toBeInTheDocument()
        expect(screen.getByText(/Số lượng/)).toBeInTheDocument()
        expect(screen.getByText(/Tổng tiền/)).toBeInTheDocument()
        expect(screen.getByText('Thanh toán')).toBeInTheDocument()
        expect(screen.getByText('Trạng thái')).toBeInTheDocument()
        expect(screen.getByText(/Ngày tạo/)).toBeInTheDocument()
        expect(screen.getByText('Hành động')).toBeInTheDocument()
    })

    it('displays order data correctly', () => {
        render(<OrderTable orders={mockOrders} verifyOrder={mockVerifyOrder} />)

        expect(screen.getByText('test@example.com')).toBeInTheDocument()
        expect(screen.getByText('5 cây')).toBeInTheDocument()
        expect(screen.getAllByText('banking')[0]).toBeInTheDocument()
    })

    it('shows status badges with correct colors', () => {
        render(<OrderTable orders={mockOrders} verifyOrder={mockVerifyOrder} />)

        const pendingBadge = screen.getByText('Chờ xác minh')
        const verifiedBadge = screen.getByText('Đã xác minh')

        expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
        expect(verifiedBadge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('shows verify button only for pending/paid orders', () => {
        render(<OrderTable orders={mockOrders} verifyOrder={mockVerifyOrder} />)

        const verifyButtons = screen.getAllByText('Xác minh')
        expect(verifyButtons).toHaveLength(1) // Only 1 pending order
    })

    it('formats currency correctly', () => {
        render(<OrderTable orders={mockOrders} verifyOrder={mockVerifyOrder} />)

        expect(screen.getByText(/5\.000\.000/)).toBeInTheDocument()
        expect(screen.getByText(/10\.000\.000/)).toBeInTheDocument()
    })
})
