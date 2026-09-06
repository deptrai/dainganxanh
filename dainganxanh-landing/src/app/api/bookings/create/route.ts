import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/getEffectiveUser'
import { rateLimit } from '@/lib/rate-limit'
import { captureError } from '@/lib/monitoring'

const PAYMENT_TIMEOUT_MINUTES = 15

export const createBookingSchema = z.object({
  room_id: z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, 'ID phòng không hợp lệ'),
  guest_name: z.string().min(1, 'Vui lòng nhập họ tên'),
  guest_phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)'),
  guest_email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày nhận phòng không đúng định dạng YYYY-MM-DD'),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày trả phòng không đúng định dạng YYYY-MM-DD'),
  guests_count: z.number().int().min(1, 'Số lượng khách phải từ 1 trở lên'),
  special_requests: z.string().max(500, 'Yêu cầu đặc biệt không quá 500 ký tự').optional().or(z.literal('')),
  payment_method: z.literal('banking'),
})

function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'BK'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 30, windowMs: 60_000, keyPrefix: 'booking-create' })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSec) },
    })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
  }

  const parsed = createBookingSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json({ error: firstIssue?.message || 'Thông tin đặt phòng không hợp lệ' }, { status: 400 })
  }

  const data = parsed.data

  // Validate dates logic
  const checkIn = new Date(data.check_in_date + 'T00:00:00Z')
  const checkOut = new Date(data.check_out_date + 'T00:00:00Z')

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return NextResponse.json({ error: 'Ngày tháng không hợp lệ' }, { status: 400 })
  }

  // Calculate current date in GMT+7 (Asia/Ho_Chi_Minh)
  const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000)
  const todayVN = nowVN.toISOString().slice(0, 10)
  if (data.check_in_date < todayVN) {
    return NextResponse.json({ error: 'Ngày nhận phòng không thể ở quá khứ' }, { status: 400 })
  }

  if (checkOut <= checkIn) {
    return NextResponse.json({ error: 'Ngày trả phòng phải sau ngày nhận phòng' }, { status: 400 })
  }

  const diffDays = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays > 30) {
    return NextResponse.json({ error: 'Thời gian lưu trú tối đa là 30 đêm' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // Fetch room information
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, name, price_per_night, capacity, status')
    .eq('id', data.room_id)
    .single()

  if (roomError || !room) {
    return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 })
  }

  if (room.status !== 'active') {
    return NextResponse.json({ error: 'Phòng hiện không khả dụng để đặt' }, { status: 400 })
  }

  if (data.guests_count > room.capacity) {
    return NextResponse.json({
      error: `Số lượng khách (${data.guests_count}) vượt quá sức chứa tối đa của phòng (${room.capacity} người)`,
    }, { status: 400 })
  }

  // Server-side price calculation (rejects any client-side totals)
  const totalAmount = Number(room.price_per_night) * diffDays
  const bookingCode = generateBookingCode()
  const expiresAt = new Date(Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000).toISOString()

  // Identify user if logged in, allow guest checkout if not
  const effectiveUser = await getEffectiveUser().catch(() => null)

  const { data: booking, error: insertError } = await supabase
    .from('room_bookings')
    .insert({
      code: bookingCode,
      user_id: effectiveUser?.userId ?? null,
      room_id: data.room_id,
      guest_name: data.guest_name,
      guest_phone: data.guest_phone,
      guest_email: data.guest_email || null,
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      guests_count: data.guests_count,
      total_amount: totalAmount,
      payment_method: data.payment_method,
      status: 'pending',
      special_requests: data.special_requests || null,
      expires_at: expiresAt,
    })
    .select('id, code, room_id, check_in_date, check_out_date, nights_count, total_amount, payment_method, expires_at, status')
    .single()

  if (insertError) {
    // 23P01 is PostgreSQL exclusion_violation (exclude_overlapping_bookings GiST constraint)
    if (insertError.code === '23P01' || insertError.message?.includes('exclude_overlapping_bookings')) {
      return NextResponse.json({
        error: 'Phòng đã có người đặt hoặc đang giữ chỗ trong khoảng thời gian này. Vui lòng chọn ngày khác.',
      }, { status: 409 })
    }

    // Trigger capacity/validation errors
    if (insertError.message?.includes('exceeds room capacity') || insertError.message?.includes('cannot be in the past')) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    console.error('[Booking Create] Insert error:', insertError)
    captureError(insertError, {
      route: '/api/bookings/create',
      roomId: data.room_id,
      guestPhone: data.guest_phone,
    })
    return NextResponse.json({ error: 'Không thể tạo đặt phòng. Vui lòng thử lại.' }, { status: 500 })
  }

  return NextResponse.json({
    bookingId: booking.id,
    bookingCode: booking.code,
    roomName: room.name,
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    nightsCount: diffDays,
    totalAmount: booking.total_amount,
    paymentMethod: booking.payment_method,
    expiresAt: booking.expires_at,
    status: booking.status,
  }, { status: 201 })
}
