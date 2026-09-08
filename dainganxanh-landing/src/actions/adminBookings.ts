'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { captureError } from '@/lib/monitoring'

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'resort_manager'])

async function verifyAdminRole() {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { user: null, error: 'Unauthorized' }
    }

    const serviceSupabase = createServiceRoleClient()
    const { data: profile } = await serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !ADMIN_ROLES.has(profile.role)) {
        return { user: null, error: 'Forbidden: admin role required' }
    }

    return { user, error: null }
}

export interface AdminBookingFilters {
    status?: string
    search?: string
    dateFrom?: string
    dateTo?: string
    lotId?: string
}

export interface FetchBookingsResult {
    bookings: any[]
    totalCount: number
    error?: string
}

export async function fetchAdminBookings(
    filters: AdminBookingFilters,
    page: number,
    pageSize: number
): Promise<FetchBookingsResult> {
    const { user, error: authError } = await verifyAdminRole()
    if (authError || !user) {
        return { bookings: [], totalCount: 0, error: authError || 'Unauthorized' }
    }

    const serviceSupabase = createServiceRoleClient()

    try {
        // Count query
        let countQuery = serviceSupabase
            .from('room_bookings')
            .select('id', { count: 'exact', head: true })

        // Data query
        let query = serviceSupabase
            .from('room_bookings')
            .select(`
                id, code, guest_name, guest_phone, guest_email,
                check_in_date, check_out_date, guests_count, total_amount,
                status, payment_method, special_requests, cancellation_reason,
                expires_at, created_at, updated_at,
                rooms(name, lot_id, lots(name, region, description))
            `)
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1)

        // Apply filters
        if (filters.status && filters.status !== 'all') {
            countQuery = countQuery.eq('status', filters.status)
            query = query.eq('status', filters.status)
        }
        if (filters.dateFrom) {
            countQuery = countQuery.gte('check_in_date', filters.dateFrom)
            query = query.gte('check_in_date', filters.dateFrom)
        }
        if (filters.dateTo) {
            countQuery = countQuery.lte('check_in_date', filters.dateTo)
            query = query.lte('check_in_date', filters.dateTo)
        }
        if (filters.lotId) {
            countQuery = countQuery.eq('rooms.lots.id', filters.lotId)
            query = query.eq('rooms.lots.id', filters.lotId)
        }
        if (filters.search) {
            const searchTerm = filters.search.trim()
            countQuery = countQuery.or(`code.ilike.%${searchTerm}%,guest_name.ilike.%${searchTerm}%,guest_phone.ilike.%${searchTerm}%,guest_email.ilike.%${searchTerm}%`)
            query = query.or(`code.ilike.%${searchTerm}%,guest_name.ilike.%${searchTerm}%,guest_phone.ilike.%${searchTerm}%,guest_email.ilike.%${searchTerm}%`)
        }

        const { count } = await countQuery
        const totalCount = count || 0

        const { data: bookings, error: queryError } = await query

        if (queryError) {
            console.error('fetchAdminBookings error:', queryError)
            captureError(queryError, { route: 'fetchAdminBookings' })
            return { bookings: [], totalCount: 0, error: 'Failed to fetch bookings' }
        }

        // Map to safe output
        const mapped = (bookings || []).map((row: any) => {
            const roomData = row.rooms
            const lotData = roomData?.lots

            return {
                id: row.id,
                code: row.code,
                guestName: row.guest_name,
                guestPhone: row.guest_phone,
                guestEmail: row.guest_email,
                roomName: roomData?.name || '',
                lotName: (Array.isArray(lotData) ? lotData[0]?.name : lotData?.name) || '',
                lotId: roomData?.lot_id || null,
                checkInDate: row.check_in_date,
                checkOutDate: row.check_out_date,
                guestsCount: row.guests_count,
                totalAmount: row.total_amount,
                status: row.status,
                paymentMethod: row.payment_method,
                specialRequests: row.special_requests,
                cancellationReason: row.cancellation_reason,
                expiresAt: row.expires_at,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }
        })

        return { bookings: mapped, totalCount }
    } catch (err) {
        console.error('fetchAdminBookings exception:', err)
        captureError(err, { route: 'fetchAdminBookings' })
        return { bookings: [], totalCount: 0, error: 'Internal server error' }
    }
}

