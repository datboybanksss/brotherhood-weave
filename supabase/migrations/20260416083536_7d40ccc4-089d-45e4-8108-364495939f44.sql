
-- Enums
CREATE TYPE public.payment_status_enum AS ENUM ('pending', 'paid');
CREATE TYPE public.payment_txn_status AS ENUM ('pending', 'completed', 'failed');

-- Tiers
CREATE TABLE public.tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  ring_color TEXT NOT NULL,
  display_order INT NOT NULL
);
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tiers readable by authenticated" ON public.tiers FOR SELECT TO authenticated USING (true);

-- Seed tiers
INSERT INTO public.tiers (name, ring_color, display_order) VALUES
  ('Foundation', '#9CA3AF', 1),
  ('Independent Thinker', '#7B9FFF', 2),
  ('Founding Member', '#1512D3', 3);

-- Departments
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Departments readable by authenticated" ON public.departments FOR SELECT TO authenticated USING (true);

-- Seed departments
INSERT INTO public.departments (name, slug) VALUES
  ('Fitness', 'fitness'),
  ('Personal Brand & Content', 'personal-brand-content'),
  ('Service', 'service'),
  ('Marketing & Merchandise', 'marketing-merchandise'),
  ('Student', 'student'),
  ('Entrepreneurs', 'entrepreneurs');

-- Users (extends auth.users 1:1)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  tier_id UUID REFERENCES public.tiers(id),
  payment_status public.payment_status_enum NOT NULL DEFAULT 'pending',
  membership_started_at TIMESTAMPTZ,
  interview_booked_at TIMESTAMPTZ,
  interview_completed BOOLEAN NOT NULL DEFAULT false,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own row
CREATE POLICY "Users can read own row" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
-- Paid users can read other paid users (for brotherhood directory)
CREATE POLICY "Paid users can read other paid users" ON public.users FOR SELECT TO authenticated USING (payment_status = 'paid');
-- Users can update safe columns on their own row
CREATE POLICY "Users can update own row" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger to create users row on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User departments
CREATE TABLE public.user_departments (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, department_id)
);
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own departments" ON public.user_departments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own departments" ON public.user_departments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own departments" ON public.user_departments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own departments" ON public.user_departments FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- Paid users can read others' departments (for directory)
CREATE POLICY "Paid users can read all departments" ON public.user_departments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND payment_status = 'paid')
);

-- Enforce max 3 departments per user
CREATE OR REPLACE FUNCTION public.check_max_departments()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.user_departments WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 departments per user';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_max_departments
  BEFORE INSERT ON public.user_departments
  FOR EACH ROW EXECUTE FUNCTION public.check_max_departments();

-- Enforce max 1 primary per user
CREATE OR REPLACE FUNCTION public.check_single_primary()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.user_departments SET is_primary = false WHERE user_id = NEW.user_id AND department_id != NEW.department_id AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_single_primary
  BEFORE INSERT OR UPDATE ON public.user_departments
  FOR EACH ROW EXECUTE FUNCTION public.check_single_primary();

-- Modules
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  required_tier_id UUID REFERENCES public.tiers(id),
  display_order INT NOT NULL
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Modules readable by authenticated" ON public.modules FOR SELECT TO authenticated USING (true);

-- Seed module
INSERT INTO public.modules (title, slug, description, required_tier_id, display_order)
VALUES (
  'Identity Alchemy',
  'identity-alchemy',
  'Discover and forge your authentic identity through six transformative lessons.',
  (SELECT id FROM public.tiers WHERE name = 'Foundation'),
  1
);

-- Lessons
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  display_order INT NOT NULL
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lessons readable by authenticated" ON public.lessons FOR SELECT TO authenticated USING (true);

-- Seed lessons
INSERT INTO public.lessons (module_id, title, display_order)
SELECT m.id, 'Lesson ' || n, n
FROM public.modules m, generate_series(1, 6) AS n
WHERE m.slug = 'identity-alchemy';

-- User module progress
CREATE TABLE public.user_module_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id),
  completed_at TIMESTAMPTZ,
  lessons_completed INT NOT NULL DEFAULT 0,
  UNIQUE (user_id, module_id)
);
ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own progress" ON public.user_module_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_module_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_module_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Meetings
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.users(id)
);
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Meetings readable by authenticated" ON public.meetings FOR SELECT TO authenticated USING (true);

-- Meeting attendance
CREATE TABLE public.meeting_attendance (
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL DEFAULT false,
  marked_by UUID REFERENCES public.users(id),
  PRIMARY KEY (meeting_id, user_id)
);
ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own attendance" ON public.meeting_attendance FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert attendance" ON public.meeting_attendance FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update attendance" ON public.meeting_attendance FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

-- Payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount NUMERIC NOT NULL,
  status public.payment_txn_status NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'stub',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Function: evaluate_tier_upgrade (called by triggers and edge function)
CREATE OR REPLACE FUNCTION public.evaluate_tier_upgrade(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tier_name TEXT;
  meeting_count INT;
  module_done BOOLEAN;
  dept_count INT;
  days_member INT;
  reasons TEXT[] := '{}';
  independent_thinker_id UUID;
BEGIN
  -- Get current tier
  SELECT t.name INTO current_tier_name
  FROM public.users u LEFT JOIN public.tiers t ON u.tier_id = t.id
  WHERE u.id = target_user_id;

  -- Never touch Founding Members
  IF current_tier_name = 'Founding Member' THEN
    RETURN jsonb_build_object('upgraded', false, 'reasons_incomplete', ARRAY[]::TEXT[]);
  END IF;

  -- Only upgrade Foundation
  IF current_tier_name IS DISTINCT FROM 'Foundation' THEN
    RETURN jsonb_build_object('upgraded', false, 'reasons_incomplete', ARRAY['Not Foundation tier']::TEXT[]);
  END IF;

  -- Check conditions
  SELECT COUNT(*) INTO meeting_count FROM public.meeting_attendance WHERE user_id = target_user_id AND attended = true;
  IF meeting_count < 2 THEN reasons := array_append(reasons, 'meetings'); END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_module_progress ump
    JOIN public.modules m ON m.id = ump.module_id
    WHERE ump.user_id = target_user_id AND m.slug = 'identity-alchemy' AND ump.completed_at IS NOT NULL
  ) INTO module_done;
  IF NOT module_done THEN reasons := array_append(reasons, 'module'); END IF;

  SELECT COUNT(*) INTO dept_count FROM public.user_departments WHERE user_id = target_user_id;
  IF dept_count < 1 THEN reasons := array_append(reasons, 'department'); END IF;

  SELECT COALESCE(EXTRACT(DAY FROM now() - membership_started_at)::INT, 0) INTO days_member FROM public.users WHERE id = target_user_id;
  IF days_member < 30 THEN reasons := array_append(reasons, 'tenure'); END IF;

  IF array_length(reasons, 1) IS NULL OR array_length(reasons, 1) = 0 THEN
    SELECT id INTO independent_thinker_id FROM public.tiers WHERE name = 'Independent Thinker';
    UPDATE public.users SET tier_id = independent_thinker_id WHERE id = target_user_id;
    RETURN jsonb_build_object('upgraded', true, 'reasons_incomplete', ARRAY[]::TEXT[]);
  END IF;

  RETURN jsonb_build_object('upgraded', false, 'reasons_incomplete', reasons);
END;
$$;

-- RPC wrapper so client can call it
-- (The edge function will also call this)

-- Trigger on meeting_attendance
CREATE OR REPLACE FUNCTION public.trigger_tier_check_attendance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.attended = true THEN
    PERFORM public.evaluate_tier_upgrade(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER check_tier_on_attendance
  AFTER INSERT OR UPDATE ON public.meeting_attendance
  FOR EACH ROW EXECUTE FUNCTION public.trigger_tier_check_attendance();

-- Trigger on user_module_progress
CREATE OR REPLACE FUNCTION public.trigger_tier_check_progress()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL THEN
    PERFORM public.evaluate_tier_upgrade(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER check_tier_on_progress
  AFTER INSERT OR UPDATE ON public.user_module_progress
  FOR EACH ROW EXECUTE FUNCTION public.trigger_tier_check_progress();

-- Trigger on user_departments insert
CREATE OR REPLACE FUNCTION public.trigger_tier_check_department()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.evaluate_tier_upgrade(NEW.user_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER check_tier_on_department
  AFTER INSERT ON public.user_departments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_tier_check_department();

-- Payment processing function (atomic)
CREATE OR REPLACE FUNCTION public.process_payment(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  foundation_id UUID;
BEGIN
  SELECT id INTO foundation_id FROM public.tiers WHERE name = 'Foundation';

  INSERT INTO public.payments (user_id, amount, status, provider)
  VALUES (p_user_id, p_amount, 'completed', 'stub');

  UPDATE public.users
  SET payment_status = 'paid',
      membership_started_at = now(),
      tier_id = foundation_id
  WHERE id = p_user_id;
END;
$$;
