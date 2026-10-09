import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/getEffectiveUser'
import { rateLimit } from '@/lib/rate-limit'
import { captureError } from '@/lib/monitoring'
import { calculateStoreOrderPrice, PricingError } from '@/lib/pricing'

const PAYMENT_TIMEOUT_MINUTES = 15

export const createOrderSchema = z.object({
  product_slug: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  customer_name: z.string().min(1, 'Vui lòng nhập họ tên'),
  customer_phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ'),
  customer_email: z.email().optional().or(z.literal('')),
  shipping_address: z.string().min(1, 'Vui lòng nhập địa chỉ giao hàng'),
  shipping_province: z.string().min(1, 'Vui lòng chọn tỉnh/thành phố'),
  shipping_note: z.string().optional(),
  payment_method: z.enum(['banking', 'cod']),
  total_amount: z.number().int().positive().optional(),
  locale: z.enum(['vi', 'en']).optional(),
})

function generateStoreOrderCode(): string {
  // padEnd: base-36 ngẫu nhiên có thể < 6 ký tự; status route bắt đúng 6
  return 'ST' + Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, '0')
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 30, windowMs: 60_000, keyPrefix: 'store-order-create' })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSec) },
    })
  }

  const effectiveUser = await getEffectiveUser().catch(() => null)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
  }

  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json({ error: firstIssue?.message || 'Thông tin không hợp lệ' }, { status: 400 })
  }

  const data = parsed.data
  const supabase = createServiceRoleClient()

  // Authoritative server-side price calculation
  let pricing
  try {
    pricing = await calculateStoreOrderPrice(supabase, {
      items: [{ slug: data.product_slug, quantity: data.quantity }],
      province: data.shipping_province,
    })
  } catch (err) {
    if (err instanceof PricingError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('calculateStoreOrderPrice failed:', err)
    return NextResponse.json({ error: 'Lỗi tính giá đơn hàng' }, { status: 500 })
  }

  // Reject client tampering attempts
  if (data.total_amount !== undefined && data.total_amount !== pricing.totalAmount) {
    return NextResponse.json({
      error: `Giá trị đơn hàng không khớp (client: ${data.total_amount}, server: ${pricing.totalAmount})`,
    }, { status: 400 })
  }

  const pricedItem = pricing.items[0]
  const subtotal = pricing.subtotal
  const shippingFee = pricing.shippingFee
  const totalAmount = pricing.totalAmount

  // Reserve stock atomically before creating order
  const { data: reserved, error: reserveError } = await supabase.rpc('reserve_product_stock', {
    p_product_id: pricedItem.productId,
    p_qty: data.quantity,
  })

  if (reserveError || !reserved) {
    captureError(reserveError ?? new Error('reserve returned false'), { route: '/api/store/orders/create', action: 'reserve_stock' })
    return NextResponse.json({ error: 'Không thể giữ hàng. Có thể sản phẩm vừa hết.' }, { status: 409 })
  }

  const expiresAt = data.payment_method === 'banking'
    ? new Date(Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000).toISOString()
    : null

  const rawCookie = req.cookies.get('NEXT_LOCALE')?.value
  const bodyLocale = data.locale
  const locale: 'vi' | 'en' =
    rawCookie === 'en' || rawCookie === 'vi'
      ? rawCookie
      : bodyLocale === 'en' || bodyLocale === 'vi'
        ? bodyLocale
        : 'vi'

  // Create store order with retry on unique code collision (23505)
  const MAX_RETRIES = 3
  let order: {
    id: string
    code: string
    total_amount: number
    payment_method: string
    expires_at: string | null
  } | null = null
  let orderError: { code?: string; message?: string } | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const orderCode = generateStoreOrderCode()
    const result = await supabase
      .from('store_orders')
      .insert({
        code: orderCode,
        user_id: effectiveUser?.userId ?? null,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email || null,
        shipping_address: data.shipping_address,
        shipping_province: data.shipping_province,
        shipping_note: data.shipping_note || null,
        subtotal,
        shipping_fee: shippingFee,
        total_amount: totalAmount,
        payment_method: data.payment_method,
        status: 'pending',
        expires_at: expiresAt,
        locale,
      })
      .select('id, code, total_amount, payment_method, expires_at')
      .single()

    if (!result.error && result.data) {
      order = result.data
      orderError = null
      break
    }

    orderError = result.error
    if (result.error?.code !== '23505') {
      break
    }
  }

  if (orderError || !order) {
    // Rollback stock reservation on order creation failure
    await supabase.rpc('release_product_stock', { p_product_id: pricedItem.productId, p_qty: data.quantity })
    captureError(new Error(orderError?.message ?? 'Failed to create store order'), {
      route: '/api/store/orders/create',
      action: 'order_insert',
      productSlug: data.product_slug,
    })
    return NextResponse.json({ error: 'Không thể tạo đơn hàng' }, { status: 500 })
  }

  // Create order item
  const { error: itemError } = await supabase.from('store_order_items').insert({
    store_order_id: order.id,
    product_id: pricedItem.productId,
    quantity: data.quantity,
    unit_price: pricedItem.unitPrice,
  })

  if (itemError) {
    // Rollback
    await supabase.from('store_orders').delete().eq('id', order.id)
    await supabase.rpc('release_product_stock', { p_product_id: pricedItem.productId, p_qty: data.quantity })
    captureError(itemError, {
      route: '/api/store/orders/create',
      action: 'item_insert',
      orderId: order.id,
      productSlug: data.product_slug,
    })
    return NextResponse.json({ error: 'Không thể tạo chi tiết đơn hàng' }, { status: 500 })
  }

  return NextResponse.json({
    orderId: order.id,
    orderCode: order.code,
    totalAmount: order.total_amount,
    paymentMethod: order.payment_method,
    expiresAt: order.expires_at,
    itemName: pricedItem.name,
  })
}
