import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { notifyPaymentSuccess, notifyContractFailure } from '@/lib/utils/telegram'
import { createReferralClick } from '@/actions/createReferralClick'
import { createHmac } from 'crypto'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/lib/rate-limit'
import { captureError } from '@/lib/monitoring'
import { sendEcoStayVoucherEmail } from '@/lib/email'

const ORDER_CODE_REGEX = /\b((?:DH|BK|ST)[A-Z0-9]{6})\b/i
const POLYMORPHIC_WEBHOOK_ENABLED = process.env.POLYMORPHIC_WEBHOOK_ENABLED !== 'false'

interface OrderLike {
  id: string
  code: string
  user_id: string | null
  user_email?: string | null
  user_name?: string | null
  total_amount: number
  status?: string
  // Eco-stay booking fields
  guest_name?: string | null
  guest_email?: string | null
  room_id?: string | null
  check_in_date?: string | null
  check_out_date?: string | null
  nights_count?: number | null
  guests_count?: number | null
}

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

function normalizeOrderCode(description: string): string | null {
  const match = String(description || '').match(ORDER_CODE_REGEX)
  return match ? match[1].toUpperCase() : null
}

function orderTypeFromCode(code: string): 'tree' | 'booking' | 'store' | null {
  if (code.startsWith('DH')) return 'tree'
  if (code.startsWith('BK')) return 'booking'
  if (code.startsWith('ST')) return 'store'
  return null
}

function isStaleTransaction(txAt: string): boolean {
  const transactionTime = new Date(txAt).getTime()
  return Date.now() - transactionTime > 60 * 60 * 1000 // 60 minutes
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

async function notifyPaymentMismatch(orderCode: string, expected: number, received: number, orderType: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  const typeLabel = orderType === 'tree' ? 'Cây' : orderType === 'booking' ? 'Đặt phòng' : 'Store'
  const message =
    `⚠️ <b>Thanh toán không đủ/khớp — ${typeLabel}</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📋 Mã đơn: <code>${orderCode}</code>\n` +
    `💰 Cần thanh toán: <b>${formatVND(expected)}</b>\n` +
    `💳 Nhận được: <b>${formatVND(received)}</b>\n` +
    `🔁 Còn thiếu: <b>${formatVND(Math.max(0, expected - received))}</b>\n` +
    `⚠️ Admin cần kiểm tra và xử lý thủ công.`
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: Number(chatId), text: message, parse_mode: 'HTML' }),
    })
  } catch (err) {
    console.error('[Telegram] notifyPaymentMismatch failed:', err)
  }
}

async function notifyWebhookError(orderType: string, orderCode: string, error: string, cassoTid: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  const typeLabel = orderType === 'tree' ? 'Cây' : orderType === 'booking' ? 'Đặt phòng' : 'Store'
  const message =
    `🚨 <b>Webhook Handler Error — ${typeLabel}</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📋 Mã đơn: <code>${orderCode}</code>\n` +
    `🔗 Casso TID: <code>${cassoTid}</code>\n` +
    `❌ Lỗi: <code>${error}</code>\n` +
    `⚠️ Admin cần kiểm tra webhook handler.`
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: Number(chatId), text: message, parse_mode: 'HTML' }),
    })
  } catch (err) {
    console.error('[Telegram] notifyWebhookError failed:', err)
  }
}

async function notifyStoreOrderConfirmed(orderCode: string, customerName: string, totalAmount: number) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  const message =
    `🛒 <b>Đơn Store thanh toán thành công!</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📋 Mã đơn: <code>${orderCode}</code>\n` +
    `👤 Khách hàng: ${customerName}\n` +
    `💰 Số tiền: <b>${formatVND(totalAmount)}</b>`
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: Number(chatId), text: message, parse_mode: 'HTML' }),
    })
  } catch (err) {
    console.error('[Telegram] notifyStoreOrderConfirmed failed:', err)
  }
}

