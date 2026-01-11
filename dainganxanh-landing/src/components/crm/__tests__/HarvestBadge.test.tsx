import { render, screen } from '@testing-library/react'
import HarvestBadge from '../HarvestBadge'

describe('HarvestBadge', () => {
    it('renders badge for trees >= 60 months', () => {
        render(<HarvestBadge ageInMonths={60} />)

        expect(screen.getByText('Sẵn sàng thu hoạch')).toBeInTheDocument()
        expect(screen.getByText('🌟')).toBeInTheDocument()
    })

    it('renders badge for trees > 60 months', () => {
        render(<HarvestBadge ageInMonths={72} />)

        expect(screen.getByText('Sẵn sàng thu hoạch')).toBeInTheDocument()
    })

    it('does not render badge for trees < 60 months', () => {
        const { container } = render(<HarvestBadge ageInMonths={59} />)

        expect(container.firstChild).toBeNull()
    })

    it('does not render badge for young trees', () => {
        const { container } = render(<HarvestBadge ageInMonths={12} />)

        expect(container.firstChild).toBeNull()
    })

    it('does not render badge for 0 month trees', () => {
        const { container } = render(<HarvestBadge ageInMonths={0} />)

        expect(container.firstChild).toBeNull()
    })

    it('has correct styling classes', () => {
        const { container } = render(<HarvestBadge ageInMonths={60} />)

        const badge = container.querySelector('.bg-gradient-to-r')
        expect(badge).toBeInTheDocument()
        expect(badge).toHaveClass('from-yellow-100', 'to-amber-100', 'border-yellow-400')
    })

    it('includes motion-reduce accessibility', () => {
        const { container } = render(<HarvestBadge ageInMonths={60} />)

        const badge = container.querySelector('.animate-pulse')
        expect(badge).toHaveClass('motion-reduce:animate-none')
    })
})
