-- =============================================================================
-- PRODUCTION SCHEMA SNAPSHOT
-- Project: gzuuyzikjvykjpeixzqk (dainganxanh)
-- Generated: 2026-03-31
-- Description: Full schema dump for applying to a fresh local Supabase instance.
--              Contains extensions, functions, tables, indexes, triggers, and
--              RLS policies. No data — structure only.
-- =============================================================================

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp"      WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto"        WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_graphql"      WITH SCHEMA graphql;
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_net"          WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "unaccent"        WITH SCHEMA public;
-- pg_cron and supabase_vault are managed by Supabase platform — skip on local
-- CREATE EXTENSION IF NOT EXISTS "pg_cron";
-- CREATE EXTENSION IF NOT EXISTS "supabase_vault";


-- =============================================================================
-- 2. FUNCTIONS (non-trigger helpers first, then trigger functions)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- slugify_for_referral  (must exist before handle_new_user)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.slugify_for_referral(input_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  slug TEXT;
BEGIN
  slug := unaccent(input_text);
  slug := lower(slug);
  slug := regexp_replace(slug, '[^a-z0-9]', '', 'g');
  slug := left(slug, 20);
  RETURN slug;
END;
$function$;

-- ---------------------------------------------------------------------------
-- generate_referral_code
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'DNG' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.users WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$function$;

-- ---------------------------------------------------------------------------
-- handle_new_user  (auth trigger — creates public.users row on signup)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  raw_name  TEXT;
  base_code TEXT;
  new_code  TEXT;
  suffix    INT := 0;
  code_exists BOOLEAN;
  rows_inserted INT;
BEGIN
  -- 1. Try full_name from auth metadata first, then name, then email prefix
  raw_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(split_part(NEW.email, '@', 1)), '')
  );

  -- 2. Slugify to get base code
  base_code := slugify_for_referral(COALESCE(raw_name, ''));

  -- 3. Fallback if slug is too short (< 3 chars)
  IF length(base_code) < 3 THEN
    base_code := 'user' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  END IF;

  -- 4. Ensure uniqueness: loop until we find a free code
  new_code := base_code;
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.users WHERE referral_code = new_code
    ) INTO code_exists;
    EXIT WHEN NOT code_exists;
    suffix    := suffix + 1;
    new_code  := base_code || suffix::TEXT;
  END LOOP;

  -- 5. Insert — use ON CONFLICT DO NOTHING to handle ALL unique violations gracefully
  INSERT INTO public.users (id, phone, email, referral_code)
  VALUES (NEW.id, NEW.phone, NEW.email, new_code)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS rows_inserted = ROW_COUNT;

  -- 6. If insert was silently skipped (conflict), retry with a random suffix
  IF rows_inserted = 0 THEN
    new_code := base_code || FLOOR(RANDOM() * 100000)::TEXT;
    INSERT INTO public.users (id, phone, email, referral_code)
    VALUES (NEW.id, NEW.phone, NEW.email, new_code)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- backfill_missing_user_profiles  (admin utility)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.backfill_missing_user_profiles()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    rec RECORD;
    base_code TEXT;
    ref_code TEXT;
BEGIN
    FOR rec IN
        SELECT au.id, au.email, au.phone
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
    LOOP
        -- Tạo referral code từ email prefix
        base_code := regexp_replace(
            lower(split_part(COALESCE(rec.email, ''), '@', 1)),
            '[^a-z0-9]', '', 'g'
        );
        IF length(base_code) < 3 THEN
            base_code := 'user';
        END IF;
        ref_code := left(base_code, 15) || FLOOR(RANDOM() * 100000)::TEXT;

        INSERT INTO public.users (id, email, phone, referral_code)
        VALUES (rec.id, rec.email, rec.phone, ref_code)
        ON CONFLICT DO NOTHING;

        GET DIAGNOSTICS inserted_count = ROW_COUNT;
    END LOOP;

    RETURN inserted_count;
END;
$function$;

