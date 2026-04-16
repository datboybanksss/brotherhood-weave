
CREATE OR REPLACE FUNCTION public.protect_user_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Skip for non-authenticated contexts (SECURITY DEFINER functions like process_payment, evaluate_tier_upgrade)
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'authenticated' THEN
    RETURN NEW;
  END IF;
  -- Skip for admins
  IF public.is_current_user_admin() THEN
    RETURN NEW;
  END IF;
  -- Block protected column changes for regular users
  IF NEW.tier_id IS DISTINCT FROM OLD.tier_id
    OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
    OR NEW.interview_completed IS DISTINCT FROM OLD.interview_completed
    OR NEW.is_admin IS DISTINCT FROM OLD.is_admin
    OR NEW.membership_started_at IS DISTINCT FROM OLD.membership_started_at
    OR NEW.rejected_at IS DISTINCT FROM OLD.rejected_at
  THEN
    RAISE EXCEPTION 'Cannot modify protected columns';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_user_columns_trigger
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_columns();
