import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * User claims they already transferred money but payment wasn't auto-detected
 * Order status changes to 'manual_payment_claimed' and waits for admin approval
 * No contract generation yet - contract only created after admin approves
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderCode } = await req.json() as { orderCode?: string }
    if (!orderCode) {
      return NextResponse.json({ error: 'orderCode is required' }, { status: 400 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Get order - must be pending or paid
    const { data: order, error: fetchError } = await serviceSupabase
      .from('orders')
      .select('id, code, user_id, status')
      .eq('code', orderCode)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 })
    }

    // Only allow claiming on pending or paid orders
    if (!['pending', 'paid'].includes(order.status)) {
      return NextResponse.json(
        { error: `Đơn hàng không ở trạng thái hợp lệ (${order.status})` },
        { status: 400 }
      )
    }

    // Update order to manual_payment_claimed status
    const { error: updateError } = await serviceSupabase
      .from('orders')
      .update({
        status: 'manual_payment_claimed',
        claimed_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Failed to claim manual payment:', updateError)
      return NextResponse.json({ error: 'Không thể xác nhận thanh toán' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Đã ghi nhận thanh toán. Admin sẽ kiểm tra và duyệt trong 24 giờ.',
      order: {
        code: order.code,
        status: 'manual_payment_claimed',
      }
    })
  } catch (err) {
    console.error('Error in claim-manual-payment:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
