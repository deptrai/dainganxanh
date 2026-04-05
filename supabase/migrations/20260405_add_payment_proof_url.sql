-- Add payment_proof_url to orders table for admin payment approval proof
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Create payment-proofs storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Only service role can upload (admin actions use service role)
CREATE POLICY "Service role can manage payment proofs" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'payment-proofs')
  WITH CHECK (bucket_id = 'payment-proofs');

-- Admins can read payment proofs
CREATE POLICY "Admins can read payment proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );
