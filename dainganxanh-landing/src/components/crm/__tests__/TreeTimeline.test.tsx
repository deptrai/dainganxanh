import { render, screen } from '@testing-library/react'
import TreeTimeline from '../TreeTimeline'

describe('TreeTimeline', () => {
    const mockProps = {
        plantedAt: '2024-01-01',
        createdAt: '2023-12-01',
        ageInMonths: 6,
    }

    it('renders timeline with all stages', () => {
        render(<TreeTimeline {...mockProps} />)

        expect(screen.getByText('Hành Trình Cây')).toBeInTheDocument()
        expect(screen.getByText('Đặt hàng thành công')).toBeInTheDocument()
        expect(screen.getByText('Đang ươm giống')).toBeInTheDocument()
        expect(screen.getByText('Trồng xuống đất')).toBeInTheDocument()
        expect(screen.getByText('Năm 5: Thu hoạch')).toBeInTheDocument()
    })

    it('shows current position indicator for young trees', () => {
        render(<TreeTimeline {...mockProps} ageInMonths={6} />)

        expect(screen.getByText('← Bạn đang ở đây')).toBeInTheDocument()
    })

    it('displays placeholder text for trees < 9 months', () => {
        render(<TreeTimeline {...mockProps} ageInMonths={3} />)

        // Should show "Đang trong giai đoạn này" for current placeholder stages
        const placeholderTexts = screen.getAllByText(/Đang trong giai đoạn này/)
        expect(placeholderTexts.length).toBeGreaterThan(0)
    })

    it('shows progress percentage to harvest', () => {
        render(<TreeTimeline {...mockProps} ageInMonths={30} />)

        // 30 months / 60 months = 50%
        expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('displays tree age in months', () => {
        render(<TreeTimeline {...mockProps} ageInMonths={12} />)

        expect(screen.getByText('12 tháng')).toBeInTheDocument()
    })

    it('marks completed stages with green styling', () => {
        const { container } = render(<TreeTimeline {...mockProps} ageInMonths={12} />)

        // Stages before month 12 should have completed styling
        const completedStages = container.querySelectorAll('.bg-green-100')
        expect(completedStages.length).toBeGreaterThan(0)
    })

    it('shows current stage with emerald styling and pulse animation', () => {
        const { container } = render(<TreeTimeline {...mockProps} ageInMonths={6} />)

        // Current stage should have emerald background and pulse animation
        const currentStage = container.querySelector('.bg-emerald-500.animate-pulse')
        expect(currentStage).toBeInTheDocument()
    })

    it('displays future stages with gray styling', () => {
        const { container } = render(<TreeTimeline {...mockProps} ageInMonths={3} />)

        // Future stages should have gray styling
        const futureStages = container.querySelectorAll('.bg-gray-100')
        expect(futureStages.length).toBeGreaterThan(0)
    })

    it('shows estimated dates for future milestones', () => {
        render(<TreeTimeline {...mockProps} ageInMonths={3} />)

        // Should show "Dự kiến:" for future stages
        const estimatedDates = screen.getAllByText(/Dự kiến:/)
        expect(estimatedDates.length).toBeGreaterThan(0)
    })

    it('handles trees without planted_at date', () => {
        render(<TreeTimeline {...mockProps} plantedAt={null} />)

        // Should still render without errors
        expect(screen.getByText('Hành Trình Cây')).toBeInTheDocument()
    })

    it('caps progress percentage at 100%', () => {
        render(<TreeTimeline {...mockProps} ageInMonths={70} />)

        // Should show 100% even though tree is older than 60 months
        expect(screen.getByText('100%')).toBeInTheDocument()
    })

    describe('Photo Integration', () => {
        const mockPhotos = [
            {
                id: 'photo-1',
                photo_url: 'https://example.com/photo1.jpg',
                caption: 'First photo',
                uploaded_at: '2024-07-01T00:00:00Z', // Month 7 - should be in "Năm 1: Bám rễ" stage
            },
            {
                id: 'photo-2',
                photo_url: 'https://example.com/photo2.jpg',
                caption: 'Second photo',
                uploaded_at: '2024-08-01T00:00:00Z',
            },
        ]

        it('renders photos in timeline stages', () => {
            render(<TreeTimeline {...mockProps} ageInMonths={12} photos={mockPhotos} />)

            // Photos should be rendered as images
            const images = screen.getAllByRole('img')
            expect(images.length).toBeGreaterThan(0)
        })

        it('shows photo alt text for accessibility', () => {
            render(<TreeTimeline {...mockProps} ageInMonths={12} photos={mockPhotos} />)

            // Image should have alt text for accessibility (caption used as alt)
            const images = screen.getAllByRole('img')
            expect(images.some(img => img.getAttribute('alt') === 'First photo')).toBe(true)
        })

        it('renders without photos gracefully', () => {
            render(<TreeTimeline {...mockProps} ageInMonths={12} photos={[]} />)

            // Should still render the timeline
            expect(screen.getByText('Hành Trình Cây')).toBeInTheDocument()
        })
    })
})
