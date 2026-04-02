-- Add service_role policy to users table
-- Problem: fetchAdminReferrals action queries users table with service_role client
-- but RLS policies only allow authenticated users to view their own profile
-- Solution: Add service_role policy to allow admin functions to access all user records

-- Enable service_role to access all user records (for admin/server functions)
CREATE POLICY "Service role can access all users"
  ON public.users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Note: This allows service_role (server-side operations) to read all users
-- while maintaining user-level restrictions for client-side authenticated access
