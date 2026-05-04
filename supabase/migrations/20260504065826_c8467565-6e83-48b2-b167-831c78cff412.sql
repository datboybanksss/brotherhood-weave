-- Google OAuth manual setup note:
-- 1. Go to https://console.cloud.google.com and create or reuse a Google Cloud project.
-- 2. Create OAuth 2.0 Web credentials.
-- 3. Add this callback URL exactly: https://zsmkhndwoxhwasrlzeox.supabase.co/auth/v1/callback
-- 4. In Authentication -> Providers -> Google, enable Google and paste the Client ID and Client Secret.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS invited_via_token TEXT NULL;

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  intended_tier TEXT NOT NULL DEFAULT 'foundation',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  used_at TIMESTAMPTZ NULL,
  used_by_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ NULL,
  CONSTRAINT invitations_intended_tier_check CHECK (intended_tier IN ('foundation', 'independent_thinker', 'founding_member'))
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.expire_stale_invitations_for_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invitations
  SET revoked_at = COALESCE(revoked_at, now())
  WHERE lower(email) = lower(NEW.email)
    AND used_at IS NULL
    AND revoked_at IS NULL
    AND expires_at <= now()
    AND id IS DISTINCT FROM NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS expire_stale_invitations_for_email_trigger ON public.invitations;
CREATE TRIGGER expire_stale_invitations_for_email_trigger
BEFORE INSERT OR UPDATE OF email, expires_at, revoked_at, used_at
ON public.invitations
FOR EACH ROW
EXECUTE FUNCTION public.expire_stale_invitations_for_email();

CREATE UNIQUE INDEX IF NOT EXISTS invitations_email_active_unique_idx
ON public.invitations (lower(email))
WHERE used_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS invitations_token_idx ON public.invitations (token);
CREATE INDEX IF NOT EXISTS invitations_email_idx ON public.invitations (lower(email));
CREATE INDEX IF NOT EXISTS invitations_created_at_desc_idx ON public.invitations (created_at DESC);

DROP POLICY IF EXISTS "Admins can read invitations" ON public.invitations;
CREATE POLICY "Admins can read invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can create invitations" ON public.invitations;
CREATE POLICY "Admins can create invitations"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can update invitations" ON public.invitations;
CREATE POLICY "Admins can update invitations"
ON public.invitations
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can delete invitations" ON public.invitations;
CREATE POLICY "Admins can delete invitations"
ON public.invitations
FOR DELETE
TO authenticated
USING (public.is_current_user_admin());