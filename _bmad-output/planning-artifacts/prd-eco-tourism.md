---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02-elicitation']
inputDocuments:
  - _bmad-output/planning-artifacts/eco-tourism-analysis.md
  - _bmad-output/planning-artifacts/eco-tourism-ux-spec.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - docs/prd.md
  - docs/userflow.md
  - _bmad-output/planning-artifacts/research/feature-analysis-casso-blog-seo-2026-03-26.md
  - _bmad-output/planning-artifacts/research/technical-camera-streaming-research-2026-03-26.md
workflowType: 'prd'
project_name: 'Đại Ngàn Xanh'
user_name: 'Luis'
date: '2026-08-28'
classification:
  projectType: web_app
  domain: fintech / e-commerce / hospitality
  complexity: high
  projectContext: brownfield
elicitationExperts:
  - first-principles-systems-thinker
  - reliability-engineer-fmea
  - pre-mortem-analyst
  - red-team-security-analyst
  - cross-functional-war-room
---

# Product Requirements Document — Eco-Tourism & Trầm Hương Store

## 1. Executive Summary

This PRD extends the existing Đại Ngàn Xanh tree-investment platform into two new verticals: **Eco-Stay** (room booking at agarwood gardens) and **Trầm Hương Store** (physical agarwood merchandise). The system is a brownfield Next.js + Supabase web application in the fintech/e-commerce/hospitality domain with high complexity due to payment reconciliation, inventory control, and concurrent booking integrity.

The project has completed multi-perspective expert elicitation covering first-principles analysis, FMEA reliability, pre-mortem failure forecasting, adversarial red-team security, and cross-functional war-room trade-offs. The findings from those reviews are incorporated as **Cross-Cutting Requirements** in Section 4.

## 2. Problem & Opportunity

**Problem:** The platform currently only supports long-term tree sponsorship. It cannot capture ancillary revenue from garden visits or agarwood by-products.

**Opportunity:** Add hospitality and retail modules that share the existing Supabase/Next.js infrastructure while respecting the unique domain rules of lodging reservations (date-range exclusivity, capacity) and physical e-commerce (inventory, shipping, COD).

## 3. Product Vision

**Vision Statement:** Đại Ngàn Xanh becomes a full agarwood lifestyle ecosystem where visitors can sleep among the trees they helped plant and take home authentic agarwood products.

**Strategic Goals (6 months):**
- Launch Eco-Stay MVP with 2-3 garden locations and 1-3 bookable rooms each.
- Launch Trầm Hương Store MVP with 4 categories and direct single-item checkout.
- Maintain 99.5% payment-reconciliation accuracy via Casso webhook.
- Zero overbookings and zero overselling.

## 4. Cross-Cutting Requirements (from Expert Elicitation)

### 4.1 Concurrency & Inventory Integrity

| ID | Requirement | Motivation |
|---|---|---|
| CC-01 | Add a GiST exclusion constraint on `room_bookings` using `btree_gist` to prevent overlapping `pending`/`confirmed` bookings for the same `room_id`. | Eliminate double-booking race conditions. |
| CC-02 | Implement 15-minute ephemeral reservation locks with `expires_at` and a cron worker to release unexpired pending bookings. | Block inventory while payment is in progress. |
| CC-03 | Use atomic stock decrement (`SELECT ... FOR UPDATE` or a PostgreSQL function) for product orders; never read-then-write. | Prevent overselling. |
| CC-04 | Re-calculate all prices and totals server-side from `products`/`rooms` tables; reject client-supplied `total_amount`. | Prevent price tampering. |

### 4.2 Payment & Webhook Architecture

| ID | Requirement | Motivation |
|---|---|---|
| CC-05 | Refactor Casso webhook into a polymorphic dispatcher by order-code prefix: `DH` (tree), `BK` (booking), `ST` (store). | Avoid silently dropped store/booking payments. |
| CC-06 | Record every Casso event in an idempotent `payment_transactions` ledger before applying side-effects. | Enable reconciliation and prevent duplicate processing. |
| CC-07 | Remove USDT from `room_bookings` and `store_orders` schemas; restrict to `banking` (booking) and `banking/cod` (store). | Align with banking-only policy and reduce compliance risk. |
| CC-08 | Implement underpayment handling: partial payment ledger, Telegram alert, and customer notification with remaining amount. | Reduce failed/unknown payment states. |

