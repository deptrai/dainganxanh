import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CancelBookingButton from '../CancelBookingButton'

describe('CancelBookingButton', () => {
    const defaultProps = {
        bookingCode: 'BK123456',
        onCancel: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
        global.fetch = jest.fn()
    })

    it('renders the cancel trigger button', () => {
        render(<CancelBookingButton {...defaultProps} />)
        const btn = screen.getByRole('button', { name: /Hủy đặt phòng/i })
        expect(btn).toBeInTheDocument()
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('opens confirmation modal on click with accessible attributes', () => {
        render(<CancelBookingButton {...defaultProps} />)
        const btn = screen.getByRole('button', { name: /Hủy đặt phòng/i })
        fireEvent.click(btn)

        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
        expect(dialog).toHaveAttribute('aria-modal', 'true')
        expect(screen.getByText('Xác nhận hủy đặt phòng')).toBeInTheDocument()
        expect(screen.getByText('Mã đơn: BK123456')).toBeInTheDocument()
    })

    it('closes modal on "Không, quay lại" dismiss button click', () => {
        render(<CancelBookingButton {...defaultProps} />)
        fireEvent.click(screen.getByRole('button', { name: /Hủy đặt phòng/i }))
        expect(screen.getByRole('dialog')).toBeInTheDocument()

        const dismissBtn = screen.getByRole('button', { name: /Không, quay lại/i })
        fireEvent.click(dismissBtn)

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('closes modal on Escape key', () => {
        render(<CancelBookingButton {...defaultProps} />)
        fireEvent.click(screen.getByRole('button', { name: /Hủy đặt phòng/i }))
        expect(screen.getByRole('dialog')).toBeInTheDocument()

        fireEvent.keyDown(window, { key: 'Escape' })
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('closes modal on backdrop click', () => {
        render(<CancelBookingButton {...defaultProps} />)
        fireEvent.click(screen.getByRole('button', { name: /Hủy đặt phòng/i }))
        expect(screen.getByRole('dialog')).toBeInTheDocument()

        const backdrop = screen.getByRole('dialog').parentElement
        if (backdrop) {
            fireEvent.click(backdrop)
        }
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('does not close modal on content click', () => {
        render(<CancelBookingButton {...defaultProps} />)
        fireEvent.click(screen.getByRole('button', { name: /Hủy đặt phòng/i }))
        const dialog = screen.getByRole('dialog')

        fireEvent.click(dialog)
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('calls cancel API with correct payload and triggers onCancel on success', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ok: true, message: 'Đã hủy đặt phòng thành công' }),
        })

        render(<CancelBookingButton {...defaultProps} />)
        fireEvent.click(screen.getByRole('button', { name: /Hủy đặt phòng/i }))

        const confirmBtn = screen.getByRole('button', { name: /Xác nhận hủy/i })
        fireEvent.click(confirmBtn)

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/bookings/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingCode: 'BK123456', reason: 'Khách hủy từ CRM' }),
            })
            expect(defaultProps.onCancel).toHaveBeenCalled()
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
    })

    it('displays error message and keeps modal open when API fails', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 409,
            json: async () => ({ error: 'Chỉ có thể hủy đơn đặt phòng đang chờ thanh toán' }),
        })

        render(<CancelBookingButton {...defaultProps} />)
        fireEvent.click(screen.getByRole('button', { name: /Hủy đặt phòng/i }))

        const confirmBtn = screen.getByRole('button', { name: /Xác nhận hủy/i })
        fireEvent.click(confirmBtn)

        await waitFor(() => {
            expect(screen.getByText('Chỉ có thể hủy đơn đặt phòng đang chờ thanh toán')).toBeInTheDocument()
            expect(screen.getByRole('dialog')).toBeInTheDocument()
            expect(defaultProps.onCancel).not.toHaveBeenCalled()
        })
    })

    it('handles network error and displays fallback error message', async () => {
        ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

        render(<CancelBookingButton {...defaultProps} />)
        fireEvent.click(screen.getByRole('button', { name: /Hủy đặt phòng/i }))

        const confirmBtn = screen.getByRole('button', { name: /Xác nhận hủy/i })
        fireEvent.click(confirmBtn)

        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument()
            expect(screen.getByRole('dialog')).toBeInTheDocument()
            expect(defaultProps.onCancel).not.toHaveBeenCalled()
        })
    })
})
