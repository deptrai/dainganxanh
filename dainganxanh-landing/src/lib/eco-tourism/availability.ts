export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export interface RoomBooking {
    id: string
    room_id: string
    check_in_date: string
    check_out_date: string
    status: BookingStatus
    expires_at: string | null
}

export interface RoomBlock {
    id: string
    room_id: string
    start_date: string
    end_date: string
    reason: string | null
    status: string
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
 * Check if a maintenance block overlaps the given date range.
 * Uses Postgres daterange(..., '[)') semantics: start inclusive, end exclusive.
 */
export function isBlockOverlapping(
    block: RoomBlock,
    checkIn: string,
    checkOut: string
): boolean {
    return block.start_date < checkOut && block.end_date > checkIn
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

/**
 * Filter room blocks to those overlapping the requested date range.
 */
export function getOverlappingBlocks(
    blocks: RoomBlock[],
    checkIn: string,
    checkOut: string
): RoomBlock[] {
    return blocks.filter((b) => isBlockOverlapping(b, checkIn, checkOut))
}

/**
 * Get all room IDs that are blocked or booked for the given date range.
 * Includes both maintenance blocks and active bookings.
 */
export function getBlockedRoomIds(
    roomIds: string[],
    bookings: RoomBooking[],
    blocks: RoomBlock[],
    checkIn: string,
    checkOut: string,
    now: Date = new Date()
): Set<string> {
    const blockedIds = new Set<string>()

    for (const b of bookings) {
        if (isBookingBlocking(b, checkIn, checkOut, now)) {
            blockedIds.add(b.room_id)
        }
    }

    for (const bl of blocks) {
        if (isBlockOverlapping(bl, checkIn, checkOut)) {
            blockedIds.add(bl.room_id)
        }
    }

    return blockedIds
}
