-- Preserve existing tier IDs and member assignments.
INSERT INTO public.tiers (name, ring_color, display_order) VALUES
  ('Foundation', '#9CA3AF', 1),
  ('Independent Thinker', '#7B9FFF', 2),
  ('Founding Member', '#1512D3', 3)
ON CONFLICT (name) DO UPDATE
SET ring_color = EXCLUDED.ring_color, display_order = EXCLUDED.display_order;

ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ADD CONSTRAINT tiers_flat_hex_color
  CHECK (ring_color ~ '^#[0-9A-Fa-f]{6}$');
DROP POLICY IF EXISTS "Tiers readable by authenticated" ON public.tiers;
CREATE POLICY "Tiers readable by authenticated" ON public.tiers
  FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.tiers TO authenticated;

-- users.tier_id already references tiers(id). Keep private users RLS intact.
-- A narrowly scoped projection makes active-member display fields available
-- without granting access to emails or other private member columns.
CREATE FUNCTION public.active_avatar_members()
RETURNS TABLE (id uuid, full_name text, avatar_url text, last_seen_at timestamptz, tier_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.id, u.full_name, u.avatar_url, u.last_seen_at, u.tier_id
  FROM public.users u
  WHERE u.payment_status = 'paid' AND u.rejected_at IS NULL
    AND (SELECT auth.uid()) IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.active_avatar_members() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.active_avatar_members() TO authenticated;

CREATE OR REPLACE VIEW public.member_avatars
WITH (security_invoker = true)
AS
SELECT u.id, u.full_name, u.avatar_url, u.last_seen_at, t.ring_color
FROM public.active_avatar_members() u
LEFT JOIN public.tiers t ON t.id = u.tier_id;
REVOKE ALL ON public.member_avatars FROM anon;
GRANT SELECT ON public.member_avatars TO authenticated;
