import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { calculateStoreOrderPrice, PricingError } from '@/lib/pricing'

const calculateStorePriceSchema = z.object({
  items: z.array(
    z.object({
      slug: z.string().min(1, 'Slug không được trống'),
      quantity: z.number().int().min(1).max(100),
    })
  ).min(1, 'Giỏ hàng phải có ít nhất 1 sản phẩm'),
  province: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 60, windowMs: 60_000, keyPrefix: 'store-calc-price' })
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

  const parsed = calculateStorePriceSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json({ error: firstIssue?.message || 'Thông tin không hợp lệ' }, { status: 400 })
  }

  const { items, province } = parsed.data

  try {
    const supabase = createServiceRoleClient()
    const pricing = await calculateStoreOrderPrice(supabase, {
      items,
      province,
    })

    return NextResponse.json(pricing)
  } catch (err) {
    if (err instanceof PricingError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('Unexpected error in calculateStoreOrderPrice:', err)
    return NextResponse.json({ error: 'Lỗi tính giá đơn hàng' }, { status: 500 })
  }
}