### 4.3 Security & Access Control

| ID | Requirement | Motivation |
|---|---|---|
| CC-09 | Remove open RLS `WITH CHECK (true)` insert policies on `room_bookings`, `store_orders`, `store_order_items`; route all creates through authenticated server routes / Edge Functions. | Prevent anonymous fake orders, status manipulation, and inventory DoS. |
| CC-10 | Replace repetitive admin subqueries with a `SECURITY DEFINER` `public.is_admin()` function. | Improve RLS performance and avoid recursion. |
| CC-11 | Make the `contracts` storage bucket private; serve contracts via short signed URLs. | Prevent mass PII leakage. |
| CC-12 | Enforce hard API-secret validation (minimum 32 chars, no empty fallbacks) on `/api/contracts/generate` and `/api/orders/identity`. | Prevent unauthorized contract generation and DoS. |
| CC-13 | Add input sanitization for DOCX template fields to prevent XML/template injection. | Avoid LibreOffice crashes and document manipulation. |

### 4.4 Cart & Checkout UX

| ID | Requirement | Motivation |
|---|---|---|
| CC-14 | Use three separate checkout flows: `/checkout/tree`, `/checkout/booking`, `/checkout/store`; do not reuse the tree KYC flow for rooms/products. | Reduce abandonment and branching complexity. |
| CC-15 | Use a hybrid cart: guest items in `localStorage` (product id + qty only) and authenticated users sync to `user_carts` table. | Support cross-device and prevent price drift. |
| CC-16 | For store COD orders, immediately show order confirmation and skip QR/payment polling. | Match customer mental model. |

### 4.5 Operations & Admin

| ID | Requirement | Motivation |
|---|---|---|
| CC-17 | Introduce lot-scoped roles (`resort_manager`, `store_staff`) in addition to coarse `admin`. | Limit on-site staff privileges. |
| CC-18 | Build separate admin views: calendar availability for rooms, inventory ledger for products. | Match operational needs. |
| CC-19 | Add product `origin_type` and `batch_certificate_url` fields; marketing copy must avoid implying new trees produce current oil. | Prevent greenwashing accusations. |
| CC-20 | Send three distinct transactional email templates: Tree Contract, Eco-Stay Voucher, Store Dispatch. | Provide correct post-purchase details. |

### 4.6 Data Validation & Constraints

| ID | Requirement | Motivation |
|---|---|---|
| CC-21 | Enforce `check_in_date >= CURRENT_DATE`, max stay duration (e.g., 30 days), and `guests_count <= rooms.capacity`. | Prevent data corruption and abuse. |
| CC-22 | Add `CHECK (stock_quantity >= 0)` on `products` and reject stale Casso transfers outside a 60-minute window. | Prevent negative inventory and expired payment confirmation. |

### 4.7 Launch & Real-World Operations

| ID | Requirement | Motivation |
|---|---|---|
| CC-23 | Provide offline downloadable booking voucher with QR, turn-by-turn directions, and on-site contact. | Support remote gardens with poor connectivity. |
| CC-24 | Implement on-demand Next.js cache revalidation (`revalidatePath('/store')`) when product/room inventory changes. | Avoid stale stock/availability pages. |
| CC-25 | Add dynamic `room_pricing_rules` for seasonal/weekend/holiday rates instead of flat `price_per_night`. | Avoid revenue loss during peak periods. |

## 5. User Personas

### 5.1 Eco-Tourist (Guest)
- Wants to discover gardens, compare rooms, and book a stay without heavy KYC.
- Concerns: accurate availability, clear pricing, easy check-in, offline access.

### 5.2 Retail Customer
- Wants authentic agarwood products, transparent origin, safe shipping.
- Concerns: stock accuracy, COD trust, fragile packaging, tracking.

### 5.3 Resort Manager
- Needs daily check-in/check-out schedule, room cleaning state, limited access to their lot.
- Concerns: overbooking, staff access, guest communication.

### 5.4 Store Fulfillment Staff
- Needs order queue, inventory tracking, shipping label/tracking input.
- Concerns: overselling, COD fraud, packaging standards.

## 6. User Stories & Acceptance Criteria

### 6.1 Eco-Stay (Room Booking)

