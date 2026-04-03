import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { notifyManualPaymentClaim } from '@/lib/utils/telegram'
import { getEffectiveUser } from '@/lib/getEffectiveUser'

/**
 * User claims they already transferred money but payment wasn't auto-detected.
 * Order status changes to 'manual_payment_claimed'.
 * If user already has identity info saved, auto-fill it to the order.
 * Sends Telegram notification to admin for approval.
 */
export async function POST(req: NextRequest) {
  try {
    const effectiveUser = await getEffectiveUser()
    if (!effectiveUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderCode } = await req.json() as { orderCode?: string }
    if (!orderCode) {
      return NextResponse.json({ error: 'orderCode is required' }, { status: 400 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Get order - must be pending
    const { data: order, error: fetchError } = await serviceSupabase
      .from('orders')
      .select('id, code, user_id, status, quantity, total_amount')
      .eq('code', orderCode)
      .eq('user_id', effectiveUser.userId)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 })
    }

    if (!['pending', 'paid'].includes(order.status)) {
      return NextResponse.json(
        { error: `Đơn hàng không ở trạng thái hợp lệ (${order.status})` },
        { status: 400 }
      )
    }

    // Check if user already has identity info saved (single query)
    let identitySource: { full_name?: string; phone?: string; id_number?: string; dob?: string } | null = null
    const { data: userProfile } = await serviceSupabase
      .from('users')
      .select('full_name, email, phone, id_number, date_of_birth')
      .eq('id', effectiveUser.userId)
      .single()

    if (userProfile?.id_number) {
      identitySource = {
        full_name: userProfile.full_name,
        phone: userProfile.phone,
        id_number: userProfile.id_number,
        dob: userProfile.date_of_birth,
      }
    }

    // 3. Fallback: check other orders of the same user for identity data
    if (!identitySource) {
      const { data: otherOrder } = await serviceSupabase
        .from('orders')
        .select('user_name, phone, id_number, dob')
        .eq('user_id', effectiveUser.userId)
        .not('id_number', 'is', null)
        .limit(1)
        .single()

      if (otherOrder?.id_number) {
        identitySource = {
          full_name: otherOrder.user_name,
          phone: otherOrder.phone,
          id_number: otherOrder.id_number,
          dob: otherOrder.dob,
        }
      }
    }

    const hasIdentity = !!identitySource

    // Update order status + auto-fill identity if available
    const updateData: Record<string, unknown> = {
      status: 'manual_payment_claimed',
      claimed_at: new Date().toISOString(),
    }

    if (hasIdentity && identitySource) {
      updateData.user_name = identitySource.full_name
      updateData.phone = identitySource.phone
      updateData.id_number = identitySource.id_number
      if (identitySource.dob) {
        updateData.dob = identitySource.dob
      }
    }

    const { error: updateError } = await serviceSupabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id)

    if (updateError) {
      console.error('Failed to claim manual payment:', updateError)
      return NextResponse.json({ error: 'Không thể xác nhận thanh toán' }, { status: 500 })
    }

    // Send Telegram notification to admin
    notifyManualPaymentClaim({
      orderCode: order.code,
      userName: userProfile?.full_name || effectiveUser.name || '',
      userEmail: userProfile?.email || effectiveUser.email || '',
      quantity: order.quantity,
      totalAmount: Number(order.total_amount),
    }).catch((err) => console.error('[Telegram] notification failed:', err))

    return NextResponse.json({
      success: true,
      hasIdentity,
      message: hasIdentity
        ? 'Đã ghi nhận thanh toán. Đang chờ admin xác nhận.'
        : 'Đã ghi nhận thanh toán. Vui lòng điền thông tin hợp đồng.',
    })
  } catch (err) {
    console.error('Error in claim-manual-payment:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
