import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/getEffectiveUser'
import { rateLimit } from '@/lib/rate-limit'

const SHIPPING_FEE_DEFAULT = 0
const PAYMENT_TIMEOUT_MINUTES = 15

const createOrderSchema = z.object({
  product_slug: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  customer_name: z.string().min(1, 'Vui lòng nhập họ tên'),
  customer_phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ'),
  customer_email: z.string().email().optional().or(z.literal('')),
  shipping_address: z.string().min(1, 'Vui lòng nhập địa chỉ giao hàng'),
  shipping_province: z.string().min(1, 'Vui lòng chọn tỉnh/thành phố'),
  shipping_note: z.string().optional(),
  payment_method: z.enum(['banking', 'cod']),
})

function generateStoreOrderCode(): string {
  return 'ST' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 30, windowMs: 60_000, keyPrefix: 'store-order-create' })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSec) },
    })
  }

  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json({ error: firstIssue?.message || 'Thông tin không hợp lệ' }, { status: 400 })
  }

  const data = parsed.data
  const supabase = createServiceRoleClient()

  // Fetch product with lock for stock reservation
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, slug, price, stock_quantity, status')
    .eq('slug', data.product_slug)
    .eq('status', 'active')
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: 'Sản phẩm không tồn tại hoặc đã ngừng bán' }, { status: 404 })
  }

  if (product.stock_quantity < data.quantity) {
    return NextResponse.json({ error: 'Sản phẩm không đủ tồn kho' }, { status: 409 })
  }

  // Server-side price calculation — reject client totals
  const subtotal = product.price * data.quantity
  const shippingFee = SHIPPING_FEE_DEFAULT
  const totalAmount = subtotal + shippingFee

  const orderCode = generateStoreOrderCode()
  const expiresAt = data.payment_method === 'banking'
    ? new Date(Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000).toISOString()
    : null

  // Reserve stock atomically before creating order
  const { data: reserved, error: reserveError } = await supabase.rpc('reserve_product_stock', {
    p_product_id: product.id,
    p_qty: data.quantity,
  })

  if (reserveError || !reserved) {
    console.error('reserve_product_stock failed:', reserveError)
    return NextResponse.json({ error: 'Không thể giữ hàng. Có thể sản phẩm vừa hết.' }, { status: 409 })
  }

  // Create store order
  const { data: order, error: orderError } = await supabase
    .from('store_orders')
    .insert({
      code: orderCode,
      user_id: effectiveUser.userId,
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
    })
    .select('id, code, total_amount, payment_method, expires_at')
    .single()

  if (orderError) {
    // Rollback stock reservation on order creation failure
    await supabase.rpc('release_product_stock', { p_product_id: product.id, p_qty: data.quantity })
    console.error('store order creation failed:', orderError)
    return NextResponse.json({ error: 'Không thể tạo đơn hàng' }, { status: 500 })
  }

  // Create order item
  const { error: itemError } = await supabase.from('store_order_items').insert({
    store_order_id: order.id,
    product_id: product.id,
    quantity: data.quantity,
    unit_price: product.price,
  })

  if (itemError) {
    // Rollback
    await supabase.from('store_orders').delete().eq('id', order.id)
    await supabase.rpc('release_product_stock', { p_product_id: product.id, p_qty: data.quantity })
    console.error('store order item creation failed:', itemError)
    return NextResponse.json({ error: 'Không thể tạo chi tiết đơn hàng' }, { status: 500 })
  }

  // For COD, confirm immediately
  if (data.payment_method === 'cod') {
    await supabase.from('store_orders').update({ status: 'confirmed', expires_at: null }).eq('id', order.id)
  }

  return NextResponse.json({
    orderId: order.id,
    orderCode: order.code,
    totalAmount: order.total_amount,
    paymentMethod: order.payment_method,
    expiresAt: order.expires_at,
    itemName: product.name,
  })
}
