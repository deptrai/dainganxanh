'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

const ORDER_CODE_REGEX = /^DH[A-Z0-9]{6}$/i

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
