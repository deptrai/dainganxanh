'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { captureError } from '@/lib/monitoring'
import { isBookingBlocking, RoomBooking } from '@/lib/eco-tourism/availability'

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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export interface BlockRoomResult {
    error?: string
    blockId?: string
}

export async function blockRoomForMaintenance(
    roomId: string,
    startDate: string,
    endDate: string,
    reason?: string
): Promise<BlockRoomResult> {
    const { user, error: authError } = await verifyAdminRole()
    if (authError || !user) {
        return { error: authError || 'Unauthorized' }
    }

    if (!roomId || !DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
        return { error: 'Ngày hoặc phòng không hợp lệ' }
    }
    if (startDate >= endDate) {
        return { error: 'Ngày kết thúc phải sau ngày bắt đầu' }
    }
    const trimmedReason = reason?.trim()
    if (!trimmedReason) {
        return { error: 'Vui lòng nhập lý do khóa phòng' }
    }

    const serviceSupabase = createServiceRoleClient()

    const { data: room, error: roomError } = await serviceSupabase
        .from('rooms')
        .select('id, status, name')
        .eq('id', roomId)
        .single()

    if (roomError || !room) {
        return { error: 'Phòng không tồn tại' }
    }
    if (room.status === 'maintenance') {
        return { error: 'Phòng đang ở trạng thái bảo trì vĩnh viễn' }
    }
    if (room.status !== 'active') {
        return { error: 'Phòng đang ngừng hoạt động' }
    }

    const { data: existingBookings, error: bookingsError } = await serviceSupabase
        .from('room_bookings')
        .select('id, room_id, check_in_date, check_out_date, status, expires_at')
        .eq('room_id', roomId)
        .gte('check_out_date', startDate)
        .lte('check_in_date', endDate)

    if (bookingsError) {
        console.error('[Admin Room] Block - fetch bookings error:', bookingsError)
        captureError(bookingsError, { route: 'blockRoomForMaintenance', roomId })
        return { error: 'Không thể kiểm tra lịch đặt phòng' }
    }

    const blocking = (existingBookings || []).filter((b: any) =>
        isBookingBlocking(b as RoomBooking, startDate, endDate)
    )
    if (blocking.length > 0) {
        return { error: 'Phòng có đơn đặt đang hoạt động trong khoảng thời gian này' }
    }

    const { data: overlappingBlocks, error: blocksError } = await serviceSupabase
        .from('room_blocks')
        .select('id')
        .eq('room_id', roomId)
        .lt('start_date', endDate)
        .gt('end_date', startDate)

    if (blocksError) {
        console.error('[Admin Room] Block - fetch blocks error:', blocksError)
        captureError(blocksError, { route: 'blockRoomForMaintenance', roomId })
        return { error: 'Không thể kiểm tra lịch khóa phòng' }
    }

    if (overlappingBlocks && overlappingBlocks.length > 0) {
        return { error: 'Khoảng thời gian này đã có block bảo trì' }
    }

    const { data: inserted, error: insertError } = await serviceSupabase
        .from('room_blocks')
        .insert({
            room_id: roomId,
            start_date: startDate,
            end_date: endDate,
            reason: trimmedReason,
            status: 'maintenance',
            created_by: user.id,
        })
        .select('id')
        .single()

    if (insertError || !inserted) {
        console.error('[Admin Room] Block insert error:', insertError)
        captureError(insertError, { route: 'blockRoomForMaintenance', roomId })
        return { error: 'Không thể tạo block bảo trì' }
    }

    revalidatePath('/crm/admin/rooms')
    revalidatePath('/eco-tourism')
    return { blockId: inserted.id }
}

export async function unblockRoom(blockId: string): Promise<{ error?: string }> {
    const { user, error: authError } = await verifyAdminRole()
    if (authError || !user) {
        return { error: authError || 'Unauthorized' }
    }

    if (!blockId) {
        return { error: 'Block không hợp lệ' }
    }

    const serviceSupabase = createServiceRoleClient()

    const { data: deletedRows, error: deleteError } = await serviceSupabase
        .from('room_blocks')
        .delete()
        .eq('id', blockId)
        .select('id')

    if (deleteError) {
        console.error('[Admin Room] Unblock error:', deleteError)
        captureError(deleteError, { route: 'unblockRoom', blockId })
        return { error: 'Không thể xóa block bảo trì' }
    }

    if (!deletedRows || deletedRows.length === 0) {
        return { error: 'Block không tồn tại hoặc đã bị xóa' }
    }

    revalidatePath('/crm/admin/rooms')
    revalidatePath('/eco-tourism')
    return {}
}

