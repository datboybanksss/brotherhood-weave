-- SECURITY FIX: Server-side nonce verification for Strava OAuth
-- Prevents account hijacking via crafted state parameter

CREATE TABLE public.strava_oauth_nonces (
  nonce uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

CREATE INDEX idx_strava_oauth_nonces_user ON public.strava_oauth_nonces(user_id);
CREATE INDEX idx_strava_oauth_nonces_expires ON public.strava_oauth_nonces(expires_at);

ALTER TABLE public.strava_oauth_nonces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own nonces" ON public.strava_oauth_nonces
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Cleanup expired nonces hourly
SELECT cron.schedule(
  'cleanup-strava-oauth-nonces',
  '0 * * * *',
  $$ DELETE FROM public.strava_oauth_nonces WHERE expires_at < now(); $$
);
