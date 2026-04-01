-- Add identity fields to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Update policy to allow users to update their own identity
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
