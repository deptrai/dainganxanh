# Story 5.2: Casso Webhook Integration — Auto Payment Verification

Status: review

## Story

As a hệ thống,
I want tự động xác nhận thanh toán ngân hàng qua Casso webhook,
so that admin không cần verify thủ công và user nhận email xác nhận ngay sau khi chuyển khoản.

## Acceptance Criteria

1. **AC1 — Webhook nhận & verify:** `POST /api/webhooks/casso` xác thực `secure-token` header, trả 401 nếu sai
2. **AC2 — Idempotency:** Mỗi giao dịch chỉ xử lý 1 lần — check `casso_tid` trong `casso_transactions` trước khi process
3. **AC3 — Luôn log:** Mọi webhook call đều được ghi vào `casso_transactions` với `status` phù hợp, kể cả không khớp
4. **AC4 — Parse orderCode:** Extract `orderCode` (format `DH[A-Z0-9]{6}`) từ `description` của transaction
5. **AC5 — Match & validate:** Tìm order `status='pending'` theo `code`, validate `amount` khớp ±1,000đ
6. **AC6 — Trigger process-payment:** Khi match thành công, invoke Edge Function `process-payment` với đủ payload
7. **AC7 — Return 200 luôn:** Webhook luôn trả `200 OK` (kể cả lỗi logic) để Casso không retry không cần thiết — chỉ trả non-200 khi auth fail
8. **AC8 — Env var:** `CASSO_SECURE_TOKEN` được đọc từ environment variable

## Prerequisite

- **Story 5.1 phải hoàn thành trước** — cần `casso_transactions` migration và `user_email/user_name` trong `orders`

## Tasks / Subtasks

