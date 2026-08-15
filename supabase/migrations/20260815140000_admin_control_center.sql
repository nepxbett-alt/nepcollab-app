-- Admin Control Center schema + RLS (idempotent)

-- Profiles moderation fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_reason text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- Campaigns featured
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- Brand / creator featured
ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- Reports extras
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS severity text DEFAULT 'medium';
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS target_type text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS target_id uuid;

-- is_admin helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- Admin policies on core tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','campaigns','applications','collaborations','conversations',
    'messages','notifications','reviews','portfolio_items','brand_profiles',
    'creator_profiles','saved_campaigns','reports','platform_settings','admin_audit_logs'
  ]
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS admin_all_select ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS admin_all_update ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS admin_all_insert ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS admin_all_delete ON public.%I', t);
      EXECUTE format('CREATE POLICY admin_all_select ON public.%I FOR SELECT TO authenticated USING (public.is_admin())', t);
      EXECUTE format('CREATE POLICY admin_all_update ON public.%I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
      EXECUTE format('CREATE POLICY admin_all_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin())', t);
      EXECUTE format('CREATE POLICY admin_all_delete ON public.%I FOR DELETE TO authenticated USING (public.is_admin())', t);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;

-- Public can read brand_profiles for discover
DROP POLICY IF EXISTS brand_profiles_public_read ON public.brand_profiles;
CREATE POLICY brand_profiles_public_read ON public.brand_profiles FOR SELECT USING (true);

-- Suspended users cannot insert applications (best-effort)
CREATE OR REPLACE FUNCTION public.block_suspended_applications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.creator_id AND COALESCE(suspended, false) = true) THEN
    RAISE EXCEPTION 'Account suspended';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_suspended_applications ON public.applications;
CREATE TRIGGER trg_block_suspended_applications
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.block_suspended_applications();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON public.profiles(suspended) WHERE suspended = true;
CREATE INDEX IF NOT EXISTS idx_campaigns_featured ON public.campaigns(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- Default platform settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('marketplace_status', 'launch', 'Marketplace availability'),
  ('maintenance_mode', 'false', 'When true, show maintenance banner'),
  ('registration_open', 'true', 'Allow new magic-link signups'),
  ('require_creator_verification', 'false', 'Creators must be verified to apply'),
  ('require_brand_verification', 'false', 'Brands must be verified to publish')
ON CONFLICT (key) DO NOTHING;
