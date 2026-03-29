---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - docs/prd.md
  - docs/userflow.md
  - _bmad-output/planning-artifacts/epics.md
  - dainganxanh-landing (existing codebase)
workflowType: 'architecture'
project_name: 'Đại Ngàn Xanh'
user_name: 'Luis'
date: '2026-01-10'
---

# 🏗️ Architecture Decision Document
## Dự án: Đại Ngàn Xanh - Nền tảng Trồng Cây & Carbon Credit

**Version:** 1.1 (Simplified)  
**Date:** January 10, 2026  
**Author:** Architect Agent (BMAD Method)  
**Status:** Approved

---

## 📋 Executive Summary

Kiến trúc đơn giản hóa cho nền tảng Đại Ngàn Xanh - tập trung vào **triển khai nhanh** với stack tối giản.

### Architectural Vision

**Simple Full-Stack Architecture:**
- **Next.js Only** - Không có backend riêng
- **Supabase All-in-One** - Database, Auth, Storage, Edge Functions
- **Single Deployment** - Dokploy (self-hosted)

### ⚡ Design Principles

1. **KISS (Keep It Simple, Stupid)** - Tối giản stack
2. **Serverless First** - Không quản lý servers
3. **Managed Services** - Để Supabase handle complexity
4. **Fast Iteration** - Ship nhanh, iterate sau

---

## 🛠️ Technology Stack (Simplified)

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | Next.js 16.1.1 | Unified SSR + API |
| **Database** | Supabase PostgreSQL | Managed, RLS built-in |
| **Auth** | Supabase Auth | Magic link, OTP, Social |
| **Storage** | Supabase Storage | Integrated với RLS |
| **Edge Functions** | Supabase Edge Functions | Webhooks, Cron jobs |
| **Hosting** | Dokploy | Self-hosted, full control |

### 🚫 What We're NOT Using

| ~~Technology~~ | Why Not |
|----------------|---------|
| ~~NestJS~~ | Overkill cho MVP, thêm complexity |
| ~~AWS S3~~ | Supabase Storage đủ dùng, integrated |
| ~~Railway/Fly.io~~ | Không cần separate backend |
| ~~Redis~~ | Supabase handles caching internally |

---

## 📁 Project Structure (Simplified)

