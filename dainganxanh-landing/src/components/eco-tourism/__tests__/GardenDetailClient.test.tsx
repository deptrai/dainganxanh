import { render, screen, fireEvent } from '@testing-library/react'
import { GardenDetailClient, GardenDetail } from '../GardenDetailClient'
import { useSearchParams } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}))

jest.mock('../ImageGallery', () => ({
  ImageGallery: () => <div data-testid="image-gallery" />,
}))

jest.mock('../MapSection', () => ({
  MapSection: () => <div data-testid="map-section" />,
}))

jest.mock('../DateRangePicker', () => ({
  DateRangePicker: () => <div data-testid="date-range-picker" />,
}))

jest.mock('../RoomCard', () => ({
  RoomCard: ({ room }: { room: { name: string } }) => <div data-testid="room-card">{room.name}</div>,
}))

describe('GardenDetailClient Component', () => {
  const mockGarden: GardenDetail = {
    id: 'lot-1',
    name: 'Vườn Trầm Ba Vì',
    region: 'Miền Bắc',
    description: 'Mô tả khu vườn',
    location_lat: 21.0,
    location_lng: 105.0,
    images: [],
    rooms: [
      {
        id: 'r1',
        name: 'Phòng Hương Sen',
        description: 'Phòng view hồ',
        capacity: 2,
        amenities: ['wifi'],
        price_per_night: 1200000,
        images: [],
        status: 'active',
      },
    ],
    bookings: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders garden details without cancellation banner when cancelled param is absent', () => {
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''))
    render(<GardenDetailClient garden={mockGarden} />)

    expect(screen.getByText('Vườn Trầm Ba Vì')).toBeInTheDocument()
    expect(screen.getByText('Miền Bắc')).toBeInTheDocument()
    expect(screen.queryByText(/Đã hủy đơn đặt phòng thành công/i)).not.toBeInTheDocument()
  })

  it('renders cancellation feedback banner when cancelled=1 in searchParams', () => {
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('cancelled=1'))
    render(<GardenDetailClient garden={mockGarden} />)

    expect(screen.getByText(/Đã hủy đơn đặt phòng thành công/i)).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: /Đóng thông báo/i })
    expect(closeBtn).toBeInTheDocument()
    fireEvent.click(closeBtn)

    expect(screen.queryByText(/Đã hủy đơn đặt phòng thành công/i)).not.toBeInTheDocument()
  })
})
