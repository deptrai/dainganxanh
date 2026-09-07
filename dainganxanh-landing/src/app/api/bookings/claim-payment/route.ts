import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { captureError } from '@/lib/monitoring'

const claimPaymentSchema = z.object({
  bookingCode: z.string().regex(/^BK[A-Z0-9]{6}$/, 'Mã đặt phòng không hợp lệ'),
})

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 10, windowMs: 60_000, keyPrefix: 'booking-claim-payment' })
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

  const parsed = claimPaymentSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json({ error: firstIssue?.message || 'Dữ liệu không hợp lệ' }, { status: 400 })
  }

  const { bookingCode } = parsed.data
  const supabase = createServiceRoleClient()

  // Verify booking exists and status
  const { data: booking, error: fetchError } = await supabase
    .from('room_bookings')
    .select('id, code, status')
    .eq('code', bookingCode)
    .maybeSingle()

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Không tìm thấy đơn đặt phòng' }, { status: 404 })
  }

  if (booking.status !== 'pending') {
    return NextResponse.json(
      { error: 'Đơn đặt phòng không ở trạng thái chờ thanh toán' },
      { status: 409 }
    )
  }

  const nowIso = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('room_bookings')
    .update({ payment_claimed_at: nowIso })
    .eq('id', booking.id)
    .eq('status', 'pending')

  if (updateError) {
    console.error('[Booking Claim Payment] Update error:', updateError)
    captureError(updateError, {
      route: '/api/bookings/claim-payment',
      bookingCode,
    })
    return NextResponse.json({ error: 'Không thể cập nhật trạng thái' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    message: 'Đã ghi nhận yêu cầu xác nhận thanh toán',
  })
}
