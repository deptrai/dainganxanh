import { render, screen } from '@testing-library/react'
import CheckInInstructions, { CheckInInstructionsProps } from '../CheckInInstructions'

describe('CheckInInstructions', () => {
    const defaultProps: CheckInInstructionsProps = {
        roomName: 'Bungalow Hoa Mai',
        lotName: 'Vườn Trầm Hương Gia Lai',
        lotRegion: 'Tây Nguyên',
        lotDescription: 'Không gian tĩnh lặng giữa rừng cây dó bầu',
        checkInDate: '2026-09-10',
        checkOutDate: '2026-09-12',
        guestPhone: '0901234567',
        specialRequests: 'Cần nôi cho em bé',
    }

    it('renders garden name, region, and description', () => {
        render(<CheckInInstructions {...defaultProps} />)
        expect(screen.getByText('Vườn Trầm Hương Gia Lai')).toBeInTheDocument()
        expect(screen.getByText('Tây Nguyên')).toBeInTheDocument()
        expect(screen.getByText('Không gian tĩnh lặng giữa rừng cây dó bầu')).toBeInTheDocument()
    })

    it('renders room name and formatted stay dates', () => {
        render(<CheckInInstructions {...defaultProps} />)
        expect(screen.getByText('Bungalow Hoa Mai')).toBeInTheDocument()
        expect(screen.getByText('10/9/2026')).toBeInTheDocument()
        expect(screen.getByText('12/9/2026')).toBeInTheDocument()
    })

    it('renders contact phone and special requests', () => {
        render(<CheckInInstructions {...defaultProps} />)
        expect(screen.getByText('0901234567')).toBeInTheDocument()
        expect(screen.getByText('Cần nôi cho em bé')).toBeInTheDocument()
    })

    it('falls back to default contact phone when guestPhone is empty', () => {
        render(<CheckInInstructions {...defaultProps} guestPhone="" />)
        expect(screen.getByText('1900 8888')).toBeInTheDocument()
    })

    it('does not render special requests section when null or undefined', () => {
        render(<CheckInInstructions {...defaultProps} specialRequests={null} />)
        expect(screen.queryByText('Yêu cầu đặc biệt đã ghi nhận')).not.toBeInTheDocument()
    })
})