#### US-ES-01: Browse Gardens
**As a** guest, **I want** to see gardens with bookable rooms and filter by region, **so that** I can choose a location.
- Acceptance:
  - `/eco-tourism` shows cards with image, name, region, price from, and CTA.
  - Filter tabs: Tất cả, Miền Bắc, Miền Trung, Miền Nam.
  - Only lots with at least one active room are shown.

#### US-ES-02: View Garden & Room Details
**As a** guest, **I want** to see room photos, capacity, amenities, and availability, **so that** I can decide.
- Acceptance:
  - `/eco-tourism/[lotId]` shows gallery, description, map, room cards.
  - Room card shows price/night, capacity, amenities, status.
  - Selecting dates disables rooms already booked in the range.

#### US-ES-03: Book a Room
**As a** guest, **I want** to complete a reservation with my contact info and pay by bank transfer, **so that** I receive a booking confirmation.
- Acceptance:
  - Form: name, phone, email, guest count, special requests.
  - Total = `nights * price_per_night` computed server-side.
  - 15-minute VietQR code with booking code.
  - Casso webhook confirms; status changes to `confirmed`.
  - Success page: booking code, summary, offline voucher link.

#### US-ES-04: Cancel Booking
**As a** guest, **I want** to cancel a pending booking, **so that** I can free the room.
- Acceptance:
  - Cancel button available when status is `pending`.
  - Booking transitions to `cancelled` with reason.
  - Room becomes available immediately.

#### US-ES-05: View My Bookings (CRM)
**As a** logged-in user, **I want** to see my booking history, **so that** I can track trips.
- Acceptance:
  - `/crm/my-bookings` lists bookings: code, room, garden, dates, status, total.
  - Click row to see detail with check-in instructions and QR.

### 6.2 Trầm Hương Store

#### US-ST-01: Browse Products
**As a** customer, **I want** to browse featured products and filter by category, **so that** I can find items.
- Acceptance:
  - `/store` shows hero, category pills, featured section, all-product grid.
  - Filter by category; search by name/description.
  - Card shows image, name, price, stock status, origin badge.

#### US-ST-02: View Product Detail
**As a** customer, **I want** to see full product info, **so that** I can decide to buy.
- Acceptance:
  - `/store/[productSlug]` shows image gallery, name, price, compare-at price, description, specifications table, origin, stock, quantity selector.
  - Related products shown.

#### US-ST-03: Direct Buy Now
**As a** customer, **I want** to buy a product directly, **so that** I can complete a purchase.
- Acceptance:
  - Checkout form: name, phone, email, shipping address, province, note.
  - Payment method: Banking or COD.
  - Banking: 15-minute VietQR.
  - COD: order confirmation without QR.
  - Server-side calculation of subtotal + shipping + total.

#### US-ST-04: Order Tracking
**As a** logged-in user, **I want** to see my store orders, **so that** I can track delivery.
- Acceptance:
  - `/crm/my-store-orders` lists orders: code, items, total, status, date.
  - Detail page shows products, shipping address, tracking number.

### 6.3 Admin Operations

#### US-AD-01: Manage Bookings
**As an** admin/resort manager, **I want** to view and update bookings, **so that** I can operate the resort.
- Acceptance:
  - Table: code, guest, room, garden, dates, status, total.
  - Filter by status, date range, garden.
  - Confirm/cancel actions with reason.

#### US-AD-02: Manage Products
**As an** admin, **I want** to add/edit products, **so that** I can run the store.
- Acceptance:
  - CRUD with name, slug, category, price, stock, SKU, images, specs, origin.
  - Image upload to `product-images` bucket with WebP/thumbnail optimization.

#### US-AD-03: Manage Store Orders
**As an** admin/store staff, **I want** to process orders, **so that** I can ship products.
- Acceptance:
  - Table: code, customer, items, total, address, status.
  - Update status: `pending -> confirmed -> processing -> shipped -> delivered`.
  - Add tracking number when shipped.

## 7. Functional Requirements

