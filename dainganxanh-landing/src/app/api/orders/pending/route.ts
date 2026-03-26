import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface PendingOrderRequest {
  code: string
  user_email?: string
  user_name?: string
  quantity: number
  total_amount: number
  payment_method: 'banking'
  referred_by?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Require authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: PendingOrderRequest = await req.json()

    // Basic validation
    if (!body.code || !body.quantity || !body.total_amount || !body.payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (body.quantity <= 0 || body.total_amount <= 0) {
      return NextResponse.json({ error: 'Invalid quantity or amount' }, { status: 400 })
    }
    if (!/^DH[A-Z0-9]{6}$/i.test(body.code)) {
      return NextResponse.json({ error: 'Invalid order code format' }, { status: 400 })
    }

    // Upsert with onConflict: 'code' for idempotency
    // If the same orderCode already exists (e.g. user F5'd the page), return existing record
    const { error: upsertError } = await supabase
      .from('orders')
      .upsert(
        {
          code: body.code,
          user_id: user.id,
          user_email: body.user_email ?? user.email,
          user_name: body.user_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0],
          quantity: body.quantity,
          total_amount: body.total_amount,
          payment_method: body.payment_method,
          referred_by: body.referred_by ?? null,
          status: 'pending',
        },
        { onConflict: 'code', ignoreDuplicates: true }
      )

    if (upsertError) {
      console.error('Failed to upsert pending order:', upsertError)
      return NextResponse.json({ error: 'Không thể tạo đơn hàng' }, { status: 500 })
    }

    // Fetch the order (works for both new inserts and existing records)
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('id, code')
      .eq('code', body.code)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !data) {
      console.error('Failed to fetch order after upsert:', fetchError)
      return NextResponse.json({ error: 'Không thể lấy thông tin đơn hàng' }, { status: 500 })
    }

    return NextResponse.json({ orderId: data.id, orderCode: data.code })
  } catch (err) {
    console.error('Unexpected error in /api/orders/pending:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
