-- Workouts table
CREATE TABLE public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  distance_km numeric(5,2) NOT NULL,
  ran_at date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workouts_distance_bounds CHECK (distance_km > 0 AND distance_km <= 200),
  CONSTRAINT workouts_note_length CHECK (note IS NULL OR char_length(note) <= 200),
  CONSTRAINT workouts_ran_at_not_future CHECK (ran_at <= current_date),
  CONSTRAINT workouts_ran_at_min CHECK (ran_at >= '2026-01-01'::date)
);

CREATE INDEX workouts_ran_at_idx ON public.workouts (ran_at DESC);
CREATE INDEX workouts_user_ran_at_idx ON public.workouts (user_id, ran_at DESC);

-- RLS
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paid users and admins can read workouts"
  ON public.workouts FOR SELECT TO authenticated
  USING (
    public.is_current_user_admin()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND payment_status = 'paid'::payment_status_enum
    )
  );

CREATE POLICY "Members can insert own workouts"
  ON public.workouts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- BEFORE INSERT trigger to force user_id = auth.uid()
CREATE OR REPLACE FUNCTION public.enforce_workout_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER workouts_enforce_user_id
  BEFORE INSERT ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_workout_user_id();

-- Realtime
ALTER TABLE public.workouts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workouts;

-- Aggregate RPC
CREATE OR REPLACE FUNCTION public.get_collective_distance()
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(distance_km), 0)::numeric FROM public.workouts;
$$;

GRANT EXECUTE ON FUNCTION public.get_collective_distance() TO authenticated;