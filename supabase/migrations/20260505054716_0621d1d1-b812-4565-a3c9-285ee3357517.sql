
-- ============ EVENTS TABLE ============
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('fitness','brotherhood_meeting','social','founder_call','workshop','other')),
  format text NOT NULL CHECK (format IN ('in_person','remote','hybrid')),
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  cover_url text,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_ends_after_starts CHECK (ends_at IS NULL OR ends_at >= starts_at),
  CONSTRAINT events_title_length CHECK (char_length(title) BETWEEN 1 AND 120),
  CONSTRAINT events_description_length CHECK (description IS NULL OR char_length(description) <= 5000)
);

CREATE INDEX events_starts_at_idx ON public.events(starts_at);
CREATE INDEX events_category_starts_idx ON public.events(category, starts_at);
CREATE INDEX events_published_starts_idx ON public.events(is_published, starts_at);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paid members read published events"
  ON public.events FOR SELECT TO authenticated
  USING (
    is_current_user_admin()
    OR (is_published = true AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.payment_status = 'paid'
    ))
  );

CREATE POLICY "Admins insert events" ON public.events FOR INSERT TO authenticated
  WITH CHECK (is_current_user_admin());
CREATE POLICY "Admins update events" ON public.events FOR UPDATE TO authenticated
  USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
CREATE POLICY "Admins delete events" ON public.events FOR DELETE TO authenticated
  USING (is_current_user_admin());

CREATE OR REPLACE FUNCTION public.touch_events_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

CREATE TRIGGER events_touch_updated
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.touch_events_updated_at();

-- ============ EVENT RSVPS TABLE ============
CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('going_in_person','going_remote','not_going')),
  responded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX event_rsvps_event_idx ON public.event_rsvps(event_id);
CREATE INDEX event_rsvps_user_event_idx ON public.event_rsvps(user_id, event_id);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paid members read all rsvps"
  ON public.event_rsvps FOR SELECT TO authenticated
  USING (
    is_current_user_admin()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.payment_status = 'paid')
  );
CREATE POLICY "Members insert own rsvp" ON public.event_rsvps FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members update own rsvp" ON public.event_rsvps FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members delete own rsvp or admin" ON public.event_rsvps FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_current_user_admin());

CREATE OR REPLACE FUNCTION public.enforce_rsvp_user_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN NEW.user_id := auth.uid(); END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER event_rsvps_force_user
  BEFORE INSERT ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.enforce_rsvp_user_id();

-- ============ ARCHIVES EVENT_RECAP EXTENSION ============
ALTER TABLE public.archives ADD COLUMN event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;

ALTER TABLE public.archives DROP CONSTRAINT IF EXISTS archives_content_type_check;
ALTER TABLE public.archives ADD CONSTRAINT archives_content_type_check
  CHECK (content_type IN ('video','document','text','event_recap'));

ALTER TABLE public.archives ADD CONSTRAINT archives_event_recap_requires_event
  CHECK (content_type <> 'event_recap' OR event_id IS NOT NULL);

CREATE INDEX archives_event_id_idx ON public.archives(event_id) WHERE event_id IS NOT NULL;

-- Update archive source validation to allow event_recap (uses body_markdown)
CREATE OR REPLACE FUNCTION public.validate_archive_source()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.content_type = 'video' AND NEW.video_url IS NULL THEN
    RAISE EXCEPTION 'video_url is required for video archives';
  END IF;
  IF NEW.content_type = 'document' AND NEW.document_url IS NULL THEN
    RAISE EXCEPTION 'document_url is required for document archives';
  END IF;
  IF NEW.content_type IN ('text','event_recap') AND NEW.body_markdown IS NULL THEN
    RAISE EXCEPTION 'body_markdown is required for text/recap archives';
  END IF;
  RETURN NEW;
END; $$;

-- ============ STORAGE: event-covers bucket ============
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('event-covers', 'event-covers', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']);

CREATE POLICY "Public read event-covers" ON storage.objects FOR SELECT
  USING (bucket_id = 'event-covers');
CREATE POLICY "Admin insert event-covers" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-covers' AND public.is_current_user_admin());
CREATE POLICY "Admin update event-covers" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-covers' AND public.is_current_user_admin());
CREATE POLICY "Admin delete event-covers" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-covers' AND public.is_current_user_admin());

-- ============ HELPER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.get_upcoming_events(category_filter text DEFAULT NULL, limit_n int DEFAULT 10)
RETURNS SETOF public.events
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.events
  WHERE is_published = true
    AND starts_at >= now()
    AND (category_filter IS NULL OR category = category_filter)
  ORDER BY starts_at ASC
  LIMIT limit_n;
$$;

CREATE OR REPLACE FUNCTION public.get_event_rsvp_summary(_event_id uuid)
RETURNS TABLE(going_in_person int, going_remote int, not_going int, total_rsvps int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'going_in_person')::int,
    COUNT(*) FILTER (WHERE status = 'going_remote')::int,
    COUNT(*) FILTER (WHERE status = 'not_going')::int,
    COUNT(*)::int
  FROM public.event_rsvps WHERE event_id = _event_id;
$$;

CREATE OR REPLACE FUNCTION public.get_my_rsvp(_event_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT status FROM public.event_rsvps
  WHERE event_id = _event_id AND user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_monthly_stats_with_delta(_user_id uuid, month_start date)
RETURNS TABLE(total_reps bigint, submission_count bigint, video_count bigint, rank int, prev_total_reps bigint, prev_submission_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH cur AS (
    SELECT * FROM public.get_user_monthly_stats(_user_id, month_start)
  ),
  prev AS (
    SELECT
      COALESCE(SUM(reps), 0)::bigint AS total_reps,
      COUNT(*)::bigint AS submission_count
    FROM public.submissions
    WHERE user_id = _user_id
      AND submitted_at >= (month_start - interval '1 month')::timestamptz
      AND submitted_at < month_start::timestamptz
  )
  SELECT cur.total_reps, cur.submission_count, cur.video_count, cur.rank,
         prev.total_reps, prev.submission_count
  FROM cur, prev;
$$;
