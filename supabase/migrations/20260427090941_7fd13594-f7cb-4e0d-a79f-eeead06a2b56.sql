-- 1. Add bio column to users
ALTER TABLE public.users ADD COLUMN bio text NULL;
ALTER TABLE public.users ADD CONSTRAINT users_bio_length_chk CHECK (bio IS NULL OR char_length(bio) <= 280);

-- 2. Update protect_user_columns trigger to allow bio (bio is NOT protected)
CREATE OR REPLACE FUNCTION public.protect_user_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'authenticated' THEN
    RETURN NEW;
  END IF;
  IF public.is_current_user_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.tier_id IS DISTINCT FROM OLD.tier_id
    OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
    OR NEW.interview_completed IS DISTINCT FROM OLD.interview_completed
    OR NEW.is_admin IS DISTINCT FROM OLD.is_admin
    OR NEW.membership_started_at IS DISTINCT FROM OLD.membership_started_at
    OR NEW.rejected_at IS DISTINCT FROM OLD.rejected_at
  THEN
    RAISE EXCEPTION 'Cannot modify protected columns';
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Create peer_pairings table
CREATE TABLE public.peer_pairings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  member_a_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_b_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_c_id uuid NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_trio boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pp_ab_canon CHECK (member_a_id < member_b_id),
  CONSTRAINT pp_bc_canon CHECK (member_c_id IS NULL OR member_b_id < member_c_id),
  CONSTRAINT pp_trio_complete CHECK (is_trio = false OR member_c_id IS NOT NULL),
  CONSTRAINT pp_c_distinct CHECK (member_c_id IS NULL OR (member_c_id <> member_a_id AND member_c_id <> member_b_id))
);

CREATE INDEX idx_pp_week ON public.peer_pairings(week_start);
CREATE INDEX idx_pp_a_week ON public.peer_pairings(member_a_id, week_start);
CREATE INDEX idx_pp_b_week ON public.peer_pairings(member_b_id, week_start);
CREATE INDEX idx_pp_c_week ON public.peer_pairings(member_c_id, week_start);

-- 4. BEFORE INSERT trigger: enforce one pairing per week per member across all 3 columns
CREATE OR REPLACE FUNCTION public.enforce_one_pairing_per_week()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.peer_pairings
    WHERE week_start = NEW.week_start
      AND (member_a_id = NEW.member_a_id OR member_b_id = NEW.member_a_id OR member_c_id = NEW.member_a_id)
  ) THEN
    RAISE EXCEPTION 'Member % already paired for week %', NEW.member_a_id, NEW.week_start;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.peer_pairings
    WHERE week_start = NEW.week_start
      AND (member_a_id = NEW.member_b_id OR member_b_id = NEW.member_b_id OR member_c_id = NEW.member_b_id)
  ) THEN
    RAISE EXCEPTION 'Member % already paired for week %', NEW.member_b_id, NEW.week_start;
  END IF;
  IF NEW.member_c_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.peer_pairings
    WHERE week_start = NEW.week_start
      AND (member_a_id = NEW.member_c_id OR member_b_id = NEW.member_c_id OR member_c_id = NEW.member_c_id)
  ) THEN
    RAISE EXCEPTION 'Member % already paired for week %', NEW.member_c_id, NEW.week_start;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_enforce_one_pairing_per_week
BEFORE INSERT ON public.peer_pairings
FOR EACH ROW EXECUTE FUNCTION public.enforce_one_pairing_per_week();

-- 5. RLS on peer_pairings
ALTER TABLE public.peer_pairings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read their own pairings"
ON public.peer_pairings FOR SELECT TO authenticated
USING (
  public.is_current_user_admin()
  OR auth.uid() = member_a_id
  OR auth.uid() = member_b_id
  OR auth.uid() = member_c_id
);

-- (no INSERT/UPDATE/DELETE policies = client cannot write; service role bypasses RLS)

-- 6. Public member profiles view (only safe public columns)
CREATE OR REPLACE VIEW public.public_member_profiles
WITH (security_invoker = on) AS
SELECT id, full_name, avatar_url, tier_id, membership_started_at, bio, created_at
FROM public.users
WHERE payment_status = 'paid' AND rejected_at IS NULL;

GRANT SELECT ON public.public_member_profiles TO authenticated;

-- 7. Enable extensions for cron + http
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 8. Weekly cron: Sunday 22:00 UTC = Monday 00:00 SAST. Computes next Monday's date.
SELECT cron.schedule(
  'assign-peer-partners-weekly',
  '0 22 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://zsmkhndwoxhwasrlzeox.supabase.co/functions/v1/assign_peer_partners',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbWtobmR3b3hod2Fzcmx6ZW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMTE5MjcsImV4cCI6MjA5MTg4NzkyN30.9ziIfthGdVNT54d9oGdXT698Ab1qrPLC7IVPjK9-_oE"}'::jsonb,
    body := jsonb_build_object(
      'week_start', to_char((current_date + 1)::date, 'YYYY-MM-DD'),
      'mode', 'full'
    )
  );
  $$
);

-- 9. Midweek trigger on users: when payment_status flips pending -> paid
CREATE OR REPLACE FUNCTION public.trigger_assign_midweek_partner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_monday date;
BEGIN
  IF OLD.payment_status IS DISTINCT FROM 'paid' AND NEW.payment_status = 'paid' THEN
    -- Compute Monday of current week (ISO: Monday=1)
    v_monday := (current_date - ((extract(isodow from current_date)::int - 1)))::date;
    PERFORM net.http_post(
      url := 'https://zsmkhndwoxhwasrlzeox.supabase.co/functions/v1/assign_peer_partners',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbWtobmR3b3hod2Fzcmx6ZW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMTE5MjcsImV4cCI6MjA5MTg4NzkyN30.9ziIfthGdVNT54d9oGdXT698Ab1qrPLC7IVPjK9-_oE"}'::jsonb,
      body := jsonb_build_object('week_start', to_char(v_monday, 'YYYY-MM-DD'), 'mode', 'midweek')
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_users_midweek_assign
AFTER UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.trigger_assign_midweek_partner();