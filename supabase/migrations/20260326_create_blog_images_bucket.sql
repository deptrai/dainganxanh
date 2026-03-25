-- Create blog-images storage bucket for cover images and in-content images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access (bucket is already public, but explicit policy for clarity)
CREATE POLICY "blog_images_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'blog-images');

-- Allow admin users to upload/delete
CREATE POLICY "blog_images_admin_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'blog-images'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "blog_images_admin_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'blog-images'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
