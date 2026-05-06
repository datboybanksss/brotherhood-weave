-- SECURITY FIX: Restrict users table direct reads
-- Previously "Paid users can read other paid users" exposed email, is_admin, invited_via_token to all paid members
-- Other-member queries must now go through public_member_profiles view

-- Drop the over-broad policy
DROP POLICY IF EXISTS "Paid users can read other paid users" ON public.users;

-- Self-read policy (each member can read their own row)
-- Note: "Users can read own row" already exists in the initial migration — no change needed.
-- Admins retain access via existing "Admins can read all users" policy — no change needed
-- All other-member queries must use the public_member_profiles view

-- Add is_admin to public_member_profiles so Brotherhood.tsx can identify founders without
-- accessing the raw users table. is_admin is already semi-public (displayed in the UI).
DROP VIEW IF EXISTS public.public_member_profiles;
CREATE VIEW public.public_member_profiles
WITH (security_invoker = true)
AS
SELECT id, full_name, avatar_url, tier_id, membership_started_at, bio, created_at,
       title, current_city, email_visible, is_admin
FROM public.users
WHERE payment_status = 'paid' AND rejected_at IS NULL;

GRANT SELECT ON public.public_member_profiles TO authenticated;
