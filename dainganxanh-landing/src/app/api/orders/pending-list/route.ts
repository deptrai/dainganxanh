import { NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Get all pending/manual_payment_claimed orders for the current user
 */
export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceRoleClient()

    const { data: orders, error } = await serviceSupabase
      .from('orders')
      .select('code, quantity, total_amount, status, created_at')
      .eq('user_id', user.id)
      .in('status', ['pending', 'manual_payment_claimed'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({ orders: orders || [] })
  } catch (err) {
    console.error('Error in pending-list:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
