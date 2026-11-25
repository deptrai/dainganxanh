import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { DateRangePicker } from '../DateRangePicker'

describe('DateRangePicker', () => {
    it('renders date inputs with min/max constraints', () => {
        const onCheckIn = jest.fn()
        const onCheckOut = jest.fn()
        renderWithIntl(
            <DateRangePicker
                checkIn=""
                checkOut=""
                onCheckInChange={onCheckIn}
                onCheckOutChange={onCheckOut}
            />
        )
        const checkIn = screen.getByLabelText('Ngày nhận phòng')
        const checkOut = screen.getByLabelText('Ngày trả phòng')
        expect(checkIn).toHaveAttribute('min')
        expect(checkIn).toHaveAttribute('max')
        expect(checkOut).toHaveAttribute('min')
        expect(checkOut).toHaveAttribute('max')
    })

    it('shows nights count when dates selected', () => {
        renderWithIntl(
            <DateRangePicker
                checkIn="2026-09-10"
                checkOut="2026-09-12"
                onCheckInChange={() => {}}
                onCheckOutChange={() => {}}
            />
        )
        expect(screen.getByText('2 đêm')).toBeInTheDocument()
    })
})
