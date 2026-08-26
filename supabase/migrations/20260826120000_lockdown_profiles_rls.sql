-- =============================================================================
-- NEPCOLLAB SECURITY HARDENING — profiles / creator_profiles / brand_profiles
-- Removes anonymous full-table reads. Enforces relationship-scoped access.
-- =============================================================================

-- Ensure is_admin exists (idempotent)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- Helper: can the current user see this profile id via a legitimate collab/application?
CREATE OR REPLACE FUNCTION public.can_view_profile(target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    target = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.collaborations c
      WHERE (c.creator_id = auth.uid() AND c.brand_id = target)
         OR (c.brand_id = auth.uid() AND c.creator_id = target)
    )
    OR EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.campaigns camp ON camp.id = a.campaign_id
      WHERE (a.creator_id = auth.uid() AND camp.brand_id = target)
         OR (camp.brand_id = auth.uid() AND a.creator_id = target)
    )
    -- Brands that post discoverable campaigns are visible to signed-in users (name/public fields only via RLS of row, not privileged columns)
    OR EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.brand_id = target
        AND lower(coalesce(c.status, '')) IN (
          'published', 'active', 'applications_open', 'paused', 'closed', 'completed'
        )
    );
$$;
GRANT EXECUTE ON FUNCTION public.can_view_profile(uuid) TO authenticated, anon, service_role;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_related" ON public.profiles;
DROP POLICY IF EXISTS profiles_select_related ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS admin_all_select ON public.profiles;
DROP POLICY IF EXISTS admin_all_update ON public.profiles;
DROP POLICY IF EXISTS admin_all_insert ON public.profiles;
DROP POLICY IF EXISTS admin_all_delete ON public.profiles;

CREATE POLICY profiles_select_own_or_related ON public.profiles
  FOR SELECT TO authenticated
  USING (public.can_view_profile(id));

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- Block privilege escalation on profile updates (non-admins)
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
  -- Preserve privileged fields for non-admins
  IF TG_OP = 'UPDATE' THEN
    NEW.role := OLD.role;
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

DROP TRIGGER IF EXISTS trg_protect_profile_privileged ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- ---------------------------------------------------------------------------
-- CREATOR_PROFILES (live uses user_id)
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.creator_profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.creator_profiles TO authenticated;
GRANT ALL ON public.creator_profiles TO service_role;

DROP POLICY IF EXISTS "creator_profiles_public_read" ON public.creator_profiles;
DROP POLICY IF EXISTS creator_profiles_public_read ON public.creator_profiles;
DROP POLICY IF EXISTS "creator_profiles_write_own" ON public.creator_profiles;
DROP POLICY IF EXISTS creator_profiles_write_own ON public.creator_profiles;
DROP POLICY IF EXISTS "creator_profiles_update_own" ON public.creator_profiles;
DROP POLICY IF EXISTS creator_profiles_update_own ON public.creator_profiles;
DROP POLICY IF EXISTS "creator_profiles_insert_own" ON public.creator_profiles;
DROP POLICY IF EXISTS creator_profiles_insert_own ON public.creator_profiles;
DROP POLICY IF EXISTS admin_all_select ON public.creator_profiles;
DROP POLICY IF EXISTS admin_all_update ON public.creator_profiles;
DROP POLICY IF EXISTS admin_all_insert ON public.creator_profiles;
DROP POLICY IF EXISTS admin_all_delete ON public.creator_profiles;

CREATE POLICY creator_profiles_select_related ON public.creator_profiles
  FOR SELECT TO authenticated
  USING (public.can_view_profile(user_id));

CREATE POLICY creator_profiles_insert_own ON public.creator_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY creator_profiles_update_own ON public.creator_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- BRAND_PROFILES (live uses user_id)
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.brand_profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.brand_profiles TO authenticated;
GRANT ALL ON public.brand_profiles TO service_role;

