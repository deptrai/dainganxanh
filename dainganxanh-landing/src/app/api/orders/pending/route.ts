import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface PendingOrderRequest {
  code: string
  user_email?: string
  user_name?: string
  quantity: number
  total_amount: number
  payment_method: 'banking' | 'usdt'
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

    // Upsert with onConflict: 'code' for idempotency
    // If the same orderCode already exists (e.g. user F5'd the page), return existing record
    const { data, error } = await supabase
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
      .select('id, code')
      .single()

    if (error) {
      console.error('Failed to upsert pending order:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orderId: data.id, orderCode: data.code })
  } catch (err) {
    console.error('Unexpected error in /api/orders/pending:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