export interface RoomCalendarData {
    lots: Array<{
        id: string
        name: string
        region?: string
        rooms: Array<{
            id: string
            name: string
            status: string
            bookings: Array<{
                id: string
                code: string
                guest_name: string
                check_in_date: string
                check_out_date: string
                status: string
            }>
            blocks: Array<{
                id: string
                start_date: string
                end_date: string
                reason: string | null
                status: string
            }>
        }>
    }>
    error?: string
}

export async function fetchRoomCalendarData(
    startDate: string,
    endDate: string
): Promise<RoomCalendarData> {
    const { user, error: authError } = await verifyAdminRole()
    if (authError || !user) {
        return { lots: [], error: authError || 'Unauthorized' }
    }

    const serviceSupabase = createServiceRoleClient()

    try {
        const { data: lots, error: lotsError } = await serviceSupabase
            .from('lots')
            .select('id, name, region')
            .order('name', { ascending: true })

        if (lotsError) {
            console.error('[Admin Room] Fetch lots error:', lotsError)
            return { lots: [], error: 'Không thể tải danh sách khu vườn' }
        }

        const { data: rooms, error: roomsError } = await serviceSupabase
            .from('rooms')
            .select('id, name, status, lot_id')
            .order('name', { ascending: true })

        if (roomsError) {
            console.error('[Admin Room] Fetch rooms error:', roomsError)
            return { lots: [], error: 'Không thể tải danh sách phòng' }
        }

        const { data: bookings, error: bookingsError } = await serviceSupabase
            .from('room_bookings')
            .select('id, code, room_id, guest_name, check_in_date, check_out_date, status')
            .gte('check_out_date', startDate)
            .lte('check_in_date', endDate)
            .order('check_in_date', { ascending: true })

        if (bookingsError) {
            console.error('[Admin Room] Fetch bookings error:', bookingsError)
            return { lots: [], error: 'Không thể tải danh sách đặt phòng' }
        }

        const { data: blocks, error: blocksError } = await serviceSupabase
            .from('room_blocks')
            .select('id, room_id, start_date, end_date, reason, status')
            .lt('start_date', endDate)
            .gt('end_date', startDate)

        if (blocksError) {
            console.error('[Admin Room] Fetch blocks error:', blocksError)
            return { lots: [], error: 'Không thể tải danh sách block bảo trì' }
        }

        const bookingsByRoom = new Map<string, any[]>()
        for (const b of bookings || []) {
            if (!bookingsByRoom.has(b.room_id)) bookingsByRoom.set(b.room_id, [])
            bookingsByRoom.get(b.room_id)!.push(b)
        }

        const blocksByRoom = new Map<string, any[]>()
        for (const bl of blocks || []) {
            if (!blocksByRoom.has(bl.room_id)) blocksByRoom.set(bl.room_id, [])
            blocksByRoom.get(bl.room_id)!.push(bl)
        }

        const roomsByLot = new Map<string, any[]>()
        for (const r of rooms || []) {
            if (!roomsByLot.has(r.lot_id)) roomsByLot.set(r.lot_id, [])
            roomsByLot.get(r.lot_id)!.push({
                id: r.id,
                name: r.name,
                status: r.status,
                bookings: bookingsByRoom.get(r.id) || [],
                blocks: blocksByRoom.get(r.id) || [],
            })
        }

        const result = (lots || []).map((lot: any) => ({
            id: lot.id,
            name: lot.name,
            region: lot.region,
            rooms: roomsByLot.get(lot.id) || [],
        }))

        return { lots: result }
    } catch (err) {
        console.error('[Admin Room] fetchRoomCalendarData exception:', err)
        captureError(err, { route: 'fetchRoomCalendarData' })
        return { lots: [], error: 'Internal server error' }
    }
}

