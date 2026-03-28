import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code || !/^DH[A-Z0-9]{6}$/i.test(code)) {
    return NextResponse.json({ error: 'Invalid order code' }, { status: 400 })
  }

  // Auth check with user session
  const supabase = await createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role to bypass RLS (user authenticated above)
  const serviceSupabase = createServiceRoleClient()
  const { data: order, error } = await serviceSupabase
    .from('orders')
    .select('id, code, status')
    .eq('code', code)
    .eq('user_id', user.id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({ status: order.status })
}
