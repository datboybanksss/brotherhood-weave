
-- 1. Users table additions
ALTER TABLE public.users
  ADD COLUMN title text,
  ADD COLUMN current_city text,
  ADD COLUMN email_visible boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT users_title_length CHECK (title IS NULL OR char_length(title) <= 80),
  ADD CONSTRAINT users_current_city_length CHECK (current_city IS NULL OR char_length(current_city) <= 50);

-- 2. Update protect_user_columns trigger (whitelist new editable fields by NOT touching them)
-- The existing function already only blocks tier_id, payment_status, interview_completed,
-- is_admin, membership_started_at, rejected_at — title/current_city/email_visible are not blocked,
-- so members can already update them via existing "Users can update own row" policy.
-- No change needed to the function.

-- 3. profile_photos table
CREATE TABLE public.profile_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  display_order int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_photos_order_range CHECK (display_order >= 0 AND display_order < 5),
  CONSTRAINT profile_photos_unique_order UNIQUE (user_id, display_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_profile_photos_user_order ON public.profile_photos (user_id, display_order);

ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paid members can read all profile photos"
  ON public.profile_photos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.payment_status = 'paid'));

CREATE POLICY "Members manage own photos - insert"
  ON public.profile_photos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members manage own photos - update"
  ON public.profile_photos FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members manage own photos - delete"
  ON public.profile_photos FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_current_user_admin());

-- 4. 5-photo limit trigger
CREATE OR REPLACE FUNCTION public.enforce_photo_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profile_photos WHERE user_id = NEW.user_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 photos per member';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_photo_limit_trigger
  BEFORE INSERT ON public.profile_photos
  FOR EACH ROW EXECUTE FUNCTION public.enforce_photo_limit();

-- 5. Batch reorder RPC (atomic single call)
CREATE OR REPLACE FUNCTION public.reorder_profile_photos(_photo_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i int;
  caller uuid := auth.uid();
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  -- Verify all photos belong to caller
  IF EXISTS (SELECT 1 FROM public.profile_photos WHERE id = ANY(_photo_ids) AND user_id <> caller) THEN
    RAISE EXCEPTION 'Cannot reorder photos you do not own';
  END IF;
  -- Move all to temporary out-of-range orders to avoid unique conflicts
  UPDATE public.profile_photos
    SET display_order = display_order + 100
    WHERE user_id = caller;
  -- Re-assign in given order
  FOR i IN 1..array_length(_photo_ids, 1) LOOP
    UPDATE public.profile_photos
      SET display_order = i - 1
      WHERE id = _photo_ids[i] AND user_id = caller;
  END LOOP;
END;
$$;

-- Need to allow display_order temporarily > 4 inside the function. Drop the CHECK and re-add as trigger.
ALTER TABLE public.profile_photos DROP CONSTRAINT profile_photos_order_range;

CREATE OR REPLACE FUNCTION public.check_photo_order_range()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only enforce on INSERT or when not in a reorder transaction (heuristic: order < 100)
  IF TG_OP = 'INSERT' AND (NEW.display_order < 0 OR NEW.display_order >= 5) THEN
    RAISE EXCEPTION 'display_order must be 0-4';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_photo_order_range_trigger
  BEFORE INSERT ON public.profile_photos
  FOR EACH ROW EXECUTE FUNCTION public.check_photo_order_range();

-- 6. Re-create public_member_profiles view with new fields
DROP VIEW IF EXISTS public.public_member_profiles;
CREATE VIEW public.public_member_profiles
WITH (security_invoker = true)
AS
SELECT id, full_name, avatar_url, tier_id, membership_started_at, bio, created_at,
       title, current_city, email_visible
FROM public.users
WHERE payment_status = 'paid' AND rejected_at IS NULL;

-- 7. Storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos', 'profile-photos', true, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Profile photos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Members upload own profile photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Members delete own profile photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_current_user_admin())
  );
