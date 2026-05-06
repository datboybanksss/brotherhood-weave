-- SECURITY FIX: Restrict modules and lessons to paid members only
-- Previously readable by all authenticated users including pre-payment signups

-- Drop existing open policies
DROP POLICY IF EXISTS "Modules readable by authenticated" ON public.modules;
DROP POLICY IF EXISTS "Lessons readable by authenticated" ON public.lessons;

-- Replace with paid-only access
CREATE POLICY "Paid users and admins can read modules" ON public.modules
  FOR SELECT TO authenticated
  USING (
    public.is_current_user_admin()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND payment_status = 'paid'
    )
  );

CREATE POLICY "Paid users and admins can read lessons" ON public.lessons
  FOR SELECT TO authenticated
  USING (
    public.is_current_user_admin()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND payment_status = 'paid'
    )
  );
