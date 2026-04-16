-- Modules: admin full CRUD
CREATE POLICY "Admins can insert modules" ON public.modules FOR INSERT TO authenticated WITH CHECK (is_current_user_admin());
CREATE POLICY "Admins can update modules" ON public.modules FOR UPDATE TO authenticated USING (is_current_user_admin());
CREATE POLICY "Admins can delete modules" ON public.modules FOR DELETE TO authenticated USING (is_current_user_admin());

-- Lessons: admin full CRUD
CREATE POLICY "Admins can insert lessons" ON public.lessons FOR INSERT TO authenticated WITH CHECK (is_current_user_admin());
CREATE POLICY "Admins can update lessons" ON public.lessons FOR UPDATE TO authenticated USING (is_current_user_admin());
CREATE POLICY "Admins can delete lessons" ON public.lessons FOR DELETE TO authenticated USING (is_current_user_admin());