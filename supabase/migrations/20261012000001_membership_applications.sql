-- Private application answers; one immutable submission per authenticated applicant.
CREATE TABLE public.membership_applications (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  city text NOT NULL CHECK (char_length(btrim(city)) BETWEEN 2 AND 100),
  occupation text NOT NULL CHECK (char_length(btrim(occupation)) BETWEEN 2 AND 150),
  motivation text NOT NULL CHECK (char_length(btrim(motivation)) BETWEEN 30 AND 1500),
  contribution text NOT NULL CHECK (char_length(btrim(contribution)) BETWEEN 30 AND 1500),
  commitment boolean NOT NULL CHECK (commitment = true),
  submitted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.membership_applications FROM anon, authenticated;
GRANT SELECT ON public.membership_applications TO authenticated;
GRANT INSERT (user_id, city, occupation, motivation, contribution, commitment) ON public.membership_applications TO authenticated;
CREATE POLICY "Applicants and founders can read applications" ON public.membership_applications
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_current_user_admin());
CREATE POLICY "Applicants can submit once" ON public.membership_applications
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND rejected_at IS NULL
        AND interview_completed = false AND payment_status = 'pending'
    )
  );
COMMENT ON TABLE public.membership_applications IS 'Private membership applications. No anonymous reads or client updates/deletes.';
