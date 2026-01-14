'use server'

import { createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

// Normalize Vietnamese text for comparison
function normalizeVietnamese(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim()
}

// Calculate available balance
export async function getAvailableBalance(userId: string) {
    const supabase = await createServerClient()

    // Total commission earned
    const { data: clicks } = await supabase
        .from('referral_clicks')
        .select('order_id')
        .eq('referrer_id', userId)
        .eq('converted', true)

    const orderIds = clicks?.map(c => c.order_id) || []

    let totalCommission = 0
    if (orderIds.length > 0) {
        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .in('id', orderIds)

        totalCommission = orders?.reduce((sum, o) => sum + (o.total_amount * 0.05), 0) || 0
    }

    // Total withdrawn (approved only)
    const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'approved')

    const totalWithdrawn = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0

    return totalCommission - totalWithdrawn
}

// Submit withdrawal request
export async function requestWithdrawal(data: {
    amount: number
    bankName: string
    bankAccountNumber: string
    bankAccountName: string
}) {
    const supabase = await createServerClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' }
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return { success: false, error: 'Profile not found' }
    }

    // Validate bank account name matches user full name
    const normalizedInput = normalizeVietnamese(data.bankAccountName)
    const normalizedUserName = normalizeVietnamese(profile.full_name)

    if (normalizedInput !== normalizedUserName) {
        return {
            success: false,
            error: 'Tên chủ tài khoản không khớp với tên của bạn trong hệ thống'
        }
    }

    // Check available balance
    const balance = await getAvailableBalance(user.id)
    if (balance < data.amount) {
        return { success: false, error: 'Số dư không đủ' }
    }

    if (data.amount < 200000) {
        return { success: false, error: 'Số tiền rút tối thiểu là 200,000 VNĐ' }
    }

    // Create withdrawal record
    const { error: insertError } = await supabase
        .from('withdrawals')
        .insert({
            user_id: user.id,
            amount: data.amount,
            bank_name: data.bankName,
            bank_account_number: data.bankAccountNumber,
            bank_account_name: data.bankAccountName,
            status: 'pending'
        })

    if (insertError) {
        console.error('Error creating withdrawal:', insertError)
        return { success: false, error: 'Không thể tạo yêu cầu rút tiền' }
    }

    // Send email to admins
    const { data: admins } = await supabase
        .from('users')
        .select('id')
        .in('role', ['admin', 'super_admin'])

    const adminIds = admins?.map(a => a.id) || []

    if (adminIds.length > 0) {
        const { data: adminUsers } = await supabase.auth.admin.listUsers()
        const adminEmails = adminUsers.users
            .filter(u => adminIds.includes(u.id))
            .map(u => u.email)
            .filter(Boolean)

        for (const email of adminEmails) {
            await sendEmail({
                to: email!,
                subject: `🔔 Yêu cầu rút tiền mới từ ${profile.full_name}`,
                html: `
          <h2>Yêu cầu rút tiền mới</h2>
          <p><strong>User:</strong> ${profile.full_name} (${profile.email})</p>
          <p><strong>Số tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.amount)}</p>
          <p><strong>Ngân hàng:</strong> ${data.bankName}</p>
          <p><strong>STK:</strong> ${data.bankAccountNumber}</p>
          <p><strong>Tên TK:</strong> ${data.bankAccountName}</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/crm/admin/withdrawals">Xem chi tiết</a></p>
        `
            })
        }
    }

    return { success: true }
}

// Admin: Approve withdrawal
export async function approveWithdrawal(withdrawalId: string, proofImageUrl: string) {
    const supabase = await createServerClient()

    // Auth check - must be admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return { success: false, error: 'Unauthorized' }
    }

    // Update withdrawal
    const { data: withdrawal, error: updateError } = await supabase
        .from('withdrawals')
        .update({
            status: 'approved',
            proof_image_url: proofImageUrl,
            approved_by: user.id,
            approved_at: new Date().toISOString()
        })
        .eq('id', withdrawalId)
        .select('user_id, amount, bank_name')
        .single()

    if (updateError) {
        console.error('Error approving withdrawal:', updateError)
        return { success: false, error: 'Không thể duyệt yêu cầu' }
    }

    // Send email to user
    const { data: { user: withdrawalUser } } = await supabase.auth.admin.getUserById(withdrawal.user_id)

    if (withdrawalUser?.email) {
        await sendEmail({
            to: withdrawalUser.email,
            subject: '✅ Yêu cầu rút tiền đã được duyệt',
            html: `
        <h2>Yêu cầu rút tiền đã được duyệt</h2>
        <p><strong>Số tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(withdrawal.amount))}</p>
        <p><strong>Ngân hàng:</strong> ${withdrawal.bank_name}</p>
        <p>Tiền đã được chuyển vào tài khoản của bạn.</p>
        <p><a href="${proofImageUrl}">Xem ảnh chuyển khoản</a></p>
      `
        })
    }

    return { success: true }
}

// Admin: Reject withdrawal
export async function rejectWithdrawal(withdrawalId: string, reason: string) {
    const supabase = await createServerClient()

    // Auth check - must be admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return { success: false, error: 'Unauthorized' }
    }

    // Update withdrawal
    const { data: withdrawal, error: updateError } = await supabase
        .from('withdrawals')
        .update({
            status: 'rejected',
            rejection_reason: reason,
            approved_by: user.id,
            approved_at: new Date().toISOString()
        })
        .eq('id', withdrawalId)
        .select('user_id, amount')
        .single()

    if (updateError) {
        console.error('Error rejecting withdrawal:', updateError)
        return { success: false, error: 'Không thể từ chối yêu cầu' }
    }

    // Send email to user
    const { data: { user: withdrawalUser } } = await supabase.auth.admin.getUserById(withdrawal.user_id)

    if (withdrawalUser?.email) {
        await sendEmail({
            to: withdrawalUser.email,
            subject: '❌ Yêu cầu rút tiền đã bị từ chối',
            html: `
        <h2>Yêu cầu rút tiền đã bị từ chối</h2>
        <p><strong>Số tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(withdrawal.amount))}</p>
        <p><strong>Lý do:</strong> ${reason}</p>
        <p>Vui lòng liên hệ admin để biết thêm chi tiết.</p>
      `
        })
    }

    return { success: true }
}
