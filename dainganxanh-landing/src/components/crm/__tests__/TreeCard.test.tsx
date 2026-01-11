import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TreeCard from '@/components/crm/TreeCard'

describe('TreeCard', () => {
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
})
