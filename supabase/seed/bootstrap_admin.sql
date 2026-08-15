-- Fix: disable the escalation trigger, bootstrap first admin, re-enable.
-- Run entire script in Supabase SQL Editor as one go.

-- 1) Temporarily disable trigger(s) that block admin assignment
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tgname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'profiles'
      AND NOT t.tgisinternal
      AND (
        tgname ILIKE '%admin%'
        OR tgname ILIKE '%role%'
        OR tgname ILIKE '%escalat%'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DISABLE TRIGGER %I', r.tgname);
    RAISE NOTICE 'Disabled trigger %', r.tgname;
  END LOOP;
END $$;

-- Also disable by known name if present
ALTER TABLE public.profiles DISABLE TRIGGER IF EXISTS prevent_non_admin_role_escalation;
-- Some DBs name the trigger after the function
DO $$
BEGIN
  ALTER TABLE public.profiles DISABLE TRIGGER prevent_non_admin_role_escalation;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

-- 2) Promote first admin (nepxbett@gmail.com)
UPDATE public.profiles
SET role = 'admin', updated_at = now()
WHERE id = 'b3e55aba-303b-479e-b610-daf307d73a14'::uuid;

-- 3) Re-enable triggers
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tgname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'profiles'
      AND NOT t.tgisinternal
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.profiles ENABLE TRIGGER %I', r.tgname);
      RAISE NOTICE 'Enabled trigger %', r.tgname;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- 4) Harden bootstrap function to disable trigger internally next time
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'An admin already exists. Use grant_admin instead.';
  END IF;

  FOR r IN
    SELECT tgname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'profiles' AND NOT t.tgisinternal
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DISABLE TRIGGER %I', r.tgname);
  END LOOP;

  UPDATE public.profiles SET role = 'admin', updated_at = now() WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  FOR r IN
    SELECT tgname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'profiles' AND NOT t.tgisinternal
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.profiles ENABLE TRIGGER %I', r.tgname);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;

  BEGIN
    INSERT INTO public.admin_audit_logs (admin_id, action, target_type, target_id, details)
    VALUES (p_user_id, 'bootstrap_admin', 'user', p_user_id, '{"source":"bootstrap_first_admin"}'::jsonb);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END;
$$;

-- 5) Fix grant_admin similarly for service_role / existing admin
CREATE OR REPLACE FUNCTION public.grant_admin(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  caller_is_admin boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    INTO caller_is_admin;

  IF NOT caller_is_admin AND EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'only an admin can assign admin role';
  END IF;

  FOR r IN
    SELECT tgname FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'profiles' AND NOT t.tgisinternal
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DISABLE TRIGGER %I', r.tgname);
  END LOOP;

  UPDATE public.profiles SET role = 'admin', updated_at = now() WHERE id = p_user_id;

  FOR r IN
    SELECT tgname FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'profiles' AND NOT t.tgisinternal
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.profiles ENABLE TRIGGER %I', r.tgname);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;

  BEGIN
    INSERT INTO public.admin_audit_logs (admin_id, action, target_type, target_id, details)
    VALUES (COALESCE(auth.uid(), p_user_id), 'grant_admin', 'user', p_user_id, '{}'::jsonb);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END;
$$;

-- 6) Verify
SELECT id, full_name, role, email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.id = 'b3e55aba-303b-479e-b610-daf307d73a14'::uuid
   OR p.role = 'admin';