-- ---------------------------------------------------------------------------
-- get_harvest_ready_trees
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_harvest_ready_trees()
 RETURNS TABLE(id uuid, tree_code text, order_id uuid, user_id uuid, user_email text, planted_at timestamp with time zone, age_months integer, co2_absorbed numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.code as tree_code,
        t.order_id,
        t.user_id,
        u.email as user_email,
        t.created_at as planted_at,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, t.created_at))::INTEGER * 12 +
        EXTRACT(MONTH FROM AGE(CURRENT_DATE, t.created_at))::INTEGER as age_months,
        0::NUMERIC as co2_absorbed  -- Placeholder since column doesn't exist
    FROM trees t
    JOIN auth.users u ON t.user_id = u.id
    WHERE
        -- Tree is at least 60 months old
        (EXTRACT(YEAR FROM AGE(CURRENT_DATE, t.created_at))::INTEGER * 12 +
         EXTRACT(MONTH FROM AGE(CURRENT_DATE, t.created_at))::INTEGER) >= 60
        -- No harvest notification sent yet
        AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.user_id = t.user_id
            AND n.type = 'harvest_ready'
            AND (n.data->>'treeId')::UUID = t.id
        );
END;
$function$;

-- ---------------------------------------------------------------------------
-- execute_sql  (admin utility — SECURITY DEFINER, use with caution)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  EXECUTE sql;
END;
$function$;

-- ---------------------------------------------------------------------------
-- Trigger helper functions  (updated_at maintenance)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_admin_preferences_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_email_templates_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_field_checklists_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_print_queue_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_replacement_tasks_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_system_config_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$function$;


-- =============================================================================
-- 3. TABLES
-- (ordered to satisfy FK dependencies: lots → orders → trees → … )
-- =============================================================================

-- ---------------------------------------------------------------------------
-- lots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lots (
    id              uuid            NOT NULL DEFAULT uuid_generate_v4(),
    name            text            NOT NULL,
    region          text            NOT NULL,
    description     text,
    location_lat    numeric(10,7),
    location_lng    numeric(10,7),
    total_trees     integer         DEFAULT 0,
    created_at      timestamptz     DEFAULT now(),
    updated_at      timestamptz     DEFAULT now(),
    planted         integer         DEFAULT 0,

    CONSTRAINT lots_pkey PRIMARY KEY (id),
    CONSTRAINT check_planted_capacity CHECK (planted <= total_trees)
);

-- ---------------------------------------------------------------------------
-- users  (mirrors auth.users — created by handle_new_user trigger)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id                  uuid    NOT NULL,
    phone               text,
    email               text,
    full_name           text,
    referral_code       text    NOT NULL,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now(),
    role                text        DEFAULT 'user'::text,
    referred_by_user_id uuid,

    CONSTRAINT users_pkey             PRIMARY KEY (id),
    CONSTRAINT users_id_fkey          FOREIGN KEY (id)                  REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT users_referred_by_user_id_fkey FOREIGN KEY (referred_by_user_id) REFERENCES public.users(id),
    CONSTRAINT users_email_key        UNIQUE (email),
    CONSTRAINT users_phone_key        UNIQUE (phone),
    CONSTRAINT users_referral_code_key UNIQUE (referral_code)
);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id              uuid        NOT NULL DEFAULT gen_random_uuid(),
    code            text        NOT NULL,
    user_id         uuid,
    quantity        integer     NOT NULL,
    total_amount    numeric     NOT NULL,
    payment_method  text        NOT NULL,
    status          text        DEFAULT 'pending'::text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    tree_status     text        DEFAULT 'pending'::text,
    planted_at      timestamptz,
    lot_id          uuid,
    latest_photo_url text,
    co2_absorbed    numeric(10,2) DEFAULT 0,
    order_code      text,
    contract_url    text,
    referred_by     uuid,
    user_email      text,
    user_name       text,
    dob             date,
    nationality     text        DEFAULT 'Việt Nam'::text,
    id_number       text,
    id_issue_date   date,
    id_issue_place  text,
    address         text,
    phone           text,

    CONSTRAINT orders_pkey              PRIMARY KEY (id),
    CONSTRAINT orders_code_key          UNIQUE (code),
    CONSTRAINT orders_user_id_fkey      FOREIGN KEY (user_id)    REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_lot_id         FOREIGN KEY (lot_id)     REFERENCES public.lots(id) ON DELETE SET NULL,
    CONSTRAINT orders_referred_by_fkey  FOREIGN KEY (referred_by) REFERENCES auth.users(id),
    CONSTRAINT orders_quantity_check    CHECK (quantity > 0),
    CONSTRAINT orders_total_amount_check CHECK (total_amount > 0),
    CONSTRAINT orders_status_check      CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'assigned'::text, 'failed'::text, 'cancelled'::text])),
    CONSTRAINT orders_payment_method_check CHECK (payment_method = ANY (ARRAY['banking'::text, 'usdt'::text]))
);