```
dainganxanh/
├── src/
│   ├── app/
│   │   │
│   │   ├── (marketing)/              # Landing pages (public)
│   │   │   ├── page.tsx              # / - Homepage
│   │   │   ├── about/                # /about
│   │   │   ├── pricing/              # /pricing
│   │   │   └── layout.tsx            # Marketing layout (no sidebar)
│   │   │
│   │   ├── (auth)/                   # Auth pages (public)
│   │   │   ├── login/                # /login
│   │   │   ├── register/             # /register
│   │   │   ├── verify/               # /verify (OTP)
│   │   │   └── layout.tsx            # Auth layout
│   │   │
│   │   ├── crm/                      # CRM area (protected) ← NEW!
│   │   │   ├── layout.tsx            # CRM layout (sidebar)
│   │   │   ├── page.tsx              # /crm → redirect to dashboard
│   │   │   │
│   │   │   ├── dashboard/            # /crm/dashboard
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── my-garden/            # /crm/my-garden
│   │   │   │   ├── page.tsx          # Tree list
│   │   │   │   └── [treeId]/         # /crm/my-garden/[treeId]
│   │   │   │       └── page.tsx      # Tree detail
│   │   │   │
│   │   │   ├── my-orders/            # /crm/my-orders
│   │   │   │   ├── page.tsx          # Order list
│   │   │   │   └── [orderId]/        # /crm/my-orders/[orderId]
│   │   │   │       └── page.tsx      # Order detail
│   │   │   │
│   │   │   ├── checkout/             # /crm/checkout
│   │   │   │   └── page.tsx          # Checkout flow
│   │   │   │
│   │   │   ├── referrals/            # /crm/referrals
│   │   │   │   └── page.tsx          # Referral dashboard
│   │   │   │
│   │   │   └── admin/                # /crm/admin/* (admin only)
│   │   │       ├── layout.tsx        # Admin permission check
│   │   │       ├── orders/           # /crm/admin/orders
│   │   │       ├── trees/            # /crm/admin/trees
│   │   │       ├── lots/             # /crm/admin/lots
│   │   │       ├── users/            # /crm/admin/users
│   │   │       └── analytics/        # /crm/admin/analytics
│   │   │
│   │   ├── api/                      # API Routes
│   │   │   ├── webhooks/
│   │   │   │   └── casso/route.ts    # Casso payment webhook (HMAC-SHA512)
│   │   │   ├── orders/
│   │   │   │   ├── pending/route.ts  # Create/get pending order
│   │   │   │   ├── status/route.ts   # Poll order payment status
│   │   │   │   └── cancel/route.ts   # Cancel pending order
│   │   │   ├── camera/
│   │   │   │   └── status/route.ts   # Farm camera stream status
│   │   │   ├── share-card/route.ts   # Generate share card
│   │   │   └── health/route.ts       # Health check
│   │   │
│   │   └── layout.tsx                # Root layout
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── marketing/                # Landing components
│   │   ├── crm/                      # CRM components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TreeCard.tsx
│   │   │   ├── OrderTable.tsx
│   │   │   └── ...
│   │   └── shared/                   # Shared components
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client
│   │   │   ├── middleware.ts         # Auth middleware
│   │   │   └── admin.ts              # Admin client (service role)
│   │   ├── permissions.ts            # RBAC logic
│   │   └── utils.ts                  # Utility functions
│   │
│   ├── hooks/
│   │   ├── useUser.ts
│   │   ├── useTrees.ts
│   │   ├── useOrders.ts
│   │   └── useAdmin.ts
│   │
│   ├── stores/                       # Zustand stores
│   │   └── useAppStore.ts
│   │
│   └── types/
│       └── database.ts               # Generated from Supabase
│
├── supabase/                         # Supabase CLI project
│   ├── config.toml                   # Supabase config
│   │
│   ├── migrations/                   # Supabase Migrations (supabase db push)
│   │   ├── 20260110000001_initial_schema.sql
│   │   ├── 20260110000002_rls_policies.sql
│   │   └── 20260110000003_storage_buckets.sql
│   │
│   ├── functions/                    # Edge Functions (supabase functions deploy)
│   │   ├── send-otp/index.ts         # OTP via Twilio
│   │   ├── process-payment/index.ts  # Payment processing
│   │   ├── generate-contract/index.ts # PDF generation
│   │   ├── send-email/index.ts       # Email via SendGrid
│   │   └── quarterly-report/index.ts # Scheduled cron job
│   │
│   └── seed.sql                      # Seed data
│
├── public/
│   ├── images/
│   └── fonts/
│
├── docs/
│   ├── prd.md
│   └── userflow.md
│
├── next.config.js
├── tailwind.config.js
├── package.json
└── .env.local
```

---

## 🔀 Route Structure

### Public Routes (No Auth)
| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Homepage với video, counter |
| `/about` | About | Story của dự án |
| `/pricing` | Pricing | Package 260k |
| `/login` | Login | Email/Phone + OTP |
| `/register` | Register | Quick registration + referral code input |
| `/blog` | Blog List | Danh sách bài viết |
| `/blog/[slug]` | Blog Detail | Chi tiết bài viết |
| `/checkout` | Checkout | Quantity → Customer Info → Banking QR |

### User Routes (Authenticated)
| Route | Page | Permission |
|-------|------|------------|
| `/crm` | Redirect | → /crm/dashboard |
| `/crm/dashboard` | Dashboard | user+ |
| `/crm/my-garden` | Tree List | user+ |
| `/crm/my-garden/[id]` | Tree Detail | user+ |
| `/crm/my-orders` | Order List | user+ |
| `/crm/my-orders/[id]` | Order Detail | user+ |
| `/crm/checkout` | Checkout | user+ |
| `/crm/referrals` | Referral Dashboard | user+ |

