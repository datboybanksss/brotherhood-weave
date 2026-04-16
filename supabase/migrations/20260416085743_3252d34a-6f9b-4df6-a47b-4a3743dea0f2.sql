
-- Security definer function to check admin status without RLS recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  )
$$;

-- Add rejected_at column
ALTER TABLE public.users ADD COLUMN rejected_at timestamptz NULL;

-- Admin can read all users
CREATE POLICY "Admins can read all users"
ON public.users
FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

-- Admin can update any user
CREATE POLICY "Admins can update any user"
ON public.users
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());