-- ---------------------------------------------------------------------------
-- trees
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trees (
    id              uuid    NOT NULL DEFAULT gen_random_uuid(),
    code            text    NOT NULL,
    order_id        uuid    NOT NULL,
    user_id         uuid,
    created_at      timestamptz DEFAULT now(),
    status          text        DEFAULT 'active'::text,
    lot_id          uuid,
    planted_at      timestamptz,
    health_status   text        DEFAULT 'healthy'::text,

    CONSTRAINT trees_pkey           PRIMARY KEY (id),
    CONSTRAINT trees_code_key       UNIQUE (code),
    CONSTRAINT trees_order_id_fkey  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    CONSTRAINT trees_user_id_fkey   FOREIGN KEY (user_id)  REFERENCES auth.users(id),
    CONSTRAINT trees_lot_id_fkey    FOREIGN KEY (lot_id)   REFERENCES public.lots(id) ON DELETE SET NULL,
    CONSTRAINT trees_health_status_check CHECK (health_status = ANY (ARRAY['healthy'::text, 'sick'::text, 'dead'::text]))
);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id          uuid    NOT NULL DEFAULT uuid_generate_v4(),
    user_id     uuid    NOT NULL,
    type        text    NOT NULL,
    title       text    NOT NULL,
    body        text,
    data        jsonb,
    read        boolean     DEFAULT false,
    created_at  timestamptz DEFAULT now(),

    CONSTRAINT notifications_pkey           PRIMARY KEY (id),
    CONSTRAINT notifications_user_id_fkey   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- casso_transactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.casso_transactions (
    id              uuid    NOT NULL DEFAULT gen_random_uuid(),
    casso_id        bigint,
    casso_tid       text    NOT NULL,
    amount          bigint  NOT NULL,
    description     text,
    bank_account    text,
    transaction_at  timestamptz,
    raw_payload     jsonb,
    status          text    NOT NULL DEFAULT 'processing'::text,
    note            text,
    order_id        uuid,
    created_at      timestamptz DEFAULT now(),

    CONSTRAINT casso_transactions_pkey          PRIMARY KEY (id),
    CONSTRAINT casso_transactions_casso_tid_key UNIQUE (casso_tid),
    CONSTRAINT casso_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);

-- ---------------------------------------------------------------------------
-- email_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_logs (
    id              uuid    NOT NULL DEFAULT gen_random_uuid(),
    order_id        uuid    NOT NULL,
    email_type      text    NOT NULL,
    recipient       text    NOT NULL,
    status          text        DEFAULT 'pending'::text,
    resend_id       text,
    error_message   text,
    sent_at         timestamptz,
    created_at      timestamptz DEFAULT now(),

    CONSTRAINT email_logs_pkey PRIMARY KEY (id)
);

-- ---------------------------------------------------------------------------
-- email_templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_templates (
    id              uuid    NOT NULL DEFAULT uuid_generate_v4(),
    template_key    text    NOT NULL,
    subject         text    NOT NULL,
    html_body       text    NOT NULL,
    variables       jsonb,
    updated_by      uuid,
    updated_at      timestamptz DEFAULT now(),
    created_at      timestamptz DEFAULT now(),

    CONSTRAINT email_templates_pkey             PRIMARY KEY (id),
    CONSTRAINT email_templates_template_key_key UNIQUE (template_key),
    CONSTRAINT email_templates_updated_by_fkey  FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

-- ---------------------------------------------------------------------------
-- field_checklists
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.field_checklists (
    id              uuid    NOT NULL DEFAULT uuid_generate_v4(),
    lot_id          uuid    NOT NULL,
    quarter         text    NOT NULL,
    checklist_items jsonb       DEFAULT '[]'::jsonb,
    overall_status  text        DEFAULT 'pending'::text,
    due_date        date    NOT NULL,
    completed_at    timestamptz,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),

    CONSTRAINT field_checklists_pkey        PRIMARY KEY (id),
    CONSTRAINT field_checklists_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- tree_health_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tree_health_logs (
    id                  uuid    NOT NULL DEFAULT uuid_generate_v4(),
    tree_id             uuid    NOT NULL,
    old_status          text,
    new_status          text    NOT NULL,
    notes               text,
    treatment_details   text,
    changed_by          uuid,
    changed_at          timestamptz DEFAULT now(),

    CONSTRAINT tree_health_logs_pkey            PRIMARY KEY (id),
    CONSTRAINT tree_health_logs_tree_id_fkey    FOREIGN KEY (tree_id)    REFERENCES public.trees(id) ON DELETE CASCADE,
    CONSTRAINT tree_health_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id)
);

-- ---------------------------------------------------------------------------
-- follow_up_tasks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follow_up_tasks (
    id              uuid    NOT NULL DEFAULT gen_random_uuid(),
    tree_id         uuid    NOT NULL,
    health_log_id   uuid    NOT NULL,
    due_date        timestamptz NOT NULL,
    status          text    NOT NULL DEFAULT 'pending'::text,
    completed_at    timestamptz,
    completed_by    uuid,
    notes           text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),

    CONSTRAINT follow_up_tasks_pkey             PRIMARY KEY (id),
    CONSTRAINT follow_up_tasks_tree_id_fkey     FOREIGN KEY (tree_id)       REFERENCES public.trees(id) ON DELETE CASCADE,
    CONSTRAINT follow_up_tasks_health_log_id_fkey FOREIGN KEY (health_log_id) REFERENCES public.tree_health_logs(id) ON DELETE CASCADE,
    CONSTRAINT follow_up_tasks_status_check     CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text]))
);

-- ---------------------------------------------------------------------------
-- replacement_tasks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.replacement_tasks (
    id              uuid    NOT NULL DEFAULT uuid_generate_v4(),
    dead_tree_id    uuid    NOT NULL,
    new_tree_id     uuid,
    status          text        DEFAULT 'pending'::text,
    assigned_to     uuid,
    notes           text,
    reason          text,
    created_at      timestamptz DEFAULT now(),
    assigned_at     timestamptz,
    completed_at    timestamptz,
    updated_at      timestamptz DEFAULT now(),

    CONSTRAINT replacement_tasks_pkey               PRIMARY KEY (id),
    CONSTRAINT replacement_tasks_dead_tree_id_fkey  FOREIGN KEY (dead_tree_id) REFERENCES public.trees(id) ON DELETE CASCADE,
    CONSTRAINT replacement_tasks_new_tree_id_fkey   FOREIGN KEY (new_tree_id)  REFERENCES public.trees(id) ON DELETE SET NULL,
    CONSTRAINT replacement_tasks_assigned_to_fkey   FOREIGN KEY (assigned_to)  REFERENCES public.users(id),
    CONSTRAINT replacement_tasks_status_check       CHECK (status = ANY (ARRAY['pending'::text, 'assigned'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))
);

-- ---------------------------------------------------------------------------
-- tree_photos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tree_photos (
    id          uuid    NOT NULL DEFAULT uuid_generate_v4(),
    lot_id      uuid    NOT NULL,
    photo_url   text    NOT NULL,
    caption     text,
    taken_at    timestamptz,
    uploaded_at timestamptz DEFAULT now(),
    gps_lat     numeric(10,7),
    gps_lng     numeric(10,7),
    gps_accuracy numeric(6,2),
    tree_id     uuid,

    CONSTRAINT tree_photos_pkey         PRIMARY KEY (id),
    CONSTRAINT tree_photos_lot_id_fkey  FOREIGN KEY (lot_id)  REFERENCES public.lots(id) ON DELETE CASCADE,
    CONSTRAINT tree_photos_tree_id_fkey FOREIGN KEY (tree_id) REFERENCES public.trees(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- print_queue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.print_queue (
    id              uuid    NOT NULL DEFAULT uuid_generate_v4(),
    order_id        uuid    NOT NULL,
    status          text    NOT NULL DEFAULT 'pending'::text,
    printed_at      timestamptz,
    shipped_at      timestamptz,
    tracking_number text,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT print_queue_pkey         PRIMARY KEY (id),
    CONSTRAINT print_queue_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    CONSTRAINT print_queue_status_check  CHECK (status = ANY (ARRAY['pending'::text, 'printed'::text, 'shipped'::text]))
);

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
    id          uuid    NOT NULL DEFAULT gen_random_uuid(),
    title       text    NOT NULL,
    slug        text    NOT NULL,
    excerpt     text,
    content     text    NOT NULL DEFAULT ''::text,
    cover_image text,
    status      text    NOT NULL DEFAULT 'draft'::text,
    published_at timestamptz,
    scheduled_at timestamptz,
    author_id   uuid,
    tags        text[]      DEFAULT '{}'::text[],
    meta_title  text,
    meta_desc   text,
    view_count  bigint      DEFAULT 0,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now(),

    CONSTRAINT posts_pkey           PRIMARY KEY (id),
    CONSTRAINT posts_slug_key       UNIQUE (slug),
    CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id),
    CONSTRAINT posts_status_check   CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'scheduled'::text]))
);