async function notifyBookingConfirmed(orderCode: string, guestName: string, totalAmount: number) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  const message =
    `🏡 <b>Đặt phòng thanh toán thành công!</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📋 Mã booking: <code>${orderCode}</code>\n` +
    `👤 Khách: ${guestName}\n` +
    `💰 Số tiền: <b>${formatVND(totalAmount)}</b>`
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: Number(chatId), text: message, parse_mode: 'HTML' }),
    })
  } catch (err) {
    console.error('[Telegram] notifyBookingConfirmed failed:', err)
  }
}

type PaymentTransactionStatus = 'pending' | 'matched' | 'amount_mismatch' | 'stale' | 'duplicate'

async function logPaymentTransaction(
  supabase: ReturnType<typeof createServiceRoleClient>,
  params: {
    orderType: string
    orderId: string
    orderCode: string
    cassoTid: string
    amount: number
    status: PaymentTransactionStatus
    metadata?: Record<string, unknown>
  }
): Promise<'ok' | 'duplicate'> {
  const { error } = await supabase.from('payment_transactions').insert({
    order_type: params.orderType,
    order_id: params.orderId,
    order_code: params.orderCode,
    casso_tid: params.cassoTid,
    amount: params.amount,
    status: params.status,
    metadata: params.metadata ?? {},
  })
  if (error) {
    if (error.code === '23505') {
      console.error('[payment_transactions] duplicate detected:', params.cassoTid, params.orderCode)
      return 'duplicate'
    }
    console.error('[payment_transactions] insert failed:', error)
  }
  return 'ok'
}

async function processTreeOrder(
  supabase: ReturnType<typeof createServiceRoleClient>,
  tx: any,
  orderCode: string,
  order: OrderLike,
  paymentStatus: 'matched' | 'amount_mismatch'
): Promise<{ ok: boolean; error?: string }> {
  if (paymentStatus === 'amount_mismatch') {
    await supabase.from('casso_transactions')
      .update({
        status: 'amount_mismatch',
        note: `Expected ${order.total_amount}, got ${tx.amount}`,
        order_id: order.id,
      })
      .eq('casso_tid', String(tx.id ?? tx.tid))
    notifyPaymentMismatch(orderCode, order.total_amount, tx.amount, 'tree')
    return { ok: false, error: 'Amount mismatch' }
  }

  const { data: fnData, error: fnError } = await supabase.functions.invoke('process-payment', {
    body: {
      userId: order.user_id,
      userEmail: order.user_email,
      userName: order.user_name,
      orderCode: order.code,
      quantity: (order as any).quantity,
      totalAmount: order.total_amount,
      paymentMethod: 'banking',
      referredBy: (order as any).referred_by || null,
    },
  })

  if (fnError) {
    await supabase.from('casso_transactions')
      .update({ status: 'function_error', note: fnError.message, order_id: order.id })
      .eq('casso_tid', String(tx.id ?? tx.tid))
    notifyContractFailure({
      orderCode: order.code,
      userName: order.user_name ?? 'Unknown',
      userEmail: order.user_email ?? '',
      errorMessage: fnError.message || 'Edge Function process-payment failed',
    })
    return { ok: false, error: fnError.message }
  }

  await supabase.from('casso_transactions')
    .update({ status: 'processed', order_id: order.id })
    .eq('casso_tid', String(tx.id ?? tx.tid))

  if ((order as any).referred_by) {
    createReferralClick(order.id, (order as any).referred_by, 'casso-webhook')
      .catch((err) => console.error('[Casso] createReferralClick failed:', err))
  }

  revalidatePath('/')
  notifyPaymentSuccess({
    orderCode: order.code,
    userName: order.user_name ?? '',
    userEmail: order.user_email ?? '',
    quantity: (order as any).quantity ?? 0,
    totalAmount: order.total_amount,
    treeCodes: fnData?.treeCodes,
  })
  return { ok: true }
}

