


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."backfill_missing_user_profiles"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."backfill_missing_user_profiles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_sql"("sql" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  EXECUTE sql;
END;
$$;


ALTER FUNCTION "public"."execute_sql"("sql" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_referral_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."generate_referral_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_harvest_ready_trees"() RETURNS TABLE("id" "uuid", "tree_code" "text", "order_id" "uuid", "user_id" "uuid", "user_email" "text", "planted_at" timestamp with time zone, "age_months" integer, "co2_absorbed" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_harvest_ready_trees"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."slugify_for_referral"("input_text" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  slug TEXT;
BEGIN
  slug := unaccent(input_text);
  slug := lower(slug);
  slug := regexp_replace(slug, '[^a-z0-9]', '', 'g');
  slug := left(slug, 20);
  RETURN slug;
END;
$$;


ALTER FUNCTION "public"."slugify_for_referral"("input_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_admin_preferences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_admin_preferences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_email_templates_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_email_templates_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_field_checklists_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_field_checklists_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_print_queue_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_print_queue_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_replacement_tasks_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_replacement_tasks_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_system_config_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_system_config_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_preferences" (
    "user_id" "uuid" NOT NULL,
    "email_notifications" "jsonb" DEFAULT '{"alerts": true, "orders": true, "withdrawals": true}'::"jsonb",
    "in_app_sound" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."casso_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "casso_id" bigint,
    "casso_tid" "text" NOT NULL,
    "amount" bigint NOT NULL,
    "description" "text",
    "bank_account" "text",
    "transaction_at" timestamp with time zone,
    "raw_payload" "jsonb",
    "status" "text" DEFAULT 'processing'::"text" NOT NULL,
    "note" "text",
    "order_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."casso_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "email_type" "text" NOT NULL,
    "recipient" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "resend_id" "text",
    "error_message" "text",
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "template_key" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "html_body" "text" NOT NULL,
    "variables" "jsonb",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."field_checklists" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lot_id" "uuid" NOT NULL,
    "quarter" "text" NOT NULL,
    "checklist_items" "jsonb" DEFAULT '[]'::"jsonb",
    "overall_status" "text" DEFAULT 'pending'::"text",
    "due_date" "date" NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."field_checklists" OWNER TO "postgres";


COMMENT ON TABLE "public"."field_checklists" IS 'Quarterly field operations checklists for lot maintenance tracking';



COMMENT ON COLUMN "public"."field_checklists"."quarter" IS 'Format: YYYY-QN (e.g., 2026-Q1)';



COMMENT ON COLUMN "public"."field_checklists"."checklist_items" IS 'JSONB array of checklist items';



CREATE TABLE IF NOT EXISTS "public"."follow_up_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tree_id" "uuid" NOT NULL,
    "health_log_id" "uuid" NOT NULL,
    "due_date" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "completed_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "follow_up_tasks_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."follow_up_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lots" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "region" "text" NOT NULL,
    "description" "text",
    "location_lat" numeric(10,7),
    "location_lng" numeric(10,7),
    "total_trees" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "planted" integer DEFAULT 0,
    CONSTRAINT "check_planted_capacity" CHECK (("planted" <= "total_trees"))
);


ALTER TABLE "public"."lots" OWNER TO "postgres";


COMMENT ON TABLE "public"."lots" IS 'Planting lots/areas where trees are planted. Used for grouping trees and photos.';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "data" "jsonb",
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Stores user notifications for tree updates, order status changes, and quarterly reports. Realtime-enabled for live updates.';



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "user_id" "uuid",
    "quantity" integer NOT NULL,
    "total_amount" numeric NOT NULL,
    "payment_method" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tree_status" "text" DEFAULT 'pending'::"text",
    "planted_at" timestamp with time zone,
    "lot_id" "uuid",
    "latest_photo_url" "text",
    "co2_absorbed" numeric(10,2) DEFAULT 0,
    "order_code" "text",
    "contract_url" "text",
    "referred_by" "uuid",
    "user_email" "text",
    "user_name" "text",
    "dob" "date",
    "nationality" "text" DEFAULT 'Việt Nam'::"text",
    "id_number" "text",
    "id_issue_date" "date",
    "id_issue_place" "text",
    "address" "text",
    "phone" "text",
    "claimed_at" timestamp with time zone,
    "verified_at" timestamp with time zone,
    "payment_proof_url" "text",
    "approved_by" "text",
    "approved_at" timestamp with time zone,
    CONSTRAINT "orders_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['banking'::"text", 'usdt'::"text"]))),
    CONSTRAINT "orders_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'manual_payment_claimed'::"text", 'verified'::"text", 'completed'::"text", 'assigned'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "orders_total_amount_check" CHECK (("total_amount" > (0)::numeric))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."orders"."tree_status" IS 'Status of trees in this package: pending, seedling, planted, growing, mature, harvested, dead';



COMMENT ON COLUMN "public"."orders"."planted_at" IS 'Actual date when trees were planted in the field';



COMMENT ON COLUMN "public"."orders"."lot_id" IS 'Reference to the planting lot where trees are located';



COMMENT ON COLUMN "public"."orders"."co2_absorbed" IS 'Total CO2 absorbed by all trees in this package (kg)';



COMMENT ON COLUMN "public"."orders"."order_code" IS 'User-friendly order code: PKG-YYYY-XXXXX';



COMMENT ON COLUMN "public"."orders"."referred_by" IS 'User ID of the referrer who brought this customer';



COMMENT ON COLUMN "public"."orders"."user_email" IS 'User email address, stored at order creation time for webhook processing';



COMMENT ON COLUMN "public"."orders"."user_name" IS 'User display name, stored at order creation time for contract/email generation';



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text",
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "cover_image" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "published_at" timestamp with time zone,
    "scheduled_at" timestamp with time zone,
    "author_id" "uuid",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "meta_title" "text",
    "meta_desc" "text",
    "view_count" bigint DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "posts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'scheduled'::"text"])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."print_queue" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "printed_at" timestamp with time zone,
    "shipped_at" timestamp with time zone,
    "tracking_number" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "print_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'printed'::"text", 'shipped'::"text"])))
);


ALTER TABLE "public"."print_queue" OWNER TO "postgres";


COMMENT ON TABLE "public"."print_queue" IS 'Queue for managing physical contract printing and postal delivery';



COMMENT ON COLUMN "public"."print_queue"."status" IS 'Status: pending (awaiting print), printed (ready to ship), shipped (delivered to postal service)';



CREATE TABLE IF NOT EXISTS "public"."referral_clicks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "ip_hash" "text",
    "user_agent" "text",
    "converted" boolean DEFAULT false,
    "order_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."referral_clicks" OWNER TO "postgres";


COMMENT ON TABLE "public"."referral_clicks" IS 'Tracks clicks on referral links and conversions to orders';



COMMENT ON COLUMN "public"."referral_clicks"."ip_hash" IS 'SHA-256 hashed IP address for privacy compliance';



COMMENT ON COLUMN "public"."referral_clicks"."converted" IS 'True when the click resulted in a completed order';



CREATE TABLE IF NOT EXISTS "public"."replacement_tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "dead_tree_id" "uuid" NOT NULL,
    "new_tree_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "assigned_to" "uuid",
    "notes" "text",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "assigned_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "replacement_tasks_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'assigned'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."replacement_tasks" OWNER TO "postgres";


COMMENT ON TABLE "public"."replacement_tasks" IS 'Tasks to replace dead trees with new ones';



COMMENT ON COLUMN "public"."replacement_tasks"."dead_tree_id" IS 'Reference to the dead tree that needs replacement';



COMMENT ON COLUMN "public"."replacement_tasks"."new_tree_id" IS 'Reference to the new replacement tree (NULL until planted)';



COMMENT ON COLUMN "public"."replacement_tasks"."status" IS 'Task status: pending, assigned, in_progress, completed, cancelled';



COMMENT ON COLUMN "public"."replacement_tasks"."assigned_to" IS 'Field operator assigned to this replacement task';



COMMENT ON COLUMN "public"."replacement_tasks"."reason" IS 'Reason why the tree died (from health log notes)';



CREATE TABLE IF NOT EXISTS "public"."system_config" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tree_health_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tree_id" "uuid" NOT NULL,
    "old_status" "text",
    "new_status" "text" NOT NULL,
    "notes" "text",
    "treatment_details" "text",
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tree_health_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."tree_health_logs" IS 'Audit log of all tree health status changes';



COMMENT ON COLUMN "public"."tree_health_logs"."old_status" IS 'Previous health status before change';



COMMENT ON COLUMN "public"."tree_health_logs"."new_status" IS 'New health status after change';



COMMENT ON COLUMN "public"."tree_health_logs"."treatment_details" IS 'Details of treatment plan for sick trees';



COMMENT ON COLUMN "public"."tree_health_logs"."changed_by" IS 'User who made the status change (typically field operator)';



CREATE TABLE IF NOT EXISTS "public"."tree_photos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lot_id" "uuid" NOT NULL,
    "photo_url" "text" NOT NULL,
    "caption" "text",
    "taken_at" timestamp with time zone,
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "gps_lat" numeric(10,7),
    "gps_lng" numeric(10,7),
    "gps_accuracy" numeric(6,2),
    "tree_id" "uuid"
);


ALTER TABLE "public"."tree_photos" OWNER TO "postgres";


COMMENT ON TABLE "public"."tree_photos" IS 'Photos uploaded for tree lots. Triggers webhook for user notifications.';



COMMENT ON COLUMN "public"."tree_photos"."lot_id" IS 'Reference to the lot where photo was taken';



COMMENT ON COLUMN "public"."tree_photos"."taken_at" IS 'Optional date when photo was actually taken';



COMMENT ON COLUMN "public"."tree_photos"."uploaded_at" IS 'Timestamp when photo was uploaded - triggers webhook';



COMMENT ON COLUMN "public"."tree_photos"."gps_lat" IS 'GPS latitude extracted from photo EXIF data (-90 to 90)';



COMMENT ON COLUMN "public"."tree_photos"."gps_lng" IS 'GPS longitude extracted from photo EXIF data (-180 to 180)';



COMMENT ON COLUMN "public"."tree_photos"."gps_accuracy" IS 'GPS accuracy in meters from EXIF GPSHPositioningError';



COMMENT ON COLUMN "public"."tree_photos"."tree_id" IS 'Optional reference to specific tree. If NULL, photo applies to entire lot.';



CREATE TABLE IF NOT EXISTS "public"."trees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'active'::"text",
    "lot_id" "uuid",
    "planted_at" timestamp with time zone,
    "health_status" "text" DEFAULT 'healthy'::"text",
    CONSTRAINT "trees_health_status_check" CHECK (("health_status" = ANY (ARRAY['healthy'::"text", 'sick'::"text", 'dead'::"text"])))
);


ALTER TABLE "public"."trees" OWNER TO "postgres";


COMMENT ON TABLE "public"."trees" IS 'Individual tree records assigned to users from orders. RLS allows users to view own trees, service role has full access for admin operations.';



COMMENT ON COLUMN "public"."trees"."lot_id" IS 'Reference to the lot where this tree is planted (nullable)';



COMMENT ON COLUMN "public"."trees"."planted_at" IS 'Timestamp when tree was actually planted in the field';



COMMENT ON COLUMN "public"."trees"."health_status" IS 'Health status of individual tree: healthy (default), sick (needs treatment), dead (needs replacement)';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "phone" "text",
    "email" "text",
    "full_name" "text",
    "referral_code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'user'::"text",
    "referred_by_user_id" "uuid",
    "id_number" "text",
    "date_of_birth" "date"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."withdrawals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "bank_name" "text" NOT NULL,
    "bank_account_number" "text" NOT NULL,
    "bank_account_name" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "proof_image_url" "text",
    "rejection_reason" "text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "withdrawals_amount_check" CHECK (("amount" >= (200000)::numeric)),
    CONSTRAINT "withdrawals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."withdrawals" OWNER TO "postgres";


COMMENT ON TABLE "public"."withdrawals" IS 'Stores referral commission withdrawal requests from users';



COMMENT ON COLUMN "public"."withdrawals"."amount" IS 'Withdrawal amount in VND, minimum 200,000';



COMMENT ON COLUMN "public"."withdrawals"."status" IS 'Withdrawal status: pending, approved, or rejected';



COMMENT ON COLUMN "public"."withdrawals"."proof_image_url" IS 'URL to proof of transfer image uploaded by admin';



ALTER TABLE ONLY "public"."admin_preferences"
    ADD CONSTRAINT "admin_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."casso_transactions"
    ADD CONSTRAINT "casso_transactions_casso_tid_key" UNIQUE ("casso_tid");



ALTER TABLE ONLY "public"."casso_transactions"
    ADD CONSTRAINT "casso_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_template_key_key" UNIQUE ("template_key");



ALTER TABLE ONLY "public"."field_checklists"
    ADD CONSTRAINT "field_checklists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follow_up_tasks"
    ADD CONSTRAINT "follow_up_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "lots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."print_queue"
    ADD CONSTRAINT "print_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_clicks"
    ADD CONSTRAINT "referral_clicks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."replacement_tasks"
    ADD CONSTRAINT "replacement_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tree_health_logs"
    ADD CONSTRAINT "tree_health_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tree_photos"
    ADD CONSTRAINT "tree_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trees"
    ADD CONSTRAINT "trees_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."trees"
    ADD CONSTRAINT "trees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_preferences_user_id" ON "public"."admin_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_casso_transactions_created" ON "public"."casso_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_casso_transactions_order" ON "public"."casso_transactions" USING "btree" ("order_id");



CREATE INDEX "idx_casso_transactions_status" ON "public"."casso_transactions" USING "btree" ("status");



CREATE INDEX "idx_casso_transactions_tid" ON "public"."casso_transactions" USING "btree" ("casso_tid");



CREATE INDEX "idx_email_logs_order_id" ON "public"."email_logs" USING "btree" ("order_id");



CREATE INDEX "idx_email_templates_key" ON "public"."email_templates" USING "btree" ("template_key");



CREATE INDEX "idx_field_checklists_due_date" ON "public"."field_checklists" USING "btree" ("due_date");



CREATE INDEX "idx_field_checklists_lot_id" ON "public"."field_checklists" USING "btree" ("lot_id");



CREATE INDEX "idx_field_checklists_lot_quarter" ON "public"."field_checklists" USING "btree" ("lot_id", "quarter");



CREATE INDEX "idx_field_checklists_quarter" ON "public"."field_checklists" USING "btree" ("quarter");



CREATE INDEX "idx_field_checklists_status" ON "public"."field_checklists" USING "btree" ("overall_status");



CREATE INDEX "idx_follow_up_tasks_due_date" ON "public"."follow_up_tasks" USING "btree" ("due_date");



CREATE INDEX "idx_follow_up_tasks_status" ON "public"."follow_up_tasks" USING "btree" ("status");



CREATE INDEX "idx_follow_up_tasks_tree_id" ON "public"."follow_up_tasks" USING "btree" ("tree_id");



CREATE INDEX "idx_lots_capacity" ON "public"."lots" USING "btree" ("planted", "total_trees");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_user_read" ON "public"."notifications" USING "btree" ("user_id", "read");



CREATE INDEX "idx_orders_claimed_at" ON "public"."orders" USING "btree" ("claimed_at" DESC) WHERE ("status" = 'manual_payment_claimed'::"text");



CREATE INDEX "idx_orders_code" ON "public"."orders" USING "btree" ("code");



CREATE INDEX "idx_orders_contract_url" ON "public"."orders" USING "btree" ("contract_url") WHERE ("contract_url" IS NOT NULL);



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_orders_manual_payment_claimed" ON "public"."orders" USING "btree" ("user_id", "status") WHERE ("status" = 'manual_payment_claimed'::"text");



CREATE INDEX "idx_orders_referred_by" ON "public"."orders" USING "btree" ("referred_by");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_tree_status" ON "public"."orders" USING "btree" ("tree_status");



CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_posts_slug" ON "public"."posts" USING "btree" ("slug");



CREATE INDEX "idx_posts_status_published" ON "public"."posts" USING "btree" ("status", "published_at" DESC);



CREATE INDEX "idx_posts_tags" ON "public"."posts" USING "gin" ("tags");



CREATE INDEX "idx_print_queue_created_at" ON "public"."print_queue" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_print_queue_order_id" ON "public"."print_queue" USING "btree" ("order_id");



CREATE INDEX "idx_print_queue_status" ON "public"."print_queue" USING "btree" ("status");



CREATE INDEX "idx_referral_clicks_created_at" ON "public"."referral_clicks" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_referral_clicks_order" ON "public"."referral_clicks" USING "btree" ("order_id");



CREATE INDEX "idx_referral_clicks_referrer" ON "public"."referral_clicks" USING "btree" ("referrer_id");



CREATE INDEX "idx_replacement_tasks_assigned_to" ON "public"."replacement_tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_replacement_tasks_created_at" ON "public"."replacement_tasks" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_replacement_tasks_dead_tree" ON "public"."replacement_tasks" USING "btree" ("dead_tree_id");



CREATE INDEX "idx_replacement_tasks_dead_tree_id" ON "public"."replacement_tasks" USING "btree" ("dead_tree_id");



CREATE INDEX "idx_replacement_tasks_status" ON "public"."replacement_tasks" USING "btree" ("status");



CREATE INDEX "idx_system_config_key" ON "public"."system_config" USING "btree" ("key");



CREATE INDEX "idx_tree_health_logs_changed_at" ON "public"."tree_health_logs" USING "btree" ("changed_at" DESC);



CREATE INDEX "idx_tree_health_logs_new_status" ON "public"."tree_health_logs" USING "btree" ("new_status");



CREATE INDEX "idx_tree_health_logs_tree_id" ON "public"."tree_health_logs" USING "btree" ("tree_id");



CREATE INDEX "idx_tree_photos_gps" ON "public"."tree_photos" USING "btree" ("gps_lat", "gps_lng") WHERE (("gps_lat" IS NOT NULL) AND ("gps_lng" IS NOT NULL));



CREATE INDEX "idx_tree_photos_lot_id" ON "public"."tree_photos" USING "btree" ("lot_id");



CREATE INDEX "idx_tree_photos_tree_id" ON "public"."tree_photos" USING "btree" ("tree_id") WHERE ("tree_id" IS NOT NULL);



CREATE INDEX "idx_tree_photos_uploaded_at" ON "public"."tree_photos" USING "btree" ("uploaded_at" DESC);



CREATE INDEX "idx_trees_health_status" ON "public"."trees" USING "btree" ("health_status");



CREATE INDEX "idx_trees_lot_id" ON "public"."trees" USING "btree" ("lot_id");



CREATE INDEX "idx_trees_order_id" ON "public"."trees" USING "btree" ("order_id");



CREATE INDEX "idx_trees_user_id" ON "public"."trees" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_phone" ON "public"."users" USING "btree" ("phone");



CREATE INDEX "idx_users_referral_code" ON "public"."users" USING "btree" ("referral_code");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_withdrawals_created_at" ON "public"."withdrawals" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_withdrawals_status" ON "public"."withdrawals" USING "btree" ("status");



CREATE INDEX "idx_withdrawals_user_id" ON "public"."withdrawals" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "admin_preferences_updated_at" BEFORE UPDATE ON "public"."admin_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_admin_preferences_updated_at"();



CREATE OR REPLACE TRIGGER "email_templates_updated_at" BEFORE UPDATE ON "public"."email_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_email_templates_updated_at"();



CREATE OR REPLACE TRIGGER "print_queue_updated_at" BEFORE UPDATE ON "public"."print_queue" FOR EACH ROW EXECUTE FUNCTION "public"."update_print_queue_updated_at"();



CREATE OR REPLACE TRIGGER "system_config_updated_at" BEFORE UPDATE ON "public"."system_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_system_config_updated_at"();



CREATE OR REPLACE TRIGGER "tree-health-dead-notification" AFTER INSERT ON "public"."tree_health_logs" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://gzuuyzikjvykjpeixzqk.supabase.co/functions/v1/notify-tree-health', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dXV5emlranZ5a2pwZWl4enFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA0Mjk4NiwiZXhwIjoyMDgzNjE4OTg2fQ._peCNxZb8juCAvvNxvp6RB_37f17_8ToZPY-aJNaxE4"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "tree-photo-notification" AFTER INSERT ON "public"."tree_photos" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://gzuuyzikjvykjpeixzqk.supabase.co/functions/v1/notify-tree-update', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dXV5emlranZ5a2pwZWl4enFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTU0NjgxNiwiZXhwIjoyMDUxMTIyODE2fQ.Gvb_sCNxZb8juCAvvNxvpF4_Rl7f17_8ToZPY-aJNaxE4"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "trigger_update_field_checklists_updated_at" BEFORE UPDATE ON "public"."field_checklists" FOR EACH ROW EXECUTE FUNCTION "public"."update_field_checklists_updated_at"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_posts_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_replacement_tasks_updated_at" BEFORE UPDATE ON "public"."replacement_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_replacement_tasks_updated_at"();



ALTER TABLE ONLY "public"."admin_preferences"
    ADD CONSTRAINT "admin_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."casso_transactions"
    ADD CONSTRAINT "casso_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."field_checklists"
    ADD CONSTRAINT "field_checklists_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "fk_orders_lot_id" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."follow_up_tasks"
    ADD CONSTRAINT "follow_up_tasks_health_log_id_fkey" FOREIGN KEY ("health_log_id") REFERENCES "public"."tree_health_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follow_up_tasks"
    ADD CONSTRAINT "follow_up_tasks_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "public"."trees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."print_queue"
    ADD CONSTRAINT "print_queue_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_clicks"
    ADD CONSTRAINT "referral_clicks_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."referral_clicks"
    ADD CONSTRAINT "referral_clicks_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."replacement_tasks"
    ADD CONSTRAINT "replacement_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."replacement_tasks"
    ADD CONSTRAINT "replacement_tasks_dead_tree_id_fkey" FOREIGN KEY ("dead_tree_id") REFERENCES "public"."trees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."replacement_tasks"
    ADD CONSTRAINT "replacement_tasks_new_tree_id_fkey" FOREIGN KEY ("new_tree_id") REFERENCES "public"."trees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tree_health_logs"
    ADD CONSTRAINT "tree_health_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."tree_health_logs"
    ADD CONSTRAINT "tree_health_logs_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "public"."trees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tree_photos"
    ADD CONSTRAINT "tree_photos_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tree_photos"
    ADD CONSTRAINT "tree_photos_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "public"."trees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trees"
    ADD CONSTRAINT "trees_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trees"
    ADD CONSTRAINT "trees_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trees"
    ADD CONSTRAINT "trees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_referred_by_user_id_fkey" FOREIGN KEY ("referred_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_user_id_public_users_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



CREATE POLICY "Admin can delete checklists" ON "public"."field_checklists" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'field_operator'::"text"]))))));



