-- Create certificates storage bucket if not exists
-- This migration sets up the storage bucket for PDF certificates

-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'certificates',
    'certificates',
    false,  -- Private bucket
    10485760,  -- 10MB limit
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for service role
-- Allow service role to insert certificates
CREATE POLICY IF NOT EXISTS "Service role can upload certificates"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'certificates');

-- Allow service role to select/download certificates
CREATE POLICY IF NOT EXISTS "Service role can read certificates"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'certificates');

-- Allow service role to update certificates
CREATE POLICY IF NOT EXISTS "Service role can update certificates"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'certificates');

-- Allow service role to delete certificates
CREATE POLICY IF NOT EXISTS "Service role can delete certificates"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'certificates');

-- Allow authenticated users to view their own certificates
-- The file structure is: {userId}/certificate-{orderCode}-{timestamp}.pdf
CREATE POLICY IF NOT EXISTS "Users can view own certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'certificates'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
