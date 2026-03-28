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

    // Use service role to bypass RLS (user authenticated above)
    const serviceSupabase = createServiceRoleClient()
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
