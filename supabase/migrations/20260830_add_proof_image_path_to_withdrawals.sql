-- Migration: Add proof_image_path column to withdrawals
-- Date: 2026-08-30
-- Purpose: Support private storage paths for signed-URL proof images

-- Step 1: Add the private storage path column
ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS proof_image_path TEXT;

-- Step 2: Backfill proof_image_path from existing public URLs
-- Old public URLs follow the pattern:
-- https://<project>.supabase.co/storage/v1/object/public/withdrawals/{withdrawalId}/proof.{ext}
-- We extract the path relative to the bucket (e.g. "{withdrawalId}/proof.{ext}").
UPDATE withdrawals
SET proof_image_path = regexp_replace(
    proof_image_url,
    '^.*\/storage\/v1\/object\/public\/withdrawals\/',
    ''
)
WHERE proof_image_path IS NULL
  AND proof_image_url IS NOT NULL
  AND proof_image_url <> ''
  AND proof_image_url LIKE '%/withdrawals/%';

-- Step 3: Add an index for fast admin lookups by proof path
CREATE INDEX IF NOT EXISTS idx_withdrawals_proof_image_path
ON withdrawals(proof_image_path)
WHERE proof_image_path IS NOT NULL;
