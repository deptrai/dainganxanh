import { render, screen, fireEvent } from '@testing-library/react'
import BookingTable, { MyBooking } from '../BookingTable'
import { formatDateVN, formatVND } from '@/lib/date'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}))

describe('BookingTable', () => {
    const mockBookings: MyBooking[] = [
        {
            id: 'booking-1',
            code: 'BKABC123',
            roomName: 'Bungalow Hoa Mai',
            lotName: 'Vườn Trầm Hương Gia Lai',
            checkInDate: '2026-09-10',
            checkOutDate: '2026-09-12',
            guestsCount: 2,
            nightsCount: 2,
            totalAmount: 2400000,
            status: 'confirmed',
            createdAt: '2026-08-01T10:00:00Z',
        },
        {
            id: 'booking-2',
            code: 'BKXYZ456',
            roomName: 'Villa Hương Rừng',
            lotName: 'Vườn Đắk Lắk',
            checkInDate: '2026-10-01',
            checkOutDate: '2026-10-04',
            guestsCount: 4,
            nightsCount: 3,
            totalAmount: 5000000,
            status: 'pending',
            createdAt: '2026-08-02T10:00:00Z',
        },
    ]

    const defaultProps = {
        bookings: mockBookings,
        page: 1,
        pageSize: 20,
        totalCount: 2,
        totalPages: 1,
        onPageChange: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('formatDateVN', () => {
        it('formats date strings as day/month/year without leading zero', () => {
            expect(formatDateVN('2026-09-10')).toBe('10/9/2026')
            expect(formatDateVN('2026-10-05')).toBe('5/10/2026')
        })

        it('handles ISO timestamps correctly', () => {
            expect(formatDateVN('2026-09-10T08:30:00.000Z')).toBe('10/9/2026')
        })

        it('returns empty string for null or undefined', () => {
            expect(formatDateVN(null)).toBe('')
            expect(formatDateVN(undefined)).toBe('')
        })
    })

    describe('formatVND', () => {
        it('formats number as Vietnamese Dong', () => {
            const formatted = formatVND(2400000)
            expect(formatted).toContain('2.400.000')
            expect(formatted).toContain('₫')
        })
    })

    it('renders desktop table headers', () => {
        render(<BookingTable {...defaultProps} />)
        expect(screen.getByRole('columnheader', { name: 'Mã đặt phòng' })).toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Phòng' })).toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Khu vườn' })).toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Nhận phòng' })).toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Trả phòng' })).toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Trạng thái' })).toBeInTheDocument()
        expect(screen.getAllByText('Tổng tiền').length).toBeGreaterThanOrEqual(1)
    })

    it('renders booking data correctly in table and card list', () => {
        render(<BookingTable {...defaultProps} />)

        // Code
        const code1Elements = screen.getAllByText('BKABC123')
        expect(code1Elements.length).toBeGreaterThanOrEqual(1)

        const code2Elements = screen.getAllByText('BKXYZ456')
        expect(code2Elements.length).toBeGreaterThanOrEqual(1)

        // Room names
        expect(screen.getAllByText('Bungalow Hoa Mai').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Villa Hương Rừng').length).toBeGreaterThanOrEqual(1)

        // Garden names
        expect(screen.getAllByText('Vườn Trầm Hương Gia Lai').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Vườn Đắk Lắk').length).toBeGreaterThanOrEqual(1)

        // Formatted dates
        expect(screen.getAllByText('10/9/2026').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('12/9/2026').length).toBeGreaterThanOrEqual(1)

        // Status badges
        expect(screen.getAllByText('Đã xác nhận').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Chờ thanh toán').length).toBeGreaterThanOrEqual(1)
    })

    it('navigates to /crm/my-bookings/[id] on row click', () => {
        render(<BookingTable {...defaultProps} />)

        const rows = screen.getAllByRole('row')
        expect(rows.length).toBe(3)

        const dataRow = rows[1]
        fireEvent.click(dataRow)
        expect(mockPush).toHaveBeenCalledWith('/crm/my-bookings/booking-1')
    })

    it('renders empty state when no bookings exist', () => {
        render(<BookingTable {...defaultProps} bookings={[]} totalCount={0} totalPages={0} />)

        expect(screen.getByText('Bạn chưa có đặt phòng nào')).toBeInTheDocument()
        const exploreBtn = screen.getByRole('link', { name: /Khám phá vườn nghỉ dưỡng/i })
        expect(exploreBtn).toBeInTheDocument()
        expect(exploreBtn).toHaveAttribute('href', '/eco-tourism')
    })

    describe('Pagination', () => {
        it('does not show pagination when totalPages is 1', () => {
            render(<BookingTable {...defaultProps} totalPages={1} />)
            expect(screen.queryByLabelText('Trang trước')).not.toBeInTheDocument()
            expect(screen.queryByLabelText('Trang sau')).not.toBeInTheDocument()
        })

        it('renders pagination and handles page changes when totalPages > 1', () => {
            const onPageChange = jest.fn()
            render(
                <BookingTable
                    {...defaultProps}
                    page={2}
                    totalPages={3}
                    totalCount={50}
                    onPageChange={onPageChange}
                />
            )

            const prevBtn = screen.getByLabelText('Trang trước')
            const nextBtn = screen.getByLabelText('Trang sau')

            expect(prevBtn).not.toBeDisabled()
            expect(nextBtn).not.toBeDisabled()

            fireEvent.click(prevBtn)
            expect(onPageChange).toHaveBeenCalledWith(1)

            fireEvent.click(nextBtn)
            expect(onPageChange).toHaveBeenCalledWith(3)
        })

        it('disables previous button on first page', () => {
            render(<BookingTable {...defaultProps} page={1} totalPages={3} />)
            const prevBtn = screen.getByLabelText('Trang trước')
            expect(prevBtn).toBeDisabled()
        })

        it('disables next button on last page', () => {
            render(<BookingTable {...defaultProps} page={3} totalPages={3} />)
            const nextBtn = screen.getByLabelText('Trang sau')
            expect(nextBtn).toBeDisabled()
        })
    })
})
