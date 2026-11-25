import { render, screen } from '@testing-library/react'
import GardenDetailPage from '../page'
import type { RoomPricingRule } from '@/lib/pricing'

const mockMaybeSingle = jest.fn()
let mockPricingRules: RoomPricingRule[] = []

jest.mock('@/lib/supabase/server', () => ({
    createServiceRoleClient: () => ({
        from: jest.fn().mockImplementation((table: string) => {
            if (table === 'lots') {
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            maybeSingle: mockMaybeSingle,
                        }),
                    }),
                }
            }
            if (table === 'room_bookings') {
                return {
                    select: jest.fn().mockReturnValue({
                        in: jest.fn().mockReturnValue({
                            in: jest.fn().mockResolvedValue({
                                data: [{ id: 'b1', room_id: 'r1', check_in_date: '2026-09-10', check_out_date: '2026-09-12', status: 'confirmed', expires_at: null }],
                                error: null,
                            }),
                        }),
                    }),
                }
            }
            if (table === 'room_blocks') {
                return {
                    select: jest.fn().mockReturnValue({
                        in: jest.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                }
            }
            if (table === 'room_pricing_rules') {
                return {
                    select: jest.fn().mockReturnValue({
                        in: jest.fn().mockResolvedValue({ data: mockPricingRules, error: null }),
                    }),
                }
            }
            return {
                select: jest.fn().mockReturnThis(),
                in: jest.fn().mockReturnThis(),
            }
        }),
    }),
}))

jest.mock('next/dynamic', () => () => () => <div data-testid="mock-map" />)

jest.mock('@/components/eco-tourism/GardenDetailClient', () => ({
    GardenDetailClient: ({ garden }: { garden: { name: string; rooms: Array<{ price_per_night: number }>; bookings: unknown[] } }) => (
        <div data-testid="garden-detail-client">
            <h1>{garden.name}</h1>
            <div data-testid="room-count">{garden.rooms.length}</div>
            <div data-testid="room-price">{garden.rooms[0]?.price_per_night}</div>
            <div data-testid="booking-count">{garden.bookings.length}</div>
        </div>
    ),
}))

describe('GardenDetailPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockPricingRules = []
    })

    it('renders 404 when lot does not exist', async () => {
        mockMaybeSingle.mockResolvedValue({ data: null, error: null })
        const params = Promise.resolve({ lotId: 'nonexistent', locale: 'vi' })
        const element = await GardenDetailPage({ params })
        render(element)
        expect(screen.getByText('Không tìm thấy vườn')).toBeInTheDocument()
    })

    it('renders garden details with active rooms and bookings', async () => {
        const lot = {
            id: 'lot-1',
            name: 'Vườn Trầm A',
            region: 'Miền Bắc',
            description: 'Vườn đẹp',
            location_lat: 10.0,
            location_lng: 106.0,
            images: ['img1.jpg'],
            rooms: [
                { id: 'r1', name: 'Phòng 1', capacity: 2, amenities: [], price_per_night: 100, images: [], status: 'active' },
                { id: 'r2', name: 'Phòng 2', capacity: 4, amenities: [], price_per_night: 200, images: [], status: 'inactive' },
            ],
        }
        mockMaybeSingle.mockResolvedValue({ data: lot, error: null })

        const params = Promise.resolve({ lotId: 'lot-1', locale: 'vi' })
        const element = await GardenDetailPage({ params })
        render(element)
        expect(screen.getByTestId('garden-detail-client')).toBeInTheDocument()
        expect(screen.getByText('Vườn Trầm A')).toBeInTheDocument()
        expect(screen.getByTestId('room-count')).toHaveTextContent('1')
        expect(screen.getByTestId('room-price')).toHaveTextContent('100')
        expect(screen.getByTestId('booking-count')).toHaveTextContent('1')
    })

    it('updates room price_per_night with effective promotional pricing rule', async () => {
        const today = new Date()
        const start = new Date(today)
        start.setDate(today.getDate() + 5)
        const end = new Date(today)
        end.setDate(today.getDate() + 25)

        mockPricingRules = [
            {
                id: 'rule-promo',
                room_id: 'r1',
                start_date: start.toISOString().split('T')[0],
                end_date: end.toISOString().split('T')[0],
                price_per_night: 75,
            },
        ]

        const lot = {
            id: 'lot-1',
            name: 'Vườn Trầm A',
            region: 'Miền Bắc',
            description: 'Vườn đẹp',
            location_lat: 10.0,
            location_lng: 106.0,
            images: ['img1.jpg'],
            rooms: [
                { id: 'r1', name: 'Phòng 1', capacity: 2, amenities: [], price_per_night: 100, images: [], status: 'active' },
            ],
        }
        mockMaybeSingle.mockResolvedValue({ data: lot, error: null })

        const params = Promise.resolve({ lotId: 'lot-1', locale: 'vi' })
        const element = await GardenDetailPage({ params })
        render(element)
        expect(screen.getByTestId('room-price')).toHaveTextContent('75')
    })
})
