-- Create withdrawals storage bucket for proof-of-transfer images uploaded by admin
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'withdrawals',
    'withdrawals',
    true,  -- Public so proof image URL is accessible in emails/UI
    5242880,  -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow only admins to upload proof images (check role in public.users)
DO $$ BEGIN
  CREATE POLICY "Admins can upload withdrawal proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'withdrawals'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow public read (bucket is public for proof image URLs in emails)
DO $$ BEGIN
  CREATE POLICY "Public can view withdrawal proofs"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'withdrawals');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow only admins to update/upsert (for re-upload)
DO $$ BEGIN
  CREATE POLICY "Admins can update withdrawal proofs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'withdrawals'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
