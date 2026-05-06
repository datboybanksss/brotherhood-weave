-- SECURITY FIX: Restrict process_payment to service_role only
-- Previously callable by any authenticated user — critical privilege escalation vector

-- Revoke from all client-callable roles
REVOKE EXECUTE ON FUNCTION public.process_payment(UUID, NUMERIC) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_payment(UUID, NUMERIC) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.process_payment(UUID, NUMERIC) FROM anon;
GRANT EXECUTE ON FUNCTION public.process_payment(UUID, NUMERIC) TO service_role;

-- Recreate with authenticated-caller rejection as defense in depth
-- Full existing function body preserved exactly, with guard added at the top
CREATE OR REPLACE FUNCTION public.process_payment(p_user_id UUID, p_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  foundation_id UUID;
BEGIN
  -- Reject any authenticated client context — only service_role may call this
  IF current_setting('request.jwt.claim.role', true) = 'authenticated' THEN
    RAISE EXCEPTION 'process_payment may only be called server-side via service_role';
  END IF;

  SELECT id INTO foundation_id FROM public.tiers WHERE name = 'Foundation';

  INSERT INTO public.payments (user_id, amount, status, provider)
  VALUES (p_user_id, p_amount, 'completed', 'stub');

  UPDATE public.users
  SET payment_status = 'paid',
      membership_started_at = now(),
      tier_id = foundation_id
  WHERE id = p_user_id;
END;
$$;
