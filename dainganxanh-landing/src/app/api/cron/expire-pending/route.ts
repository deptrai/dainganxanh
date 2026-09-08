import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { captureError, trackLatency } from '@/lib/monitoring'

/**
 * Cron endpoint to expire pending bookings and store orders that have not
 * been paid within the 15-minute window.
 *
 * Uses atomic PostgreSQL stored procedures:
 * - `expire_pending_bookings()`: Frees room bookings and unlocks GiST exclusion constraint.
 * - `expire_pending_store_orders()`: Cancels banking store orders and returns reserved stock in a single transaction.
 *
 * Security: Requires Bearer ${CRON_SECRET} token in Authorization header.
 * Methods: Supports both GET and POST.
 */

function isAuthorized(req: Request | NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return authHeader === `Bearer ${cronSecret}`
}

async function handleExpirePending(req: Request | NextRequest) {
  const start = Date.now()

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  let expiredBookings = 0
  let expiredOrders = 0

  // 1. Expire pending room bookings (isolated try/catch)
  try {
    const { data, error } = await supabase.rpc('expire_pending_bookings')
    if (error) {
      console.error('[expire-pending] expire_pending_bookings failed:', error)
      captureError(error, { route: '/api/cron/expire-pending', action: 'expire_bookings' })
    } else {
      expiredBookings = Number(data ?? 0)
    }
  } catch (err) {
    console.error('[expire-pending] Unexpected error in expire_bookings:', err)
    captureError(err, { route: '/api/cron/expire-pending', action: 'expire_bookings_unexpected' })
  }

  // 2. Expire pending store orders & atomically release stock (isolated try/catch)
  try {
    const { data, error } = await supabase.rpc('expire_pending_store_orders')
    if (error) {
      console.error('[expire-pending] expire_pending_store_orders failed:', error)
      captureError(error, { route: '/api/cron/expire-pending', action: 'expire_store_orders' })
    } else {
      expiredOrders = Number(data ?? 0)
    }
  } catch (err) {
    console.error('[expire-pending] Unexpected error in expire_store_orders:', err)
    captureError(err, { route: '/api/cron/expire-pending', action: 'expire_store_orders_unexpected' })
  }

  // 3. Revalidate public pages if any inventory changed
  if (expiredOrders > 0) {
    try {
      revalidatePath('/store')
    } catch {
      /* best effort */
    }
  }

  if (expiredBookings > 0) {
    try {
      revalidatePath('/eco-tourism')
    } catch {
      /* best effort */
    }
  }

  const durationMs = Date.now() - start
  trackLatency('/api/cron/expire-pending', durationMs, { expiredBookings, expiredOrders })

  return NextResponse.json({
    ok: true,
    expiredBookings,
    expiredOrders,
    durationMs,
  })
}

export async function GET(req: Request) {
  return handleExpirePending(req)
}

export async function POST(req: NextRequest) {
  return handleExpirePending(req)
}
