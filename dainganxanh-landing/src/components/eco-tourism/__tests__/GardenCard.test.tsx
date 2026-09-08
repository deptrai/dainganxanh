import { render, screen } from '@testing-library/react'
import { GardenCard } from '../GardenCard'

const baseLot = {
    id: 'lot-1',
    name: 'Vườn A',
    region: 'Miền Bắc',
    images: [],
    priceFrom: 850000,
}

describe('GardenCard', () => {
    test('renders garden name and region badge', () => {
        render(<GardenCard lot={baseLot} />)
        expect(screen.getByText('Vườn A')).toBeInTheDocument()
        expect(screen.getAllByText('Miền Bắc').length).toBeGreaterThan(0)
    })

    test('renders "Giá từ" price', () => {
        render(<GardenCard lot={baseLot} />)
        expect(screen.getByText(/850.000/i)).toBeInTheDocument()
    })

    test('renders "Xem phòng" CTA linking to lot detail', () => {
        render(<GardenCard lot={baseLot} />)
        const link = screen.getAllByRole('link').find(el => el.getAttribute('href') === '/eco-tourism/lot-1')
        expect(link).toBeInTheDocument()
    })

    test('renders placeholder emoji when no image', () => {
        render(<GardenCard lot={{ ...baseLot, images: [] }} />)
        expect(screen.getByText('🌳')).toBeInTheDocument()
    })

    test('renders dash when priceFrom is null', () => {
        render(<GardenCard lot={{ ...baseLot, priceFrom: null }} />)
        expect(screen.getByText('—')).toBeInTheDocument()
    })
})
