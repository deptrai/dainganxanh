-- Create contracts storage bucket if not exists
-- This migration sets up the storage bucket for PDF contracts

-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'contracts',
    'contracts',
    false,  -- Private bucket
    10485760,  -- 10MB limit
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for service role
-- Allow service role to insert contracts
CREATE POLICY IF NOT EXISTS "Service role can upload contracts"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'contracts');

-- Allow service role to select/download contracts
CREATE POLICY IF NOT EXISTS "Service role can read contracts"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'contracts');

-- Allow service role to update contracts
CREATE POLICY IF NOT EXISTS "Service role can update contracts"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'contracts');

-- Allow service role to delete contracts
CREATE POLICY IF NOT EXISTS "Service role can delete contracts"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'contracts');
