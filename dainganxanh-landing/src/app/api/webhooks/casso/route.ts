import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { notifyPaymentSuccess } from '@/lib/utils/telegram'
import { createReferralClick } from '@/actions/createReferralClick'
import { createHmac } from 'crypto'

const ORDER_CODE_REGEX = /\b(DH[A-Z0-9]{6})\b/i

// Verify Casso Webhook V2 HMAC signature
// Header: x-casso-signature: t=<timestamp>,v1=<hmac-sha512>
// Signed payload: `${timestamp}.${JSON.stringify(sortedByKey(body))}`
// Ref: https://github.com/CassoHQ/casso-webhook-v2-verify-signature
function sortObjByKey(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj
  const sorted: Record<string, unknown> = {}
  Object.keys(obj as Record<string, unknown>).sort().forEach(k => {
    sorted[k] = sortObjByKey((obj as Record<string, unknown>)[k])
  })
  return sorted
}

async function verifyCassoSignature(req: NextRequest, secret: string): Promise<{ body: unknown; ok: boolean }> {
  const sig = req.headers.get('x-casso-signature') ?? ''
  const rawBody = await req.text()

  const match = sig.match(/t=(\d+),v1=([a-f0-9]+)/)
  if (!match) return { body: null, ok: false }

  const [, timestampStr, received] = match
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any
  try { parsed = JSON.parse(rawBody) } catch { return { body: null, ok: false } }

  const sorted = sortObjByKey(parsed)
  const message = `${timestampStr}.${JSON.stringify(sorted)}`
  const expected = createHmac('sha512', secret).update(message).digest('hex')

  return { body: parsed, ok: expected === received }
}

export async function POST(req: NextRequest) {
  // Guard: env var must be configured
  if (!process.env.CASSO_SECURE_TOKEN) {
    console.error('CASSO_SECURE_TOKEN is not configured')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // AC1 — Verify Casso Webhook V2 HMAC signature
  const sig = req.headers.get('x-casso-signature') ?? '(none)'
  const { body, ok } = await verifyCassoSignature(req, process.env.CASSO_SECURE_TOKEN)
  if (!ok) {
    console.error('[Casso] HMAC verification failed', {
      sig,
      contentType: req.headers.get('content-type'),
      bodyPreview: typeof body === 'object' ? JSON.stringify(body)?.slice(0, 200) : body,
    })
    // Log failed attempt to DB for visibility
    try {
      const supabase = createServiceRoleClient()
      await supabase.from('casso_transactions').insert({
        casso_tid: `hmac_fail_${Date.now()}`,
        amount: 0,
        description: `HMAC fail — sig: ${sig.slice(0, 80)}`,
        status: 'hmac_failed',
        raw_payload: { sig, body },
      })
    } catch { /* best-effort */ }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  // Casso Webhook V2 payload: { error: 0, data: { id, reference, description, amount,
  //   runningBalance, transactionDateTime, accountNumber, bankName, bankAbbreviation } }
  // V1 compat: { data: { tid, amount, type, description, bank_sub_acc_id, when } }
  const tx = body?.data

  // Casso gửi test ping không có data — acknowledge và return
  const txId = tx?.id ?? tx?.tid
  if (!txId) {
    return NextResponse.json({ ok: true })
  }

  // AC8 — createServiceRoleClient() bypasses RLS để ghi casso_transactions
  const supabase = createServiceRoleClient()

  // AC2 — Idempotency: check casso_tid trước khi process
  const { data: existing } = await supabase
    .from('casso_transactions')
    .select('id, status')
    .eq('casso_tid', String(txId))
    .single()

  if (existing) {
    // AC7 — Luôn trả 200 kể cả duplicate
    return NextResponse.json({ ok: true, duplicate: true })
  }

  // AC3 — Log transaction ngay lập tức với status 'processing'
  await supabase.from('casso_transactions').insert({
    casso_id:       String(txId),
    casso_tid:      String(txId),
    amount:         tx.amount,
    description:    tx.description,
    bank_account:   tx.accountNumber ?? tx.bank_sub_acc_id,
    transaction_at: tx.transactionDateTime ?? tx.when,
    raw_payload:    tx,
    status:         'processing',
  })

  // Chỉ xử lý tiền vào (V2: amount > 0, V1: type !== 2)
  if (tx.amount <= 0) {
    await supabase
      .from('casso_transactions')
      .update({ status: 'no_match', note: 'Outgoing transaction ignored' })
      .eq('casso_tid', String(txId))
    // AC7 — Luôn trả 200
    return NextResponse.json({ ok: true })
  }

  // AC4 — Parse orderCode từ description
  const match = String(tx.description || '').match(ORDER_CODE_REGEX)
  if (!match) {
    await supabase
      .from('casso_transactions')
      .update({ status: 'no_match', note: 'orderCode not found in description' })
      .eq('casso_tid', String(txId))
    // AC7 — Luôn trả 200
    return NextResponse.json({ ok: true })
  }
  const orderCode = match[1].toUpperCase()

  // AC5 — Tìm order pending theo orderCode
  const { data: order } = await supabase
    .from('orders')
    .select('id, code, user_id, user_email, user_name, quantity, total_amount, referred_by')
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
      .eq('casso_tid', String(txId))
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
      .eq('casso_tid', String(txId))
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
      referredBy:    order.referred_by || null,
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
    .eq('casso_tid', String(txId))

  // Create referral_click for commission tracking (non-blocking)
  if (!fnError && order.referred_by) {
    createReferralClick(order.id, order.referred_by, 'casso-webhook')
      .catch((err) => console.error('[Casso] createReferralClick failed:', err))
  }

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
