import { isBookingBlocking, getBlockingBookings, type RoomBooking } from '../availability'

describe('availability', () => {
    const baseBooking: RoomBooking = {
        id: 'b1',
        room_id: 'r1',
        check_in_date: '2026-09-10',
        check_out_date: '2026-09-12',
        status: 'confirmed',
        expires_at: null,
    }

    describe('isBookingBlocking', () => {
        it('blocks overlapping confirmed booking', () => {
            expect(isBookingBlocking(baseBooking, '2026-09-09', '2026-09-11')).toBe(true)
        })

        it('does not block when checkOut equals booking check_in (exclusive end)', () => {
            expect(isBookingBlocking(baseBooking, '2026-09-08', '2026-09-10')).toBe(false)
        })

        it('does not block when checkIn equals booking check_out (exclusive start)', () => {
            expect(isBookingBlocking(baseBooking, '2026-09-12', '2026-09-14')).toBe(false)
        })

        it('blocks pending booking with future expires_at', () => {
            const future = new Date(Date.now() + 60_000).toISOString()
            const pending = { ...baseBooking, status: 'pending' as const, expires_at: future }
            expect(isBookingBlocking(pending, '2026-09-09', '2026-09-11')).toBe(true)
        })

        it('does not block expired pending booking', () => {
            const past = new Date(Date.now() - 60_000).toISOString()
            const pending = { ...baseBooking, status: 'pending' as const, expires_at: past }
            expect(isBookingBlocking(pending, '2026-09-09', '2026-09-11')).toBe(false)
        })

        it('ignores cancelled booking', () => {
            const cancelled = { ...baseBooking, status: 'cancelled' as const }
            expect(isBookingBlocking(cancelled, '2026-09-09', '2026-09-11')).toBe(false)
        })
    })

    describe('getBlockingBookings', () => {
        it('returns only blocking bookings', () => {
            const bookings: RoomBooking[] = [
                baseBooking,
                { ...baseBooking, id: 'b2', status: 'cancelled' },
            ]
            expect(getBlockingBookings(bookings, '2026-09-09', '2026-09-11')).toHaveLength(1)
        })
    })
})
