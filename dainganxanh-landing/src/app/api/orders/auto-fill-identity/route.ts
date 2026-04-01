import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
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
      .eq('user_id', user.id)
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

    // If no identity data, try to auto-fill from user profile
    const { data: userProfile } = await serviceSupabase
      .from('users')
      .select('full_name, phone, id_number, date_of_birth')
      .eq('id', user.id)
      .single()

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
