import { render, screen, waitFor } from '@testing-library/react'
import { OrderSummary } from '../OrderSummary'

describe('OrderSummary Component', () => {
  const defaultProps = {
    roomId: 'room-1',
    checkIn: '2026-10-01',
    checkOut: '2026-10-03',
    guestsCount: 2,
    roomName: 'Bungalow Sen',
    lotName: 'Vườn Trầm Hương A',
    onError: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('renders booking metadata and fetches price breakdown', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        roomId: 'room-1',
        roomName: 'Bungalow Sen',
        nights: 2,
        basePricePerNight: 1200000,
        nightBreakdown: [
          { date: '2026-10-01', price: 1200000, isCustomRule: false },
          { date: '2026-10-02', price: 1500000, isCustomRule: true },
        ],
        totalAmount: 2700000,
      }),
    })

    render(<OrderSummary {...defaultProps} />)

    expect(screen.getByText('Bungalow Sen')).toBeInTheDocument()
    expect(screen.getByText('Vườn Trầm Hương A')).toBeInTheDocument()
    expect(screen.getByText('2 khách')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('2 đêm')).toBeInTheDocument()
      expect(screen.getByText('2.700.000 ₫')).toBeInTheDocument()
      expect(screen.getByText('Giá đặc biệt áp dụng:')).toBeInTheDocument()
    })
    expect(defaultProps.onError).toHaveBeenCalledWith(null)
  })

  it('handles calculation API error and triggers onError callback', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Yêu cầu đặt tối thiểu 3 đêm.' }),
    })

    render(<OrderSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Yêu cầu đặt tối thiểu 3 đêm.')).toBeInTheDocument()
    })
    expect(defaultProps.onError).toHaveBeenCalledWith('Yêu cầu đặt tối thiểu 3 đêm.')
  })
})
