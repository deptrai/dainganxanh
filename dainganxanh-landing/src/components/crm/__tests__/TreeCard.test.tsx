import { render, screen } from '@testing-library/react'
import TreeCard from '@/components/crm/TreeCard'

describe('TreeCard', () => {
    // Freeze time so age-derived UI ("vừa trồng", "đã 2.5 năm", etc.) is deterministic.
    const FIXED_NOW = new Date('2026-04-20T12:00:00Z')

    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(FIXED_NOW)
    })
    afterAll(() => {
        jest.useRealTimers()
    })

    const mockTree = {
        id: '123',
        tree_code: 'TREE-2026-001',
        status: 'growing',
        planted_at: '2026-01-01T00:00:00Z',
        co2_absorbed: 15.5,
        latest_photo: 'https://example.com/tree.jpg',
    }

    it('renders tree code', () => {
        render(<TreeCard tree={mockTree} />)
        expect(screen.getByText('TREE-2026-001')).toBeInTheDocument()
    })

    it('renders status badge with correct emoji and label', () => {
        render(<TreeCard tree={mockTree} />)
        expect(screen.getByText('🌲')).toBeInTheDocument()
        expect(screen.getByText('Đang lớn')).toBeInTheDocument()
    })

    it('renders CO2 absorbed', () => {
        render(<TreeCard tree={mockTree} />)
        expect(screen.getByText(/15\.5 kg CO₂/)).toBeInTheDocument()
    })

    it('shows placeholder when tree is less than 9 months old', () => {
        const youngTree = {
            ...mockTree,
            planted_at: new Date().toISOString(), // Just planted
            latest_photo: null,
        }
        render(<TreeCard tree={youngTree} />)
        expect(screen.getByText('Cây đang lớn...')).toBeInTheDocument()
    })

    it('shows photo when tree is older than 9 months and has photo', () => {
        const oldTree = {
            ...mockTree,
            planted_at: '2025-01-01T00:00:00Z', // Over 1 year old
        }
        const { container } = render(<TreeCard tree={oldTree} />)
        const img = container.querySelector('img')
        expect(img).toHaveAttribute('alt', 'Cây TREE-2026-001')
    })

    it('links to tree detail page', () => {
        const { container } = render(<TreeCard tree={mockTree} />)
        const link = container.querySelector('a')
        expect(link).toHaveAttribute('href', '/crm/my-garden/123')
    })

    it('shows harvest badge for trees >= 120 months old', () => {
        const harvestReadyTree = {
            ...mockTree,
            planted_at: new Date(Date.now() - 120 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 120 months ago
        }
        render(<TreeCard tree={harvestReadyTree} />)
        expect(screen.getByText('Sẵn sàng thu hoạch')).toBeInTheDocument()
        expect(screen.getByText('🌟')).toBeInTheDocument()
    })

    it('shows gold ring border for harvest-ready trees', () => {
        const harvestReadyTree = {
            ...mockTree,
            planted_at: new Date(Date.now() - 120 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
        const { container } = render(<TreeCard tree={harvestReadyTree} />)
        const link = container.querySelector('a')
        expect(link).toHaveClass('ring-4', 'ring-yellow-400')
    })

    it('does not show harvest badge for young trees', () => {
        const youngTree = {
            ...mockTree,
            planted_at: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 12 months ago
        }
        render(<TreeCard tree={youngTree} />)
        expect(screen.queryByText('Sẵn sàng thu hoạch')).not.toBeInTheDocument()
    })
})
