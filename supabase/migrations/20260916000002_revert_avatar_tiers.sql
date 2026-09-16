-- Undo the avatar migration applied to this project in error.
-- Retain both migrations so fresh installs and live databases converge.
CREATE OR REPLACE VIEW public.member_avatars
WITH (security_invoker = true)
AS
SELECT u.id, u.full_name, u.avatar_url, u.last_seen_at, t.ring_color
FROM public.users u
LEFT JOIN public.tiers t ON t.id = u.tier_id
WHERE u.payment_status = 'paid' AND u.rejected_at IS NULL;

DROP FUNCTION public.active_avatar_members();
ALTER TABLE public.tiers DROP CONSTRAINT tiers_flat_hex_color;
GRANT SELECT ON public.member_avatars TO authenticated;
