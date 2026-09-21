import { render, screen } from '@testing-library/react'
import BookingStatusBadge, { BOOKING_STATUS_CONFIG } from '../BookingStatusBadge'

describe('BookingStatusBadge', () => {
    it('renders data-testid="booking-status-badge"', () => {
        render(<BookingStatusBadge status="pending" />)
        const badge = screen.getByTestId('booking-status-badge')
        expect(badge).toBeInTheDocument()
    })

    it('renders pending status with amber styling and label', () => {
        render(<BookingStatusBadge status="pending" />)
        const badge = screen.getByTestId('booking-status-badge')
        expect(badge).toHaveTextContent('Chờ thanh toán')
        expect(badge).toHaveClass('bg-amber-100')
        expect(badge).toHaveClass('text-amber-800')
    })

    it('renders confirmed status with emerald styling and label', () => {
        render(<BookingStatusBadge status="confirmed" />)
        const badge = screen.getByTestId('booking-status-badge')
        expect(badge).toHaveTextContent('Đã xác nhận')
        expect(badge).toHaveClass('bg-emerald-100')
        expect(badge).toHaveClass('text-emerald-800')
    })

    it('renders cancelled status with red styling and label', () => {
        render(<BookingStatusBadge status="cancelled" />)
        const badge = screen.getByTestId('booking-status-badge')
        expect(badge).toHaveTextContent('Đã hủy')
        expect(badge).toHaveClass('bg-red-100')
        expect(badge).toHaveClass('text-red-800')
    })

    it('renders completed status with blue styling and label', () => {
        render(<BookingStatusBadge status="completed" />)
        const badge = screen.getByTestId('booking-status-badge')
        expect(badge).toHaveTextContent('Hoàn thành')
        expect(badge).toHaveClass('bg-blue-100')
        expect(badge).toHaveClass('text-blue-800')
    })

    it('renders no_show status with gray styling and label', () => {
        render(<BookingStatusBadge status="no_show" />)
        const badge = screen.getByTestId('booking-status-badge')
        expect(badge).toHaveTextContent('Không đến')
        expect(badge).toHaveClass('bg-gray-100')
        expect(badge).toHaveClass('text-gray-800')
    })

    it('renders fallback for unknown status', () => {
        render(<BookingStatusBadge status="unknown_status" />)
        const badge = screen.getByTestId('booking-status-badge')
        expect(badge).toHaveTextContent('unknown_status')
        expect(badge).toHaveClass('bg-gray-100')
        expect(badge).toHaveClass('text-gray-800')
    })

    it('applies custom className when provided', () => {
        render(<BookingStatusBadge status="confirmed" className="custom-class" />)
        const badge = screen.getByTestId('booking-status-badge')
        expect(badge).toHaveClass('custom-class')
    })
})
