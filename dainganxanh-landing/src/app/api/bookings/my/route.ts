import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getImpersonationContext } from '@/lib/getImpersonationContext'
import { rateLimit } from '@/lib/rate-limit'
import { captureError } from '@/lib/monitoring'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, { limit: 100, windowMs: 60_000, keyPrefix: 'my-bookings' })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSec) },
      }
    )
  }

  const ctx = await getImpersonationContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 })
  }

  const { effectiveUserId } = ctx
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const start = (page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE - 1

  const supabase = createServiceRoleClient()

  const {
    data: bookings,
    error,
    count,
  } = await supabase
    .from('room_bookings')
    .select(
      `
      id,
      code,
      check_in_date,
      check_out_date,
      guests_count,
      nights_count,
      total_amount,
      payment_method,
      status,
      expires_at,
      created_at,
      rooms(name, lots(name))
    `,
      { count: 'exact' }
    )
    .eq('user_id', effectiveUserId)
    .order('created_at', { ascending: false })
    .range(start, end)

  if (error) {
    captureError(error, { route: '/api/bookings/my', userId: effectiveUserId })
    return NextResponse.json({ error: 'Không thể tải danh sách đặt phòng' }, { status: 500 })
  }

  const formatted = (bookings || []).map((row) => ({
    id: row.id,
    code: row.code,
    roomName: (row.rooms as unknown as { name?: string } | null)?.name || '',
    lotName: (() => {
      const room = row.rooms as unknown as { lots?: { name?: string } | { name?: string }[] | null } | null
      const lotData = room?.lots
      const lot = Array.isArray(lotData) ? lotData[0] : lotData
      return lot?.name || ''
    })(),
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    guestsCount: row.guests_count,
    nightsCount: row.nights_count,
    totalAmount: row.total_amount,
    paymentMethod: row.payment_method,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }))

  return NextResponse.json({
    bookings: formatted,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / PAGE_SIZE),
    },
  })
}
