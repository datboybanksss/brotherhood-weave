
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exercise text NOT NULL CHECK (exercise IN (
    'push_ups','squats','sit_ups','pull_ups','plank_seconds',
    'wall_sit_seconds','burpees','lunges','mountain_climbers'
  )),
  reps int NOT NULL CHECK (reps > 0 AND reps <= 10000),
  video_url text,
  video_retention text NOT NULL DEFAULT '90_days'
    CHECK (video_retention IN ('90_days','forever')),
  video_visibility text NOT NULL DEFAULT 'public'
    CHECK (video_visibility IN ('public','private')),
  note text CHECK (note IS NULL OR char_length(note) <= 200),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_id uuid
);

CREATE INDEX submissions_submitted_at_idx ON public.submissions (submitted_at DESC);
CREATE INDEX submissions_user_submitted_idx ON public.submissions (user_id, submitted_at DESC);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.enforce_submissions_user_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_submissions_user_id
BEFORE INSERT ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.enforce_submissions_user_id();

CREATE OR REPLACE FUNCTION public.enforce_submissions_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  jwt_role text := current_setting('request.jwt.claim.role', true);
BEGIN
  IF jwt_role <> 'authenticated' THEN
    RETURN NEW;
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.exercise IS DISTINCT FROM OLD.exercise
     OR NEW.reps IS DISTINCT FROM OLD.reps
     OR NEW.video_retention IS DISTINCT FROM OLD.video_retention
     OR NEW.video_visibility IS DISTINCT FROM OLD.video_visibility
     OR NEW.note IS DISTINCT FROM OLD.note
     OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.event_id IS DISTINCT FROM OLD.event_id
  THEN
    RAISE EXCEPTION 'Only video_url may be modified on submissions';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_submissions_update
BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.enforce_submissions_update();

CREATE POLICY "Paid users and admins can read submissions"
ON public.submissions FOR SELECT TO authenticated
USING (
  is_current_user_admin()
  OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.payment_status = 'paid')
);

CREATE POLICY "Members can insert own submissions"
ON public.submissions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update own submissions"
ON public.submissions FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can delete own submissions or admins any"
ON public.submissions FOR DELETE TO authenticated
USING (auth.uid() = user_id OR is_current_user_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fitness-videos','fitness-videos',false,52428800,ARRAY['video/mp4','video/quicktime'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "fitness-videos: owner can insert in own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'fitness-videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "fitness-videos: owner can update in own folder"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'fitness-videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'fitness-videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "fitness-videos: owner or admin can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'fitness-videos'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR is_current_user_admin())
);

CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard(month_start date)
RETURNS TABLE (
  user_id uuid, full_name text, avatar_url text, tier_id uuid,
  total_reps bigint, submission_count bigint, video_count bigint, score bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    u.id, u.full_name, u.avatar_url, u.tier_id,
    COALESCE(SUM(s.reps), 0)::bigint,
    COUNT(s.id)::bigint,
    COUNT(s.video_url)::bigint,
    (COALESCE(SUM(s.reps), 0) + COUNT(s.id) * 50 + COUNT(s.video_url) * 25)::bigint
  FROM public.users u
  JOIN public.submissions s ON s.user_id = u.id
  WHERE s.submitted_at >= month_start::timestamptz
    AND s.submitted_at < (month_start + interval '1 month')::timestamptz
  GROUP BY u.id, u.full_name, u.avatar_url, u.tier_id
  HAVING COUNT(s.id) > 0
  ORDER BY (COALESCE(SUM(s.reps), 0) + COUNT(s.id) * 50 + COUNT(s.video_url) * 25) DESC,
           COUNT(s.id) DESC, u.full_name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.get_monthly_leaderboard(date) TO authenticated;

-- Week is Mon 00:00 → Sun 23:59 SAST. Caller passes the week's Monday (computed in SAST client-side).
CREATE OR REPLACE FUNCTION public.get_weekly_forfeit_list(week_start date)
RETURNS TABLE (
  user_id uuid, full_name text, avatar_url text, tier_id uuid, last_submission_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  week_start_ts timestamptz;
  week_end_ts timestamptz;
BEGIN
  week_start_ts := (week_start::text || ' 00:00:00 Africa/Johannesburg')::timestamptz;
  week_end_ts := week_start_ts + interval '7 days';
  RETURN QUERY
  SELECT u.id, u.full_name, u.avatar_url, u.tier_id,
    (SELECT MAX(s.submitted_at) FROM public.submissions s WHERE s.user_id = u.id)
  FROM public.users u
  WHERE u.payment_status = 'paid' AND u.rejected_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.user_id = u.id
        AND s.submitted_at >= week_start_ts
        AND s.submitted_at < week_end_ts
    )
  ORDER BY (SELECT MAX(s.submitted_at) FROM public.submissions s WHERE s.user_id = u.id) ASC NULLS FIRST,
           u.full_name ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_weekly_forfeit_list(date) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_weekly_streak(_user_id uuid)
RETURNS int LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  streak int := 0;
  cursor_week_start timestamptz;
  cursor_week_end timestamptz;
  has_any boolean;
  now_sast date;
BEGIN
  now_sast := (now() AT TIME ZONE 'Africa/Johannesburg')::date;
  cursor_week_start := ((now_sast - ((extract(isodow from now_sast)::int - 1)))::text
                        || ' 00:00:00 Africa/Johannesburg')::timestamptz;
  LOOP
    cursor_week_end := cursor_week_start + interval '7 days';
    SELECT EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.user_id = _user_id
        AND s.submitted_at >= cursor_week_start
        AND s.submitted_at < cursor_week_end
    ) INTO has_any;
    IF NOT has_any THEN EXIT; END IF;
    streak := streak + 1;
    cursor_week_start := cursor_week_start - interval '7 days';
    IF streak >= 520 THEN EXIT; END IF;
  END LOOP;
  RETURN streak;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_weekly_streak(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_monthly_stats(_user_id uuid, month_start date)
RETURNS TABLE (total_reps bigint, submission_count bigint, video_count bigint, rank int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH board AS (
    SELECT user_id, ROW_NUMBER() OVER ()::int AS rnk
    FROM public.get_monthly_leaderboard(month_start)
  ),
  mine AS (
    SELECT
      COALESCE(SUM(reps), 0)::bigint AS total_reps,
      COUNT(*)::bigint AS submission_count,
      COUNT(video_url)::bigint AS video_count
    FROM public.submissions
    WHERE user_id = _user_id
      AND submitted_at >= month_start::timestamptz
      AND submitted_at < (month_start + interval '1 month')::timestamptz
  )
  SELECT mine.total_reps, mine.submission_count, mine.video_count,
    COALESCE((SELECT rnk FROM board WHERE board.user_id = _user_id), 0) AS rank
  FROM mine;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_monthly_stats(uuid, date) TO authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'fitness-video-retention',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zsmkhndwoxhwasrlzeox.supabase.co/functions/v1/cleanup_fitness_videos',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbWtobmR3b3hod2Fzcmx6ZW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMTE5MjcsImV4cCI6MjA5MTg4NzkyN30.9ziIfthGdVNT54d9oGdXT698Ab1qrPLC7IVPjK9-_oE"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
