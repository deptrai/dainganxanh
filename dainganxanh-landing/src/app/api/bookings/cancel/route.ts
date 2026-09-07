import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { captureError } from '@/lib/monitoring'

const cancelBookingSchema = z.object({
  bookingCode: z.string().regex(/^BK[A-Z0-9]{6}$/, 'Mã đặt phòng không hợp lệ'),
  reason: z.string().max(200, 'Lý do hủy không quá 200 ký tự').optional(),
})

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 10, windowMs: 60_000, keyPrefix: 'booking-cancel' })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSec) },
      }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
  }

  const parsed = cancelBookingSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json({ error: firstIssue?.message || 'Dữ liệu không hợp lệ' }, { status: 400 })
  }

  const { bookingCode, reason } = parsed.data
  const supabase = createServiceRoleClient()

  // Fetch booking with room to get lot_id for revalidation
  const { data: booking, error: fetchError } = await supabase
    .from('room_bookings')
    .select('id, code, status, room_id, rooms(lot_id)')
    .eq('code', bookingCode)
    .maybeSingle()

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Không tìm thấy đơn đặt phòng' }, { status: 404 })
  }

  if (booking.status !== 'pending') {
    return NextResponse.json(
      { error: 'Chỉ có thể hủy đơn đặt phòng đang chờ thanh toán' },
      { status: 409 }
    )
  }

  const cancellationReason = reason ?? 'Khách hủy đặt phòng'
  const { error: updateError } = await supabase
    .from('room_bookings')
    .update({
      status: 'cancelled',
      cancellation_reason: cancellationReason,
    })
    .eq('id', booking.id)
    .eq('status', 'pending')

  if (updateError) {
    console.error('[Booking Cancel] Update error:', updateError)
    captureError(updateError, {
      route: '/api/bookings/cancel',
      bookingCode,
    })
    return NextResponse.json({ error: 'Không thể hủy đặt phòng. Vui lòng thử lại.' }, { status: 500 })
  }

  // On-demand revalidation for marketing pages
  try {
    revalidatePath('/eco-tourism')
    const roomsData = booking.rooms as unknown
    const room = (Array.isArray(roomsData) ? roomsData[0] : roomsData) as { lot_id?: string } | null
    const lotId = room?.lot_id
    if (lotId) {
      revalidatePath(`/eco-tourism/${lotId}`, 'page')
    }
  } catch {
    // best-effort
  }

  return NextResponse.json({
    ok: true,
    message: 'Đã hủy đặt phòng thành công',
  })
}