-- ---------------------------------------------------------------------------
-- referral_clicks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_clicks (
    id          uuid    NOT NULL DEFAULT gen_random_uuid(),
    referrer_id uuid    NOT NULL,
    ip_hash     text,
    user_agent  text,
    converted   boolean     DEFAULT false,
    order_id    uuid,
    created_at  timestamptz DEFAULT now(),

    CONSTRAINT referral_clicks_pkey             PRIMARY KEY (id),
    CONSTRAINT referral_clicks_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT referral_clicks_order_id_fkey    FOREIGN KEY (order_id)    REFERENCES public.orders(id)
);

-- ---------------------------------------------------------------------------
-- system_config
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_config (
    id          uuid    NOT NULL DEFAULT uuid_generate_v4(),
    key         text    NOT NULL,
    value       jsonb   NOT NULL,
    updated_by  uuid,
    updated_at  timestamptz DEFAULT now(),

    CONSTRAINT system_config_pkey           PRIMARY KEY (id),
    CONSTRAINT system_config_key_key        UNIQUE (key),
    CONSTRAINT system_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

-- ---------------------------------------------------------------------------
-- admin_preferences
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_preferences (
    user_id             uuid    NOT NULL,
    email_notifications jsonb       DEFAULT '{"alerts": true, "orders": true, "withdrawals": true}'::jsonb,
    in_app_sound        boolean     DEFAULT true,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now(),

    CONSTRAINT admin_preferences_pkey       PRIMARY KEY (user_id),
    CONSTRAINT admin_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- withdrawals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id                  uuid        NOT NULL DEFAULT uuid_generate_v4(),
    user_id             uuid        NOT NULL,
    amount              numeric(12,2) NOT NULL,
    bank_name           text        NOT NULL,
    bank_account_number text        NOT NULL,
    bank_account_name   text        NOT NULL,
    status              text        NOT NULL DEFAULT 'pending'::text,
    proof_image_url     text,
    rejection_reason    text,
    approved_by         uuid,
    approved_at         timestamptz,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now(),

    CONSTRAINT withdrawals_pkey             PRIMARY KEY (id),
    CONSTRAINT withdrawals_user_id_fkey     FOREIGN KEY (user_id)     REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT withdrawals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id),
    CONSTRAINT withdrawals_amount_check     CHECK (amount >= 200000),
    CONSTRAINT withdrawals_status_check     CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))
);


-- =============================================================================
-- 4. INDEXES  (non-PK / non-unique-constraint indexes only)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_preferences_user_id       ON public.admin_preferences  USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_casso_transactions_created      ON public.casso_transactions  USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_casso_transactions_order        ON public.casso_transactions  USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_casso_transactions_status       ON public.casso_transactions  USING btree (status);
CREATE INDEX IF NOT EXISTS idx_casso_transactions_tid          ON public.casso_transactions  USING btree (casso_tid);

CREATE INDEX IF NOT EXISTS idx_email_logs_order_id             ON public.email_logs          USING btree (order_id);

CREATE INDEX IF NOT EXISTS idx_email_templates_key             ON public.email_templates     USING btree (template_key);

CREATE INDEX IF NOT EXISTS idx_field_checklists_due_date       ON public.field_checklists    USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_field_checklists_lot_id         ON public.field_checklists    USING btree (lot_id);
CREATE INDEX IF NOT EXISTS idx_field_checklists_lot_quarter    ON public.field_checklists    USING btree (lot_id, quarter);
CREATE INDEX IF NOT EXISTS idx_field_checklists_quarter        ON public.field_checklists    USING btree (quarter);
CREATE INDEX IF NOT EXISTS idx_field_checklists_status         ON public.field_checklists    USING btree (overall_status);

CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_due_date        ON public.follow_up_tasks     USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_status          ON public.follow_up_tasks     USING btree (status);
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_tree_id         ON public.follow_up_tasks     USING btree (tree_id);

CREATE INDEX IF NOT EXISTS idx_lots_capacity                   ON public.lots                USING btree (planted, total_trees);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at        ON public.notifications       USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id           ON public.notifications       USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read         ON public.notifications       USING btree (user_id, read);

CREATE INDEX IF NOT EXISTS idx_orders_code                     ON public.orders              USING btree (code);
CREATE INDEX IF NOT EXISTS idx_orders_contract_url             ON public.orders              USING btree (contract_url) WHERE (contract_url IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_orders_created_at               ON public.orders              USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_referred_by              ON public.orders              USING btree (referred_by);
CREATE INDEX IF NOT EXISTS idx_orders_status                   ON public.orders              USING btree (status);
CREATE INDEX IF NOT EXISTS idx_orders_tree_status              ON public.orders              USING btree (tree_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id                  ON public.orders              USING btree (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug               ON public.posts               USING btree (slug);
CREATE        INDEX IF NOT EXISTS idx_posts_status_published   ON public.posts               USING btree (status, published_at DESC);
CREATE        INDEX IF NOT EXISTS idx_posts_tags               ON public.posts               USING gin  (tags);

CREATE INDEX IF NOT EXISTS idx_print_queue_created_at          ON public.print_queue         USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_print_queue_order_id            ON public.print_queue         USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_print_queue_status              ON public.print_queue         USING btree (status);

CREATE INDEX IF NOT EXISTS idx_referral_clicks_created_at      ON public.referral_clicks     USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_order           ON public.referral_clicks     USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_referrer        ON public.referral_clicks     USING btree (referrer_id);

CREATE INDEX IF NOT EXISTS idx_replacement_tasks_assigned_to   ON public.replacement_tasks   USING btree (assigned_to);
CREATE INDEX IF NOT EXISTS idx_replacement_tasks_created_at    ON public.replacement_tasks   USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replacement_tasks_dead_tree     ON public.replacement_tasks   USING btree (dead_tree_id);
CREATE INDEX IF NOT EXISTS idx_replacement_tasks_dead_tree_id  ON public.replacement_tasks   USING btree (dead_tree_id);
CREATE INDEX IF NOT EXISTS idx_replacement_tasks_status        ON public.replacement_tasks   USING btree (status);

CREATE INDEX IF NOT EXISTS idx_system_config_key               ON public.system_config       USING btree (key);

CREATE INDEX IF NOT EXISTS idx_tree_health_logs_changed_at     ON public.tree_health_logs    USING btree (changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tree_health_logs_new_status     ON public.tree_health_logs    USING btree (new_status);
CREATE INDEX IF NOT EXISTS idx_tree_health_logs_tree_id        ON public.tree_health_logs    USING btree (tree_id);

CREATE INDEX IF NOT EXISTS idx_tree_photos_gps                 ON public.tree_photos         USING btree (gps_lat, gps_lng) WHERE ((gps_lat IS NOT NULL) AND (gps_lng IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_tree_photos_lot_id              ON public.tree_photos         USING btree (lot_id);
CREATE INDEX IF NOT EXISTS idx_tree_photos_tree_id             ON public.tree_photos         USING btree (tree_id) WHERE (tree_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_tree_photos_uploaded_at         ON public.tree_photos         USING btree (uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_trees_health_status             ON public.trees               USING btree (health_status);
CREATE INDEX IF NOT EXISTS idx_trees_lot_id                    ON public.trees               USING btree (lot_id);
CREATE INDEX IF NOT EXISTS idx_trees_order_id                  ON public.trees               USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_trees_user_id                   ON public.trees               USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_users_email                     ON public.users               USING btree (email);
CREATE INDEX IF NOT EXISTS idx_users_phone                     ON public.users               USING btree (phone);
CREATE INDEX IF NOT EXISTS idx_users_referral_code             ON public.users               USING btree (referral_code);
CREATE INDEX IF NOT EXISTS idx_users_role                      ON public.users               USING btree (role);

CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at          ON public.withdrawals         USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status              ON public.withdrawals         USING btree (status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id             ON public.withdrawals         USING btree (user_id);


-- =============================================================================
-- 5. TRIGGERS
-- =============================================================================

-- auth.users → public.users  (Supabase built-in hook pattern)
-- NOTE: On local Supabase this trigger must be created on the auth schema.
--       Uncomment only if your local setup supports it.
-- CREATE OR REPLACE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE TRIGGER admin_preferences_updated_at
    BEFORE UPDATE ON public.admin_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_admin_preferences_updated_at();

CREATE OR REPLACE TRIGGER email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_email_templates_updated_at();

CREATE OR REPLACE TRIGGER trigger_update_field_checklists_updated_at
    BEFORE UPDATE ON public.field_checklists
    FOR EACH ROW EXECUTE FUNCTION public.update_field_checklists_updated_at();

CREATE OR REPLACE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER print_queue_updated_at
    BEFORE UPDATE ON public.print_queue
    FOR EACH ROW EXECUTE FUNCTION public.update_print_queue_updated_at();

CREATE OR REPLACE TRIGGER update_replacement_tasks_updated_at
    BEFORE UPDATE ON public.replacement_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_replacement_tasks_updated_at();

CREATE OR REPLACE TRIGGER system_config_updated_at
    BEFORE UPDATE ON public.system_config
    FOR EACH ROW EXECUTE FUNCTION public.update_system_config_updated_at();

-- HTTP webhook triggers — these call Supabase Edge Functions.
-- On local Supabase, supabase_functions.http_request is available via the
-- pg_net extension. Replace the URLs/tokens with your local equivalents or
-- comment out if not needed locally.

-- tree-health-dead-notification
CREATE OR REPLACE TRIGGER "tree-health-dead-notification"
    AFTER INSERT ON public.tree_health_logs
    FOR EACH ROW
    EXECUTE FUNCTION supabase_functions.http_request(
        'https://gzuuyzikjvykjpeixzqk.supabase.co/functions/v1/notify-tree-health',
        'POST',
        '{"Content-type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}',
        '{}',
        '5000'
    );

-- tree-photo-notification
CREATE OR REPLACE TRIGGER "tree-photo-notification"
    AFTER INSERT ON public.tree_photos
    FOR EACH ROW
    EXECUTE FUNCTION supabase_functions.http_request(
        'https://gzuuyzikjvykjpeixzqk.supabase.co/functions/v1/notify-tree-update',
        'POST',
        '{"Content-type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}',
        '{}',
        '5000'
    );


-- =============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on every table
ALTER TABLE public.admin_preferences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casso_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_checklists    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replacement_tasks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_health_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_photos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trees               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals         ENABLE ROW LEVEL SECURITY;

-- ---- admin_preferences ----
CREATE POLICY "Admins can view own preferences"
    ON public.admin_preferences FOR SELECT
    USING ((auth.uid() = user_id) AND (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    )));

CREATE POLICY "Admins can insert own preferences"
    ON public.admin_preferences FOR INSERT
    WITH CHECK ((auth.uid() = user_id) AND (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    )));

CREATE POLICY "Admins can update own preferences"
    ON public.admin_preferences FOR UPDATE
    USING ((auth.uid() = user_id) AND (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    )));

-- ---- casso_transactions ----
CREATE POLICY "admin_read"
    ON public.casso_transactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    ));

CREATE POLICY "service_role_full_access"
    ON public.casso_transactions FOR ALL
    USING (auth.role() = 'service_role'::text);

-- ---- email_templates ----
CREATE POLICY "Admins can view email templates"
    ON public.email_templates FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    ));

CREATE POLICY "Admins can update email templates"
    ON public.email_templates FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    ));