export async function fetchAdminBookingDetail(bookingId: string) {
    const { user, error: authError } = await verifyAdminRole()
    if (authError || !user) {
        return { booking: null, error: authError || 'Unauthorized' }
    }

    const serviceSupabase = createServiceRoleClient()

    const { data: booking, error } = await serviceSupabase
        .from('room_bookings')
        .select(`
            id, code, guest_name, guest_phone, guest_email,
            check_in_date, check_out_date, guests_count, total_amount,
            status, payment_method, special_requests, cancellation_reason,
            expires_at, created_at, updated_at, user_id,
            rooms(name, lot_id, lots(name, region, description))
        `)
        .eq('id', bookingId)
        .single()

    if (error || !booking) {
        return { booking: null, error: 'Booking not found' }
    }

    const roomData = booking.rooms as unknown as {
        name?: string
        lot_id?: string
        lots?: { name?: string; region?: string; description?: string | null } | Array<{ name?: string; region?: string; description?: string | null }> | null
    } | null
    const lotData = roomData?.lots

    return {
        booking: {
            id: booking.id,
            code: booking.code,
            guestName: booking.guest_name,
            guestPhone: booking.guest_phone,
            guestEmail: booking.guest_email,
            roomName: roomData?.name || '',
            lotName: (Array.isArray(lotData) ? lotData[0]?.name : lotData?.name) || '',
            lotId: roomData?.lot_id || null,
            checkInDate: booking.check_in_date,
            checkOutDate: booking.check_out_date,
            guestsCount: booking.guests_count,
            totalAmount: booking.total_amount,
            status: booking.status,
            paymentMethod: booking.payment_method,
            specialRequests: booking.special_requests,
            cancellationReason: booking.cancellation_reason,
            expiresAt: booking.expires_at,
            createdAt: booking.created_at,
            updatedAt: booking.updated_at,
            userId: booking.user_id,
        }
    }
}

export async function confirmBooking(bookingId: string): Promise<{ error?: string }> {
    const { user, error: authError } = await verifyAdminRole()
    if (authError || !user) {
        return { error: authError || 'Unauthorized' }
    }

    const serviceSupabase = createServiceRoleClient()

    const { data: booking, error: fetchError } = await serviceSupabase
        .from('room_bookings')
        .select('id, status, room_id')
        .eq('id', bookingId)
        .single()

    if (fetchError || !booking) {
        return { error: 'Booking not found' }
    }

    if (booking.status !== 'pending') {
        return { error: 'Chỉ có thể xác nhận đơn đang chờ thanh toán' }
    }

    const { error: updateError } = await serviceSupabase
        .from('room_bookings')
        .update({
            status: 'confirmed',
            payment_claimed_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('status', 'pending')

    if (updateError) {
        console.error('[Admin Booking] Confirm error:', updateError)
        captureError(updateError, { route: 'confirmBooking', bookingId })
        return { error: 'Không thể xác nhận đặt phòng' }
    }

    revalidatePath('/crm/admin/bookings')
    revalidatePath(`/crm/admin/bookings/${bookingId}`)
    return {}
}

export async function adminCancelBooking(
    bookingId: string,
    reason?: string
): Promise<{ error?: string }> {
    const { user, error: authError } = await verifyAdminRole()
    if (authError || !user) {
        return { error: authError || 'Unauthorized' }
    }

    const serviceSupabase = createServiceRoleClient()

    const { data: booking, error: fetchError } = await serviceSupabase
        .from('room_bookings')
        .select('id, status, room_id')
        .eq('id', bookingId)
        .single()

    if (fetchError || !booking) {
        return { error: 'Booking not found' }
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
        return { error: 'Chỉ có thể hủy đơn đang chờ hoặc đã xác nhận' }
    }

    const cancellationReason = reason || 'Admin hủy đặt phòng'

    const { error: updateError } = await serviceSupabase
        .from('room_bookings')
        .update({
            status: 'cancelled',
            cancellation_reason: cancellationReason,
        })
        .eq('id', bookingId)
        .in('status', ['pending', 'confirmed'])

    if (updateError) {
        console.error('[Admin Booking] Cancel error:', updateError)
        captureError(updateError, { route: 'adminCancelBooking', bookingId })
        return { error: 'Không thể hủy đặt phòng' }
    }

    revalidatePath('/crm/admin/bookings')
    revalidatePath(`/crm/admin/bookings/${bookingId}`)
    return {}
}
