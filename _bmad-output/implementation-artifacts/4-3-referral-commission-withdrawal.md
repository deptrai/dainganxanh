# Story 4.3: Referral Commission Withdrawal

**Epic:** Epic 4 - Viral & Growth  
**Story Points:** 8  
**Created:** 2026-01-14

---

## User Story

**As a** referrer with earned commission,  
**I want to** rút tiền hoa hồng về tài khoản ngân hàng,  
**So that** tôi nhận được phần thưởng giới thiệu của mình.

---

## Acceptance Criteria

### User Flow - Withdrawal Request

**Given** tôi có số dư khả dụng ≥ 200,000 VNĐ (Minimum payout threshold)  
**When** tôi vào trang `/crm/referrals` và chọn "Rút tiền"  
**Then** hiển thị form nhập thông tin:
- Ngân hàng (dropdown: Vietcombank, BIDV, Techcombank, VietinBank, ACB, etc.)
- Số tài khoản (numeric input)
- Tên chủ tài khoản (text input)
- Số tiền rút (numeric, max = available balance)

**And** hệ thống validate:
- Tên chủ tài khoản phải trùng với `full_name` của user
- So sánh: normalize(input) === normalize(user.full_name)
- Normalization: Loại bỏ dấu, chuyển về uppercase, trim spaces

**When** submit thành công  
**Then** tạo bản ghi trong bảng `withdrawals`:
```sql
{
  user_id: uuid,
  amount: number,
  bank_name: text,
  bank_account_number: text,
  bank_account_name: text,
  status: 'pending',
  created_at: timestamp
}
```

**And** gửi email thông báo cho Admin:
- Query: `SELECT email FROM auth.users JOIN public.users ON auth.users.id = public.users.id WHERE public.users.role IN ('admin', 'super_admin')`
- Subject: "🔔 Yêu cầu rút tiền mới từ [User Name]"
- Body: Thông tin user, số tiền, ngân hàng, STK

**And** hiển thị thông báo thành công cho user: "Yêu cầu rút tiền đã được gửi. Admin sẽ xử lý trong 1-3 ngày làm việc."

---

### Admin Flow - Withdrawal Approval

**Given** (Admin) tôi nhận được email thông báo  
**When** tôi vào Admin Dashboard > `/crm/admin/withdrawals`  
**Then** hiển thị danh sách các yêu cầu rút tiền:
- Filters: All / Pending / Approved / Rejected
- Columns: User, Amount, Bank Info, Status, Created Date, Actions

**When** tôi click vào một yêu cầu Pending  
**Then** hiển thị modal chi tiết:
- Thông tin user (name, email, referral stats)
- Thông tin rút tiền (amount, bank details)
- Available balance verification
- Actions: Approve / Reject

**When** tôi thực hiện chuyển khoản thủ công (bên ngoài hệ thống) và click "Approve"  
**Then** hệ thống yêu cầu upload ảnh bằng chứng chuyển khoản:
- File types: PNG, JPG, JPEG, WebP
- Max size: 5MB
- Upload to Supabase Storage: `withdrawals/[withdrawal_id]/proof.webp`

**When** upload ảnh thành công  
**Then** cập nhật bản ghi:
```sql
UPDATE withdrawals SET
  status = 'approved',
  proof_image_url = '[storage_url]',
  approved_at = NOW(),
  approved_by = [admin_user_id]
WHERE id = [withdrawal_id]
```

**And** gửi email thông báo cho user:
- Subject: "✅ Yêu cầu rút tiền đã được duyệt"
- Body: Số tiền, ngân hàng, thời gian duyệt, link xem ảnh chuyển khoản

**When** tôi click "Reject"  
**Then** yêu cầu nhập lý do từ chối  
**And** cập nhật status = 'rejected', lưu lý do  
**And** gửi email thông báo từ chối cho user

---

## Technical Specifications

### 1. Database Schema

#### New Table: `withdrawals`

```sql
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 200000),
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  proof_image_url TEXT,
  rejection_reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at DESC);

-- RLS Policies
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals"
  ON withdrawals FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own withdrawals
CREATE POLICY "Users can create own withdrawals"
  ON withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Service role (admin) can update all
CREATE POLICY "Service role full access"
  ON withdrawals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 2. Server Actions

#### `src/actions/withdrawals.ts`

```typescript
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
  
  const totalWithdrawn = withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0
  
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
        <p><strong>Số tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(withdrawal.amount)}</p>
        <p><strong>Ngân hàng:</strong> ${withdrawal.bank_name}</p>
        <p>Tiền đã được chuyển vào tài khoản của bạn.</p>
        <p><a href="${proofImageUrl}">Xem ảnh chuyển khoản</a></p>
      `
    })
  }
  
  return { success: true }
}
```

### 3. Email Service

#### `src/lib/email/index.ts`

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    await resend.emails.send({
      from: 'Đại Ngàn Xanh <noreply@dainganxanh.com>',
      to,
      subject,
      html
    })
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}
```

### 4. UI Components

#### User Withdrawal Form: `src/components/crm/WithdrawalForm.tsx`
- Form với validation
- Bank dropdown
- Account number input
- Account name input (validate against user.full_name)
- Amount input (max = available balance)

#### Admin Withdrawal List: `src/app/crm/admin/withdrawals/page.tsx`
- Table với filters (All/Pending/Approved/Rejected)
- Modal chi tiết
- Upload proof image
- Approve/Reject actions

---

## Dependencies

- **Email Service:** Resend (hoặc SendGrid)
- **Image Upload:** Supabase Storage
- **FR-22:** Commission Withdrawal System

---

## Testing Checklist

- [ ] User có thể xem số dư khả dụng
- [ ] Validation tên chủ TK hoạt động (có dấu, không dấu, hoa thường)
- [ ] Không cho rút nếu số dư < 200k
- [ ] Email gửi đến admin khi có yêu cầu mới
- [ ] Admin thấy danh sách pending withdrawals
- [ ] Admin phải upload ảnh mới approve được
- [ ] Email gửi đến user khi được duyệt
- [ ] Balance cập nhật đúng sau khi approve

---

**Status:** Ready for Implementation  
**Assigned to:** Dev Team  
**Target Sprint:** Q1 2026
