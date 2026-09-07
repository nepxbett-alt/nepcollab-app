-- Promote nepcoolab@gmail.com (and legacy nepcoollab typo) to admin
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.bypass_profile_protect', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      IF NEW.role IN ('creator', 'brand')
         AND COALESCE(OLD.onboarded, false) = false THEN
        NULL;
      ELSE
        NEW.role := OLD.role;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users
  WHERE lower(email) IN ('nepcoolab@gmail.com', 'nepcoollab@gmail.com')
  ORDER BY CASE WHEN lower(email) = 'nepcoolab@gmail.com' THEN 0 ELSE 1 END
  LIMIT 1;
  IF uid IS NULL THEN
    RAISE NOTICE 'Admin email not found in auth.users — sign in once then re-run.';
    RETURN;
  END IF;
  INSERT INTO public.profiles (id, full_name, role, onboarded, verified)
  VALUES (uid, 'NepCollab Admin', 'admin', true, true)
  ON CONFLICT (id) DO NOTHING;
  PERFORM set_config('app.bypass_profile_protect', 'on', true);
  UPDATE public.profiles
  SET role = 'admin', onboarded = true, verified = true, updated_at = now()
  WHERE id = uid;
  PERFORM set_config('app.bypass_profile_protect', 'off', true);
  RAISE NOTICE 'Admin set for %', uid;
END $$;
