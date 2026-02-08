-- Migration: Add role column to users table
-- This is required for admin access control
-- Date: 2026-01-15

-- Step 1: Add role column with default value 'user'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Step 2: Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 3: Update specific user to admin for testing
UPDATE users 
SET role = 'admin'
WHERE email = 'phanquochoipt@gmail.com';

-- Step 4: Verify the changes
SELECT id, email, role, created_at 
FROM users 
WHERE email = 'phanquochoipt@gmail.com';

-- Step 5: Check all users and their roles
SELECT email, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