### Admin Routes (Role-Based)
| Route | Page | Permission |
|-------|------|------------|
| `/crm/admin/orders` | Order Management | admin+ |
| `/crm/admin/trees` | Tree Management | admin+ |
| `/crm/admin/lots` | Lot Management | admin+ |
| `/crm/admin/users` | User Management | admin+ |
| `/crm/admin/analytics` | Analytics | admin+ |
| `/crm/admin/casso` | Casso Transaction Log | admin+ |
| `/crm/admin/referrals` | Referral Management | admin+ |
| `/crm/admin/print-queue` | Contract Print Queue | admin+ |
| `/crm/admin/blog` | Blog CMS | admin+ |

---

## 🔐 Authentication & Authorization

### Auth Flow (Supabase Magic Link + OTP)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────▶│   Next.js   │────▶│  Supabase   │
│   Browser   │     │  Middleware │     │    Auth     │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    Check session
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        Has Session?              No Session?
              │                         │
              ▼                         ▼
        Continue to                Redirect to
        /crm/*                     /login
```

### Middleware Protection

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes - no protection
  if (pathname.startsWith('/api/webhooks')) return NextResponse.next()
  if (!pathname.startsWith('/crm')) return NextResponse.next()
  
  // Check Supabase session
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Admin routes - check role
  if (pathname.startsWith('/crm/admin')) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!['admin', 'super_admin'].includes(profile?.role)) {
      return NextResponse.redirect(new URL('/crm/dashboard', request.url))
    }
  }
  
  return NextResponse.next()
}
```

### RBAC Roles

```typescript
// lib/permissions.ts
export type Role = 'user' | 'field_operator' | 'admin' | 'super_admin'

export const PERMISSIONS = {
  // User permissions
  'view:dashboard': ['user', 'field_operator', 'admin', 'super_admin'],
  'purchase:trees': ['user', 'admin', 'super_admin'],
  'view:my-garden': ['user', 'admin', 'super_admin'],
  
  // Field operator
  'upload:photos': ['field_operator', 'admin', 'super_admin'],
  'update:tree-status': ['field_operator', 'admin', 'super_admin'],
  
  // Admin
  'manage:orders': ['admin', 'super_admin'],
  'manage:lots': ['admin', 'super_admin'],
  'view:analytics': ['admin', 'super_admin'],
  
  // Super admin
  'manage:users': ['super_admin'],
} as const

export function hasPermission(role: Role, permission: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[permission].includes(role)
}
```

---

## 💾 Database Schema (Supabase)

### SQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE user_role AS ENUM ('user', 'field_operator', 'admin', 'super_admin');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'verified', 'assigned', 'completed', 'cancelled');
CREATE TYPE tree_status AS ENUM ('seedling', 'planted', 'growing', 'mature', 'harvested', 'dead');
CREATE TYPE health_status AS ENUM ('healthy', 'sick', 'dead');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  full_name TEXT,
  wallet_address TEXT UNIQUE,
  role user_role DEFAULT 'user',
  referral_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  referred_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 1000),
  unit_price INTEGER DEFAULT 260000,
  total_amount INTEGER NOT NULL,
  status order_status DEFAULT 'pending',
  payment_type TEXT NOT NULL, -- 'banking' | 'usdt'
  payment_ref TEXT,
  contract_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lots table
CREATE TABLE lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  planted INTEGER DEFAULT 0,
  gps_polygon JSONB, -- GeoJSON
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trees table
CREATE TABLE trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_code TEXT UNIQUE NOT NULL, -- TREE-2026-XXXXX
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES lots(id),
  status tree_status DEFAULT 'seedling',
  health_status health_status DEFAULT 'healthy',
  planted_at TIMESTAMPTZ,
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  co2_absorbed DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tree photos table
CREATE TABLE tree_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL, -- Supabase Storage URL
  thumbnail_url TEXT,
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  captured_at TIMESTAMPTZ NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tree health logs
CREATE TABLE tree_health_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  previous_status health_status NOT NULL,
  new_status health_status NOT NULL,
  treatment TEXT,
  notes TEXT,
  logged_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_trees_order_id ON trees(order_id);
CREATE INDEX idx_trees_lot_id ON trees(lot_id);
CREATE INDEX idx_tree_photos_tree_id ON tree_photos(tree_id);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_photos ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Orders policies
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Trees policies
CREATE POLICY "Users can view own trees"
  ON trees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = trees.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all trees"
  ON trees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'field_operator')
    )
  );

-- Lots are public read
CREATE POLICY "Anyone can view lots"
  ON lots FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage lots"
  ON lots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Tree photos
CREATE POLICY "Users can view own tree photos"
  ON tree_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trees
      JOIN orders ON trees.order_id = orders.id
      WHERE tree_photos.tree_id = trees.id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Field operators can upload photos"
  ON tree_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('field_operator', 'admin', 'super_admin')
    )
  );
```

---

## 📦 Supabase Storage Buckets

```sql
-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('tree-photos', 'tree-photos', false),
  ('contracts', 'contracts', false),
  ('share-cards', 'share-cards', true);

-- Storage policies
CREATE POLICY "Users can view own tree photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tree-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Field operators can upload to tree-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tree-photos'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('field_operator', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Users can view own contracts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view share cards"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'share-cards');
```

---

## ⚡ Supabase Edge Functions

### Function 1: Send OTP

```typescript
// supabase/functions/send-otp/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { phone, email } = await req.json()
  
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  
  // Store OTP in database with expiry
  const supabase = createClient(...)
  await supabase.from('otps').insert({
    identifier: phone || email,
    code: otp,
    expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  })
  
  // Send via Twilio (SMS) or SendGrid (Email)
  if (phone) {
    await sendTwilioSMS(phone, `Mã OTP của bạn: ${otp}`)
  } else {
    await sendSendGridEmail(email, `Mã OTP của bạn: ${otp}`)
  }
  
  return new Response(JSON.stringify({ success: true }))
})
```

### Function 2: Process Payment Webhook

```typescript
// supabase/functions/process-payment/index.ts
serve(async (req) => {
  const payload = await req.json()
  const signature = req.headers.get('x-signature')
  
  // Verify webhook signature
  if (!verifySignature(payload, signature)) {
    return new Response('Invalid signature', { status: 401 })
  }
  
  const supabase = createClient(...)
  
  // Update order status
  await supabase
    .from('orders')
    .update({ status: 'paid', payment_ref: payload.transactionId })
    .eq('id', payload.orderId)
  
  // Generate tree codes
  const order = await supabase.from('orders').select().eq('id', payload.orderId).single()
  const treeCodes = Array.from({ length: order.quantity }, (_, i) => ({
    tree_code: `TREE-${new Date().getFullYear()}-${payload.orderId.slice(0, 5).toUpperCase()}${i + 1}`,
    order_id: payload.orderId,
  }))
  
  await supabase.from('trees').insert(treeCodes)
  
  // Trigger email (via another edge function)
  await supabase.functions.invoke('send-email', {
    body: { type: 'order-confirmation', orderId: payload.orderId }
  })
  
  return new Response(JSON.stringify({ success: true }))
})
```

### Function 3: Quarterly Report (Cron)

```typescript
// supabase/functions/quarterly-report/index.ts
// Scheduled via Supabase Dashboard: 0 0 1 */3 * (every 3 months)

