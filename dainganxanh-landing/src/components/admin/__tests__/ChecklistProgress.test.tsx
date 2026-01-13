import { render, screen } from '@testing-library/react'
import { ChecklistProgress } from '../ChecklistProgress'

describe('ChecklistProgress', () => {
    it('renders progress bar with correct percentage', () => {
        render(<ChecklistProgress completed={3} total={5} />)

        expect(screen.getByText('60%')).toBeInTheDocument()
        expect(screen.getByText('3/5 hoàn thành')).toBeInTheDocument()
    })

    it('shows red color for low completion (< 30%)', () => {
        const { container } = render(<ChecklistProgress completed={1} total={5} />)

        const progressBar = container.querySelector('.bg-red-500')
        expect(progressBar).toBeInTheDocument()
    })

    it('shows yellow color for medium completion (30-70%)', () => {
        const { container } = render(<ChecklistProgress completed={3} total={5} />)

        const progressBar = container.querySelector('.bg-yellow-500')
        expect(progressBar).toBeInTheDocument()
    })

    it('shows green color for high completion (> 70%)', () => {
        const { container } = render(<ChecklistProgress completed={4} total={5} />)

        const progressBar = container.querySelector('.bg-green-500')
        expect(progressBar).toBeInTheDocument()
    })

    it('handles 0% completion', () => {
        render(<ChecklistProgress completed={0} total={5} />)

        expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('handles 100% completion', () => {
        render(<ChecklistProgress completed={5} total={5} />)

        expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('hides percentage when showPercentage is false', () => {
        render(<ChecklistProgress completed={3} total={5} showPercentage={false} />)

        expect(screen.queryByText('60%')).not.toBeInTheDocument()
    })

    it('applies correct size class for sm size', () => {
        const { container } = render(
            <ChecklistProgress completed={3} total={5} size="sm" />
        )

        const progressContainer = container.querySelector('.h-2')
        expect(progressContainer).toBeInTheDocument()
    })

    it('applies correct size class for md size', () => {
        const { container } = render(
            <ChecklistProgress completed={3} total={5} size="md" />
        )

        const progressContainer = container.querySelector('.h-3')
        expect(progressContainer).toBeInTheDocument()
    })

    it('applies correct size class for lg size', () => {
        const { container } = render(
            <ChecklistProgress completed={3} total={5} size="lg" />
        )

        const progressContainer = container.querySelector('.h-4')
        expect(progressContainer).toBeInTheDocument()
    })

    it('handles edge case with 0 total', () => {
        render(<ChecklistProgress completed={0} total={0} />)

        expect(screen.getByText('0%')).toBeInTheDocument()
    })
})
