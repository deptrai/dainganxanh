export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export interface RoomBooking {
    id: string
    room_id: string
    check_in_date: string
    check_out_date: string
    status: BookingStatus
    expires_at: string | null
}

/**
 * Check if a booking blocks the given date range.
 * Uses Postgres daterange(..., '[)') semantics: check_in inclusive, check_out exclusive.
 */
export function isBookingBlocking(
    booking: RoomBooking,
    checkIn: string,
    checkOut: string,
    now: Date = new Date()
): boolean {
    if (booking.status === 'cancelled' || booking.status === 'no_show') {
        return false
    }
    if (booking.status === 'pending' && booking.expires_at && new Date(booking.expires_at) <= now) {
        return false
    }
    // Strict inequalities: check_in_date < checkOut && check_out_date > checkIn
    return booking.check_in_date < checkOut && booking.check_out_date > checkIn
}

/**
 * Filter room bookings to those blocking the requested date range.
 */
export function getBlockingBookings(
    bookings: RoomBooking[],
    checkIn: string,
    checkOut: string,
    now: Date = new Date()
): RoomBooking[] {
    return bookings.filter((b) => isBookingBlocking(b, checkIn, checkOut, now))
}
