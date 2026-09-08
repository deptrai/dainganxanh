import { render, screen } from '@testing-library/react'
import { RoomCard, type Room } from '../RoomCard'

const sampleRoom: Room = {
    id: 'room-1',
    name: 'Phòng Đôi',
    description: null,
    capacity: 2,
    amenities: ['WiFi', 'Điều hòa'],
    price_per_night: 1200000,
    images: null,
    status: 'active',
}

describe('RoomCard', () => {
    it('renders room name, capacity, price, and booking CTA', () => {
        render(<RoomCard room={sampleRoom} lotId="lot-1" checkIn="2026-09-10" checkOut="2026-09-12" />)
        expect(screen.getByText('Phòng Đôi')).toBeInTheDocument()
        expect(screen.getByText('2 khách')).toBeInTheDocument()
        expect(screen.getByText('1.200.000 ₫')).toBeInTheDocument()
        const link = screen.getByRole('link')
        expect(link).toHaveAttribute('href', '/eco-tourism/lot-1/book?room_id=room-1&check_in=2026-09-10&check_out=2026-09-12')
    })

    it('disables CTA and shows booked badge when state is booked', () => {
        render(<RoomCard room={sampleRoom} lotId="lot-1" state="booked" />)
        expect(screen.getByText('Đã được đặt')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Đã đặt' })).toBeDisabled()
    })

    it('disables CTA and shows maintenance badge when state is blocked', () => {
        render(<RoomCard room={sampleRoom} lotId="lot-1" state="blocked" />)
        expect(screen.getByText('Đang bảo trì')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Bảo trì' })).toBeDisabled()
    })
})
