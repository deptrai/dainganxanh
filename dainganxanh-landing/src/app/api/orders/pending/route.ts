import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { VALID_UNIT_PRICES } from '@/lib/constants'
import { notifyNewOrder } from '@/lib/utils/telegram'
import { getEffectiveUser } from '@/lib/getEffectiveUser'
import { rateLimit } from '@/lib/rate-limit'

const identityFieldsSchema = z.object({
  dob: z.string().min(1).optional().nullable(),
  nationality: z.string().optional().nullable(),
  id_number: z.string().regex(/^\d{12}$/, 'Số CCCD phải có 12 chữ số').optional().nullable(),
  id_issue_date: z.string().min(1).optional().nullable(),
  id_issue_place: z.string().min(1).optional().nullable(),
  address: z.string().min(1).optional().nullable(),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ').optional().nullable(),
})

interface PendingOrderRequest {
  code: string
  user_email?: string
  user_name?: string
  quantity: number
  total_amount: number
  unit_price?: number
  has_insurance?: boolean
  payment_method: 'banking'
  referred_by?: string | null
  // Customer identity fields (optional, for contract generation)
  dob?: string | null
  nationality?: string | null
  id_number?: string | null
  id_issue_date?: string | null
  id_issue_place?: string | null
  address?: string | null
  phone?: string | null
}

export async function GET() {
  try {
    const effectiveUser = await getEffectiveUser()
    if (!effectiveUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceRoleClient()
    const { data } = await serviceSupabase
      .from('orders')
      .select('id, code, quantity, total_amount, created_at, dob, nationality, id_number, id_issue_date, id_issue_place, address, phone')
      .eq('user_id', effectiveUser.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ order: data ?? null })
  } catch (err) {
    console.error('Unexpected error in GET /api/orders/pending:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 30, windowMs: 60_000, keyPrefix: 'pending-order' })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSec) },
    })
  }

  try {
    const effectiveUser = await getEffectiveUser()
    if (!effectiveUser) {
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
    // Validate total_amount matches expected server-side calculation
    const unitPrice = body.unit_price ?? 410000
    if (!VALID_UNIT_PRICES.includes(unitPrice)) {
      return NextResponse.json({ error: 'Invalid unit_price' }, { status: 400 })
    }
    const expectedAmount = body.quantity * unitPrice
    if (body.total_amount !== expectedAmount) {
      return NextResponse.json({ error: 'Invalid total_amount' }, { status: 400 })
    }
    const hasInsurance = body.has_insurance ?? (unitPrice === 410000)

    const serviceSupabase = createServiceRoleClient()

    // Safety net: if client didn't resolve referred_by, look up from users.referred_by_user_id
    let referredBy = body.referred_by ?? null
    if (!referredBy) {
      const { data: profile } = await serviceSupabase
        .from('users')
        .select('referred_by_user_id')
        .eq('id', effectiveUser.userId)
        .single()
      referredBy = profile?.referred_by_user_id ?? null
    }

    // Step 1: Upsert base order fields (ignoreDuplicates: true preserves existing order intact)
    const { error: upsertError } = await serviceSupabase
      .from('orders')
      .upsert(
        {
          code: body.code,
          user_id: effectiveUser.userId,
          user_email: body.user_email ?? effectiveUser.email,
          user_name: body.user_name ?? effectiveUser.name,
          quantity: body.quantity,
          total_amount: body.total_amount,
          unit_price: unitPrice,
          has_insurance: hasInsurance,
          payment_method: body.payment_method,
          referred_by: referredBy,
          status: 'pending',
        },
        { onConflict: 'code', ignoreDuplicates: true }
      )

    if (upsertError) {
      console.error('Failed to upsert pending order:', upsertError)
      return NextResponse.json({ error: 'Không thể tạo đơn hàng' }, { status: 500 })
    }

    // Step 2: If identity fields provided, validate and update them separately (only while order is still pending)
    const hasIdentityFields = body.id_number || body.dob || body.address
    if (hasIdentityFields) {
      const identityResult = identityFieldsSchema.safeParse({
        dob: body.dob, nationality: body.nationality, id_number: body.id_number,
        id_issue_date: body.id_issue_date, id_issue_place: body.id_issue_place,
        address: body.address, phone: body.phone,
      })
      if (!identityResult.success) {
        const firstIssue = identityResult.error.issues[0]
        return NextResponse.json(
          { error: firstIssue?.message || 'Thông tin cá nhân không hợp lệ' },
          { status: 400 }
        )
      }
      const { error: updateError } = await serviceSupabase
        .from('orders')
        .update({
          dob: body.dob ?? null,
          nationality: body.nationality ?? 'Việt Nam',
          id_number: body.id_number ?? null,
          id_issue_date: body.id_issue_date ?? null,
          id_issue_place: body.id_issue_place ?? null,
          address: body.address ?? null,
          phone: body.phone ?? null,
        })
        .eq('code', body.code)
        .eq('user_id', effectiveUser.userId)
        .eq('status', 'pending')

      if (updateError) {
        console.error('Failed to update identity fields:', updateError)
        return NextResponse.json(
          { error: 'Không thể lưu thông tin cá nhân. Vui lòng thử lại.' },
          { status: 500 }
        )
      }
    }

    // Fetch the order (works for both new inserts and existing records)
    const { data, error: fetchError } = await serviceSupabase
      .from('orders')
      .select('id, code')
      .eq('code', body.code)
      .eq('user_id', effectiveUser.userId)
      .single()

    if (fetchError || !data) {
      console.error('Failed to fetch order after upsert:', fetchError)
      return NextResponse.json({ error: 'Không thể lấy thông tin đơn hàng' }, { status: 500 })
    }

    // Gửi thông báo Telegram khi có đơn hàng mới (non-blocking)
    notifyNewOrder({
      orderCode: data.code,
      userName: body.user_name ?? effectiveUser.name ?? 'Khách hàng',
      userEmail: body.user_email ?? effectiveUser.email ?? '',
      quantity: body.quantity,
      totalAmount: body.total_amount,
    }).catch((err) => console.error('[Telegram] notifyNewOrder failed:', err))

    return NextResponse.json({ orderId: data.id, orderCode: data.code })
  } catch (err) {
    console.error('Unexpected error in /api/orders/pending:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const effectiveUser = await getEffectiveUser()
    if (!effectiveUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderId = req.nextUrl.searchParams.get('orderId')
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const { quantity, total_amount, unit_price } = await req.json()
    if (!quantity || !total_amount || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    const patchUnitPrice = unit_price ?? 410000
    if (!VALID_UNIT_PRICES.includes(patchUnitPrice)) {
      return NextResponse.json({ error: 'Invalid unit_price' }, { status: 400 })
    }
    if (total_amount !== quantity * patchUnitPrice) {
      return NextResponse.json({ error: 'Invalid total_amount' }, { status: 400 })
    }

    const serviceSupabase = createServiceRoleClient()
    const { error: updateError } = await serviceSupabase
      .from('orders')
      .update({ quantity, total_amount })
      .eq('id', orderId)
      .eq('user_id', effectiveUser.userId)
      .eq('status', 'pending')

    if (updateError) {
      console.error('Failed to update pending order quantity:', updateError)
      return NextResponse.json({ error: 'Không thể cập nhật đơn hàng' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error in PATCH /api/orders/pending:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
