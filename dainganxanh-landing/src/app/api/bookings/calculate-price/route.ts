import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { captureError } from '@/lib/monitoring'
import { calculateBookingPrice, PricingError } from '@/lib/pricing'

const calculateBookingPriceSchema = z.object({
  room_id: z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, 'room_id không hợp lệ'),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày nhận phòng phải là YYYY-MM-DD'),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày trả phòng phải là YYYY-MM-DD'),
  guests_count: z.number().int().min(1).default(1),
})

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 60, windowMs: 60_000, keyPrefix: 'booking-calc-price' })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, {
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

  const parsed = calculateBookingPriceSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json({ error: firstIssue?.message || 'Thông tin không hợp lệ' }, { status: 400 })
  }

  const { room_id, check_in_date, check_out_date, guests_count } = parsed.data

  try {
    const supabase = createServiceRoleClient()

    // Check room_blocks for maintenance overlap (story 11.8)
    const { data: overlappingBlocks, error: blocksError } = await supabase
      .from('room_blocks')
      .select('id')
      .eq('room_id', room_id)
      .lte('start_date', check_out_date)
      .gt('end_date', check_in_date)

    if (blocksError) {
      console.error('[Booking Calculate] Blocks check error:', blocksError)
      captureError(blocksError, {
        route: '/api/bookings/calculate-price',
        roomId: room_id,
      })
      return NextResponse.json({ error: 'Không thể kiểm tra lịch bảo trì' }, { status: 500 })
    }

    if (overlappingBlocks && overlappingBlocks.length > 0) {
      return NextResponse.json({ error: 'Phòng đang bảo trì trong khoảng thời gian này' }, { status: 409 })
    }

    const pricing = await calculateBookingPrice(supabase, {
      roomId: room_id,
      checkInDate: check_in_date,
      checkOutDate: check_out_date,
      guestsCount: guests_count,
    })

    return NextResponse.json(pricing)
  } catch (err) {
    if (err instanceof PricingError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('Unexpected error in calculateBookingPrice:', err)
    return NextResponse.json({ error: 'Lỗi tính giá phòng' }, { status: 500 })
  }
}
