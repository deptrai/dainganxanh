import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/getEffectiveUser'

export async function GET(req: NextRequest) {
  try {
    const effectiveUser = await getEffectiveUser()
    if (!effectiveUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get order code from query
    const orderCode = req.nextUrl.searchParams.get('orderCode')
    if (!orderCode) {
      return NextResponse.json({ error: 'orderCode is required' }, { status: 400 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Get order
    const { data: order } = await serviceSupabase
      .from('orders')
      .select('*')
      .eq('code', orderCode)
      .eq('user_id', effectiveUser.userId)
      .single()

    // If order already has identity data, return it
    if (order?.id_number) {
      return NextResponse.json({
        hasIdentity: true,
        order: {
          full_name: order.user_name,
          dob: order.dob,
          nationality: order.nationality,
          id_number: order.id_number,
          id_issue_date: order.id_issue_date,
          id_issue_place: order.id_issue_place,
          address: order.address,
          phone: order.phone,
        }
      })
    }

    // Try to auto-fill from user profile (if columns exist)
    let userProfile: { full_name?: string; phone?: string; id_number?: string; date_of_birth?: string } | null = null
    const { data: profileData, error: profileError } = await serviceSupabase
      .from('users')
      .select('full_name, phone, id_number, date_of_birth')
      .eq('id', effectiveUser.userId)
      .single()

    if (!profileError) {
      userProfile = profileData
    } else {
      // Columns may not exist yet — fallback to basic fields
      const { data: basicProfile } = await serviceSupabase
        .from('users')
        .select('full_name, phone')
        .eq('id', effectiveUser.userId)
        .single()
      userProfile = basicProfile
    }

    if (userProfile?.id_number) {
      // Auto-save user profile data to this order
      await serviceSupabase
        .from('orders')
        .update({
          user_name: userProfile.full_name,
          id_number: userProfile.id_number,
          phone: userProfile.phone,
          dob: userProfile.date_of_birth,
        })
        .eq('id', order?.id)

      return NextResponse.json({
        hasIdentity: true,
        autoFilled: true,
        message: 'Thông tin được điền tự động từ lần mua trước',
        order: {
          full_name: userProfile.full_name || '',
          dob: userProfile.date_of_birth || '',
          nationality: 'Việt Nam',
          id_number: userProfile.id_number || '',
          id_issue_date: '',
          id_issue_place: '',
          address: '',
          phone: userProfile.phone || '',
        }
      })
    }

    // Fallback: check OTHER orders of the same user for identity data
    const { data: otherOrder } = await serviceSupabase
      .from('orders')
      .select('user_name, dob, nationality, id_number, id_issue_date, id_issue_place, address, phone')
      .eq('user_id', effectiveUser.userId)
      .not('id_number', 'is', null)
      .neq('code', orderCode)
      .limit(1)
      .single()

    if (otherOrder?.id_number) {
      // Auto-save to current order
      if (order?.id) {
        await serviceSupabase
          .from('orders')
          .update({
            user_name: otherOrder.user_name,
            id_number: otherOrder.id_number,
            phone: otherOrder.phone,
            dob: otherOrder.dob,
            nationality: otherOrder.nationality,
            id_issue_date: otherOrder.id_issue_date,
            id_issue_place: otherOrder.id_issue_place,
            address: otherOrder.address,
          })
          .eq('id', order.id)
      }

      return NextResponse.json({
        hasIdentity: true,
        autoFilled: true,
        message: 'Thông tin được điền tự động từ đơn hàng trước',
        order: {
          full_name: otherOrder.user_name || '',
          dob: otherOrder.dob || '',
          nationality: otherOrder.nationality || 'Việt Nam',
          id_number: otherOrder.id_number || '',
          id_issue_date: otherOrder.id_issue_date || '',
          id_issue_place: otherOrder.id_issue_place || '',
          address: otherOrder.address || '',
          phone: otherOrder.phone || '',
        }
      })
    }

    // No saved identity data
    return NextResponse.json({
      hasIdentity: false,
      message: 'Vui lòng nhập thông tin CCCD',
    })
  } catch (err) {
    console.error('Error in auto-fill-identity:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
