import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import LocaleTabs from '../LocaleTabs'

describe('LocaleTabs', () => {
    it('renders tabs with localized labels and calls onChange on click', () => {
        const handleChange = jest.fn()
        renderWithIntl(
            <LocaleTabs activeTab="vi" onChange={handleChange} />
        )

        const viTab = screen.getByText('Tiếng Việt')
        const enTab = screen.getByText('Tiếng Anh')
        expect(viTab).toBeInTheDocument()
        expect(enTab).toBeInTheDocument()

        fireEvent.click(enTab)
        expect(handleChange).toHaveBeenCalledWith('en')
    })

    it('renders dot indicator when hasEnContent is true', () => {
        renderWithIntl(
            <LocaleTabs activeTab="vi" onChange={jest.fn()} hasEnContent={true} />
        )

        const dot = screen.getByTitle('Đã có nội dung tiếng Anh')
        expect(dot).toBeInTheDocument()
    })

    it('supports pills variant', () => {
        const handleChange = jest.fn()
        renderWithIntl(
            <LocaleTabs activeTab="en" onChange={handleChange} variant="pills" />
        )

        const viTab = screen.getByText('Tiếng Việt')
        expect(viTab).toBeInTheDocument()
        fireEvent.click(viTab)
        expect(handleChange).toHaveBeenCalledWith('vi')
    })
})
