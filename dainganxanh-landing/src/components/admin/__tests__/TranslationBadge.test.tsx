import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import TranslationBadge from '../TranslationBadge'

describe('TranslationBadge', () => {
    it('renders "VI + EN" badge with emerald styling when hasEn is true (vi locale)', () => {
        const { container } = renderWithIntl(<TranslationBadge hasEn={true} />, { locale: 'vi' })
        const badge = screen.getByText('VI + EN')
        expect(badge).toBeInTheDocument()
        expect(badge.className).toContain('text-emerald-700')
        expect(badge.className).toContain('bg-emerald-50')
        expect(container.querySelector('span[title="Đã có bản dịch tiếng Anh"]')).toBeInTheDocument()
    })

    it('renders "Chỉ có VI" badge with muted styling when hasEn is false (vi locale)', () => {
        const { container } = renderWithIntl(<TranslationBadge hasEn={false} />, { locale: 'vi' })
        const badge = screen.getByText('Chỉ có VI')
        expect(badge).toBeInTheDocument()
        expect(badge.className).toContain('text-gray-500')
        expect(badge.className).toContain('bg-gray-100')
        expect(container.querySelector('span[title="Chỉ có tiếng Việt, chưa dịch tiếng Anh"]')).toBeInTheDocument()
    })

    it('renders "VI only" badge when rendered with en locale', () => {
        renderWithIntl(<TranslationBadge hasEn={false} />, { locale: 'en' })
        expect(screen.getByText('VI only')).toBeInTheDocument()
    })

    it('applies custom className if provided', () => {
        renderWithIntl(<TranslationBadge hasEn={true} className="custom-test-class" />)
        const badge = screen.getByText('VI + EN')
        expect(badge.className).toContain('custom-test-class')
    })
})