### 7.1 Eco-Tourism

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| F-ES-01 | Garden landing page with region filter | P0 | SSR, revalidate on room changes. |
| F-ES-02 | Garden detail with room list | P0 | Reuse marketing header/footer. |
| F-ES-03 | Date-based availability check | P0 | Client + server validation. |
| F-ES-04 | Guest booking form | P0 | Name, phone, email, guest count. |
| F-ES-05 | 15-minute VietQR payment | P0 | Prefix `BK-`. |
| F-ES-06 | Casso webhook confirm | P0 | Update booking, lock room. |
| F-ES-07 | Booking success & offline voucher | P0 | PDF/QR, directions. |
| F-ES-08 | CRM my-bookings list/detail | P1 | Authenticated. |
| F-ES-09 | Admin booking management | P1 | Confirm/cancel/filter. |
| F-ES-10 | Calendar-based room admin | P2 | Gantt/calendar view. |

### 7.2 Trầm Hương Store

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| F-ST-01 | Product catalog page | P0 | Category filter, search. |
| F-ST-02 | Product detail page | P0 | SEO-friendly, SSR. |
| F-ST-03 | Direct buy-now checkout | P0 | Single-item MVP. |
| F-ST-04 | Banking & COD payment | P0 | Prefix `ST-`. |
| F-ST-05 | Casso webhook confirm | P0 | Decrement stock. |
| F-ST-06 | Store order success | P0 | Order code, summary. |
| F-ST-07 | CRM my-store-orders | P1 | Authenticated. |
| F-ST-08 | Admin product CRUD | P1 | Image upload, specs. |
| F-ST-09 | Admin store order management | P1 | Fulfillment workflow. |
| F-ST-10 | Multi-item persistent cart | P2 | Deferred. |

### 7.3 Shared Infrastructure

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| F-SH-01 | Polymorphic Casso webhook dispatcher | P0 | `DH/BK/ST` routing. |
| F-SH-02 | Secure order creation APIs | P0 | Service role, Zod, rate limits. |
| F-SH-03 | Server-side price/total calculation | P0 | Reject client totals. |
| F-SH-04 | Inventory reservation & release | P0 | 15-min timeout worker. |
| F-SH-05 | Three transactional email templates | P1 | Tree/Stay/Store. |
| F-SH-06 | Lot-scoped admin roles | P2 | `resort_manager`, `store_staff`. |

## 8. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Page load time (public pages) | < 3 seconds on 3G |
| NFR-02 | Payment confirmation end-to-end | < 5 minutes via Casso |
| NFR-03 | Overbooking & overselling | 0 incidents |
| NFR-04 | Customer PII exposure | 0 unauthorized leaks |
| NFR-05 | Uptime | 99.5% |
| NFR-06 | Mobile-first responsive | All public pages |
| NFR-07 | WCAG 2.1 AA | Public pages |

## 9. Database Schema (Refined)

### 9.1 Core Tables

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 2,
  price_per_night BIGINT NOT NULL CHECK (price_per_night > 0),
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Room pricing rules (seasonal / weekend / holiday)
CREATE TABLE IF NOT EXISTS public.room_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_per_night BIGINT NOT NULL CHECK (price_per_night > 0),
  min_nights INTEGER DEFAULT 1,
  CHECK (end_date >= start_date)
);

-- Room bookings
CREATE TABLE IF NOT EXISTS public.room_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests_count INTEGER NOT NULL DEFAULT 1 CHECK (guests_count > 0),
  nights_count INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
  total_amount BIGINT NOT NULL CHECK (total_amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('banking')),
  payment_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  special_requests TEXT,
  cancellation_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT room_bookings_dates_check CHECK (check_out_date > check_in_date),
  CONSTRAINT room_bookings_stay_check CHECK (check_out_date - check_in_date <= 30),
  CONSTRAINT exclude_overlapping_bookings
    EXCLUDE USING gist (
      room_id WITH =,
      daterange(check_in_date, check_out_date, '[)') WITH &&
    ) WHERE (status IN ('pending', 'confirmed', 'completed'))
);

