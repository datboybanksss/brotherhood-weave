-- Account-free intake; only administrators can read applicant information.
CREATE TABLE public.guest_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 100),
 email text NOT NULL UNIQUE CHECK (char_length(email) <= 255 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 city text NOT NULL CHECK (char_length(btrim(city)) BETWEEN 2 AND 100),
 occupation text NOT NULL CHECK (char_length(btrim(occupation)) BETWEEN 2 AND 150),
 motivation text NOT NULL CHECK (char_length(btrim(motivation)) BETWEEN 30 AND 1500),
 contribution text NOT NULL CHECK (char_length(btrim(contribution)) BETWEEN 30 AND 1500),
 commitment boolean NOT NULL CHECK (commitment),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined')),
 submitted_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz,
 reviewed_by uuid REFERENCES public.users(id),
 interview_confirmed_at timestamptz,
 invitation_id uuid REFERENCES public.invitations(id)
);
ALTER TABLE public.guest_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.guest_applications FROM anon, authenticated;
GRANT SELECT ON public.guest_applications TO authenticated;
CREATE POLICY "Founders read guest applications" ON public.guest_applications FOR SELECT TO authenticated USING (public.is_current_user_admin());
CREATE FUNCTION public.submit_guest_application(p_full_name text,p_email text,p_city text,p_occupation text,p_motivation text,p_contribution text,p_commitment boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.guest_applications(full_name,email,city,occupation,motivation,contribution,commitment)
 VALUES(btrim(p_full_name),lower(btrim(p_email)),btrim(p_city),btrim(p_occupation),btrim(p_motivation),btrim(p_contribution),p_commitment)
 ON CONFLICT(email) DO NOTHING;
 -- Same response for duplicates: never disclose whether an email has applied.
END; $$;
REVOKE ALL ON FUNCTION public.submit_guest_application(text,text,text,text,text,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_guest_application(text,text,text,text,text,text,boolean) TO anon, authenticated;
CREATE FUNCTION public.review_guest_application(p_id uuid,p_approve boolean,p_interview_held boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.guest_applications; invite_token text; invite_id uuid;
BEGIN
 IF NOT public.is_current_user_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
 SELECT * INTO a FROM public.guest_applications WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
 IF a.status <> 'pending' THEN RAISE EXCEPTION 'Application already reviewed'; END IF;
 IF p_approve THEN
  IF p_interview_held IS DISTINCT FROM true THEN RAISE EXCEPTION 'Confirm that the interview took place'; END IF;
  invite_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
  INSERT INTO public.invitations(token,email,full_name,is_admin,intended_tier,expires_at,created_by)
  VALUES(invite_token,a.email,a.full_name,false,'foundation',now()+interval '30 days',auth.uid()) RETURNING id INTO invite_id;
 END IF;
 UPDATE public.guest_applications SET status=CASE WHEN p_approve THEN 'approved' ELSE 'declined' END,
 reviewed_at=now(),reviewed_by=auth.uid(),interview_confirmed_at=CASE WHEN p_approve THEN now() END,invitation_id=invite_id WHERE id=p_id;
 RETURN invite_token;
END; $$;
REVOKE ALL ON FUNCTION public.review_guest_application(uuid,boolean,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_guest_application(uuid,boolean,boolean) TO authenticated;
