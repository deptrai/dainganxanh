import { render, screen } from '@testing-library/react'
import EmptyGarden from '@/components/crm/EmptyGarden'

describe('EmptyGarden', () => {
    it('renders empty state message', () => {
        render(<EmptyGarden />)
        expect(screen.getByText('Bạn chưa có cây nào')).toBeInTheDocument()
    })

    it('renders CTA button linking to pricing', () => {
        const { container } = render(<EmptyGarden />)
        const link = container.querySelector('a[href="/pricing"]')
        expect(link).toBeInTheDocument()
        expect(link).toHaveTextContent('Trồng cây ngay')
    })

    it('renders benefit icons', () => {
        render(<EmptyGarden />)
        expect(screen.getByText('Bảo vệ môi trường')).toBeInTheDocument()
        expect(screen.getByText('Thu nhập bền vững')).toBeInTheDocument()
        expect(screen.getByText('Theo dõi minh bạch')).toBeInTheDocument()
    })
})
