CREATE TABLE public.member_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_social_links_platform_chk CHECK (
    platform IN ('instagram', 'linkedin', 'tiktok', 'x', 'youtube', 'website')
  ),
  CONSTRAINT member_social_links_url_length CHECK (char_length(url) <= 300),
  CONSTRAINT member_social_links_unique_platform UNIQUE (user_id, platform)
);

CREATE INDEX member_social_links_user_order_idx
  ON public.member_social_links (user_id, display_order, platform);

ALTER TABLE public.member_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paid members can read member social links"
  ON public.member_social_links FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.payment_status = 'paid'
        AND u.rejected_at IS NULL
    )
  );

CREATE POLICY "Members can manage own social links"
  ON public.member_social_links FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_member_social_links_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_member_social_links_updated_at
BEFORE UPDATE ON public.member_social_links
FOR EACH ROW EXECUTE FUNCTION public.touch_member_social_links_updated_at();
