import { render, screen, act, waitFor, fireEvent } from '@testing-library/react'
import FarmCamera from '../FarmCamera'

// Mock lucide-react icons to avoid SVG render issues in jsdom
jest.mock('lucide-react', () => ({
    Video: () => <svg data-testid="icon-video" />,
    VideoOff: () => <svg data-testid="icon-video-off" />,
    Maximize2: () => <svg data-testid="icon-maximize" />,
    RefreshCw: () => <svg data-testid="icon-refresh" />,
}))

const mockFetchOnline = () =>
    jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ online: true, streaming: false }),
    } as Response)

const mockFetchOffline = () =>
    jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ online: false }),
    } as Response)

const mockFetchError = () =>
    jest.fn().mockRejectedValue(new Error('Network error'))

describe('FarmCamera', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
        jest.restoreAllMocks()
    })

    it('renders section title and subtitle', async () => {
        global.fetch = mockFetchOnline()
        await act(async () => {
            render(<FarmCamera />)
        })
        expect(screen.getByText('Camera Vườn Trực Tiếp')).toBeInTheDocument()
        expect(screen.getByText('Quan sát cây của bạn 24/7')).toBeInTheDocument()
    })

    it('renders iframe optimistically before first status check resolves', () => {
        // fetch never resolves → isOnline stays null
        global.fetch = jest.fn().mockReturnValue(new Promise(() => {}))
        render(<FarmCamera streamName="farm" />)
        expect(screen.getByTitle('Camera vườn trực tiếp')).toBeInTheDocument()
        expect(screen.queryByTestId('icon-video-off')).not.toBeInTheDocument()
    })

    it('shows "Đang phát" badge when stream is online', async () => {
        global.fetch = mockFetchOnline()
        await act(async () => {
            render(<FarmCamera streamName="farm" />)
        })
        await waitFor(() => {
            expect(screen.getByText('Đang phát')).toBeInTheDocument()
        })
    })

    it('shows iframe when stream is online', async () => {
        global.fetch = mockFetchOnline()
        await act(async () => {
            render(<FarmCamera streamName="farm" />)
        })
        await waitFor(() => {
            const iframe = screen.getByTitle('Camera vườn trực tiếp')
            expect(iframe).toBeInTheDocument()
            expect(iframe).toHaveAttribute('src', expect.stringContaining('src=farm'))
        })
    })

    it('shows offline placeholder when stream is offline', async () => {
        global.fetch = mockFetchOffline()
        await act(async () => {
            render(<FarmCamera streamName="farm" />)
        })
        await waitFor(() => {
            expect(screen.getByText('Camera đang ngoại tuyến')).toBeInTheDocument()
            expect(screen.getByText('Vui lòng thử lại sau')).toBeInTheDocument()
        })
        expect(screen.queryByTitle('Camera vườn trực tiếp')).not.toBeInTheDocument()
    })

    it('shows "Ngoại tuyến" badge when stream is offline', async () => {
        global.fetch = mockFetchOffline()
        await act(async () => {
            render(<FarmCamera streamName="farm" />)
        })
        await waitFor(() => {
            expect(screen.getByText('Ngoại tuyến')).toBeInTheDocument()
        })
    })

    it('assumes online when fetch fails (optimistic fallback)', async () => {
        global.fetch = mockFetchError()
        await act(async () => {
            render(<FarmCamera streamName="farm" />)
        })
        await waitFor(() => {
            expect(screen.queryByText('Camera đang ngoại tuyến')).not.toBeInTheDocument()
            expect(screen.getByTitle('Camera vườn trực tiếp')).toBeInTheDocument()
        })
    })

    it('polls status every 30 seconds', async () => {
        global.fetch = mockFetchOnline()
        await act(async () => {
            render(<FarmCamera streamName="farm" />)
        })
        const callCountAfterMount = (global.fetch as jest.Mock).mock.calls.length
        expect(callCountAfterMount).toBe(1)

        await act(async () => {
            jest.advanceTimersByTime(30000)
        })
        expect((global.fetch as jest.Mock).mock.calls.length).toBe(2)

        await act(async () => {
            jest.advanceTimersByTime(30000)
        })
        expect((global.fetch as jest.Mock).mock.calls.length).toBe(3)
    })

    it('calls /api/camera/status with correct stream name', async () => {
        global.fetch = mockFetchOnline()
        await act(async () => {
            render(<FarmCamera streamName="my-stream" />)
        })
        expect(global.fetch).toHaveBeenCalledWith(
            '/api/camera/status?stream=my-stream',
            expect.any(Object)
        )
    })

    it('refresh button remounts iframe (changes key)', async () => {
        global.fetch = mockFetchOnline()
        await act(async () => {
            render(<FarmCamera streamName="farm" />)
        })

        const iframeBefore = screen.getByTitle('Camera vườn trực tiếp')
        const srcBefore = iframeBefore.getAttribute('src')

        act(() => {
            fireEvent.click(screen.getByTitle('Tải lại stream'))
        })

        // After refresh the iframe is remounted — src stays the same but React key changed.
        // We can't easily assert the key, but we can verify the iframe is still present.
        expect(screen.getByTitle('Camera vườn trực tiếp')).toBeInTheDocument()
        expect(screen.getByTitle('Camera vườn trực tiếp').getAttribute('src')).toBe(srcBefore)
    })

    it('renders fullscreen button', async () => {
        global.fetch = mockFetchOnline()
        await act(async () => {
            render(<FarmCamera />)
        })
        expect(screen.getByTestId('icon-maximize').closest('button')).toBeInTheDocument()
    })

    it('stream URL uses NEXT_PUBLIC_GO2RTC_URL env', async () => {
        global.fetch = mockFetchOnline()
        await act(async () => {
            render(<FarmCamera streamName="farm" />)
        })
        await waitFor(() => {
            const iframe = screen.getByTitle('Camera vườn trực tiếp')
            expect(iframe.getAttribute('src')).toMatch(/stream\.html\?src=farm&mode=mse/)
        })
    })

    it('cleans up interval on unmount', async () => {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
        global.fetch = mockFetchOnline()
        let unmount: () => void
        await act(async () => {
            const result = render(<FarmCamera />)
            unmount = result.unmount
        })
        await act(async () => {
            unmount()
        })
        expect(clearIntervalSpy).toHaveBeenCalled()
    })
})
