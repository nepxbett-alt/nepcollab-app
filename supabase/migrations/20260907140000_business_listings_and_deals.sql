-- Business listings (homepage) + deals + admin influencer assignments

CREATE TABLE IF NOT EXISTS public.business_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL CHECK (char_length(btrim(business_name)) BETWEEN 2 AND 120),
  contact_name TEXT NOT NULL CHECK (char_length(btrim(contact_name)) BETWEEN 2 AND 80),
  phone TEXT NOT NULL CHECK (char_length(btrim(phone)) BETWEEN 7 AND 30),
  email TEXT NOT NULL CHECK (char_length(btrim(email)) BETWEEN 5 AND 120),
  category TEXT,
  location TEXT,
  description TEXT NOT NULL CHECK (char_length(btrim(description)) BETWEEN 10 AND 2000),
  website TEXT,
  -- pending = submitted, listed = on homepage, paused, closed
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','listed','paused','closed')),
  featured BOOLEAN NOT NULL DEFAULT false,
  show_on_homepage BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  listed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_business_listings_homepage
  ON public.business_listings (show_on_homepage, featured, listed_at DESC)
  WHERE show_on_homepage = true AND status = 'listed';
CREATE INDEX IF NOT EXISTS idx_business_listings_owner
  ON public.business_listings (owner_id);
CREATE INDEX IF NOT EXISTS idx_business_listings_status
  ON public.business_listings (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.business_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.business_listings(id) ON DELETE CASCADE,
  brand_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 2 AND 160),
  brief TEXT CHECK (char_length(btrim(COALESCE(brief, ''))) <= 4000),
  -- open | matched | closing | closed
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','matched','closing','closed')),
  admin_notes TEXT,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_deals_listing ON public.business_deals(listing_id);
CREATE INDEX IF NOT EXISTS idx_business_deals_brand ON public.business_deals(brand_user_id);
CREATE INDEX IF NOT EXISTS idx_business_deals_status ON public.business_deals(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.deal_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.business_deals(id) ON DELETE CASCADE,
  influencer_name TEXT NOT NULL CHECK (char_length(btrim(influencer_name)) BETWEEN 2 AND 100),
  influencer_handle TEXT,
  platform TEXT, -- Instagram, TikTok, YouTube, Facebook
  followers_text TEXT, -- e.g. "42K"
  niche TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  -- proposed by admin → brand_selected → declined → notified → confirmed → closed
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed','brand_selected','declined','notified','confirmed','closed')),
  admin_note TEXT,
  brand_note TEXT,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_assignments_deal ON public.deal_assignments(deal_id);

ALTER TABLE public.business_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_assignments ENABLE ROW LEVEL SECURITY;

-- Listings: public can read listed+homepage; anyone can insert pending; owner/admin manage
DROP POLICY IF EXISTS listings_public_select ON public.business_listings;
CREATE POLICY listings_public_select ON public.business_listings
  FOR SELECT TO anon, authenticated
  USING (
    (show_on_homepage = true AND status = 'listed')
    OR public.is_admin()
    OR (auth.uid() IS NOT NULL AND owner_id = auth.uid())
  );

DROP POLICY IF EXISTS listings_public_insert ON public.business_listings;
CREATE POLICY listings_public_insert ON public.business_listings
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND show_on_homepage = false);

DROP POLICY IF EXISTS listings_owner_update ON public.business_listings;
CREATE POLICY listings_owner_update ON public.business_listings
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR owner_id = auth.uid())
  WITH CHECK (public.is_admin() OR owner_id = auth.uid());

DROP POLICY IF EXISTS listings_admin_delete ON public.business_listings;
CREATE POLICY listings_admin_delete ON public.business_listings
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Deals
DROP POLICY IF EXISTS deals_select ON public.business_deals;
CREATE POLICY deals_select ON public.business_deals
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR brand_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.business_listings l
      WHERE l.id = listing_id AND l.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS deals_admin_all ON public.business_deals;
CREATE POLICY deals_admin_insert ON public.business_deals
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR brand_user_id = auth.uid());

DROP POLICY IF EXISTS deals_update ON public.business_deals;
CREATE POLICY deals_update ON public.business_deals
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR brand_user_id = auth.uid())
  WITH CHECK (public.is_admin() OR brand_user_id = auth.uid());

DROP POLICY IF EXISTS deals_admin_delete ON public.business_deals;
CREATE POLICY deals_admin_delete ON public.business_deals
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Assignments
DROP POLICY IF EXISTS assignments_select ON public.deal_assignments;
CREATE POLICY assignments_select ON public.deal_assignments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.business_deals d
      WHERE d.id = deal_id
        AND (d.brand_user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS assignments_admin_write ON public.deal_assignments;
CREATE POLICY assignments_admin_insert ON public.deal_assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS assignments_update ON public.deal_assignments;
CREATE POLICY assignments_update ON public.deal_assignments
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.business_deals d
      WHERE d.id = deal_id AND d.brand_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.business_deals d
      WHERE d.id = deal_id AND d.brand_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS assignments_admin_delete ON public.deal_assignments;
CREATE POLICY assignments_admin_delete ON public.deal_assignments
  FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT ON public.business_listings TO anon, authenticated;
GRANT UPDATE, DELETE ON public.business_listings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_deals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_assignments TO authenticated;
GRANT ALL ON public.business_listings, public.business_deals, public.deal_assignments TO service_role;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_listings_updated ON public.business_listings;
CREATE TRIGGER trg_listings_updated BEFORE UPDATE ON public.business_listings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_deals_updated ON public.business_deals;
CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON public.business_deals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_assignments_updated ON public.deal_assignments;
CREATE TRIGGER trg_assignments_updated BEFORE UPDATE ON public.deal_assignments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
