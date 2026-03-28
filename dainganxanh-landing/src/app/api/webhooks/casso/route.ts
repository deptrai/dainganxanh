import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { notifyPaymentSuccess } from '@/lib/utils/telegram'
import { createHmac } from 'crypto'

const ORDER_CODE_REGEX = /\b(DH[A-Z0-9]{6})\b/i

// Verify Casso Webhook V2 HMAC signature
// Header format: x-casso-signature: t=<timestamp>,v1=<hmac-sha256>
// Signed payload: `${timestamp}.${rawBody}`
async function verifyCassoSignature(req: NextRequest, secret: string): Promise<{ rawBody: string; ok: boolean }> {
  const sig = req.headers.get('x-casso-signature') ?? ''
  const rawBody = await req.text()

  const tMatch = sig.match(/t=(\d+)/)
  const v1Match = sig.match(/v1=([a-f0-9]+)/)
  if (!tMatch || !v1Match) return { rawBody, ok: false }

  const timestamp = tMatch[1]
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  return { rawBody, ok: expected === v1Match[1] }
}

export async function POST(req: NextRequest) {
  // Guard: env var must be configured
  if (!process.env.CASSO_SECURE_TOKEN) {
    console.error('CASSO_SECURE_TOKEN is not configured')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // AC1 — Verify Casso Webhook V2 HMAC signature
  const { rawBody, ok } = await verifyCassoSignature(req, process.env.CASSO_SECURE_TOKEN)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const tx = body?.data

  // Casso gửi test ping không có data — acknowledge và return
  if (!tx?.tid) {
    return NextResponse.json({ ok: true })
  }

  // AC8 — createServiceRoleClient() bypasses RLS để ghi casso_transactions
  const supabase = createServiceRoleClient()

  // AC2 — Idempotency: check casso_tid trước khi process
  const { data: existing } = await supabase
    .from('casso_transactions')
    .select('id, status')
    .eq('casso_tid', String(tx.tid))
    .single()

  if (existing) {
    // AC7 — Luôn trả 200 kể cả duplicate
    return NextResponse.json({ ok: true, duplicate: true })
  }

  // AC3 — Log transaction ngay lập tức với status 'processing'
  await supabase.from('casso_transactions').insert({
    casso_id:       tx.id,
    casso_tid:      String(tx.tid),
    amount:         tx.amount,
    description:    tx.description,
    bank_account:   tx.bank_sub_acc_id,
    transaction_at: tx.when,
    raw_payload:    tx,
    status:         'processing',
  })

  // Chỉ xử lý tiền vào (type=1 hoặc amount > 0)
  if (tx.type === 2 || tx.amount <= 0) {
    await supabase
      .from('casso_transactions')
      .update({ status: 'no_match', note: 'Outgoing transaction ignored' })
      .eq('casso_tid', String(tx.tid))
    // AC7 — Luôn trả 200
    return NextResponse.json({ ok: true })
  }

  // AC4 — Parse orderCode từ description
  const match = String(tx.description || '').match(ORDER_CODE_REGEX)
  if (!match) {
    await supabase
      .from('casso_transactions')
      .update({ status: 'no_match', note: 'orderCode not found in description' })
      .eq('casso_tid', String(tx.tid))
    // AC7 — Luôn trả 200
    return NextResponse.json({ ok: true })
  }
  const orderCode = match[1].toUpperCase()

  // AC5 — Tìm order pending theo orderCode
  const { data: order } = await supabase
    .from('orders')
    .select('id, code, user_id, user_email, user_name, quantity, total_amount')
    .eq('code', orderCode)
    .eq('status', 'pending')
    .single()

  if (!order) {
    await supabase
      .from('casso_transactions')
      .update({
        status: 'order_not_found',
        note:   `Order ${orderCode} not found or not pending`,
      })
      .eq('casso_tid', String(tx.tid))
    // AC7 — Luôn trả 200
    return NextResponse.json({ ok: true })
  }

  // AC5 — Validate amount khớp ±1,000đ
  const diff = Math.abs(Number(tx.amount) - Number(order.total_amount))
  if (diff > 1000) {
    await supabase
      .from('casso_transactions')
      .update({
        status:   'amount_mismatch',
        note:     `Expected ${order.total_amount}, got ${tx.amount} (diff: ${diff})`,
        order_id: order.id,
      })
      .eq('casso_tid', String(tx.tid))
    // AC7 — Luôn trả 200
    return NextResponse.json({ ok: true })
  }

  // AC6 — Invoke Edge Function process-payment
  const { data: fnData, error: fnError } = await supabase.functions.invoke('process-payment', {
    body: {
      userId:        order.user_id,
      userEmail:     order.user_email,
      userName:      order.user_name,
      orderCode:     order.code,
      quantity:      order.quantity,
      totalAmount:   order.total_amount,
      paymentMethod: 'banking',
    },
  })

  // AC3 — Update log với kết quả cuối cùng
  await supabase
    .from('casso_transactions')
    .update({
      status:   fnError ? 'function_error' : 'processed',
      note:     fnError?.message ?? null,
      order_id: order.id,
    })
    .eq('casso_tid', String(tx.tid))

  // Gửi thông báo Telegram khi thanh toán thành công (non-blocking)
  if (!fnError) {
    notifyPaymentSuccess({
      orderCode:   order.code,
      userName:    order.user_name,
      userEmail:   order.user_email,
      quantity:    order.quantity,
      totalAmount: order.total_amount,
      treeCodes:   fnData?.treeCodes,
    }).catch((err) => console.error('[Telegram] notifyPaymentSuccess failed:', err))
  }

  // AC7 — Luôn trả 200 (kể cả function_error) để Casso không retry
  return NextResponse.json({ ok: true })
}