serve(async (req) => {
  const supabase = createClient(...)
  
  // Get all trees with new photos this quarter
  const { data: trees } = await supabase
    .from('trees')
    .select(`
      *,
      tree_photos (photo_url, captured_at),
      orders (user_id, users (email, full_name))
    `)
    .gte('tree_photos.captured_at', getQuarterStart())
  
  // Send email to each user
  for (const tree of trees) {
    await supabase.functions.invoke('send-email', {
      body: {
        type: 'quarterly-update',
        userId: tree.orders.user_id,
        treeId: tree.id,
        photos: tree.tree_photos
      }
    })
  }
  
  return new Response(JSON.stringify({ processed: trees.length }))
})
```

---

## 🌐 API Routes (Next.js)

### Simple API Routes (not Edge Functions)

```
/api/webhooks/payment    → Payment provider webhooks
/api/webhooks/supabase   → Supabase realtime webhooks
/api/share-card          → Generate share card image
/api/health              → Health check
```

### Example: Share Card Generator

```typescript
// app/api/share-card/route.ts
import { ImageResponse } from 'next/og'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'Người gieo hạt'
  const trees = searchParams.get('trees') || '1'
  const co2 = parseInt(trees) * 20 // ~20kg CO2/tree/year
  
  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(135deg, #2E8B57, #1A3320)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Lora',
      }}>
        <h1 style={{ fontSize: 48 }}>🌳 Đại Ngàn Xanh</h1>
        <p style={{ fontSize: 32 }}>{name}</p>
        <p style={{ fontSize: 64, color: '#FFD700' }}>{trees} cây</p>
        <p style={{ fontSize: 24 }}>= {co2}kg CO2/năm</p>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