async function processBooking(
  supabase: ReturnType<typeof createServiceRoleClient>,
  tx: any,
  orderCode: string,
  booking: OrderLike,
  paymentStatus: 'matched' | 'amount_mismatch'
): Promise<{ ok: boolean; error?: string }> {
  if (paymentStatus === 'amount_mismatch') {
    notifyPaymentMismatch(orderCode, booking.total_amount, tx.amount, 'booking')
    return { ok: false, error: 'Amount mismatch' }
  }

  // Double-check booking still pending to avoid race with cancel
  const { data: current } = await supabase
    .from('room_bookings')
    .select('status')
    .eq('id', booking.id)
    .single()

  if (!current || current.status !== 'pending') {
    return { ok: false, error: 'Booking is not pending' }
  }

  const { error: updateError } = await supabase
    .from('room_bookings')
    .update({ status: 'confirmed', payment_ref: String(tx.id ?? tx.tid), expires_at: null })
    .eq('id', booking.id)

  if (updateError) {
    console.error('[Casso] Booking confirm failed:', updateError)
    return { ok: false, error: updateError.message }
  }

  revalidatePath('/eco-tourism')
  notifyBookingConfirmed(orderCode, booking.guest_name ?? '', booking.total_amount)

  // Send Eco-Stay Voucher email asynchronously (non-blocking)
  // Note: avoid next/after here because tests invoke this handler outside a request scope.
  if (booking.guest_email) {
    (async () => {
      try {
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('name, lots(name, region)')
          .eq('id', booking.room_id ?? '')
          .single()

        if (roomError) {
          throw new Error(`Failed to load room data: ${roomError.message}`)
        }

        const roomName = roomData?.name || 'Phòng nghỉ sinh thái'
        const lotInfo = (roomData as any)?.lots
        const gardenName = lotInfo?.name
          ? (lotInfo.name.startsWith('Vườn') ? lotInfo.name : `Vườn ${lotInfo.name}`)
          : undefined
        const gardenAddress = lotInfo?.region
          ? (lotInfo.region.startsWith('Khu vực') ? lotInfo.region : `Khu vực ${lotInfo.region}`)
          : undefined

        const voucherBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://dainganxanh.com.vn").replace(/\/$/, "")
        const voucherUrl = `${voucherBaseUrl}/eco-tourism/voucher/${orderCode}`

        await sendEcoStayVoucherEmail({
          bookingId: booking.id,
          recipientEmail: booking.guest_email || '',
          guestName: booking.guest_name || 'Quý khách',
          bookingCode: orderCode,
          voucherUrl,
          roomName,
          gardenName,
          gardenAddress,
          checkInDate: booking.check_in_date || '',
          checkOutDate: booking.check_out_date || '',
          nightsCount: booking.nights_count || 1,
          guestsCount: booking.guests_count || 1,
          totalAmount: booking.total_amount,
        })
      } catch (emailErr) {
        console.error('[Casso] Failed to send voucher email:', emailErr)
        captureError(emailErr instanceof Error ? emailErr : new Error(String(emailErr)), {
          route: '/api/webhooks/casso',
          orderType: 'booking',
          orderCode,
          action: 'send_voucher_email',
        })
      }
    })()
  }

  return { ok: true }
}

async function processStoreOrder(
  supabase: ReturnType<typeof createServiceRoleClient>,
  tx: any,
  orderCode: string,
  order: OrderLike,
  paymentStatus: 'matched' | 'amount_mismatch'
): Promise<{ ok: boolean; error?: string }> {
  if (paymentStatus === 'amount_mismatch') {
    notifyPaymentMismatch(orderCode, order.total_amount, tx.amount, 'store')
    return { ok: false, error: 'Amount mismatch' }
  }

  // Must be idempotent: if already confirmed, skip
  const { data: current } = await supabase
    .from('store_orders')
    .select('status')
    .eq('id', order.id)
    .single()

  if (!current) return { ok: false, error: 'Store order not found' }
  if (current.status !== 'pending') return { ok: true } // already processed

  // Get items and decrement reserved stock atomically
  const { data: items } = await supabase
    .from('store_order_items')
    .select('id, product_id, quantity')
    .eq('store_order_id', order.id)

  if (items && items.length > 0) {
    for (const item of items) {
      await supabase.rpc('release_product_stock', {
        p_product_id: item.product_id,
        p_qty: item.quantity,
      })
      // release_product_stock adds stock back and removes reserved;
      // we then want to decrement actual stock (not reserved)
      const { error: stockError } = await supabase.rpc('reserve_product_stock', {
        p_product_id: item.product_id,
        p_qty: item.quantity,
      })
      if (stockError) {
        console.error('[Casso] Stock finalization failed:', stockError)
      }
    }
  }

  const { error: updateError } = await supabase
    .from('store_orders')
    .update({ status: 'confirmed', payment_ref: String(tx.id ?? tx.tid), expires_at: null })
    .eq('id', order.id)

  if (updateError) {
    console.error('[Casso] Store order confirm failed:', updateError)
    return { ok: false, error: updateError.message }
  }

  revalidatePath('/store')
  notifyStoreOrderConfirmed(orderCode, (order as any).customer_name ?? '', order.total_amount)
  return { ok: true }
}

