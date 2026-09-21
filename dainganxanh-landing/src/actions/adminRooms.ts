'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { captureError } from '@/lib/monitoring'
import { isBookingBlocking, RoomBooking } from '@/lib/eco-tourism/availability'

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'resort_manager'])

async function getAssignedLotIds(userId: string): Promise<string[]> {
    const serviceSupabase = createServiceRoleClient()
    const { data, error } = await serviceSupabase
        .from('admin_user_lots')
        .select('lot_id')
        .eq('user_id', userId)
        .eq('role', 'resort_manager')

    if (error) {
        console.error('Failed to fetch admin_user_lots:', error)
        return []
    }

    return (data || []).map((a: any) => a.lot_id)
}

async function verifyAdminRole(): Promise<{
    user: { id: string } | null
    role: string | null
    assignedLotIds: string[] | null
    error: string | null
}> {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { user: null, role: null, assignedLotIds: null, error: 'Unauthorized' }
    }

    const serviceSupabase = createServiceRoleClient()
    const { data: profile } = await serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !ADMIN_ROLES.has(profile.role)) {
        return { user: null, role: null, assignedLotIds: null, error: 'Forbidden: admin role required' }
    }

    if (profile.role === 'resort_manager') {
        const assignedLotIds = await getAssignedLotIds(user.id)
        if (assignedLotIds.length === 0) {
            return { user: null, role: null, assignedLotIds: null, error: 'Forbidden: resort_manager requires lot assignment' }
        }
        return { user, role: profile.role, assignedLotIds, error: null }
    }

    return { user, role: profile.role, assignedLotIds: null, error: null }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

function isValidDateString(value: string): boolean {
    if (!DATE_RE.test(value)) return false
    const d = new Date(value + 'T00:00:00Z')
    return !isNaN(d.getTime()) && value === d.toISOString().slice(0, 10)
}

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
    const { user, role, assignedLotIds, error: authError } = await verifyAdminRole()
    if (authError || !user) {
        return { error: authError || 'Unauthorized' }
    }

    if (!roomId || !isValidDateString(startDate) || !isValidDateString(endDate)) {
        return { error: 'Ngày hoặc phòng không hợp lệ' }
    }
    if (startDate >= endDate) {
        return { error: 'Ngày kết thúc phải sau ngày bắt đầu' }
    }

    const today = new Date().toISOString().slice(0, 10)
    if (endDate <= today) {
        return { error: 'Không thể khóa phòng cho ngày trong quá khứ' }
    }

    const trimmedReason = reason?.trim()
    if (!trimmedReason) {
        return { error: 'Vui lòng nhập lý do khóa phòng' }
    }
    if (trimmedReason.length > 500) {
        return { error: 'Lý do không quá 500 ký tự' }
    }

    const serviceSupabase = createServiceRoleClient()

    const { data: room, error: roomError } = await serviceSupabase
        .from('rooms')
        .select('id, status, name, lot_id')
        .eq('id', roomId)
        .single()

    if (roomError || !room) {
        return { error: 'Phòng không tồn tại' }
    }
    if (role === 'resort_manager' && (!assignedLotIds || !assignedLotIds.includes(room.lot_id))) {
        return { error: 'Bạn không được phép quản lý phòng của khu vườn này' }
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
        .lte('start_date', endDate)
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
    const { user, role, assignedLotIds, error: authError } = await verifyAdminRole()
    if (authError || !user) {
        return { error: authError || 'Unauthorized' }
    }

    if (!blockId || !UUID_RE.test(blockId)) {
        return { error: 'Block không hợp lệ' }
    }

    const serviceSupabase = createServiceRoleClient()

    const { data: block, error: blockError } = await serviceSupabase
        .from('room_blocks')
        .select('id, room_id, rooms!inner(lot_id)')
        .eq('id', blockId)
        .single()

    if (blockError || !block) {
        return { error: 'Block không tồn tại hoặc đã bị xóa' }
    }

    const blockLotId = (block as any).rooms?.lot_id
    if (role === 'resort_manager' && (!assignedLotIds || !assignedLotIds.includes(blockLotId))) {
        return { error: 'Bạn không được phép quản lý block của khu vườn này' }
    }

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
    const { user, role, assignedLotIds, error: authError } = await verifyAdminRole()
    if (authError || !user) {
        return { lots: [], error: authError || 'Unauthorized' }
    }

    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
        return { lots: [], error: 'Ngày không hợp lệ' }
    }
    if (startDate > endDate) {
        return { lots: [], error: 'Ngày bắt đầu phải trước ngày kết thúc' }
    }

    const serviceSupabase = createServiceRoleClient()

    try {
        const lotIdsFilter = role === 'resort_manager' ? assignedLotIds : undefined

        const lotsQuery = serviceSupabase
            .from('lots')
            .select('id, name, region')
            .order('name', { ascending: true })
        const { data: lots, error: lotsError } = lotIdsFilter
            ? await lotsQuery.in('id', lotIdsFilter)
            : await lotsQuery

        if (lotsError) {
            console.error('[Admin Room] Fetch lots error:', lotsError)
            return { lots: [], error: 'Không thể tải danh sách khu vườn' }
        }

        const allowedLotIds = new Set((lots || []).map((l: any) => l.id))

        const { data: rooms, error: roomsError } = await serviceSupabase
            .from('rooms')
            .select('id, name, status, lot_id')
            .in('lot_id', [...allowedLotIds])
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
            .lte('start_date', endDate)
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

