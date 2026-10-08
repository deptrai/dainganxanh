import { render, screen } from '@testing-library/react'
import StoreOrderStatusBadge from '../StoreOrderStatusBadge'
import { STORE_ORDER_STATUS_CONFIG } from '@/lib/store-order-status'

describe('StoreOrderStatusBadge', () => {
    it('renders data-testid="store-order-status-badge"', () => {
        render(<StoreOrderStatusBadge status="pending" />)
        const badge = screen.getByTestId('store-order-status-badge')
        expect(badge).toBeInTheDocument()
    })

    it('renders pending status with amber styling and label', () => {
        render(<StoreOrderStatusBadge status="pending" />)
        const badge = screen.getByTestId('store-order-status-badge')
        expect(badge).toHaveTextContent(STORE_ORDER_STATUS_CONFIG.pending.label)
        expect(badge).toHaveClass('bg-amber-100')
        expect(badge).toHaveClass('text-amber-800')
    })

    it('renders confirmed status with emerald styling and label', () => {
        render(<StoreOrderStatusBadge status="confirmed" />)
        const badge = screen.getByTestId('store-order-status-badge')
        expect(badge).toHaveTextContent(STORE_ORDER_STATUS_CONFIG.confirmed.label)
        expect(badge).toHaveClass('bg-emerald-100')
        expect(badge).toHaveClass('text-emerald-800')
    })

    it('renders processing status with blue styling and label', () => {
        render(<StoreOrderStatusBadge status="processing" />)
        const badge = screen.getByTestId('store-order-status-badge')
        expect(badge).toHaveTextContent(STORE_ORDER_STATUS_CONFIG.processing.label)
        expect(badge).toHaveClass('bg-blue-100')
        expect(badge).toHaveClass('text-blue-800')
    })

    it('renders shipped status with indigo styling and label', () => {
        render(<StoreOrderStatusBadge status="shipped" />)
        const badge = screen.getByTestId('store-order-status-badge')
        expect(badge).toHaveTextContent(STORE_ORDER_STATUS_CONFIG.shipped.label)
        expect(badge).toHaveClass('bg-indigo-100')
        expect(badge).toHaveClass('text-indigo-800')
    })

    it('renders delivered status with green styling and label', () => {
        render(<StoreOrderStatusBadge status="delivered" />)
        const badge = screen.getByTestId('store-order-status-badge')
        expect(badge).toHaveTextContent(STORE_ORDER_STATUS_CONFIG.delivered.label)
        expect(badge).toHaveClass('bg-green-100')
        expect(badge).toHaveClass('text-green-800')
    })

    it('renders cancelled status with red styling and label', () => {
        render(<StoreOrderStatusBadge status="cancelled" />)
        const badge = screen.getByTestId('store-order-status-badge')
        expect(badge).toHaveTextContent(STORE_ORDER_STATUS_CONFIG.cancelled.label)
        expect(badge).toHaveClass('bg-red-100')
        expect(badge).toHaveClass('text-red-800')
    })

    it('renders fallback for unknown status', () => {
        render(<StoreOrderStatusBadge status="unknown_status" />)
        const badge = screen.getByTestId('store-order-status-badge')
        expect(badge).toHaveTextContent('unknown_status')
        expect(badge).toHaveClass('bg-gray-100')
        expect(badge).toHaveClass('text-gray-800')
    })

    it('applies custom className when provided', () => {
        render(<StoreOrderStatusBadge status="delivered" className="custom-test-class" />)
        const badge = screen.getByTestId('store-order-status-badge')
        expect(badge).toHaveClass('custom-test-class')
    })
})
