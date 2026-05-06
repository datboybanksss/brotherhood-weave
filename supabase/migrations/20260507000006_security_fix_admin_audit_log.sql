-- SECURITY FIX: Admin audit log for privileged actions

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  target_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_actor ON public.admin_audit_log(actor_id);
CREATE INDEX idx_admin_audit_target ON public.admin_audit_log(target_id);
CREATE INDEX idx_admin_audit_created ON public.admin_audit_log(created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

-- No client INSERT/UPDATE/DELETE — service_role and SECURITY DEFINER functions only
