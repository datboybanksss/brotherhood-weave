
-- 1. Add verification columns to member_social_links
ALTER TABLE public.member_social_links
  ADD COLUMN IF NOT EXISTS submitted_url text,
  ADD COLUMN IF NOT EXISTS verified_url text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_method text,
  ADD COLUMN IF NOT EXISTS platform_user_id text,
  ADD COLUMN IF NOT EXISTS platform_username text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Backfill submitted_url from existing url
UPDATE public.member_social_links
SET submitted_url = url
WHERE submitted_url IS NULL;

-- Constrain status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'member_social_links_verification_status_check'
  ) THEN
    ALTER TABLE public.member_social_links
      ADD CONSTRAINT member_social_links_verification_status_check
      CHECK (verification_status IN ('unverified','pending','verified','pending_manual_review','failed'));
  END IF;
END $$;

-- 2. Replace public read policy: only verified rows with verified_url visible to other paid members
DROP POLICY IF EXISTS "Paid members can read member social links" ON public.member_social_links;

CREATE POLICY "Paid members can read verified social links"
ON public.member_social_links
FOR SELECT
TO authenticated
USING (
  verification_status = 'verified'
  AND verified_at IS NOT NULL
  AND verified_url IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.payment_status = 'paid'
      AND u.rejected_at IS NULL
  )
);

-- (Owner ALL policy "Members can manage own social links" remains unchanged so owners still see all states.)

-- 3. OAuth state table (server-only)
CREATE TABLE IF NOT EXISTS public.social_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  pkce_verifier text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE public.social_oauth_states ENABLE ROW LEVEL SECURITY;
-- No policies => no access for anon/authenticated. Service role bypasses RLS.

CREATE INDEX IF NOT EXISTS idx_social_oauth_states_expires ON public.social_oauth_states(expires_at);
