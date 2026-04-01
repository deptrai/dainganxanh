import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

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

    // Parse DOB to Date format for users table
    const dobDate = new Date(identityFields.dob)

    // 1. Update identity fields on the order
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
      console.error('Failed to update identity fields on order:', updateError)
      return NextResponse.json({ error: 'Không thể lưu thông tin. Vui lòng thử lại.' }, { status: 500 })
    }

    // 2. ALSO save identity to users profile for future reuse
    const { error: userUpdateError } = await serviceSupabase
      .from('users')
      .update({
        full_name: full_name,
        id_number: identityFields.id_number,
        date_of_birth: dobDate.toISOString().split('T')[0], // YYYY-MM-DD format
        phone: identityFields.phone,
      })
      .eq('id', user.id)

    if (userUpdateError) {
      console.error('Warning: Failed to update user profile:', userUpdateError)
      // Continue anyway - order was saved successfully
    }

    // 3. Trigger contract generation in background (non-blocking) for completed orders
    if (order.status === 'completed') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3001}`
      fetch(`${baseUrl}/api/contracts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
        body: JSON.stringify({ orderId: order.id }),
      }).catch((err) => console.error('[Contract] generation trigger failed:', err))
    }

    return NextResponse.json({ success: true, message: 'Đã lưu thông tin hợp đồng. Các lần mua tiếp theo sẽ tự động điền.' })
  } catch (err) {
    console.error('Unexpected error in POST /api/orders/identity:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
