-- Migration: 20261010000000_content_i18n.sql
-- Description: Content Database i18n, Admin VI/EN Entry & Dynamic Sitemap (Story 14.4)

-- 1. Add translations JSONB column to content tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE lots ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb NOT NULL;

-- 2. GIN indexes for efficient JSONB querying
CREATE INDEX IF NOT EXISTS idx_products_translations ON products USING GIN (translations);
CREATE INDEX IF NOT EXISTS idx_product_categories_translations ON product_categories USING GIN (translations);
CREATE INDEX IF NOT EXISTS idx_rooms_translations ON rooms USING GIN (translations);
CREATE INDEX IF NOT EXISTS idx_lots_translations ON lots USING GIN (translations);
CREATE INDEX IF NOT EXISTS idx_notifications_translations ON notifications USING GIN (translations);
CREATE INDEX IF NOT EXISTS idx_email_templates_translations ON email_templates USING GIN (translations);

-- 3. Drop NOT NULL on notifications.title (allows body-only notifications or translated titles)
ALTER TABLE notifications ALTER COLUMN title DROP NOT NULL;

-- 4. Backfill Vietnamese translations mirror for main text columns (idempotent, only if vi missing)
UPDATE products
SET translations = COALESCE(translations, '{}'::jsonb) || jsonb_build_object('vi', jsonb_build_object('name', name, 'description', description))
WHERE translations->'vi' IS NULL;

UPDATE product_categories
SET translations = COALESCE(translations, '{}'::jsonb) || jsonb_build_object('vi', jsonb_build_object('name', name, 'description', description))
WHERE translations->'vi' IS NULL;

UPDATE rooms
SET translations = COALESCE(translations, '{}'::jsonb) || jsonb_build_object('vi', jsonb_build_object('name', name, 'description', description))
WHERE translations->'vi' IS NULL;

UPDATE lots
SET translations = COALESCE(translations, '{}'::jsonb) || jsonb_build_object('vi', jsonb_build_object('name', name, 'description', description, 'region', region))
WHERE translations->'vi' IS NULL;

UPDATE notifications
SET translations = COALESCE(translations, '{}'::jsonb) || jsonb_build_object('vi', jsonb_build_object('title', title, 'body', body))
WHERE translations->'vi' IS NULL;

UPDATE email_templates
SET translations = COALESCE(translations, '{}'::jsonb) || jsonb_build_object('vi', jsonb_build_object('subject', subject, 'html_body', html_body))
WHERE translations->'vi' IS NULL;

-- 5. Backfill English translations for 4 seed product categories (merge with existing vi)
UPDATE product_categories
SET translations = COALESCE(translations, '{}'::jsonb) || jsonb_build_object('en', jsonb_build_object('name', 'Agarwood Perfume'))
WHERE slug = 'nuoc-hoa' AND translations->'en' IS NULL;

UPDATE product_categories
SET translations = COALESCE(translations, '{}'::jsonb) || jsonb_build_object('en', jsonb_build_object('name', 'Agarwood Essential Oil'))
WHERE slug = 'tinh-dau' AND translations->'en' IS NULL;

UPDATE product_categories
SET translations = COALESCE(translations, '{}'::jsonb) || jsonb_build_object('en', jsonb_build_object('name', 'Incense & Agarwood Sticks'))
WHERE slug = 'huong-lieu' AND translations->'en' IS NULL;

UPDATE product_categories
SET translations = COALESCE(translations, '{}'::jsonb) || jsonb_build_object('en', jsonb_build_object('name', 'Handicrafts'))
WHERE slug = 'thu-cong' AND translations->'en' IS NULL;

-- 6. Create post_translations table for long-form blog content
CREATE TABLE IF NOT EXISTS post_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    locale TEXT NOT NULL CHECK (locale IN ('vi', 'en')),
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT,
    meta_title TEXT,
    meta_desc TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_post_translations_locale_slug UNIQUE (locale, slug),
    CONSTRAINT uq_post_translations_post_locale UNIQUE (post_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_post_translations_post_id ON post_translations (post_id);
CREATE INDEX IF NOT EXISTS idx_post_translations_locale_slug ON post_translations (locale, slug);

-- 7. Enable RLS on post_translations
ALTER TABLE post_translations ENABLE ROW LEVEL SECURITY;

-- Public read access: allow reading translations of published posts
CREATE POLICY "Public read published post translations"
    ON post_translations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_translations.post_id
              AND posts.status = 'published'
              AND posts.published_at <= now()
        )
        OR (
            auth.role() = 'authenticated' AND EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                  AND users.role IN ('admin', 'super_admin')
            )
        )
    );

-- Admin & editor write access
CREATE POLICY "Admin and editor write post translations"
    ON post_translations
    FOR ALL
    USING (
        auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role IN ('admin', 'super_admin')
        )
    );