-- ---- field_checklists ----
CREATE POLICY "Admin can view all checklists"
    ON public.field_checklists FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'field_operator'::text])
    ));

CREATE POLICY "Admin can insert checklists"
    ON public.field_checklists FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'field_operator'::text])
    ));

CREATE POLICY "Admin can update checklists"
    ON public.field_checklists FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'field_operator'::text])
    ));

CREATE POLICY "Admin can delete checklists"
    ON public.field_checklists FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'field_operator'::text])
    ));

-- ---- follow_up_tasks ----
CREATE POLICY "Service role can manage all follow_up_tasks"
    ON public.follow_up_tasks FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can view their own tree follow_up_tasks"
    ON public.follow_up_tasks FOR SELECT TO authenticated
    USING (tree_id IN (
        SELECT trees.id FROM trees WHERE trees.user_id = auth.uid()
    ));

-- ---- lots ----
CREATE POLICY "Authenticated users can view lots"
    ON public.lots FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Service role can manage lots"
    ON public.lots FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ---- notifications ----
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Only service role can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK ((auth.uid() = user_id) OR (auth.role() = 'service_role'::text));

CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can delete notifications"
    ON public.notifications FOR DELETE
    USING (auth.role() = 'service_role'::text);

-- ---- orders ----
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
    ON public.orders FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ---- posts ----
