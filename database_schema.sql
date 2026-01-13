-- Current Database Schema (2026-01-12)
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Last updated: 2026-01-12

CREATE TABLE public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  email_type text NOT NULL,
  recipient text NOT NULL,
  status text DEFAULT 'pending'::text,
  resend_id text,
  error_message text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE public.lots (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  region text NOT NULL,
  description text,
  location_lat numeric,
  location_lng numeric,
  total_trees integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  planted integer DEFAULT 0,
  CONSTRAINT lots_pkey PRIMARY KEY (id)
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  user_id uuid,
  quantity integer NOT NULL CHECK (quantity > 0),
  total_amount numeric NOT NULL CHECK (total_amount > 0::numeric),
  payment_method text NOT NULL CHECK (payment_method = ANY (ARRAY['banking'::text, 'usdt'::text])),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'assigned'::text, 'failed'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  tree_status text DEFAULT 'pending'::text,
  planted_at timestamp with time zone,
  lot_id uuid,
  latest_photo_url text,
  co2_absorbed numeric DEFAULT 0,
  order_code text,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_orders_lot_id FOREIGN KEY (lot_id) REFERENCES public.lots(id)
);

CREATE TABLE public.tree_photos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  lot_id uuid NOT NULL,
  photo_url text NOT NULL,
  caption text,
  taken_at timestamp with time zone,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tree_photos_pkey PRIMARY KEY (id),
  CONSTRAINT tree_photos_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lots(id)
);

-- NOTE: After migration 20260112_fix_trees_table_schema.sql, this table will have:
-- lot_id UUID, planted_at TIMESTAMPTZ columns
CREATE TABLE public.trees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  order_id uuid NOT NULL,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'active'::text,
  -- Missing columns (to be added via migration):
  -- lot_id uuid REFERENCES lots(id),
  -- planted_at timestamp with time zone,
  CONSTRAINT trees_pkey PRIMARY KEY (id),
  CONSTRAINT trees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.users (
  id uuid NOT NULL,
  phone text UNIQUE,
  email text UNIQUE,
  full_name text,
  referral_code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'user'::text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- IMPORTANT NOTES:
-- 1. orders.status now includes 'assigned' for tree lot assignment workflow
-- 2. trees table needs lot_id and planted_at columns (see migration 20260112_fix_trees_table_schema.sql)
-- 3. FK constraints: orders.lot_id -> lots.id, trees.order_id -> orders.id, trees.user_id -> auth.users.id


-- Important Notes:
-- 1. trees.user_id has FK constraint to auth.users(id) - must exist in auth.users
-- 2. trees.code has UNIQUE constraint - duplicates will fail
-- 3. trees.order_id is NOT NULL but has no FK constraint to orders table
-- 4. orders.user_id can be NULL
