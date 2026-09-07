import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, { limit: 60, windowMs: 60_000, keyPrefix: 'booking-status' })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSec) },
      }
    )
  }

  const code = req.nextUrl.searchParams.get('code')
  if (!code || !/^BK[A-Z0-9]{6}$/.test(code)) {
    return NextResponse.json({ error: 'Mã đặt phòng không hợp lệ' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data: booking, error } = await supabase
    .from('room_bookings')
    .select('id, code, status, expires_at, total_amount, check_in_date, check_out_date, guests_count, rooms(name)')
    .eq('code', code)
    .maybeSingle()

  if (error || !booking) {
    return NextResponse.json({ error: 'Không tìm thấy đơn đặt phòng' }, { status: 404 })
  }

  let effectiveStatus = booking.status
  if (booking.status === 'pending' && booking.expires_at) {
    const isExpired = new Date(booking.expires_at).getTime() <= Date.now()
    if (isExpired) {
      effectiveStatus = 'expired'
    }
  }

  const roomsData = booking.rooms as unknown
  const room = (Array.isArray(roomsData) ? roomsData[0] : roomsData) as { name?: string } | null
  const roomName = room?.name ?? ''

  return NextResponse.json({
    status: effectiveStatus,
    expiresAt: booking.expires_at,
    totalAmount: booking.total_amount,
    roomName,
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    guestsCount: booking.guests_count,
  })
}
