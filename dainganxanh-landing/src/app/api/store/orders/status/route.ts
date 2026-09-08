import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/getEffectiveUser'

export async function GET(req: NextRequest) {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.json({ error: 'Missing order code' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data: order, error } = await supabase
    .from('store_orders')
    .select('id, code, status, total_amount, payment_method, tracking_number, expires_at')
    .eq('code', code)
    .eq('user_id', effectiveUser.userId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json(order)
}
