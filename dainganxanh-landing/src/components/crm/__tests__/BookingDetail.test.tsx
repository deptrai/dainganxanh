import { render, screen } from '@testing-library/react'
import BookingDetail, { MyBookingDetail } from '../BookingDetail'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}))

describe('BookingDetail', () => {
    const baseBooking: MyBookingDetail = {
        id: 'booking-1',
        code: 'BKABC123',
        roomId: 'room-1',
        roomName: 'Bungalow Hoa Mai',
        lotName: 'Vườn Trầm Hương Gia Lai',
        lotRegion: 'Tây Nguyên',
        lotDescription: 'Không gian tĩnh lặng giữa rừng cây',
        guestName: 'Nguyễn Văn A',
        guestPhone: '0901234567',
        guestEmail: 'nguyenvana@example.com',
        checkInDate: '2026-09-10',
        checkOutDate: '2026-09-12',
        guestsCount: 2,
        nightsCount: 2,
        totalAmount: 2400000,
        paymentMethod: 'banking',
        status: 'confirmed',
        specialRequests: 'Cần check-in sớm',
        cancellationReason: null,
        expiresAt: null,
        createdAt: '2026-08-01T10:00:00Z',
        lotId: 'lot-1',
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders back to list link and basic booking details', () => {
        render(<BookingDetail booking={baseBooking} />)

        const backLink = screen.getByRole('link', { name: /Quay lại danh sách/i })
        expect(backLink).toHaveAttribute('href', '/crm/my-bookings')

        expect(screen.getByText('BKABC123')).toBeInTheDocument()
        expect(screen.getAllByText('Bungalow Hoa Mai').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Vườn Trầm Hương Gia Lai').length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument()
        expect(screen.getAllByText('0901234567').length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('nguyenvana@example.com')).toBeInTheDocument()
        expect(screen.getByText(/Chuyển khoản ngân hàng/i)).toBeInTheDocument()
        expect(screen.getAllByText('Cần check-in sớm').length).toBeGreaterThanOrEqual(1)
    })

    it('renders check-in instructions for confirmed bookings', () => {
        render(<BookingDetail booking={{ ...baseBooking, status: 'confirmed' }} />)
        expect(screen.getByText('Hướng dẫn nhận phòng')).toBeInTheDocument()
    })

    it('renders check-in instructions for completed bookings', () => {
        render(<BookingDetail booking={{ ...baseBooking, status: 'completed' }} />)
        expect(screen.getByText('Hướng dẫn nhận phòng')).toBeInTheDocument()
    })

    it('renders continue payment and cancel button for active pending bookings', () => {
        const futureExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
        render(
            <BookingDetail
                booking={{
                    ...baseBooking,
                    status: 'pending',
                    expiresAt: futureExpiresAt,
                }}
            />
        )

        const payLink = screen.getByRole('link', { name: /Tiếp tục thanh toán/i })
        expect(payLink).toBeInTheDocument()
        expect(payLink).toHaveAttribute(
            'href',
            '/eco-tourism/lot-1/book?code=BKABC123'
        )

        const cancelBtn = screen.getByRole('button', { name: /Hủy đặt phòng/i })
        expect(cancelBtn).toBeInTheDocument()
    })

    it('renders expired notice for pending booking when expiresAt has passed', () => {
        const pastExpiresAt = new Date(Date.now() - 1000).toISOString()
        render(
            <BookingDetail
                booking={{
                    ...baseBooking,
                    status: 'pending',
                    expiresAt: pastExpiresAt,
                }}
            />
        )

        expect(screen.getByText(/Thời gian giữ chỗ cho đơn này đã hết hạn/i)).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: /Tiếp tục thanh toán/i })).not.toBeInTheDocument()
    })

    it('renders cancellation reason for cancelled bookings if reason exists', () => {
        render(
            <BookingDetail
                booking={{
                    ...baseBooking,
                    status: 'cancelled',
                    cancellationReason: 'Khách đổi lịch công tác',
                }}
            />
        )

        expect(screen.getByText(/Khách đổi lịch công tác/i)).toBeInTheDocument()
        expect(screen.getByText('Thông tin hủy đặt phòng')).toBeInTheDocument()
        expect(screen.queryByText('Hướng dẫn nhận phòng')).not.toBeInTheDocument()
    })

    it('renders cancellation reason for no_show bookings if reason exists', () => {
        render(
            <BookingDetail
                booking={{
                    ...baseBooking,
                    status: 'no_show',
                    cancellationReason: 'Khách không đến nhận phòng',
                }}
            />
        )

        expect(screen.getByText(/Khách không đến nhận phòng/i)).toBeInTheDocument()
    })
})
