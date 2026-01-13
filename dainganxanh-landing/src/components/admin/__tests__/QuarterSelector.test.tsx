import { render, screen, fireEvent } from '@testing-library/react'
import { QuarterSelector } from '../QuarterSelector'

describe('QuarterSelector', () => {
    const mockOnQuarterChange = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders all 4 quarters', () => {
        render(
            <QuarterSelector
                selectedQuarter="2026-Q1"
                onQuarterChange={mockOnQuarterChange}
            />
        )

        expect(screen.getByText('Q1')).toBeInTheDocument()
        expect(screen.getByText('Q2')).toBeInTheDocument()
        expect(screen.getByText('Q3')).toBeInTheDocument()
        expect(screen.getByText('Q4')).toBeInTheDocument()
    })

    it('highlights selected quarter', () => {
        render(
            <QuarterSelector
                selectedQuarter="2026-Q2"
                onQuarterChange={mockOnQuarterChange}
            />
        )

        const q2Button = screen.getByText('Q2').closest('button')
        expect(q2Button).toHaveClass('bg-green-600')
    })

    it('calls onQuarterChange when quarter is clicked', () => {
        render(
            <QuarterSelector
                selectedQuarter="2026-Q1"
                onQuarterChange={mockOnQuarterChange}
            />
        )

        const q3Button = screen.getByText('Q3').closest('button')
        fireEvent.click(q3Button!)

        expect(mockOnQuarterChange).toHaveBeenCalledWith('2026-Q3')
    })

    it('shows current year', () => {
        render(
            <QuarterSelector
                selectedQuarter="2026-Q1"
                onQuarterChange={mockOnQuarterChange}
                year={2026}
            />
        )

        expect(screen.getByText('Năm 2026')).toBeInTheDocument()
    })

    it('changes year when previous button is clicked', () => {
        render(
            <QuarterSelector
                selectedQuarter="2026-Q1"
                onQuarterChange={mockOnQuarterChange}
                year={2026}
            />
        )

        const prevButton = screen.getByLabelText('Previous year')
        fireEvent.click(prevButton)

        expect(mockOnQuarterChange).toHaveBeenCalledWith('2025-Q1')
    })

    it('changes year when next button is clicked', () => {
        render(
            <QuarterSelector
                selectedQuarter="2026-Q1"
                onQuarterChange={mockOnQuarterChange}
                year={2026}
            />
        )

        const nextButton = screen.getByLabelText('Next year')
        fireEvent.click(nextButton)

        expect(mockOnQuarterChange).toHaveBeenCalledWith('2027-Q1')
    })

    it('displays due dates for each quarter', () => {
        render(
            <QuarterSelector
                selectedQuarter="2026-Q1"
                onQuarterChange={mockOnQuarterChange}
            />
        )

        expect(screen.getByText('31 Tháng 3')).toBeInTheDocument()
        expect(screen.getByText('30 Tháng 6')).toBeInTheDocument()
        expect(screen.getByText('30 Tháng 9')).toBeInTheDocument()
        expect(screen.getByText('31 Tháng 12')).toBeInTheDocument()
    })

    it('shows selected quarter info', () => {
        render(
            <QuarterSelector
                selectedQuarter="2026-Q1"
                onQuarterChange={mockOnQuarterChange}
                year={2026}
            />
        )

        expect(screen.getByText(/Hạn chót:/i)).toBeInTheDocument()
        expect(screen.getByText(/31 Tháng 3 2026/i)).toBeInTheDocument()
    })

    it('shows current quarter indicator', () => {
        // Mock current date to Q2 2026
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-04-15'))

        const { container } = render(
            <QuarterSelector
                selectedQuarter="2026-Q1"
                onQuarterChange={mockOnQuarterChange}
                year={2026}
            />
        )

        // Q2 should have current indicator (green dot)
        const q2Button = screen.getByText('Q2').closest('button')
        const indicator = q2Button?.querySelector('.bg-green-500')
        expect(indicator).toBeInTheDocument()

        jest.useRealTimers()
    })
})
