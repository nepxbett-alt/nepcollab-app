-- NepCollab admin console support
-- Safe to re-run

-- Allow admin in role (live may already allow)
DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IS NULL OR role IN ('creator', 'brand', 'admin'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- Bootstrap: only works when zero admins exist (run once)
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'An admin already exists. Use grant_admin instead.';
  END IF;
  UPDATE public.profiles SET role = 'admin', updated_at = now() WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  INSERT INTO public.admin_audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (p_user_id, 'bootstrap_admin', 'user', p_user_id, '{"source":"bootstrap_first_admin"}'::jsonb);
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin(uuid) TO service_role, authenticated;

-- grant_admin: admin-only
CREATE OR REPLACE FUNCTION public.grant_admin(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() AND current_setting('role', true) <> 'service_role' THEN
    -- allow if no admins yet
    IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
      RAISE EXCEPTION 'only an admin can assign admin role';
    END IF;
  END IF;
  UPDATE public.profiles SET role = 'admin', updated_at = now() WHERE id = p_user_id;
  BEGIN
    INSERT INTO public.admin_audit_logs (admin_id, action, target_type, target_id, details)
    VALUES (COALESCE(auth.uid(), p_user_id), 'grant_admin', 'user', p_user_id, '{}'::jsonb);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_admin(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.revoke_admin(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'only an admin can revoke admin role';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot revoke your own admin role';
  END IF;
  UPDATE public.profiles SET role = 'creator', updated_at = now() WHERE id = p_user_id AND role = 'admin';
  INSERT INTO public.admin_audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'revoke_admin', 'user', p_user_id, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_admin(uuid) TO authenticated;

-- Admin RLS policies (idempotent via drop/create)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','campaigns','applications','collaborations','conversations',
    'messages','notifications','reviews','portfolio_items','brand_profiles',
    'creator_profiles','saved_campaigns','reports','platform_settings','admin_audit_logs'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS admin_all_select ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS admin_all_update ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS admin_all_insert ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS admin_all_delete ON public.%I', t);
    BEGIN
      EXECUTE format('CREATE POLICY admin_all_select ON public.%I FOR SELECT TO authenticated USING (public.is_admin())', t);
      EXECUTE format('CREATE POLICY admin_all_update ON public.%I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
      EXECUTE format('CREATE POLICY admin_all_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin())', t);
      EXECUTE format('CREATE POLICY admin_all_delete ON public.%I FOR DELETE TO authenticated USING (public.is_admin())', t);
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;
  END LOOP;
END $$;

-- Public brand profiles read (for discover cards)
DROP POLICY IF EXISTS brand_profiles_public_read ON public.brand_profiles;
CREATE POLICY brand_profiles_public_read ON public.brand_profiles FOR SELECT USING (true);

-- Ensure reports table basics
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.profiles(id),
  reported_user_id uuid REFERENCES public.profiles(id),
  reason text,
  status text DEFAULT 'open',
  details text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.profiles(id)
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value text,
  description text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.platform_settings (key, value, description) VALUES
  ('marketplace_status', 'launch', 'Marketplace availability'),
  ('monetization', '0', 'Platform monetization'),
  ('payment_enabled', 'false', 'Payments enabled')
ON CONFLICT (key) DO NOTHING;
