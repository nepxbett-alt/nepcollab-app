-- Allow users to set their own role once (NULL → creator|brand) during onboarding.
-- Admins remain free to change roles. Non-admins still cannot escalate to admin
-- or change an already-set role.

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- First-time role pick during onboarding
    IF OLD.role IS NULL AND NEW.role IN ('creator', 'brand') THEN
      NULL; -- keep NEW.role
    ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
      NEW.role := OLD.role;
    END IF;

    IF NEW.suspended IS DISTINCT FROM OLD.suspended THEN
      NEW.suspended := OLD.suspended;
    END IF;
    IF NEW.suspended_at IS DISTINCT FROM OLD.suspended_at THEN
      NEW.suspended_at := OLD.suspended_at;
    END IF;
    IF NEW.suspended_reason IS DISTINCT FROM OLD.suspended_reason THEN
      NEW.suspended_reason := OLD.suspended_reason;
    END IF;
    IF NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
      NEW.admin_notes := OLD.admin_notes;
    END IF;
    IF NEW.featured IS DISTINCT FROM OLD.featured THEN
      NEW.featured := OLD.featured;
    END IF;
    IF NEW.verified IS DISTINCT FROM OLD.verified THEN
      NEW.verified := OLD.verified;
    END IF;
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      NEW.verification_status := OLD.verification_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
