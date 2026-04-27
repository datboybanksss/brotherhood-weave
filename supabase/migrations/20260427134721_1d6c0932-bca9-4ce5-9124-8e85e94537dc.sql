-- 1. Workouts table additions
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS verified_via text,
  ADD COLUMN IF NOT EXISTS strava_activity_id bigint,
  ADD COLUMN IF NOT EXISTS activity_type text,
  ADD COLUMN IF NOT EXISTS duration_seconds integer;

ALTER TABLE public.workouts
  DROP CONSTRAINT IF EXISTS workouts_verified_via_check;
ALTER TABLE public.workouts
  ADD CONSTRAINT workouts_verified_via_check
  CHECK (verified_via IS NULL OR verified_via IN ('strava', 'manual'));

CREATE UNIQUE INDEX IF NOT EXISTS workouts_strava_activity_id_key
  ON public.workouts (strava_activity_id)
  WHERE strava_activity_id IS NOT NULL;

UPDATE public.workouts SET verified_via = 'manual' WHERE verified_via IS NULL;

-- Trigger: default verified_via and block client-supplied strava_activity_id
CREATE OR REPLACE FUNCTION public.enforce_workout_verified_via()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := current_setting('request.jwt.claim.role', true);
BEGIN
  IF NEW.verified_via IS NULL THEN
    NEW.verified_via := 'manual';
  END IF;

  -- Only service_role (Edge Functions) may set strava_activity_id / strava verification.
  IF jwt_role = 'authenticated' THEN
    IF NEW.strava_activity_id IS NOT NULL THEN
      RAISE EXCEPTION 'strava_activity_id can only be set by service role';
    END IF;
    IF NEW.verified_via = 'strava' THEN
      RAISE EXCEPTION 'verified_via=strava can only be set by service role';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workouts_enforce_verified_via ON public.workouts;
CREATE TRIGGER workouts_enforce_verified_via
  BEFORE INSERT ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_workout_verified_via();

-- 2. strava_connections
CREATE TABLE IF NOT EXISTS public.strava_connections (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  strava_athlete_id bigint NOT NULL UNIQUE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  scope text NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_synced_at timestamptz
);

CREATE INDEX IF NOT EXISTS strava_connections_athlete_idx
  ON public.strava_connections (strava_athlete_id);

ALTER TABLE public.strava_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own strava connection" ON public.strava_connections;
CREATE POLICY "Users can read own strava connection"
  ON public.strava_connections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own strava connection" ON public.strava_connections;
CREATE POLICY "Users can delete own strava connection"
  ON public.strava_connections FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE policies for clients — only service role writes.

-- 3. strava_webhook_events (audit)
CREATE TABLE IF NOT EXISTS public.strava_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aspect_type text NOT NULL,
  object_type text NOT NULL,
  object_id bigint NOT NULL,
  owner_id bigint NOT NULL,
  subscription_id bigint,
  event_time bigint,
  raw_body jsonb NOT NULL,
  processed_at timestamptz,
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS strava_webhook_events_received_idx
  ON public.strava_webhook_events (received_at DESC);
CREATE INDEX IF NOT EXISTS strava_webhook_events_object_idx
  ON public.strava_webhook_events (object_id, aspect_type);

ALTER TABLE public.strava_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read webhook events" ON public.strava_webhook_events;
CREATE POLICY "Admins can read webhook events"
  ON public.strava_webhook_events FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

-- No client write policies — service role only.