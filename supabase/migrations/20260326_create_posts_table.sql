-- Create posts table for blog
CREATE TABLE IF NOT EXISTS posts (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text NOT NULL,
  slug          text UNIQUE NOT NULL,
  excerpt       text,
  content       text NOT NULL DEFAULT '',
  cover_image   text,
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at  timestamptz,
  scheduled_at  timestamptz,
  author_id     uuid REFERENCES auth.users(id),
  tags          text[] DEFAULT '{}',
  meta_title    text,
  meta_desc     text,
  view_count    bigint DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status_published ON posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING gin(tags);

-- Auto update updated_at trigger (function already exists from orders migration)
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public: read published posts only
CREATE POLICY "public_read_published" ON posts FOR SELECT
  USING (status = 'published' AND published_at <= now());

-- Admin: full access
CREATE POLICY "admin_full_access" ON posts
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Service role: full access (bypasses RLS automatically, but explicit for clarity)
CREATE POLICY "service_role_full_access" ON posts
  USING (auth.role() = 'service_role');
