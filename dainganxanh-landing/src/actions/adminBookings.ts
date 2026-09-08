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

    // D3: For resort_manager, require at least one admin_user_lots assignment
    // Full lot-scoped filtering is deferred to Epic 13
    if (profile.role === 'resort_manager') {
        const { data: lotAssignments, error: lotError } = await serviceSupabase
            .from('admin_user_lots')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)

        if (lotError) {
            console.error('Failed to check admin_user_lots:', lotError)
            return { user: null, error: 'Không thể kiểm tra quyền truy cập' }
        }

        if (!lotAssignments || lotAssignments.length === 0) {
            return { user: null, error: 'Forbidden: resort_manager requires lot assignment' }
        }
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
            countQuery = countQuery.eq('rooms.lot_id', filters.lotId)
            query = query.eq('rooms.lot_id', filters.lotId)
        }
        if (filters.search) {
            const searchTerm = filters.search.trim()
            // Escape PostgREST filter metacharacters: , ( ) . " '
            const escapedTerm = searchTerm.replace(/[,()."']/g, '')
            if (escapedTerm) {
                countQuery = countQuery.or(`code.ilike.%${escapedTerm}%,guest_name.ilike.%${escapedTerm}%,guest_phone.ilike.%${escapedTerm}%,guest_email.ilike.%${escapedTerm}%`)
                query = query.or(`code.ilike.%${escapedTerm}%,guest_name.ilike.%${escapedTerm}%,guest_phone.ilike.%${escapedTerm}%,guest_email.ilike.%${escapedTerm}%`)
            }
        }

        const { count, error: countError } = await countQuery
        if (countError) {
            console.error('fetchAdminBookings count error:', countError)
            captureError(countError, { route: 'fetchAdminBookings' })
            return { bookings: [], totalCount: 0, error: 'Failed to fetch bookings' }
        }
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



export async function confirmBooking(bookingId: string): Promise<{ error?: string }> {
    const { user, error: authError } = await verifyAdminRole()
    if (authError || !user) {
        return { error: authError || 'Unauthorized' }
    }

    const serviceSupabase = createServiceRoleClient()

    const { data: booking, error: fetchError } = await serviceSupabase
        .from('room_bookings')
        .select('id, status, room_id, expires_at, check_in_date, check_out_date, code')
        .eq('id', bookingId)
        .single()

    if (fetchError || !booking) {
        return { error: 'Booking not found' }
    }

    if (booking.status !== 'pending') {
        return { error: 'Chỉ có thể xác nhận đơn đang chờ thanh toán' }
    }

    // P3: Check if booking has expired
    if (booking.expires_at && new Date(booking.expires_at) < new Date()) {
        return { error: 'Đơn đặt phòng đã hết hạn. Vui lòng kiểm tra lại trạng thái.' }
    }

    // P3: Check for overlapping confirmed bookings for the same room
    const { data: overlappingBookings, error: overlapError } = await serviceSupabase
        .from('room_bookings')
        .select('id')
        .eq('room_id', booking.room_id)
        .in('status', ['confirmed', 'completed'])
        .gte('check_out_date', booking.check_in_date)
        .lte('check_in_date', booking.check_out_date)
        .neq('id', bookingId)

    if (overlapError) {
        console.error('[Admin Booking] Overlap check error:', overlapError)
        captureError(overlapError, { route: 'confirmBooking', bookingId })
        return { error: 'Không thể kiểm tra phòng trống' }
    }

    if (overlappingBookings && overlappingBookings.length > 0) {
        return { error: 'Phòng đã có đơn xác nhận trong khoảng thời gian này' }
    }

    // P4: Only set payment_claimed_at if not already set; clear expires_at
    const updateData: Record<string, any> = {
        status: 'confirmed',
        expires_at: null,
    }
    const { data: existingBooking } = await serviceSupabase
        .from('room_bookings')
        .select('payment_claimed_at')
        .eq('id', bookingId)
        .single()

    if (!existingBooking?.payment_claimed_at) {
        updateData.payment_claimed_at = new Date().toISOString()
    }

    // P5: Verify update affected rows
    const { data: updatedRows, error: updateError } = await serviceSupabase
        .from('room_bookings')
        .update(updateData)
        .eq('id', bookingId)
        .eq('status', 'pending')
        .select('id')

    if (updateError) {
        console.error('[Admin Booking] Confirm error:', updateError)
        captureError(updateError, { route: 'confirmBooking', bookingId })
        return { error: 'Không thể xác nhận đặt phòng' }
    }

    if (!updatedRows || updatedRows.length === 0) {
        return { error: 'Đơn đặt phòng đã thay đổi trạng thái. Vui lòng tải lại trang.' }
    }

    // P6: Revalidate all affected paths
    revalidatePath('/crm/admin/bookings')
    revalidatePath(`/crm/admin/bookings/${bookingId}`)
    revalidatePath('/crm/my-bookings')
    revalidatePath('/eco-tourism')
    // Get lot_id to revalidate specific lot page
    const { data: roomData } = await serviceSupabase
        .from('rooms')
        .select('lot_id')
        .eq('id', booking.room_id)
        .single()
    if (roomData?.lot_id) {
        revalidatePath(`/eco-tourism/${roomData.lot_id}`)
    }
    revalidatePath(`/eco-tourism/voucher/${booking.code || ''}`)
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
        .select('id, status, room_id, code')
        .eq('id', bookingId)
        .single()

    if (fetchError || !booking) {
        return { error: 'Booking not found' }
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
        return { error: 'Chỉ có thể hủy đơn đang chờ hoặc đã xác nhận' }
    }

    // D1: Require cancellation reason
    const cancellationReason = reason?.trim()
    if (!cancellationReason) {
        return { error: 'Vui lòng nhập lý do hủy đặt phòng' }
    }

    // P5: Verify update affected rows
    const { data: updatedRows, error: updateError } = await serviceSupabase
        .from('room_bookings')
        .update({
            status: 'cancelled',
            cancellation_reason: cancellationReason,
        })
        .eq('id', bookingId)
        .in('status', ['pending', 'confirmed'])
        .select('id')

    if (updateError) {
        console.error('[Admin Booking] Cancel error:', updateError)
        captureError(updateError, { route: 'adminCancelBooking', bookingId })
        return { error: 'Không thể hủy đặt phòng' }
    }

    if (!updatedRows || updatedRows.length === 0) {
        return { error: 'Đơn đặt phòng đã thay đổi trạng thái. Vui lòng tải lại trang.' }
    }

    // P6: Revalidate all affected paths
    revalidatePath('/crm/admin/bookings')
    revalidatePath(`/crm/admin/bookings/${bookingId}`)
    revalidatePath('/crm/my-bookings')
    revalidatePath('/eco-tourism')
    // Get lot_id to revalidate specific lot page
    const { data: roomData } = await serviceSupabase
        .from('rooms')
        .select('lot_id')
        .eq('id', booking.room_id)
        .single()
    if (roomData?.lot_id) {
        revalidatePath(`/eco-tourism/${roomData.lot_id}`)
    }
    revalidatePath(`/eco-tourism/voucher/${booking.code || ''}`)
    return {}
}
