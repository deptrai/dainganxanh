import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Cron endpoint to expire pending bookings and store orders that have not
 * been paid within the 15-minute window. Releases reserved product stock.
 *
 * Trigger: Supabase cron / pg_cron or external scheduler every minute.
 * Security: Requires CRON_SECRET bearer token.
 */

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  try {
    // 1. Expire pending room bookings
    await supabase.rpc('expire_pending_bookings')

    // 2. Expire pending store orders
    await supabase.rpc('expire_pending_store_orders')

    // 3. Release reserved stock for cancelled store orders that still hold reservations.
    // We match store_orders cancelled because of payment timeout with their items
    // and call release_product_stock for each item if the product still shows reserved.
    const { data: cancelledStoreItems, error: itemsError } = await supabase
      .from('store_order_items')
      .select('id, product_id, quantity, store_orders!inner(id, status, cancellation_reason)')
      .eq('store_orders.status', 'cancelled')
      .eq('store_orders.cancellation_reason', 'Payment timeout (15 mins)')
      .returns<{
        id: string
        product_id: string
        quantity: number
        store_orders: { id: string; status: string; cancellation_reason: string }
      }[]>()

    if (itemsError) {
      console.error('[expire-pending] Failed to fetch cancelled store items:', itemsError)
    } else if (cancelledStoreItems && cancelledStoreItems.length > 0) {
      for (const item of cancelledStoreItems) {
        await supabase.rpc('release_product_stock', {
          p_product_id: item.product_id,
          p_qty: item.quantity,
        })
      }
    }

    // 4. Revalidate public pages so availability / stock stays fresh
    revalidatePath('/store')
    revalidatePath('/eco-tourism')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[expire-pending] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