- [x] Task 1: Tạo migration `casso_transactions` table (AC: #2, #3)
  - [x] Tạo `supabase/migrations/20260326_create_casso_transactions.sql`
  - [x] Schema: `id, casso_id bigint, casso_tid text UNIQUE, amount bigint, description text, bank_account text, transaction_at timestamptz, raw_payload jsonb, status text, note text, order_id uuid REFERENCES orders(id), created_at`
  - [x] Status enum values: `processing | processed | no_match | order_not_found | amount_mismatch | function_error | duplicate`
  - [x] RLS: chỉ service role write, admin role read

- [x] Task 2: Tạo webhook API Route (AC: #1 → #8)
  - [x] Tạo `src/app/api/webhooks/casso/route.ts`
  - [x] Dùng `createServiceRoleClient()` (bypass RLS)
  - [x] Verify `secure-token` header
  - [x] Idempotency check theo `casso_tid`
  - [x] Insert vào `casso_transactions` với status `processing` ngay đầu
  - [x] Parse orderCode với regex `/\b(DH[A-Z0-9]{6})\b/i`
  - [x] Query `orders` với đủ fields cần cho `process-payment`
  - [x] Validate amount với tolerance ±1,000đ
  - [x] Invoke `process-payment` Edge Function
  - [x] Update `casso_transactions.status` theo kết quả

- [x] Task 3: Thêm env var (AC: #8)
  - [x] Thêm `CASSO_SECURE_TOKEN=` vào `.env.local` (local dev)
  - [x] Document trong README hoặc `.env.example`

- [ ] Task 4: Test với Casso simulator
  - [ ] Dùng Casso dashboard → "Giả lập giao dịch" để test end-to-end
  - [ ] Verify order chuyển sang `completed` trong Supabase

## Dev Notes

### Casso Webhook — Cơ chế thực tế

**Security:** Không dùng HMAC-SHA256. Casso gắn token tĩnh vào HTTP Header:
```
Header: secure-token: {your_secret_token}
```
Set token trên Casso dashboard → lưu vào `CASSO_SECURE_TOKEN` env var.

**Webhook payload (Casso V2):**
```json
{
  "error": 0,
  "data": {
    "id": 1,
    "tid": "TF80307914",
    "description": "DHABC123 chuyen khoan mua cay",
    "amount": 260000,
    "cusum_balance": 15900500,
    "when": "2026-03-26 10:30:00",
    "bank_sub_acc_id": "771368999999",
    "subAccId": 1,
    "type": 1
  }
}
```
- `id` = Casso internal ID
- `tid` = Bank transaction reference — dùng làm idempotency key
- `description` = Nội dung CK do user nhập — chứa orderCode
- `amount` = Số tiền (VNĐ, integer)
- `type: 1` = tiền vào (credit), `type: 2` = tiền ra

**Retry behavior:** Nếu webhook trả non-200, Casso retry trong 12 giờ → luôn trả 200 trừ auth fail.

### Orders Table — Fields cần query

```typescript
// Story 5.1 đã thêm user_email và user_name vào orders table
const { data: order } = await supabase
  .from('orders')
  .select('id, code, user_id, user_email, user_name, quantity, total_amount')
  .eq('code', orderCode)           // ← cột "code", không phải "order_code"
  .eq('status', 'pending')         // ← chỉ match pending orders
  .single()
```

### process-payment Edge Function — Exact interface

```typescript
// supabase/functions/process-payment/index.ts
interface PaymentRequest {
  userId: string
  userEmail: string
  userName: string
  orderCode: string
  quantity: number
  totalAmount: number       // ← "totalAmount" không phải "amount"
  paymentMethod: 'banking' | 'usdt'
  referredBy?: string
}
```

**Invoke từ API Route (server-side):**
```typescript
import { createServiceRoleClient } from '@/lib/supabase/server'
const supabase = createServiceRoleClient()
const { error } = await supabase.functions.invoke('process-payment', {
  body: {
    userId: order.user_id,
    userEmail: order.user_email,
    userName: order.user_name,
    orderCode: order.code,
    quantity: order.quantity,
    totalAmount: order.total_amount,
    paymentMethod: 'banking',
  },
})
```

### Full Implementation

```typescript
// src/app/api/webhooks/casso/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

const ORDER_CODE_REGEX = /\b(DH[A-Z0-9]{6})\b/i

export async function POST(req: NextRequest) {
  // 1. Auth
  const token = req.headers.get('secure-token')
  if (token !== process.env.CASSO_SECURE_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const tx = body?.data
  // Casso gửi test ping không có data — ignore
  if (!tx?.tid) return NextResponse.json({ ok: true })

  const supabase = createServiceRoleClient()

  // 2. Idempotency
  const { data: existing } = await supabase
    .from('casso_transactions')
    .select('id, status')
    .eq('casso_tid', String(tx.tid))
    .single()

  if (existing) return NextResponse.json({ ok: true, duplicate: true })

  // 3. Log transaction trước
  await supabase.from('casso_transactions').insert({
    casso_id: tx.id,
    casso_tid: String(tx.tid),
    amount: tx.amount,
    description: tx.description,
    bank_account: tx.bank_sub_acc_id,
    transaction_at: tx.when,
    raw_payload: tx,
    status: 'processing',
  })

  // 4. Chỉ xử lý tiền vào (type=1 hoặc amount > 0)
  if (tx.type === 2 || tx.amount <= 0) {
    await supabase.from('casso_transactions')
      .update({ status: 'no_match', note: 'Outgoing transaction ignored' })
      .eq('casso_tid', String(tx.tid))
    return NextResponse.json({ ok: true })
  }

  // 5. Parse orderCode
  const match = String(tx.description || '').match(ORDER_CODE_REGEX)
  if (!match) {
    await supabase.from('casso_transactions')
      .update({ status: 'no_match', note: 'orderCode not found in description' })
      .eq('casso_tid', String(tx.tid))
    return NextResponse.json({ ok: true })
  }
  const orderCode = match[1].toUpperCase()

  // 6. Lookup order
  const { data: order } = await supabase
    .from('orders')
    .select('id, code, user_id, user_email, user_name, quantity, total_amount')
    .eq('code', orderCode)
    .eq('status', 'pending')
    .single()

  if (!order) {
    await supabase.from('casso_transactions')
      .update({ status: 'order_not_found', note: `Order ${orderCode} not found or not pending` })
      .eq('casso_tid', String(tx.tid))
    return NextResponse.json({ ok: true })
  }

  // 7. Validate amount (tolerance ±1,000đ)
  const diff = Math.abs(Number(tx.amount) - Number(order.total_amount))
  if (diff > 1000) {
    await supabase.from('casso_transactions')
      .update({ status: 'amount_mismatch', note: `Expected ${order.total_amount}, got ${tx.amount}` })
      .eq('casso_tid', String(tx.tid))
    return NextResponse.json({ ok: true })
  }

  // 8. Trigger process-payment
  const { error: fnError } = await supabase.functions.invoke('process-payment', {
    body: {
      userId: order.user_id,
      userEmail: order.user_email,
      userName: order.user_name,
      orderCode: order.code,
      quantity: order.quantity,
      totalAmount: order.total_amount,
      paymentMethod: 'banking',
    },
  })

  await supabase.from('casso_transactions')
    .update({
      status: fnError ? 'function_error' : 'processed',
      note: fnError?.message,
      order_id: order.id,
    })
    .eq('casso_tid', String(tx.tid))

  return NextResponse.json({ ok: true })
}
```

### Migration: casso_transactions

```sql
-- supabase/migrations/20260326_create_casso_transactions.sql
CREATE TABLE casso_transactions (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  casso_id       bigint,
  casso_tid      text UNIQUE NOT NULL,
  amount         bigint NOT NULL,
  description    text,
  bank_account   text,
  transaction_at timestamptz,
  raw_payload    jsonb,
  status         text NOT NULL DEFAULT 'processing',
  note           text,
  order_id       uuid REFERENCES orders(id),
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX idx_casso_transactions_tid ON casso_transactions(casso_tid);
CREATE INDEX idx_casso_transactions_status ON casso_transactions(status);
CREATE INDEX idx_casso_transactions_created ON casso_transactions(created_at DESC);

ALTER TABLE casso_transactions ENABLE ROW LEVEL SECURITY;
-- Service role: full access
CREATE POLICY "service_role_full_access" ON casso_transactions
  USING (auth.role() = 'service_role');
-- Admin read: xem logs trên dashboard
CREATE POLICY "admin_read" ON casso_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));
```

### Project Structure Notes

```
dainganxanh-landing/
├── src/app/api/webhooks/
│   └── casso/route.ts              ← TẠO MỚI
└── .env.local                      ← Thêm CASSO_SECURE_TOKEN

supabase/migrations/
└── 20260326_create_casso_transactions.sql  ← TẠO MỚI
```

**⚠️ Không tạo trong `supabase/webhooks/` folder** — đây là Next.js API Route, không phải Supabase webhook.

### Casso Setup Steps (không phải dev task nhưng cần biết)

1. Đăng ký tài khoản [casso.vn](https://casso.vn)
2. Connect MB Bank account `771368999999`
3. Vào Settings → Webhook → Nhập URL: `https://dainganxanh.vn/api/webhooks/casso`
4. Set Security Key → copy vào `CASSO_SECURE_TOKEN`
5. Dùng "Giả lập giao dịch" để test

### Regression Risk

- **BankingPayment manual confirm:** Không thay đổi — vẫn hoạt động song song
- **process-payment idempotency:** Function check `orders.code` → nếu order đã `completed`, return success → không duplicate

### References

- [Source: Casso Developer Docs — https://developer.casso.vn/english-v2-new/webhook/thiet-lap-webhook-thu-cong]
- [Source: supabase/functions/process-payment/index.ts — PaymentRequest interface & idempotency]
- [Source: supabase/migrations/20260111_create_orders_table.sql — orders schema]
- [Source: src/lib/supabase/server.ts — createServiceRoleClient()]
- [Source: feature-analysis-casso-blog-seo-2026-03-26.md — Architecture review corrections]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- `supabase/migrations/20260326_create_casso_transactions.sql` — Migration tạo bảng casso_transactions với RLS policies
- `dainganxanh-landing/src/app/api/webhooks/casso/route.ts` — Next.js API Route xử lý Casso webhook
- `dainganxanh-landing/.env.local` — Thêm CASSO_SECURE_TOKEN placeholder
- `dainganxanh-landing/.env.example` — Document CASSO_SECURE_TOKEN cho dev mới
