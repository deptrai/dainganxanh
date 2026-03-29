'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { notifyWithdrawalRequest } from '@/lib/utils/telegram'


// Normalize Vietnamese text for comparison
function normalizeVietnamese(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'D')
        .toUpperCase()
        .trim()
}

// Calculate available balance (auth-checked)
export async function getAvailableBalance(userId: string) {
    // AUTH CHECK: Verify caller is querying their own balance
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
        return 0
    }

    // Use service role to bypass RLS — orders with referred_by are OTHER users' orders
    const serviceSupabase = createServiceRoleClient()

    // Total commission earned — query directly from orders.referred_by
    const { data: orders } = await serviceSupabase
        .from('orders')
        .select('total_amount')
        .eq('referred_by', userId)
        .eq('status', 'completed')

    const totalCommission = orders?.reduce((sum, o) => sum + Math.round(Number(o.total_amount) * 0.10), 0) || 0

    // Total withdrawn (approved + pending) — pending must be reserved to prevent over-commitment
    const { data: withdrawals } = await serviceSupabase
        .from('withdrawals')
        .select('amount')
        .eq('user_id', userId)
        .in('status', ['approved', 'pending'])

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

    // Send email to admins (non-blocking — withdrawal is already committed)
    const supabaseAdmin = createServiceRoleClient()
    try {
        const { data: admins } = await supabaseAdmin
            .from('users')
            .select('id')
            .in('role', ['admin', 'super_admin'])

        const adminIds = admins?.map(a => a.id) || []

        if (adminIds.length > 0) {
            const { data: adminUsers } = await supabaseAdmin.auth.admin.listUsers()
            const adminEmails = adminUsers.users
                .filter(u => adminIds.includes(u.id))
                .map(u => u.email)
                .filter(Boolean)

            // Fire all emails concurrently, catch individual failures
            await Promise.allSettled(adminEmails.map(email =>
                supabaseAdmin.functions.invoke('send-withdrawal-email', {
                    body: {
                        type: 'request_created',
                        to: email,
                        userEmail: profile.email,
                        fullName: profile.full_name,
                        amount: data.amount,
                        bankName: data.bankName,
                        bankAccountNumber: data.bankAccountNumber,
                        bankAccountName: data.bankAccountName,
                        withdrawalId: newWithdrawal.id
                    },
                })
            ))
        }
    } catch (err) {
        console.error('Error sending admin withdrawal emails:', err)
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

    // Use service role for admin role check and update (bypasses RLS)
    const supabaseAdmin = createServiceRoleClient()

    const { data: profile } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return { success: false, error: 'Unauthorized' }
    }

    // Update withdrawal — must be pending to approve (prevent double-approve)
    const { data: withdrawal, error: updateError } = await supabaseAdmin
        .from('withdrawals')
        .update({
            status: 'approved',
            proof_image_url: proofImageUrl,
            approved_by: user.id,
            approved_at: new Date().toISOString()
        })
        .eq('id', withdrawalId)
        .eq('status', 'pending')
        .select('user_id, amount, bank_name, bank_account_number, bank_account_name')
        .single()

    if (updateError || !withdrawal) {
        console.error('Error approving withdrawal:', updateError)
        return { success: false, error: 'Không thể duyệt yêu cầu (có thể đã được xử lý)' }
    }

    // Send email to user (non-blocking)
    try {
        const { data: { user: withdrawalUser } } = await supabaseAdmin.auth.admin.getUserById(withdrawal.user_id)

        if (withdrawalUser?.email) {
            await supabaseAdmin.functions.invoke('send-withdrawal-email', {
                body: {
                    type: 'request_approved',
                    to: withdrawalUser.email,
                    fullName: withdrawalUser.user_metadata?.full_name || 'Người dùng',
                    amount: withdrawal.amount,
                    bankName: withdrawal.bank_name,
                    bankAccountNumber: withdrawal.bank_account_number,
                    bankAccountName: withdrawal.bank_account_name,
                    withdrawalId: withdrawalId,
                    proofImageUrl: proofImageUrl
                },
            })
        }
    } catch (err) {
        console.error('Error sending approval email:', err)
    }

    return { success: true }
}

// Admin: Reject withdrawal
export async function rejectWithdrawal(withdrawalId: string, reason: string) {
    if (!reason?.trim()) {
        return { success: false, error: 'Vui lòng nhập lý do từ chối' }
    }

    const supabase = await createServerClient()

    // Auth check - must be admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' }
    }

    // Use service role for admin role check and update (bypasses RLS)
    const supabaseAdmin = createServiceRoleClient()

    const { data: profile } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return { success: false, error: 'Unauthorized' }
    }

    // Update withdrawal — must be pending to reject (prevent double-processing)
    const { data: withdrawal, error: updateError } = await supabaseAdmin
        .from('withdrawals')
        .update({
            status: 'rejected',
            rejection_reason: reason,
            approved_by: user.id,
            approved_at: new Date().toISOString()
        })
        .eq('id', withdrawalId)
        .eq('status', 'pending')
        .select('user_id, amount, bank_name, bank_account_number, bank_account_name')
        .single()

    if (updateError || !withdrawal) {
        console.error('Error rejecting withdrawal:', updateError)
        return { success: false, error: 'Không thể từ chối yêu cầu (có thể đã được xử lý)' }
    }

    // Send email to user (non-blocking)
    try {
        const { data: { user: withdrawalUser } } = await supabaseAdmin.auth.admin.getUserById(withdrawal.user_id)

        if (withdrawalUser?.email) {
            await supabaseAdmin.functions.invoke('send-withdrawal-email', {
                body: {
                    type: 'request_rejected',
                    to: withdrawalUser.email,
                    fullName: withdrawalUser.user_metadata?.full_name || 'Người dùng',
                    amount: withdrawal.amount,
                    bankName: withdrawal.bank_name,
                    bankAccountNumber: withdrawal.bank_account_number,
                    bankAccountName: withdrawal.bank_account_name,
                    withdrawalId: withdrawalId,
                    rejectionReason: reason
                },
            })
        }
    } catch (err) {
        console.error('Error sending rejection email:', err)
    }

    return { success: true }
}