async function findPendingOrder(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orderType: 'tree' | 'booking' | 'store',
  orderCode: string
): Promise<{ order: OrderLike | null; table: string }> {
  if (orderType === 'tree') {
    const { data: order } = await supabase
      .from('orders')
      .select('id, code, user_id, user_email, user_name, quantity, total_amount, referred_by, status')
      .eq('code', orderCode)
      .eq('status', 'pending')
      .single()
    return { order: order as OrderLike | null, table: 'orders' }
  }

  if (orderType === 'booking') {
    const { data: booking } = await supabase
      .from('room_bookings')
      .select('id, code, user_id, guest_name, guest_email, room_id, check_in_date, check_out_date, nights_count, guests_count, total_amount, status')
      .eq('code', orderCode)
      .eq('status', 'pending')
      .single()
    return { order: booking as unknown as OrderLike | null, table: 'room_bookings' }
  }

  const { data: storeOrder } = await supabase
    .from('store_orders')
    .select('id, code, user_id, customer_name, customer_email, total_amount, status')
    .eq('code', orderCode)
    .eq('status', 'pending')
    .single()
  return { order: storeOrder as unknown as OrderLike | null, table: 'store_orders' }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 100, windowMs: 60_000, keyPrefix: 'casso' })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSec) },
    })
  }

  if (!process.env.CASSO_SECURE_TOKEN) {
    console.error('CASSO_SECURE_TOKEN is not configured')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const sig = req.headers.get('x-casso-signature') ?? '(none)'
  const { body, ok } = await verifyCassoSignature(req, process.env.CASSO_SECURE_TOKEN)
  if (!ok) {
    const supabase = createServiceRoleClient()
    try {
      await supabase.from('casso_transactions').insert({
        casso_id: null,
        casso_tid: `hmac_fail_${Date.now()}`,
        amount: 0,
        description: `HMAC fail — sig: ${sig.slice(0, 80)}`,
        status: 'hmac_failed',
        raw_payload: { sig, body },
      })
    } catch { /* best effort */ }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = (body as any)?.data
  const txId = String(tx?.id ?? tx?.tid ?? `unknown_${Date.now()}`)
  if (!txId) {
    return NextResponse.json({ ok: true })
  }

  const supabase = createServiceRoleClient()

  // Idempotency check
  const { data: existing } = await supabase
    .from('casso_transactions')
    .select('id, status')
    .eq('casso_tid', txId)
    .single()

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  // Log raw Casso transaction
  const numericCassoId = Number.isInteger(Number(txId)) ? Number(txId) : null
  await supabase.from('casso_transactions').insert({
    casso_id: numericCassoId,
    casso_tid: txId,
    amount: tx.amount,
    description: tx.description,
    bank_account: tx.accountNumber ?? tx.bank_sub_acc_id,
    transaction_at: tx.transactionDateTime ?? tx.when,
    raw_payload: tx,
    status: 'processing',
  })

  // Ignore outgoing
  if (tx.amount <= 0) {
    await supabase.from('casso_transactions')
      .update({ status: 'no_match', note: 'Outgoing transaction ignored' })
      .eq('casso_tid', txId)
    return NextResponse.json({ ok: true })
  }

  // Parse order code
  const orderCode = normalizeOrderCode(tx.description)
  if (!orderCode) {
    await supabase.from('casso_transactions')
      .update({ status: 'no_match', note: 'orderCode not found in description' })
      .eq('casso_tid', txId)
    return NextResponse.json({ ok: true })
  }

  const orderType = orderTypeFromCode(orderCode)
  if (!orderType) {
    await supabase.from('casso_transactions')
      .update({ status: 'no_match', note: `Unknown order prefix: ${orderCode}` })
      .eq('casso_tid', txId)
    return NextResponse.json({ ok: true })
  }

  // Feature flag: rollback to legacy DH-only handler if disabled
  if (!POLYMORPHIC_WEBHOOK_ENABLED && orderType !== 'tree') {
    await supabase.from('casso_transactions')
      .update({ status: 'skipped', note: `Polymorphic webhook disabled. ${orderType} not processed.` })
      .eq('casso_tid', txId)
    await logPaymentTransaction(supabase, {
      orderType,
      orderId: '00000000-0000-0000-0000-000000000000',
      orderCode,
      cassoTid: txId,
      amount: tx.amount,
      status: 'duplicate', // placeholder: we do not process non-DH in legacy mode
    })
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Stale check (60 minutes)
  const txAt = tx.transactionDateTime ?? tx.when
  if (isStaleTransaction(txAt)) {
    await supabase.from('casso_transactions')
      .update({ status: 'no_match', note: 'Transaction older than 60 minutes' })
      .eq('casso_tid', txId)
    await logPaymentTransaction(supabase, {
      orderType,
      orderId: '00000000-0000-0000-0000-000000000000',
      orderCode,
      cassoTid: txId,
      amount: tx.amount,
      status: 'stale',
    })
    return NextResponse.json({ ok: true })
  }

  // Find pending order
  const { order } = await findPendingOrder(supabase, orderType, orderCode)
  if (!order) {
    await supabase.from('casso_transactions')
      .update({ status: 'order_not_found', note: `${orderType} ${orderCode} not found or not pending` })
      .eq('casso_tid', txId)
    return NextResponse.json({ ok: true })
  }

  // Amount validation ±1,000đ
  const diff = Math.abs(Number(tx.amount) - Number(order.total_amount))
  const paymentStatus: 'matched' | 'amount_mismatch' = diff > 1000 ? 'amount_mismatch' : 'matched'

  let result: { ok: boolean; error?: string }
  try {
    switch (orderType) {
      case 'tree':
        result = await processTreeOrder(supabase, tx, orderCode, order, paymentStatus)
        break
      case 'booking':
        result = await processBooking(supabase, tx, orderCode, order, paymentStatus)
        break
      case 'store':
        result = await processStoreOrder(supabase, tx, orderCode, order, paymentStatus)
        break
      default:
        result = { ok: false, error: 'Unknown order type' }
    }
  } catch (handlerError) {
    const errMsg = handlerError instanceof Error ? handlerError.message : String(handlerError)
    console.error(`[Casso] ${orderType} handler failed:`, handlerError)
    captureError(handlerError, {
      route: '/api/webhooks/casso',
      orderType,
      orderCode,
      cassoTid: txId,
      action: 'handler_processing',
    })
    notifyWebhookError(orderType, orderCode, errMsg, txId)
    result = { ok: false, error: `${orderType} handler error: ${errMsg}` }
  }

  // Ledger record
  const logResult = await logPaymentTransaction(supabase, {
    orderType,
    orderId: order.id,
    orderCode,
    cassoTid: txId,
    amount: tx.amount,
    status: paymentStatus === 'amount_mismatch' ? 'amount_mismatch' : (result.ok ? 'matched' : 'amount_mismatch'),
    metadata: { note: result.error },
  })
  if (logResult === 'duplicate') {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  // Update casso_transactions final status for non-tree (tree does it inside)
  // Note: casso_transactions.order_id has FK to orders(id), so we don't pass order_id for booking/store
  if (orderType !== 'tree') {
    await supabase.from('casso_transactions')
      .update({
        status: result.ok ? 'processed' : 'function_error',
        note: result.error ?? undefined,
      })
      .eq('casso_tid', txId)
  }

  return NextResponse.json({ ok: true })
}
