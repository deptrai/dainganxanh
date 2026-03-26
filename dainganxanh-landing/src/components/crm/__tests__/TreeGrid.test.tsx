import { render, screen } from '@testing-library/react'
import TreeGrid from '@/components/crm/TreeGrid'

describe('TreeGrid', () => {
    const mockTrees = [
        {
            id: '1',
            tree_code: 'TREE-001',
            status: 'growing',
            planted_at: '2026-01-01T00:00:00Z',
            co2_absorbed: 10,
            latest_photo: null,
        },
        {
            id: '2',
            tree_code: 'TREE-002',
            status: 'mature',
            planted_at: '2025-01-01T00:00:00Z',
            co2_absorbed: 50,
            latest_photo: 'https://example.com/tree2.jpg',
        },
    ]

    it('renders all trees in grid', () => {
        render(<TreeGrid trees={mockTrees} />)
        expect(screen.getByText('TREE-001')).toBeInTheDocument()
        expect(screen.getByText('TREE-002')).toBeInTheDocument()
    })

    it('renders empty grid when no trees', () => {
        const { container } = render(<TreeGrid trees={[]} />)
        const grid = container.querySelector('.grid')
        expect(grid?.children.length).toBe(0)
    })

    it('applies responsive grid classes', () => {
        const { container } = render(<TreeGrid trees={mockTrees} />)
        const grid = container.querySelector('.grid')
        expect(grid).toHaveClass('grid-cols-1')
        expect(grid).toHaveClass('md:grid-cols-2')
        expect(grid).toHaveClass('lg:grid-cols-3')
        expect(grid).toHaveClass('xl:grid-cols-4')
    })
})