CREATE POLICY "Admin can insert checklists" ON "public"."field_checklists" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'field_operator'::"text"]))))));



CREATE POLICY "Admin can update checklists" ON "public"."field_checklists" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'field_operator'::"text"]))))));



CREATE POLICY "Admin can view all checklists" ON "public"."field_checklists" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'field_operator'::"text"]))))));



CREATE POLICY "Admins can insert own preferences" ON "public"."admin_preferences" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))));



CREATE POLICY "Admins can insert system config" ON "public"."system_config" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can update email templates" ON "public"."email_templates" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can update own preferences" ON "public"."admin_preferences" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))));



CREATE POLICY "Admins can update system config" ON "public"."system_config" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can update tree health_status" ON "public"."trees" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view email templates" ON "public"."email_templates" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can view own preferences" ON "public"."admin_preferences" FOR SELECT USING ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))));



CREATE POLICY "Admins can view system config" ON "public"."system_config" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Authenticated users can view lots" ON "public"."lots" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view tree_photos" ON "public"."tree_photos" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Field operators can view assigned tasks" ON "public"."replacement_tasks" FOR SELECT TO "authenticated" USING ((("assigned_to" = "auth"."uid"()) OR ("assigned_to" IS NULL)));



CREATE POLICY "Only service role can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("auth"."role"() = 'service_role'::"text")));



