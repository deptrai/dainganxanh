'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

const ORDER_CODE_REGEX = /^DH[A-Z0-9]{6}$/i
const ORDER_CODE_FIND_REGEX = /\b(DH[A-Z0-9]{6})\b/i

// ---------------------------------------------------------------------------
// syncCassoTransactions — Pull the last 1 day of transactions from Casso API
// and process any unrecognised ones the same way the webhook handler does.
// ---------------------------------------------------------------------------

interface CassoApiRecord {
  id: number
  tid: string
  amount: number
  description: string
  bank_sub_acc_id: string
  when: string
  type: number // 1 = credit, 2 = debit
}

export interface SyncResult {
  success: boolean
  error?: string
  imported: number
  skipped: number
  matched: number
}

export async function syncCassoTransactions(): Promise<SyncResult> {
  // 1. Auth — admin only
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Unauthorized', imported: 0, skipped: 0, matched: 0 }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { success: false, error: 'Unauthorized: admin role required', imported: 0, skipped: 0, matched: 0 }
  }

  const apiKey = process.env.CASSO_API_KEY
  if (!apiKey) {
    return { success: false, error: 'CASSO_API_KEY chưa được cấu hình', imported: 0, skipped: 0, matched: 0 }
  }

  // 2. Build date range: today and yesterday
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().slice(0, 10) // YYYY-MM-DD

  // 3. Fetch all pages from Casso API
  const records: CassoApiRecord[] = []
  let page = 1
  const pageSize = 100

  while (true) {
    const url = `https://oauth.casso.vn/v2/transactions?fromDate=${fmt(yesterday)}&toDate=${fmt(now)}&page=${page}&pageSize=${pageSize}`
    const resp = await fetch(url, {
      headers: { Authorization: `Apikey ${apiKey}` },
      cache: 'no-store',
    })
    if (!resp.ok) {
      const text = await resp.text()
      return { success: false, error: `Casso API lỗi ${resp.status}: ${text}`, imported: 0, skipped: 0, matched: 0 }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await resp.json()
    if (json.error !== 0) {
      return { success: false, error: `Casso API: ${json.message}`, imported: 0, skipped: 0, matched: 0 }
    }
    const batch: CassoApiRecord[] = json.data?.records ?? []
    records.push(...batch)
    if (batch.length < pageSize) break
    page++
  }

  if (records.length === 0) {
    return { success: true, imported: 0, skipped: 0, matched: 0 }
  }

  // 4. Process each record — same logic as webhook handler
  const adminSupabase = createServiceRoleClient()
  let imported = 0, skipped = 0, matched = 0

  for (const tx of records) {
    // Skip outgoing
    if (tx.type === 2 || tx.amount <= 0) { skipped++; continue }

    // Idempotency check
    const { data: existing } = await adminSupabase
      .from('casso_transactions')
      .select('id')
      .eq('casso_tid', String(tx.tid))
      .single()
    if (existing) { skipped++; continue }

    // Insert with status 'processing'
    await adminSupabase.from('casso_transactions').insert({
      casso_id:       tx.id,
      casso_tid:      String(tx.tid),
      amount:         tx.amount,
      description:    tx.description,
      bank_account:   tx.bank_sub_acc_id,
      transaction_at: tx.when,
      raw_payload:    tx,
      status:         'processing',
    })
    imported++

    // Parse order code
    const codeMatch = String(tx.description || '').match(ORDER_CODE_FIND_REGEX)
    if (!codeMatch) {
      await adminSupabase.from('casso_transactions')
        .update({ status: 'no_match', note: 'orderCode not found in description' })
        .eq('casso_tid', String(tx.tid))
      continue
    }
    const orderCode = codeMatch[1].toUpperCase()

    // Find pending order
    const { data: order } = await adminSupabase
      .from('orders')
      .select('id, code, user_id, user_email, user_name, quantity, total_amount')
      .eq('code', orderCode)
      .eq('status', 'pending')
      .single()

    if (!order) {
      await adminSupabase.from('casso_transactions')
        .update({ status: 'order_not_found', note: `Order ${orderCode} not found or not pending` })
        .eq('casso_tid', String(tx.tid))
      continue
    }

    // Validate amount ±1,000đ
    const diff = Math.abs(Number(tx.amount) - Number(order.total_amount))
    if (diff > 1000) {
      await adminSupabase.from('casso_transactions')
        .update({
          status: 'amount_mismatch',
          note: `Expected ${order.total_amount}, got ${tx.amount} (diff: ${diff})`,
          order_id: order.id,
        })
        .eq('casso_tid', String(tx.tid))
      continue
    }

    // Invoke process-payment Edge Function
    const { error: fnError } = await adminSupabase.functions.invoke('process-payment', {
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

    await adminSupabase.from('casso_transactions')
      .update({
        status:   fnError ? 'function_error' : 'processed',
        note:     fnError ? `[Sync] ${fnError.message}` : '[Sync] Matched via manual sync',
        order_id: order.id,
      })
      .eq('casso_tid', String(tx.tid))

    if (!fnError) matched++
  }

  return { success: true, imported, skipped, matched }
}

/**
 * Admin: Manually force-process a Casso transaction that could not be
 * matched automatically (status = 'order_not_found' | 'amount_mismatch').
 *
 * Steps:
 * 1. Verify caller is admin/super_admin
 * 2. Lookup order by orderCode (must be 'pending')
 * 3. Invoke process-payment Edge Function
 * 4. Update casso_transactions status
 */
export async function manualProcessTransaction(
    transactionId: string,
    orderCode: string
): Promise<{ success: boolean; error?: string }> {
    // 1. Verify admin role via session client
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return { success: false, error: 'Unauthorized: admin role required' }
    }

    // Validate orderCode format
    const normalizedCode = orderCode.trim().toUpperCase()
    if (!ORDER_CODE_REGEX.test(normalizedCode)) {
        return { success: false, error: 'Mã đơn hàng không hợp lệ (format: DH + 6 ký tự)' }
    }

    // Use service role client for the rest (bypass RLS)
    const adminSupabase = createServiceRoleClient()

    // 2. Verify transaction exists and is in a re-processable state
    const { data: transaction, error: txError } = await adminSupabase
        .from('casso_transactions')
        .select('id, status, amount, casso_tid')
        .eq('id', transactionId)
        .single()

    if (txError || !transaction) {
        return { success: false, error: 'Không tìm thấy giao dịch' }
    }

    if (!['order_not_found', 'amount_mismatch', 'function_error'].includes(transaction.status)) {
        return {
            success: false,
            error: `Không thể xử lý thủ công giao dịch có trạng thái: ${transaction.status}`,
        }
    }

    // 3. Lookup order by orderCode (must be 'pending')
    const { data: order, error: orderError } = await adminSupabase
        .from('orders')
        .select('id, code, user_id, user_email, user_name, quantity, total_amount')
        .eq('code', normalizedCode)
        .eq('status', 'pending')
        .single()

    if (orderError || !order) {
        return {
            success: false,
            error: `Không tìm thấy đơn hàng ${normalizedCode} ở trạng thái pending`,
        }
    }

    // 4. Invoke process-payment Edge Function
    const { error: fnError } = await adminSupabase.functions.invoke('process-payment', {
        body: {
            userId: order.user_id,
            userEmail: order.user_email,
            userName: order.user_name,
            orderCode: order.code,
            quantity: order.quantity,
            totalAmount: order.total_amount,
            paymentMethod: 'banking',
        },
    })

    // 5. Update casso_transactions status
    const newStatus = fnError ? 'function_error' : 'processed'
    const { error: updateError } = await adminSupabase
        .from('casso_transactions')
        .update({
            status: newStatus,
            note: fnError
                ? `[Manual] Error: ${fnError.message}`
                : `[Manual] Processed by admin — Order ${normalizedCode}`,
            order_id: fnError ? undefined : order.id,
        })
        .eq('id', transactionId)

    if (updateError) {
        console.error('Error updating casso_transactions after manual process:', updateError)
    }

    if (fnError) {
        return {
            success: false,
            error: `Lỗi khi gọi process-payment: ${fnError.message}`,
        }
    }

    return { success: true }
}
