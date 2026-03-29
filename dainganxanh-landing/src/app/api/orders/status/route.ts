import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  // Auth check with user session
  const supabase = await createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceSupabase = createServiceRoleClient()
  const code = req.nextUrl.searchParams.get('code')

  // If no code: return most recent completed order (used by checkout on mount)
  if (!code) {
    const { data: order } = await serviceSupabase
      .from('orders')
      .select('id, code, status, quantity, user_name, id_number, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return NextResponse.json({ order: order ?? null })
  }

  if (!/^DH[A-Z0-9]{6}$/i.test(code)) {
    return NextResponse.json({ error: 'Invalid order code' }, { status: 400 })
  }

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
