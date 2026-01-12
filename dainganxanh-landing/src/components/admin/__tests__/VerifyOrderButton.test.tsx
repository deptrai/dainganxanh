import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import VerifyOrderButton from '../VerifyOrderButton'

describe('VerifyOrderButton', () => {
    const mockVerifyOrder = jest.fn()
    const orderId = 'test-order-123'

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders verify button', () => {
        render(<VerifyOrderButton orderId={orderId} verifyOrder={mockVerifyOrder} />)
        expect(screen.getByText('Xác minh')).toBeInTheDocument()
    })

    it('shows confirmation modal when clicked', () => {
        render(<VerifyOrderButton orderId={orderId} verifyOrder={mockVerifyOrder} />)

        fireEvent.click(screen.getByText('Xác minh'))

        expect(screen.getByText('Xác nhận xác minh đơn hàng')).toBeInTheDocument()
        expect(screen.getByText(/Bạn có chắc chắn muốn xác minh đơn hàng này/)).toBeInTheDocument()
    })

    it('calls verifyOrder when confirmed', async () => {
        mockVerifyOrder.mockResolvedValue(undefined)

        render(<VerifyOrderButton orderId={orderId} verifyOrder={mockVerifyOrder} />)

        // Open modal
        fireEvent.click(screen.getByText('Xác minh'))

        // Confirm - get the second "Xác minh" button (the one in the modal)
        const buttons = screen.getAllByRole('button', { name: /Xác minh/i })
        const confirmButton = buttons[1] // Modal button is the second one
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(mockVerifyOrder).toHaveBeenCalledWith(orderId)
        })
    })

    it('shows loading state during verification', async () => {
        mockVerifyOrder.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

        render(<VerifyOrderButton orderId={orderId} verifyOrder={mockVerifyOrder} />)

        fireEvent.click(screen.getByText('Xác minh'))
        const buttons = screen.getAllByRole('button', { name: /Xác minh/i })
        const confirmButton = buttons[1]
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(screen.getByText('Đang xử lý...')).toBeInTheDocument()
        })
    })

    it('shows error message on verification failure', async () => {
        const errorMessage = 'Verification failed'
        mockVerifyOrder.mockRejectedValue(new Error(errorMessage))

        render(<VerifyOrderButton orderId={orderId} verifyOrder={mockVerifyOrder} />)

        fireEvent.click(screen.getByText('Xác minh'))
        const buttons = screen.getAllByRole('button', { name: /Xác minh/i })
        const confirmButton = buttons[1]
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument()
        })
    })

    it('closes modal when cancel is clicked', () => {
        render(<VerifyOrderButton orderId={orderId} verifyOrder={mockVerifyOrder} />)

        fireEvent.click(screen.getByText('Xác minh'))
        expect(screen.getByText('Xác nhận xác minh đơn hàng')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Hủy'))
        expect(screen.queryByText('Xác nhận xác minh đơn hàng')).not.toBeInTheDocument()
    })
})
