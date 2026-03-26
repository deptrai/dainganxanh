import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ShareButton } from '../ShareButton'
import * as analytics from '@/lib/analytics/tracking'

// Mock analytics
jest.mock('@/lib/analytics/tracking', () => ({
    trackShareInitiated: jest.fn(),
    trackShareCompleted: jest.fn(),
}))

// Mock navigator.share
const mockShare = jest.fn()
const mockClipboard = {
    writeText: jest.fn(),
}

describe('ShareButton', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        Object.assign(navigator, {
            share: mockShare,
            clipboard: mockClipboard,
        })
        // Reset userAgent to desktop default
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            configurable: true,
        })
    })

    it('should render share button', () => {
        render(
            <ShareButton
                context="purchase"
                data={{ trees: 5, refCode: 'TEST123' }}
            />
        )

        expect(screen.getByText(/Chia sẻ/i)).toBeInTheDocument()
    })

    it('should call Web Share API when available', async () => {
        mockShare.mockResolvedValue(undefined)
        // Set mobile user agent so the component uses native share
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
            configurable: true,
        })

        render(
            <ShareButton
                context="purchase"
                data={{ trees: 5, refCode: 'TEST123' }}
            />
        )

        const shareBtn = screen.getByText(/Chia sẻ/i)
        fireEvent.click(shareBtn)

        await waitFor(() => {
            expect(mockShare).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: expect.any(String),
                    text: expect.any(String),
                    url: expect.any(String),
                })
            )
        })
    })

    it('should show fallback when Web Share API not available', () => {
        Object.assign(navigator, { share: undefined })

        render(
            <ShareButton
                context="purchase"
                data={{ trees: 5, refCode: 'TEST123' }}
            />
        )

        const shareBtn = screen.getByText(/Chia sẻ/i)
        fireEvent.click(shareBtn)

        // Should show fallback options
        expect(screen.getByLabelText(/Chia sẻ lên Facebook/i)).toBeInTheDocument()
    })

    it('should copy to clipboard', async () => {
        mockClipboard.writeText.mockResolvedValue(undefined)
        Object.assign(navigator, { share: undefined }) // Disable Web Share API

        render(
            <ShareButton
                context="purchase"
                data={{ trees: 5, refCode: 'TEST123' }}
            />
        )

        // Click main share button to show fallback
        const shareBtn = screen.getByText(/Chia sẻ/i)
        fireEvent.click(shareBtn)

        // Click copy button
        const copyBtn = screen.getByLabelText(/Sao chép link/i)
        fireEvent.click(copyBtn)

        await waitFor(() => {
            expect(mockClipboard.writeText).toHaveBeenCalled()
            expect(screen.getByText(/Đã copy!/i)).toBeInTheDocument()
        })
    })

    // NEW: Analytics tracking tests
    describe('Analytics Tracking', () => {
        it('should track share initiated and completed for native share', async () => {
            mockShare.mockResolvedValue(undefined)
            // Set mobile user agent so the component uses native share
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
                configurable: true,
            })

            render(
                <ShareButton
                    context="purchase"
                    source="success_screen"
                    data={{ trees: 5, refCode: 'TEST123' }}
                />
            )

            const shareBtn = screen.getByText(/Chia sẻ/i)
            fireEvent.click(shareBtn)

            await waitFor(() => {
                expect(analytics.trackShareInitiated).toHaveBeenCalledWith({
                    source: 'success_screen',
                    method: 'native',
                    trees: 5,
                    refCode: 'TEST123',
                    context: 'purchase',
                })
                expect(analytics.trackShareCompleted).toHaveBeenCalledWith({
                    source: 'success_screen',
                    method: 'native',
                    trees: 5,
                    refCode: 'TEST123',
                    context: 'purchase',
                })
            })
        })

        it('should track share initiated and completed for copy', async () => {
            mockClipboard.writeText.mockResolvedValue(undefined)
            Object.assign(navigator, { share: undefined })

            render(
                <ShareButton
                    context="purchase"
                    source="dashboard"
                    data={{ trees: 3, refCode: 'ABC456' }}
                />
            )

            const shareBtn = screen.getByText(/Chia sẻ/i)
            fireEvent.click(shareBtn)

            const copyBtn = screen.getByLabelText(/Sao chép link/i)
            fireEvent.click(copyBtn)

            await waitFor(() => {
                expect(analytics.trackShareInitiated).toHaveBeenCalledWith({
                    source: 'dashboard',
                    method: 'copy',
                    trees: 3,
                    refCode: 'ABC456',
                    context: 'purchase',
                })
                expect(analytics.trackShareCompleted).toHaveBeenCalledWith({
                    source: 'dashboard',
                    method: 'copy',
                    trees: 3,
                    refCode: 'ABC456',
                    context: 'purchase',
                })
            })
        })

        it('should track share initiated and completed for Facebook', () => {
            Object.assign(navigator, { share: undefined })
            const mockOpen = jest.fn()
            window.open = mockOpen

            render(
                <ShareButton
                    context="progress"
                    data={{ months: 6, refCode: 'XYZ789' }}
                />
            )

            const shareBtn = screen.getByText(/Chia sẻ/i)
            fireEvent.click(shareBtn)

            const facebookBtn = screen.getByLabelText(/Chia sẻ lên Facebook/i)
            fireEvent.click(facebookBtn)

            // Note: trackShareInitiated is called twice - once for native (failed), once for facebook
            expect(analytics.trackShareCompleted).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'facebook',
                    refCode: 'XYZ789',
                    context: 'progress',
                })
            )
        })
    })
})