CREATE POLICY "Service role can access all users" ON "public"."users" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can delete notifications" ON "public"."notifications" FOR DELETE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all follow_up_tasks" ON "public"."follow_up_tasks" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage all replacement_tasks" ON "public"."replacement_tasks" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage all tree_health_logs" ON "public"."tree_health_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage lots" ON "public"."lots" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage replacement_tasks" ON "public"."replacement_tasks" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage tree_health_logs" ON "public"."tree_health_logs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage tree_photos" ON "public"."tree_photos" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage trees" ON "public"."trees" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access" ON "public"."orders" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access" ON "public"."referral_clicks" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access" ON "public"."withdrawals" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create own withdrawals" ON "public"."withdrawals" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND ("status" = 'pending'::"text")));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view logs for their trees" ON "public"."tree_health_logs" FOR SELECT TO "authenticated" USING (("tree_id" IN ( SELECT "trees"."id"
   FROM "public"."trees"
  WHERE ("trees"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own referral clicks" ON "public"."referral_clicks" FOR SELECT USING (("auth"."uid"() = "referrer_id"));



CREATE POLICY "Users can view own withdrawals" ON "public"."withdrawals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own tree follow_up_tasks" ON "public"."follow_up_tasks" FOR SELECT TO "authenticated" USING (("tree_id" IN ( SELECT "trees"."id"
   FROM "public"."trees"
  WHERE ("trees"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own tree health logs" ON "public"."tree_health_logs" FOR SELECT TO "authenticated" USING (("tree_id" IN ( SELECT "trees"."id"
   FROM "public"."trees"
  WHERE ("trees"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own tree replacement tasks" ON "public"."replacement_tasks" FOR SELECT TO "authenticated" USING (("dead_tree_id" IN ( SELECT "trees"."id"
   FROM "public"."trees"
  WHERE ("trees"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own trees" ON "public"."trees" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "admin_full_access" ON "public"."posts" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



ALTER TABLE "public"."admin_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_read" ON "public"."casso_transactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



ALTER TABLE "public"."casso_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."field_checklists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follow_up_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_read_published" ON "public"."posts" FOR SELECT USING ((("status" = 'published'::"text") AND ("published_at" <= "now"())));



ALTER TABLE "public"."referral_clicks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."replacement_tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_full_access" ON "public"."casso_transactions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service_role_full_access" ON "public"."posts" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."system_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tree_health_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tree_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."withdrawals" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."tree_photos";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."backfill_missing_user_profiles"() TO "anon";
GRANT ALL ON FUNCTION "public"."backfill_missing_user_profiles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."backfill_missing_user_profiles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_sql"("sql" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_sql"("sql" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_sql"("sql" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_harvest_ready_trees"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_harvest_ready_trees"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_harvest_ready_trees"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."slugify_for_referral"("input_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."slugify_for_referral"("input_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."slugify_for_referral"("input_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_admin_preferences_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_admin_preferences_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_admin_preferences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_email_templates_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_email_templates_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_email_templates_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_field_checklists_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_field_checklists_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_field_checklists_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_print_queue_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_print_queue_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_print_queue_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_replacement_tasks_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_replacement_tasks_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_replacement_tasks_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_system_config_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_system_config_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_system_config_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."admin_preferences" TO "anon";
GRANT ALL ON TABLE "public"."admin_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."casso_transactions" TO "anon";
GRANT ALL ON TABLE "public"."casso_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."casso_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."email_logs" TO "anon";
GRANT ALL ON TABLE "public"."email_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."email_logs" TO "service_role";



GRANT ALL ON TABLE "public"."email_templates" TO "anon";
GRANT ALL ON TABLE "public"."email_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."email_templates" TO "service_role";



GRANT ALL ON TABLE "public"."field_checklists" TO "anon";
GRANT ALL ON TABLE "public"."field_checklists" TO "authenticated";
GRANT ALL ON TABLE "public"."field_checklists" TO "service_role";



GRANT ALL ON TABLE "public"."follow_up_tasks" TO "anon";
GRANT ALL ON TABLE "public"."follow_up_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."follow_up_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."lots" TO "anon";
GRANT ALL ON TABLE "public"."lots" TO "authenticated";
GRANT ALL ON TABLE "public"."lots" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."print_queue" TO "anon";
GRANT ALL ON TABLE "public"."print_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."print_queue" TO "service_role";



GRANT ALL ON TABLE "public"."referral_clicks" TO "anon";
GRANT ALL ON TABLE "public"."referral_clicks" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_clicks" TO "service_role";



GRANT ALL ON TABLE "public"."replacement_tasks" TO "anon";
GRANT ALL ON TABLE "public"."replacement_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."replacement_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."system_config" TO "anon";
GRANT ALL ON TABLE "public"."system_config" TO "authenticated";
GRANT ALL ON TABLE "public"."system_config" TO "service_role";



GRANT ALL ON TABLE "public"."tree_health_logs" TO "anon";
GRANT ALL ON TABLE "public"."tree_health_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."tree_health_logs" TO "service_role";



GRANT ALL ON TABLE "public"."tree_photos" TO "anon";
GRANT ALL ON TABLE "public"."tree_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."tree_photos" TO "service_role";



GRANT ALL ON TABLE "public"."trees" TO "anon";
GRANT ALL ON TABLE "public"."trees" TO "authenticated";
GRANT ALL ON TABLE "public"."trees" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."withdrawals" TO "anon";
GRANT ALL ON TABLE "public"."withdrawals" TO "authenticated";
GRANT ALL ON TABLE "public"."withdrawals" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