CREATE POLICY "public_read_published"
    ON public.posts FOR SELECT
    USING ((status = 'published'::text) AND (published_at <= now()));

CREATE POLICY "admin_full_access"
    ON public.posts FOR ALL
    USING (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    ));

CREATE POLICY "service_role_full_access"
    ON public.posts FOR ALL
    USING (auth.role() = 'service_role'::text);

-- ---- referral_clicks ----
CREATE POLICY "Users can view own referral clicks"
    ON public.referral_clicks FOR SELECT
    USING (auth.uid() = referrer_id);

CREATE POLICY "Service role full access"
    ON public.referral_clicks FOR ALL
    USING (auth.role() = 'service_role'::text);

-- ---- replacement_tasks ----
CREATE POLICY "Users can view their own tree replacement tasks"
    ON public.replacement_tasks FOR SELECT TO authenticated
    USING (dead_tree_id IN (
        SELECT trees.id FROM trees WHERE trees.user_id = auth.uid()
    ));

CREATE POLICY "Field operators can view assigned tasks"
    ON public.replacement_tasks FOR SELECT TO authenticated
    USING ((assigned_to = auth.uid()) OR (assigned_to IS NULL));

CREATE POLICY "Service role can manage replacement_tasks"
    ON public.replacement_tasks FOR ALL
    USING (auth.role() = 'service_role'::text);

CREATE POLICY "Service role can manage all replacement_tasks"
    ON public.replacement_tasks FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ---- system_config ----
CREATE POLICY "Admins can view system config"
    ON public.system_config FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    ));

CREATE POLICY "Admins can insert system config"
    ON public.system_config FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    ));

CREATE POLICY "Admins can update system config"
    ON public.system_config FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid()
          AND users.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    ));

-- ---- tree_health_logs ----
CREATE POLICY "Users can view logs for their trees"
    ON public.tree_health_logs FOR SELECT TO authenticated
    USING (tree_id IN (
        SELECT trees.id FROM trees WHERE trees.user_id = auth.uid()
    ));

CREATE POLICY "Users can view their own tree health logs"
    ON public.tree_health_logs FOR SELECT TO authenticated
    USING (tree_id IN (
        SELECT trees.id FROM trees WHERE trees.user_id = auth.uid()
    ));

CREATE POLICY "Service role can manage tree_health_logs"
    ON public.tree_health_logs FOR ALL
    USING (auth.role() = 'service_role'::text);

CREATE POLICY "Service role can manage all tree_health_logs"
    ON public.tree_health_logs FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ---- tree_photos ----
CREATE POLICY "Authenticated users can view tree_photos"
    ON public.tree_photos FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Service role can manage tree_photos"
    ON public.tree_photos FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ---- trees ----
CREATE POLICY "Users can view their own trees"
    ON public.trees FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can update tree health_status"
    ON public.trees FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'::text
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'::text
    ));

CREATE POLICY "Service role can manage trees"
    ON public.trees FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ---- users ----
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- ---- withdrawals ----
CREATE POLICY "Users can view own withdrawals"
    ON public.withdrawals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own withdrawals"
    ON public.withdrawals FOR INSERT
    WITH CHECK ((auth.uid() = user_id) AND (status = 'pending'::text));

CREATE POLICY "Service role full access"
    ON public.withdrawals FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);


-- =============================================================================
-- END OF SCHEMA SNAPSHOT
-- =============================================================================
