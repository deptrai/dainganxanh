import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/getEffectiveUser'

/**
 * Get all orders for the current user (profile page)
 */
export async function GET() {
  try {
    const effectiveUser = await getEffectiveUser()
    if (!effectiveUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceRoleClient()

    const { data: orders, error } = await serviceSupabase
      .from('orders')
      .select('id, code, order_code, quantity, total_amount, payment_method, status, created_at, verified_at, contract_url, user_name, user_email')
      .eq('user_id', effectiveUser.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({ orders: orders || [] })
  } catch (err) {
    console.error('Error in profile/orders:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
