import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Auth check with user session
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, orderCode } = await req.json()
    if (!orderId && !orderCode) {
      return NextResponse.json({ error: 'Missing orderId or orderCode' }, { status: 400 })
    }
    if (orderCode && !/^DH[A-Z0-9]{6}$/i.test(orderCode)) {
      return NextResponse.json({ error: 'Invalid order code format' }, { status: 400 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Fetch caller role (needed for admin refund path)
    const { data: callerProfile } = await serviceSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = ['admin', 'super_admin'].includes(callerProfile?.role ?? '')

    // Admin refund path: check if target order is completed
    if (orderId) {
      const { data: existingOrder } = await serviceSupabase
        .from('orders')
        .select('id, code, total_amount, user_id, status')
        .eq('id', orderId)
        .single()

      if (existingOrder?.status === 'completed') {
        // Only admins can cancel completed orders
        if (!isAdmin) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { error: updateError } = await serviceSupabase
          .from('orders')
          .update({ status: 'cancelled_refunded' })
          .eq('id', orderId)
          .eq('status', 'completed')

        if (updateError) {
          console.error('Failed to refund order:', updateError)
          return NextResponse.json({ error: 'Không thể hoàn tiền đơn hàng' }, { status: 500 })
        }

        // Non-blocking audit log
        try {
          await serviceSupabase.from('admin_audit_log').insert({
            admin_id: user.id,
            action: 'order_refund_initiated',
            target_id: existingOrder.id,
            metadata: {
              order_code: existingOrder.code,
              amount: existingOrder.total_amount,
              user_id: existingOrder.user_id,
            },
          })
        } catch (auditErr) {
          console.error('Audit log failed (non-blocking):', auditErr)
        }

        return NextResponse.json({ success: true, refundStatus: 'manual_pending' })
      }

      if (!existingOrder) {
        return NextResponse.json({ error: 'Đơn hàng không tìm thấy hoặc đã xử lý' }, { status: 404 })
      }
    }

    // Regular cancel path: user cancels own pending order (existing behavior)
    let query = serviceSupabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (orderId) query = query.eq('id', orderId)
    else query = query.eq('code', orderCode)

    const { data, error } = await query.select('id')

    if (error) {
      console.error('Failed to cancel order:', error)
      return NextResponse.json({ error: 'Không thể hủy đơn hàng' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Đơn hàng không tìm thấy hoặc đã xử lý' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error in /api/orders/cancel:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
