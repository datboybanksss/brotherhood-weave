-- Signup remains open; accounts have no member access until a founder approves.
ALTER TABLE public.users ADD COLUMN membership_request_kind text CHECK (membership_request_kind IN ('existing','new'));
CREATE FUNCTION public.approve_member_request(p_user_id uuid, p_interview_held boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target public.users;
BEGIN
 IF NOT public.is_current_user_admin() THEN RAISE EXCEPTION 'Founder access required'; END IF;
 SELECT * INTO target FROM public.users WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND OR target.rejected_at IS NOT NULL THEN RAISE EXCEPTION 'Request unavailable'; END IF;
 IF target.membership_request_kind IS DISTINCT FROM 'existing' AND p_interview_held IS DISTINCT FROM true THEN RAISE EXCEPTION 'Confirm the applicant meeting took place'; END IF;
 UPDATE public.users SET interview_completed=true,payment_status='paid',membership_started_at=coalesce(membership_started_at,now()),tier_id=coalesce(tier_id,(SELECT id FROM public.tiers WHERE name='Foundation' LIMIT 1)) WHERE id=p_user_id;
 INSERT INTO public.admin_audit_log(actor_id,target_id,action,metadata) VALUES(auth.uid(),p_user_id,'membership_approved',jsonb_build_object('request_kind',target.membership_request_kind,'interview_confirmed',p_interview_held));
END; $$;
REVOKE ALL ON FUNCTION public.approve_member_request(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_member_request(uuid,boolean) TO authenticated;
-- Membership access uses the existing protected payment_status flag so the member
-- app and its existing RLS rules stay compatible. This is not a payment record.
-- Add a restrictive gate to member-only tables, even where an older permissive
-- policy granted authenticated users access. Account/application/public-content
-- tables are intentionally excluded.
CREATE FUNCTION public.has_member_access() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.users WHERE id=auth.uid() AND rejected_at IS NULL AND (payment_status='paid' OR is_admin));
$$;
REVOKE ALL ON FUNCTION public.has_member_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_member_access() TO authenticated;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['channels','messages','direct_messages','conversations','conversation_participants','modules','lessons','archives','playbooks','peer_pairings','submissions','workouts'] LOOP
 IF EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
 EXECUTE format('CREATE POLICY "Founder approved members only" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.has_member_access()) WITH CHECK (public.has_member_access())',t);
 END IF;
 END LOOP;
END $$;

-- Approve the verified existing account when present; otherwise issue an invite.
CREATE OR REPLACE FUNCTION public.review_guest_application(p_id uuid,p_approve boolean,p_interview_held boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.guest_applications; invite_token text; invite_id uuid; member_id uuid;
BEGIN
 IF NOT public.is_current_user_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
 SELECT * INTO a FROM public.guest_applications WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
 IF a.status <> 'pending' THEN RAISE EXCEPTION 'Application already reviewed'; END IF;
 SELECT id INTO member_id FROM auth.users WHERE lower(email)=a.email AND email_confirmed_at IS NOT NULL LIMIT 1;
 IF p_approve THEN
  IF p_interview_held IS DISTINCT FROM true THEN RAISE EXCEPTION 'Confirm that the interview took place'; END IF;
  IF member_id IS NOT NULL THEN
   PERFORM public.approve_member_request(member_id,true);
  ELSE
   invite_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
   INSERT INTO public.invitations(token,email,full_name,is_admin,intended_tier,expires_at,created_by)
   VALUES(invite_token,a.email,a.full_name,false,'foundation',now()+interval '30 days',auth.uid()) RETURNING id INTO invite_id;
  END IF;
 ELSIF member_id IS NOT NULL THEN
  -- Do not deactivate a member who was already approved independently.
  UPDATE public.users SET rejected_at=now() WHERE id=member_id AND payment_status='pending';
 END IF;
 UPDATE public.guest_applications SET status=CASE WHEN p_approve THEN 'approved' ELSE 'declined' END,
 reviewed_at=now(),reviewed_by=auth.uid(),interview_confirmed_at=CASE WHEN p_approve THEN now() END,invitation_id=invite_id WHERE id=p_id;
 RETURN invite_token;
END; $$;
