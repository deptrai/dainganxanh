import { render, screen, fireEvent } from '@testing-library/react'
import BookingPageClient from '../BookingPageClient'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(''),
}))

jest.mock('@/components/eco-tourism/BookingForm', () => ({
  BookingForm: (props: { onSuccess: (booking: unknown) => void }) => (
    <div data-testid="mock-booking-form">
      <button
        onClick={() =>
          props.onSuccess({
            bookingId: 'b-1',
            bookingCode: 'BKTEST01',
            roomName: 'Phòng VIP',
            checkInDate: '2026-10-01',
            checkOutDate: '2026-10-03',
            nightsCount: 2,
            totalAmount: 2000000,
            expiresAt: new Date(Date.now() + 60000).toISOString(),
            status: 'pending',
          })
        }
      >
        Submit Form
      </button>
    </div>
  ),
}))

jest.mock('@/components/eco-tourism/OrderSummary', () => ({
  OrderSummary: () => <div data-testid="mock-order-summary">Order Summary Mock</div>,
}))

jest.mock('@/components/eco-tourism/VietQRDisplay', () => ({
  VietQRDisplay: (props: { onExpired: () => void; onSuccess: () => void }) => (
    <div data-testid="mock-vietqr-display">
      <button onClick={props.onExpired}>Trigger Expired</button>
      <button onClick={props.onSuccess}>Trigger Success</button>
    </div>
  ),
}))

describe('BookingPageClient', () => {
  const defaultProps = {
    room: {
      id: 'room-1',
      name: 'Phòng VIP',
      description: 'Mô tả phòng',
      capacity: 2,
      amenities: ['wifi'],
      price_per_night: 1000000,
      images: ['img1.jpg'],
      status: 'active' as const,
    },
    lot: {
      id: 'lot-1',
      name: 'Vườn Trầm Hương A',
      region: 'Miền Trung',
    },
    checkIn: '2026-10-01',
    checkOut: '2026-10-03',
  }

  it('renders form and order summary in initial form step', () => {
    render(<BookingPageClient {...defaultProps} />)
    expect(screen.getByText('Đặt phòng tại Vườn Trầm Hương A')).toBeInTheDocument()
    expect(screen.getByTestId('mock-booking-form')).toBeInTheDocument()
    expect(screen.getByTestId('mock-order-summary')).toBeInTheDocument()
  })

  it('switches to payment step when form succeeds', () => {
    render(<BookingPageClient {...defaultProps} />)
    fireEvent.click(screen.getByText('Submit Form'))
    expect(screen.getByTestId('mock-vietqr-display')).toBeInTheDocument()
  })

  it('switches to expired screen when hold expires', () => {
    render(<BookingPageClient {...defaultProps} />)
    fireEvent.click(screen.getByText('Submit Form'))
    fireEvent.click(screen.getByText('Trigger Expired'))
    expect(screen.getByText('Đơn đặt phòng đã hết hạn')).toBeInTheDocument()
  })

  it('switches to success screen when payment confirms', () => {
    render(<BookingPageClient {...defaultProps} />)
    fireEvent.click(screen.getByText('Submit Form'))
    fireEvent.click(screen.getByText('Trigger Success'))
    expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
  })
})
