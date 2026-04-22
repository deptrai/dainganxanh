import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const identitySchema = z.object({
  orderCode: z.string().min(1),
  full_name: z.string().min(1, 'Vui lòng nhập họ tên'),
  dob: z.string().min(1, 'Vui lòng nhập ngày sinh'),
  nationality: z.string().default('Việt Nam'),
  id_number: z.string().regex(/^\d{12}$/, 'Số CCCD phải có 12 chữ số'),
  id_issue_date: z.string().min(1, 'Vui lòng nhập ngày cấp'),
  id_issue_place: z.string().min(1, 'Vui lòng nhập nơi cấp'),
  address: z.string().min(1, 'Vui lòng nhập địa chỉ'),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ'),
})

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 30 identity submissions per minute per IP
    const rl = rateLimit(req, { limit: 30, windowMs: 60_000, keyPrefix: 'identity' })
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      )
    }

    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = identitySchema.safeParse(body)
    if (!result.success) {
      const firstIssue = result.error.issues[0]
      return NextResponse.json({ error: firstIssue?.message || 'Thông tin không hợp lệ' }, { status: 400 })
    }

    const { orderCode, full_name, ...identityFields } = result.data
    const serviceSupabase = createServiceRoleClient()

    // Verify order belongs to this user
    const { data: order, error: fetchError } = await serviceSupabase
      .from('orders')
      .select('id, code, user_id, status')
      .eq('code', orderCode)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 })
    }

    // Update identity fields + user_name on the order
    const { error: updateError } = await serviceSupabase
      .from('orders')
      .update({
        user_name: full_name,
        dob: identityFields.dob,
        nationality: identityFields.nationality,
        id_number: identityFields.id_number,
        id_issue_date: identityFields.id_issue_date,
        id_issue_place: identityFields.id_issue_place,
        address: identityFields.address,
        phone: identityFields.phone,
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Failed to update identity fields:', updateError)
      return NextResponse.json({ error: 'Không thể lưu thông tin. Vui lòng thử lại.' }, { status: 500 })
    }

    // Trigger contract generation in background (non-blocking) for completed orders
    if (order.status === 'completed') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3001}`
      fetch(`${baseUrl}/api/contracts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
        body: JSON.stringify({ orderId: order.id }),
      }).catch((err) => console.error('[Contract] generation trigger failed:', err))
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error in POST /api/orders/identity:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