-- Product categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE RESTRICT,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price BIGINT NOT NULL CHECK (price > 0),
  compare_at_price BIGINT CHECK (compare_at_price > 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  sku TEXT UNIQUE,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  origin_type TEXT NOT NULL DEFAULT 'mature_partner_plantation' CHECK (origin_type IN ('mature_partner_plantation', 'cooperative_farm', 'dainganxanh_harvest')),
  batch_certificate_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Store orders
CREATE TABLE IF NOT EXISTS public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  shipping_address TEXT NOT NULL,
  shipping_province TEXT,
  shipping_note TEXT,
  subtotal BIGINT NOT NULL CHECK (subtotal > 0),
  shipping_fee BIGINT NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  total_amount BIGINT NOT NULL CHECK (total_amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('banking', 'cod')),
  payment_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  tracking_number TEXT,
  cancellation_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Store order items
CREATE TABLE IF NOT EXISTS public.store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price BIGINT NOT NULL CHECK (unit_price > 0),
  subtotal BIGINT GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment transactions ledger
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type TEXT NOT NULL CHECK (order_type IN ('tree', 'booking', 'store')),
  order_id UUID NOT NULL,
  order_code TEXT NOT NULL,
  casso_tid TEXT NOT NULL,
  amount BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'amount_mismatch', 'stale', 'duplicate')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User carts (for authenticated users)
CREATE TABLE IF NOT EXISTS public.user_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
```

### 9.2 Stored Procedures

```sql
-- Admin check helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  );
$$;

