-- Add referred_by_user_id column to users table
-- This ensures ALL users have a persistent referrer in their profile
--
-- Root cause: Previously, referred_by only existed in orders table
-- This made referral tracking fragile - easily lost during order creation
--
-- Solution: Store referrer at user level (permanent, immutable)
--
-- Default referrer: dainganxanh (nguyenphuonghoang888@gmail.com)
-- User ID: 5296b70b-03bb-463b-853c-9ccff2697685

BEGIN;

-- Step 1: Add column (nullable first to allow updates)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS referred_by_user_id UUID;

-- Step 2: Add FK constraint to ensure referrer exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_referred_by_user_id_fkey'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_referred_by_user_id_fkey
    FOREIGN KEY (referred_by_user_id)
    REFERENCES users(id);
  END IF;
END $$;

-- Step 3: Update existing users → default to dainganxanh
UPDATE users
SET referred_by_user_id = '5296b70b-03bb-463b-853c-9ccff2697685'
WHERE referred_by_user_id IS NULL
  AND id != '5296b70b-03bb-463b-853c-9ccff2697685'; -- Exclude dainganxanh itself

-- Step 4: dainganxanh user will have NULL referred_by_user_id
-- This is acceptable as the root referrer node

-- Step 5: NOT NULL constraint will be added in future migration
-- after deciding policy for root referrer (self-reference or NULL)

COMMIT;

-- Verification queries (run these after migration):
--
-- Check column exists:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'users' AND column_name = 'referred_by_user_id';
--
-- Check referrer distribution:
-- SELECT
--     u_ref.email as referrer_email,
--     u_ref.referral_code,
--     COUNT(*) as referred_count
-- FROM users u
-- LEFT JOIN users u_ref ON u.referred_by_user_id = u_ref.id
-- GROUP BY u_ref.email, u_ref.referral_code
-- ORDER BY referred_count DESC;
-- Expected: dainganxanh = 20 users, NULL = 1 user (dainganxanh itself)