```

---

## 📦 Deployment (Simplified)

```
┌─────────────────────────────────────────────────────────────────┐
│                         DOKPLOY                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Next.js 16.1.1                          │ │
│  │   • SSR pages (landing, CRM)                               │ │
│  │   • API Routes (/api/*)                                    │ │
│  │   • Edge Middleware (auth)                                 │ │
│  │   • Static assets served directly                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                   │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐       │
│  │PostgreSQL│   Auth   │ Storage  │ Realtime │Edge Func │       │
│  │  (RLS)   │  (JWT)   │ (Photos) │ (Subs)   │ (Cron)   │       │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
│  ┌──────────────────────┬──────────────────────┐                │
│  │       SendGrid       │        Twilio        │                │
│  │   (Transactional)    │        (OTP)         │                │
│  └──────────────────────┴──────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

NEXT_PUBLIC_APP_URL=https://dainganxanh.com.vn

# Twilio (for OTP)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+84xxx

# SendGrid (for emails)
SENDGRID_API_KEY=xxx
SENDGRID_FROM_EMAIL=noreply@dainganxanh.com.vn
```

---

## 📊 Version Matrix (Final)

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | 16.1.1 | App Router, SSR |
| React | 19.0.0 | Latest |
| Supabase JS | 2.58.0 | Database, Auth, Storage |
| Tailwind CSS | 3.4.x | Styling |
| Framer Motion | 12.x | Animations |
| shadcn/ui | Latest | UI components |
| Zustand | 5.x | State management |
| React Query | 5.x | Data fetching |

---

## 🔧 Supabase CLI Development Workflow

### Initial Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to existing project
cd dainganxanh
supabase link --project-ref <project-id>

# Or init new project
supabase init
```

### Migration Workflow

```bash
# Create new migration
supabase migration new initial_schema

# Edit migration file
# supabase/migrations/20260110000001_initial_schema.sql

# Push to remote database
supabase db push

# Reset local database (development)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.ts

# Check migration status
supabase migration list
```

### Edge Functions Workflow

```bash
# Create new function
supabase functions new send-otp

# Serve locally (with hot reload)
supabase functions serve send-otp --env-file .env.local

# Deploy single function
supabase functions deploy send-otp

# Deploy all functions
supabase functions deploy

# View function logs
supabase functions logs send-otp
```

### Local Development

```bash
# Start local Supabase stack (Postgres, Auth, Storage, etc.)
supabase start

# Stop local stack
supabase stop

# View local dashboard
# http://localhost:54323
```

### Environment Files

```bash
# supabase/.env.local (for Edge Functions)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
SENDGRID_API_KEY=xxx
```

---

## ✅ Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Setup Next.js project với route structure mới
- [ ] Setup Supabase project
- [ ] Create database schema + RLS policies
- [ ] Setup Supabase Auth
- [ ] Migrate landing page

### Phase 2: Core Features (Week 3-4)
- [ ] User registration/login flow
- [ ] Order creation + checkout flow
- [ ] My Garden dashboard
- [ ] Tree detail page

### Phase 3: Admin (Week 5-6)
- [ ] Admin order management
- [ ] Tree assignment to lots
- [ ] Photo upload
- [ ] Basic analytics

### Phase 4: Polish (Week 7-8)
- [ ] Email notifications
- [ ] Share card generation
- [ ] Quarterly cron job
- [ ] Testing + deployment

---

**End of Architecture Decision Document v1.1 (Simplified)**
