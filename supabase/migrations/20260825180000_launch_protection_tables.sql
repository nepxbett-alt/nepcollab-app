-- Launch pack: collaboration protection tables (safe if partially applied)
CREATE TABLE IF NOT EXISTS public.collaboration_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES public.collaborations(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  superseded_at TIMESTAMPTZ,
  UNIQUE (collaboration_id, version)
);
ALTER TABLE public.collaboration_agreements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS collab_agreements_select ON public.collaboration_agreements;
CREATE POLICY collab_agreements_select ON public.collaboration_agreements
  FOR SELECT TO authenticated USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.collaborations c
      WHERE c.id = collaboration_id AND (c.brand_id = auth.uid() OR c.creator_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS collab_agreements_insert ON public.collaboration_agreements;
CREATE POLICY collab_agreements_insert ON public.collaboration_agreements
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.collaborations c
      WHERE c.id = collaboration_id AND (c.brand_id = auth.uid() OR c.creator_id = auth.uid())
    )
  );
GRANT SELECT, INSERT ON public.collaboration_agreements TO authenticated;
GRANT ALL ON public.collaboration_agreements TO service_role;

CREATE TABLE IF NOT EXISTS public.collaboration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES public.collaborations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  event_type TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_collab_events_collab ON public.collaboration_events(collaboration_id, created_at);
ALTER TABLE public.collaboration_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS collab_events_select ON public.collaboration_events;
CREATE POLICY collab_events_select ON public.collaboration_events
  FOR SELECT TO authenticated USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.collaborations c
      WHERE c.id = collaboration_id AND (c.brand_id = auth.uid() OR c.creator_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS collab_events_insert ON public.collaboration_events;
CREATE POLICY collab_events_insert ON public.collaboration_events
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() OR public.is_admin());
GRANT SELECT, INSERT ON public.collaboration_events TO authenticated;
GRANT ALL ON public.collaboration_events TO service_role;

-- Allow null social metrics (preferred over fake zeros)
ALTER TABLE public.social_accounts ALTER COLUMN engagement_rate DROP NOT NULL;
ALTER TABLE public.social_accounts ALTER COLUMN followers DROP NOT NULL;

-- Collaboration protection columns (idempotent)
ALTER TABLE public.collaborations
  ADD COLUMN IF NOT EXISTS benefit_commitment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS protection_status TEXT DEFAULT 'pending_agreement',
  ADD COLUMN IF NOT EXISTS benefit_title TEXT,
  ADD COLUMN IF NOT EXISTS redemption_code TEXT,
  ADD COLUMN IF NOT EXISTS benefit_committed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS benefit_redeemed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_confirmed_by_brand_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_confirmed_by_creator_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deliverable_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revision_limit INTEGER DEFAULT 1;

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS benefit_type TEXT,
  ADD COLUMN IF NOT EXISTS benefit_title TEXT,
  ADD COLUMN IF NOT EXISTS benefit_value_display TEXT,
  ADD COLUMN IF NOT EXISTS redemption_method TEXT DEFAULT 'manual';
