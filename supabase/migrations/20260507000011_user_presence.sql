-- User presence: last_seen_at tracking + member_avatars view

-- 1. Add last_seen_at to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- 2. member_avatars view — safe public display info for Avatar component
--    Replaces direct users-table queries for other members (users table is self-read only post security fix)
CREATE OR REPLACE VIEW public.member_avatars
WITH (security_invoker = true)
AS
SELECT u.id, u.full_name, u.avatar_url, u.last_seen_at, t.ring_color
FROM public.users u
LEFT JOIN public.tiers t ON t.id = u.tier_id
WHERE u.payment_status = 'paid' AND u.rejected_at IS NULL;

GRANT SELECT ON public.member_avatars TO authenticated;

-- 3. Add last_seen_at to public_member_profiles for presence on profile pages
DROP VIEW IF EXISTS public.public_member_profiles;
CREATE VIEW public.public_member_profiles
WITH (security_invoker = true)
AS
SELECT id, full_name, avatar_url, tier_id, membership_started_at, bio, created_at,
       title, current_city, email_visible, is_admin, last_seen_at
FROM public.users
WHERE payment_status = 'paid' AND rejected_at IS NULL;

GRANT SELECT ON public.public_member_profiles TO authenticated;

-- 4. Allow users to update their own last_seen_at (RLS already allows UPDATE on own row)
-- No extra policy needed — users can update their own row already.
