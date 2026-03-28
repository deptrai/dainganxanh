'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { notifyWithdrawalRequest } from '@/lib/utils/telegram'


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

    // Total commission earned — query directly from orders.referred_by
    // to stay consistent with getReferralStats and avoid missing commissions
    // when referral_clicks were not created (e.g. direct code entry) or
    // when the click was older than the 7-day conversion window.
    const { data: orders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('referred_by', userId)
        .eq('status', 'completed')

    const totalCommission = orders?.reduce((sum, o) => sum + Math.round(Number(o.total_amount) * 0.10), 0) || 0

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
    // Create withdrawal record
    const { data: newWithdrawal, error: insertError } = await supabase
        .from('withdrawals')
        .insert({
            user_id: user.id,
            amount: data.amount,
            bank_name: data.bankName,
            bank_account_number: data.bankAccountNumber,
            bank_account_name: data.bankAccountName,
            status: 'pending'
        })
        .select()
        .single()

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
        const supabaseAdmin = createServiceRoleClient()
        const { data: adminUsers } = await supabaseAdmin.auth.admin.listUsers()
        const adminEmails = adminUsers.users
            .filter(u => adminIds.includes(u.id))
            .map(u => u.email)
            .filter(Boolean)

        const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-withdrawal-email`
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        for (const email of adminEmails) {
            // Send email via Edge Function
            await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({
                    type: 'request_created',
                    to: email, // Send to admin email
                    userEmail: profile.email,
                    fullName: profile.full_name,
                    amount: data.amount,
                    bankName: data.bankName,
                    bankAccountNumber: data.bankAccountNumber,
                    bankAccountName: data.bankAccountName,
                    withdrawalId: newWithdrawal.id
                }),
            })
        }
    }

    // Gửi Telegram cho admin (non-blocking)
    notifyWithdrawalRequest({
        userName: profile.full_name,
        userEmail: profile.email,
        amount: data.amount,
        bankName: data.bankName,
        bankAccountNumber: data.bankAccountNumber,
    }).catch((err) => console.error('[Telegram] notifyWithdrawalRequest failed:', err))

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
        .select('user_id, amount, bank_name, bank_account_number, bank_account_name')
        .single()

    if (updateError) {
        console.error('Error approving withdrawal:', updateError)
        return { success: false, error: 'Không thể duyệt yêu cầu' }
    }

    // Send email to user
    const supabaseAdmin = createServiceRoleClient()
    const { data: { user: withdrawalUser } } = await supabaseAdmin.auth.admin.getUserById(withdrawal.user_id)

    if (withdrawalUser?.email) {
        const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-withdrawal-email`
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
                type: 'request_approved',
                to: withdrawalUser.email,
                fullName: withdrawalUser.user_metadata?.full_name || 'Người dùng', // Assuming full_name is in user_metadata
                amount: withdrawal.amount,
                bankName: withdrawal.bank_name,
                bankAccountNumber: withdrawal.bank_account_number,
                bankAccountName: withdrawal.bank_account_name,
                withdrawalId: withdrawalId,
                proofImageUrl: proofImageUrl
            }),
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
        .select('user_id, amount, bank_name, bank_account_number, bank_account_name')
        .single()

    if (updateError) {
        console.error('Error rejecting withdrawal:', updateError)
        return { success: false, error: 'Không thể từ chối yêu cầu' }
    }

    // Send email to user
    const supabaseAdmin = createServiceRoleClient()
    const { data: { user: withdrawalUser } } = await supabaseAdmin.auth.admin.getUserById(withdrawal.user_id)

    if (withdrawalUser?.email) {
        const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-withdrawal-email`
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
                type: 'request_rejected',
                to: withdrawalUser.email,
                fullName: withdrawalUser.user_metadata?.full_name || 'Người dùng',
                amount: withdrawal.amount,
                bankName: withdrawal.bank_name,
                bankAccountNumber: withdrawal.bank_account_number,
                bankAccountName: withdrawal.bank_account_name,
                withdrawalId: withdrawalId,
                rejectionReason: reason
            }),
        })
    }

    return { success: true }
}
