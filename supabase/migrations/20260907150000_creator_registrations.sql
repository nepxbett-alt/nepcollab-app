-- Creator registrations: join + notify when businesses list

CREATE TABLE IF NOT EXISTS public.creator_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 100),
  email TEXT NOT NULL CHECK (char_length(btrim(email)) BETWEEN 5 AND 120),
  phone TEXT CHECK (char_length(btrim(COALESCE(phone,''))) <= 30),
  niche TEXT,
  location TEXT,
  platforms TEXT, -- e.g. Instagram, TikTok
  followers_text TEXT,
  bio TEXT CHECK (char_length(btrim(COALESCE(bio,''))) <= 2000),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','paused')),
  notify_new_businesses BOOLEAN NOT NULL DEFAULT true,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_reg_email
  ON public.creator_registrations (lower(email));
CREATE INDEX IF NOT EXISTS idx_creator_reg_status
  ON public.creator_registrations (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_reg_user
  ON public.creator_registrations (user_id);

-- Alerts when a business is listed (shown in creator workspace)
CREATE TABLE IF NOT EXISTS public.creator_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.business_listings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creator_alerts_created
  ON public.creator_alerts (created_at DESC);

ALTER TABLE public.creator_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS creator_reg_public_insert ON public.creator_registrations;
CREATE POLICY creator_reg_public_insert ON public.creator_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS creator_reg_select ON public.creator_registrations;
CREATE POLICY creator_reg_select ON public.creator_registrations
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS creator_reg_update ON public.creator_registrations;
CREATE POLICY creator_reg_update ON public.creator_registrations
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR user_id = auth.uid())
  WITH CHECK (public.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS creator_reg_admin_delete ON public.creator_registrations;
CREATE POLICY creator_reg_admin_delete ON public.creator_registrations
  FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS creator_alerts_select ON public.creator_alerts;
CREATE POLICY creator_alerts_select ON public.creator_alerts
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.creator_registrations c
      WHERE c.user_id = auth.uid() AND c.status = 'active' AND c.notify_new_businesses = true
    )
    OR EXISTS (
      SELECT 1 FROM public.creator_registrations c
      WHERE lower(c.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
        AND c.notify_new_businesses = true
    )
  );

DROP POLICY IF EXISTS creator_alerts_admin_insert ON public.creator_alerts;
CREATE POLICY creator_alerts_admin_insert ON public.creator_alerts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS creator_alerts_admin_all ON public.creator_alerts;
CREATE POLICY creator_alerts_admin_delete ON public.creator_alerts
  FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT INSERT ON public.creator_registrations TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.creator_registrations TO authenticated;
GRANT SELECT ON public.creator_alerts TO authenticated;
GRANT INSERT, DELETE ON public.creator_alerts TO authenticated;
GRANT ALL ON public.creator_registrations, public.creator_alerts TO service_role;

DROP TRIGGER IF EXISTS trg_creator_reg_updated ON public.creator_registrations;
CREATE TRIGGER trg_creator_reg_updated
  BEFORE UPDATE ON public.creator_registrations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
