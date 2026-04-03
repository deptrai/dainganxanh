import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/getEffectiveUser'

const identitySchema = z.object({
  full_name: z.string().min(1, 'Vui lòng nhập họ tên'),
  dob: z.string().min(1, 'Vui lòng nhập ngày sinh'),
  nationality: z.string().default('Việt Nam'),
  id_number: z.string().regex(/^\d{12}$/, 'Số CCCD phải có 12 chữ số'),
  id_issue_date: z.string().min(1, 'Vui lòng nhập ngày cấp'),
  id_issue_place: z.string().min(1, 'Vui lòng nhập nơi cấp'),
  address: z.string().min(1, 'Vui lòng nhập địa chỉ'),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ'),
})

/**
 * GET: Fetch user's saved identity from their most recent order
 */
export async function GET() {
  try {
    const effectiveUser = await getEffectiveUser()
    if (!effectiveUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Find the most recent order with identity data
    const { data: order } = await serviceSupabase
      .from('orders')
      .select('user_name, dob, nationality, id_number, id_issue_date, id_issue_place, address, phone')
      .eq('user_id', effectiveUser.userId)
      .not('id_number', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!order?.id_number) {
      return NextResponse.json({ hasIdentity: false })
    }

    return NextResponse.json({
      hasIdentity: true,
      identity: {
        full_name: order.user_name || '',
        dob: order.dob || '',
        nationality: order.nationality || 'Việt Nam',
        id_number: order.id_number || '',
        id_issue_date: order.id_issue_date || '',
        id_issue_place: order.id_issue_place || '',
        address: order.address || '',
        phone: order.phone || '',
      },
    })
  } catch (err) {
    console.error('Error in GET /api/profile/identity:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT: Update identity on all user's orders + users profile
 */
export async function PUT(req: NextRequest) {
  try {
    const effectiveUser = await getEffectiveUser()
    if (!effectiveUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = identitySchema.safeParse(body)
    if (!result.success) {
      const firstIssue = result.error.issues[0]
      return NextResponse.json({ error: firstIssue?.message || 'Thông tin không hợp lệ' }, { status: 400 })
    }

    const { full_name, ...identityFields } = result.data
    const serviceSupabase = createServiceRoleClient()

    // 1. Only update orders that don't have a signed contract yet
    const { error: orderError } = await serviceSupabase
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
      .eq('user_id', effectiveUser.userId)
      .not('status', 'eq', 'cancelled')
      .is('contract_url', null)

    if (orderError) {
      console.error('Failed to update orders identity:', orderError)
    }

    // 2. Update users profile (best-effort)
    const dobDate = new Date(identityFields.dob)
    const fullProfileData = {
      full_name,
      phone: identityFields.phone,
      id_number: identityFields.id_number,
      date_of_birth: dobDate.toISOString().split('T')[0],
    }
    const { error: userError } = await serviceSupabase
      .from('users')
      .update(fullProfileData)
      .eq('id', effectiveUser.userId)

    if (userError) {
      console.warn('Warning: Failed to update user profile:', userError.message)
      // Fallback to basic fields
      await serviceSupabase
        .from('users')
        .update({ full_name, phone: identityFields.phone })
        .eq('id', effectiveUser.userId)
    }

    return NextResponse.json({ success: true, message: 'Đã cập nhật thông tin hợp đồng' })
  } catch (err) {
    console.error('Error in PUT /api/profile/identity:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
