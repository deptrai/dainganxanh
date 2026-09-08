import { render, screen } from '@testing-library/react'
import GardenDetailPage from '../page'

const mockMaybeSingle = jest.fn()
const mockIn = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
    createServiceRoleClient: () => ({
        from: mockFrom,
    }),
}))

jest.mock('next/dynamic', () => () => () => <div data-testid="mock-map" />)

jest.mock('@/components/eco-tourism/GardenDetailClient', () => ({
    GardenDetailClient: ({ garden }: { garden: { name: string; rooms: unknown[]; bookings: unknown[] } }) => (
        <div data-testid="garden-detail-client">
            <h1>{garden.name}</h1>
            <div data-testid="room-count">{garden.rooms.length}</div>
            <div data-testid="booking-count">{garden.bookings.length}</div>
        </div>
    ),
}))

describe('GardenDetailPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockFrom.mockImplementation((table: string) => ({
            select: mockSelect,
        }))
        mockSelect.mockImplementation((columns: string) => {
            if (columns.includes('rooms')) {
                return {
                    eq: mockEq,
                }
            }
            return {
                in: mockIn,
            }
        })
        mockEq.mockReturnValue({
            maybeSingle: mockMaybeSingle,
        })
        mockIn.mockImplementation((column: string) => {
            if (column === 'room_id') {
                return { in: mockIn }
            }
            return { data: [{ id: 'b1', room_id: 'r1', check_in_date: '2026-09-10', check_out_date: '2026-09-12', status: 'confirmed', expires_at: null }] }
        })
    })

    it('renders 404 when lot does not exist', async () => {
        mockMaybeSingle.mockResolvedValue({ data: null, error: null })
        const params = Promise.resolve({ lotId: 'nonexistent' })
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

        const params = Promise.resolve({ lotId: 'lot-1' })
        const element = await GardenDetailPage({ params })
        render(element)
        expect(screen.getByTestId('garden-detail-client')).toBeInTheDocument()
        expect(screen.getByText('Vườn Trầm A')).toBeInTheDocument()
        expect(screen.getByTestId('room-count')).toHaveTextContent('1')
        expect(screen.getByTestId('booking-count')).toHaveTextContent('1')
    })
})
