# Supabase Edge Functions - Đại Ngàn Xanh

## Functions Overview

### 1. `send-email`
Gửi email xác nhận đơn hàng với PDF contract đính kèm.

**Dependencies:**
- Resend API
- Supabase Storage

**Environment Variables:**
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_BASE_URL`

### 2. `generate-contract`
Tạo PDF contract với thông tin đơn hàng và upload lên Supabase Storage.

**Dependencies:**
- pdf-lib
- Supabase Storage

### 3. `process-payment`
Orchestrator function xử lý toàn bộ flow sau thanh toán:
1. Generate tree codes
2. Create order record
3. Insert trees vào database
4. Generate PDF contract
5. Send email confirmation

## Deployment

### Prerequisites
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login
supabase login
```

### Deploy Functions
```bash
cd dainganxanh-landing

# Deploy all functions
supabase functions deploy send-email
supabase functions deploy generate-contract
supabase functions deploy process-payment

# Set secrets
supabase secrets set RESEND_API_KEY=re_EXsBoj17_Lqz8xAGwWgNjio9KTMpSC1Ne
supabase secrets set RESEND_FROM_EMAIL=noreply@dainganxanh.com
supabase secrets set NEXT_PUBLIC_BASE_URL=https://dainganxanh.com
```

### Local Testing
```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve

# Test process-payment
curl -X POST http://localhost:54321/functions/v1/process-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "userId": "user-uuid",
    "userEmail": "test@example.com",
    "userName": "Test User",
    "orderCode": "DH123456",
    "quantity": 5,
    "totalAmount": 1300000,
    "paymentMethod": "banking"
  }'
```

## Database Schema Required

```sql
-- Orders table (if not exists)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  quantity INTEGER NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trees table (already created)
-- email_logs table (already created)
```

## Email Template

Template location: `/email-templates/order-confirmation.html`

**Variables:**
- `{{user_name}}`
- `{{order_code}}`
- `{{quantity}}`
- `{{total_amount}}`
- `{{co2_impact}}`
- `{{dashboard_url}}`
- `{{#each tree_codes}}...{{/each}}`

## Error Handling

All functions include:
- Try-catch error handling
- Error logging to console
- Email failure logging to `email_logs` table
- Graceful degradation (email failure doesn't fail payment)

## Next Steps

1. ✅ Deploy functions to Supabase
2. ✅ Set environment secrets
3. ✅ Test with real payment flow
4. ⏳ Integrate with frontend checkout
5. ⏳ Add webhook for automatic payment confirmation