-- Atomic product stock reservation
CREATE OR REPLACE FUNCTION public.reserve_product_stock(p_product_id UUID, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - p_qty,
      reserved_quantity = reserved_quantity + p_qty
  WHERE id = p_product_id AND stock_quantity >= p_qty;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Release reserved product stock
CREATE OR REPLACE FUNCTION public.release_product_stock(p_product_id UUID, p_qty INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity + p_qty,
      reserved_quantity = GREATEST(reserved_quantity - p_qty, 0)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Booking capacity and date validation trigger
CREATE OR REPLACE FUNCTION public.validate_room_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_capacity INT;
BEGIN
  SELECT capacity INTO v_capacity FROM public.rooms WHERE id = NEW.room_id;

  IF NEW.guests_count > v_capacity THEN
    RAISE EXCEPTION 'Guest count exceeds room capacity of %', v_capacity;
  END IF;

  IF NEW.check_in_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Check-in date cannot be in the past';
  END IF;

  IF NEW.check_out_date - NEW.check_in_date > 30 THEN
    RAISE EXCEPTION 'Stay cannot exceed 30 nights';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_room_booking
BEFORE INSERT OR UPDATE ON public.room_bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_room_booking();

-- Release expired pending bookings
CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS void AS $$
BEGIN
  UPDATE public.room_bookings
  SET status = 'cancelled', cancellation_reason = 'Payment timeout (15 mins)'
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Release expired pending store orders
CREATE OR REPLACE FUNCTION public.expire_pending_store_orders()
RETURNS void AS $$
BEGIN
  UPDATE public.store_orders
  SET status = 'cancelled', cancellation_reason = 'Payment timeout (15 mins)'
  WHERE status = 'pending'
    AND payment_method = 'banking'
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
```

### 9.3 RLS Policies

```sql
-- Rooms: public read, admin write
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_public_read"
  ON public.rooms FOR SELECT
  USING (status = 'active');

CREATE POLICY "rooms_admin_all"
  ON public.rooms FOR ALL
  USING (public.is_admin());

-- Room bookings: no direct client insert
ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_bookings_user_select"
  ON public.room_bookings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "room_bookings_admin_all"
  ON public.room_bookings FOR ALL
  USING (public.is_admin());

-- Product categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_categories_public_read"
  ON public.product_categories FOR SELECT
  USING (true);

CREATE POLICY "product_categories_admin_all"
  ON public.product_categories FOR ALL
  USING (public.is_admin());

-- Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_public_read"
  ON public.products FOR SELECT
  USING (status IN ('active', 'out_of_stock'));

CREATE POLICY "products_admin_all"
  ON public.products FOR ALL
  USING (public.is_admin());

-- Store orders: no direct client insert
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_orders_user_select"
  ON public.store_orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "store_orders_admin_all"
  ON public.store_orders FOR ALL
  USING (public.is_admin());

-- Store order items
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_order_items_user_select"
  ON public.store_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_orders
      WHERE store_orders.id = store_order_items.store_order_id
      AND store_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "store_order_items_admin_all"
  ON public.store_order_items FOR ALL
  USING (public.is_admin());

-- User carts
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_carts_owner"
  ON public.user_carts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 9.4 Storage Buckets

```sql
-- Product and room images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-images',
  'room-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "room_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'room-images');

CREATE POLICY "product_images_admin_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

CREATE POLICY "room_images_admin_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'room-images'
    AND public.is_admin()
  );
```

## 10. API Routes

### 10.1 Eco-Stay

| Method | Route | Description |
|---|---|---|
| GET | `/api/rooms?lotId=...` | List active rooms by lot |
| GET | `/api/bookings/availability?roomId=...&checkIn=...&checkOut=...` | Check availability |
| POST | `/api/bookings/create` | Create pending booking (server-validated) |
| GET | `/api/bookings/status?code=...` | Poll booking status |
| POST | `/api/bookings/cancel` | Cancel pending booking |
| PUT | `/api/admin/bookings/[id]/confirm` | Admin confirm booking |
| PUT | `/api/admin/bookings/[id]/cancel` | Admin cancel booking |

### 10.2 Store

| Method | Route | Description |
|---|---|---|
| GET | `/api/store/products` | List active products |
| GET | `/api/store/products/[slug]` | Product detail |
| POST | `/api/store/cart/sync` | Sync localStorage cart for authenticated users |
| POST | `/api/store/orders/create` | Create store order (server-validated) |
| GET | `/api/store/orders/[id]/status` | Poll store order status |
| PUT | `/api/admin/store-orders/[id]/status` | Admin update order status |
| PUT | `/api/admin/store-orders/[id]/ship` | Add tracking number |

### 10.3 Payment

| Method | Route | Description |
|---|---|---|
| POST | `/api/webhooks/casso` | Polymorphic dispatcher for DH/BK/ST |
| POST | `/api/payments/expire-pending` | Cron endpoint to release expired holds |

## 11. Route Structure

### Public Routes
- `/eco-tourism` — Garden listing
- `/eco-tourism/[lotId]` — Garden detail
- `/eco-tourism/[lotId]/book` — Booking form
- `/eco-tourism/booking/success` — Booking success
- `/store` — Store catalog
- `/store/[productSlug]` — Product detail
- `/store/checkout` — Store checkout
- `/store/checkout/success` — Order success

### CRM Routes (authenticated)
- `/crm/my-bookings` — My bookings
- `/crm/my-bookings/[id]` — Booking detail
- `/crm/my-store-orders` — My store orders
- `/crm/my-store-orders/[id]` — Store order detail

### Admin Routes
- `/crm/admin/bookings` — Manage bookings
- `/crm/admin/rooms` — Manage rooms
- `/crm/admin/products` — Manage products
- `/crm/admin/store-orders` — Manage store orders

## 12. Webhook & Payment Reconciliation Flow

```
Casso -> /api/webhooks/casso
  |
  +-- Prefix DH -> process tree order
  +-- Prefix BK -> confirm room booking
  +-- Prefix ST -> confirm store order (decrement stock)
  |
  +-- amount_mismatch -> payment_transactions ledger + alert + customer notify
  +-- stale -> reject
  +-- duplicate -> idempotent skip
```

## 13. UI/UX Notes

- No shadcn/ui; use native HTML inputs + Tailwind + lucide-react.
- Mobile-first; date pickers use `<input type="date">` with `min`/`max` validation.
- Payment screens show 15-minute countdown and copyable transfer description.
- Admin room view uses calendar; admin product view uses inventory ledger.

## 14. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Double-booking | GiST exclusion constraint + reservation locks |
| Overselling | Atomic stock decrement + reservation system |
| Payment drops | Polymorphic webhook + payment transactions ledger |
| Client price tampering | Server-side total calculation |
| PII leakage | Private contract bucket + signed URLs |
| Stale cache | On-demand revalidation on inventory change |
| Offline check-in | Downloadable voucher with QR and directions |
| COD fraud/risk | OTP for guests, deposit for high-value orders |

## 15. Open Questions

1. Should COD orders > 1,000,000 VND require a partial banking deposit?
2. Should tree owners receive a discount code for Eco-Stay and Store?
3. Which courier(s) will be integrated for live tracking after MVP?
4. Which gardens and rooms will be piloted for launch?
5. Do existing tree investors need the CCCD fields pre-filled from `orders` table?

---

*PRD generated from expert elicitation: First-Principles, FMEA, Pre-Mortem, Red-Team Security, Cross-Functional War Room.*