DROP POLICY IF EXISTS "brand_profiles_public_read" ON public.brand_profiles;
DROP POLICY IF EXISTS brand_profiles_public_read ON public.brand_profiles;
DROP POLICY IF EXISTS "brand_profiles_insert_own" ON public.brand_profiles;
DROP POLICY IF EXISTS brand_profiles_insert_own ON public.brand_profiles;
DROP POLICY IF EXISTS "brand_profiles_update_own" ON public.brand_profiles;
DROP POLICY IF EXISTS brand_profiles_update_own ON public.brand_profiles;
DROP POLICY IF EXISTS admin_all_select ON public.brand_profiles;
DROP POLICY IF EXISTS admin_all_update ON public.brand_profiles;
DROP POLICY IF EXISTS admin_all_insert ON public.brand_profiles;
DROP POLICY IF EXISTS admin_all_delete ON public.brand_profiles;

CREATE POLICY brand_profiles_select_related ON public.brand_profiles
  FOR SELECT TO authenticated
  USING (public.can_view_profile(user_id));

CREATE POLICY brand_profiles_insert_own ON public.brand_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY brand_profiles_update_own ON public.brand_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- SOCIAL_ACCOUNTS — never public
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.social_accounts') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.social_accounts FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated';
    EXECUTE 'GRANT ALL ON public.social_accounts TO service_role';
    -- Drop broad policies if any
    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "social_accounts_public_read" ON public.social_accounts';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

DROP POLICY IF EXISTS social_accounts_select ON public.social_accounts;
DROP POLICY IF EXISTS social_accounts_select_own ON public.social_accounts;
DROP POLICY IF EXISTS social_accounts_select_related ON public.social_accounts;
DROP POLICY IF EXISTS social_accounts_write_own ON public.social_accounts;
DROP POLICY IF EXISTS social_accounts_update_own ON public.social_accounts;
DROP POLICY IF EXISTS social_accounts_delete_own ON public.social_accounts;

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_accounts_select_related ON public.social_accounts
  FOR SELECT TO authenticated
  USING (public.can_view_profile(user_id));

CREATE POLICY social_accounts_insert_own ON public.social_accounts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY social_accounts_update_own ON public.social_accounts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY social_accounts_delete_own ON public.social_accounts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- Narrow PUBLIC campaign brand label (name only) via SECURITY DEFINER view
-- Campaigns themselves stay publicly readable when published.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.public_campaign_brand AS
SELECT
  bp.user_id,
  bp.business_name,
  bp.category,
  bp.website
FROM public.brand_profiles bp
WHERE EXISTS (
  SELECT 1 FROM public.campaigns c
  WHERE c.brand_id = bp.user_id
    AND lower(coalesce(c.status, '')) IN (
      'published', 'active', 'applications_open', 'paused', 'closed', 'completed'
    )
);
-- Views run as invoker by default in PG15+; force security_barrier owner
ALTER VIEW public.public_campaign_brand SET (security_invoker = false);
GRANT SELECT ON public.public_campaign_brand TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- REVIEWS / PORTFOLIO — remove full public dumps if product does not need them
-- Keep participant-scoped; public campaign pages should not leak creator roster.
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.reviews FROM anon;
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
DROP POLICY IF EXISTS reviews_public_read ON public.reviews;
DROP POLICY IF EXISTS reviews_select_related ON public.reviews;
CREATE POLICY reviews_select_related ON public.reviews
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR reviewer_id = auth.uid()
    OR reviewee_id = auth.uid()
  );

REVOKE ALL ON public.portfolio_items FROM anon;
DROP POLICY IF EXISTS "portfolio_public_read" ON public.portfolio_items;
DROP POLICY IF EXISTS portfolio_public_read ON public.portfolio_items;
DROP POLICY IF EXISTS portfolio_select_related ON public.portfolio_items;
CREATE POLICY portfolio_select_related ON public.portfolio_items
  FOR SELECT TO authenticated
  USING (public.can_view_profile(creator_id) OR creator_id = auth.uid() OR public.is_admin());
