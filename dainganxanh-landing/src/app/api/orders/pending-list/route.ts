import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/getEffectiveUser'

/**
 * Get all pending/manual_payment_claimed orders for the current user
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
      .select('code, quantity, total_amount, status, created_at')
      .eq('user_id', effectiveUser.userId)
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
