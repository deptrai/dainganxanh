-- Role protection: admin cannot change super_admin roles

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop old update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can update user roles" ON public.users;

-- User chỉ update profile của mình (không được update role)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- Admin/super_admin update user roles với restrictions
CREATE POLICY "Admin can update user roles" ON public.users
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
    AND auth.uid() != id
  )
  WITH CHECK (
    -- super_admin có thể set bất kỳ role
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    OR (
      -- admin chỉ được set user/admin, không được động vào super_admin
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
      AND role != 'super_admin'
      AND (SELECT role FROM public.users WHERE id = users.id) != 'super_admin'
    )
  );
