import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, { limit: 60, windowMs: 60_000, keyPrefix: 'store-order-status' })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSec ?? 60) },
      }
    )
  }

  const rawCode = req.nextUrl.searchParams.get('code')
  const code = rawCode ? rawCode.trim().toUpperCase().replace(/^ST-/, 'ST') : null
  if (!code || !/^ST[A-Z0-9]{6}$/.test(code)) {
    return NextResponse.json({ error: 'Mã đơn hàng không hợp lệ' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data: order, error } = await supabase
    .from('store_orders')
    .select('code, status, total_amount, payment_method, expires_at, tracking_number')
    .eq('code', code)
    .maybeSingle()

  if (error) {
    console.error('store order status lookup failed:', error)
    return NextResponse.json({ error: 'Lỗi hệ thống. Vui lòng thử lại sau.' }, { status: 500 })
  }
  if (!order) {
    return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 })
  }

  let effectiveStatus = order.status
  if (order.status === 'pending' && order.expires_at) {
    const isExpired = new Date(order.expires_at).getTime() <= Date.now()
    if (isExpired) {
      effectiveStatus = 'expired'
    }
  }

  return NextResponse.json({
    code: order.code,
    status: effectiveStatus,
    total_amount: order.total_amount,
    payment_method: order.payment_method,
    expires_at: order.expires_at,
    tracking_number: order.tracking_number,
  })
}
