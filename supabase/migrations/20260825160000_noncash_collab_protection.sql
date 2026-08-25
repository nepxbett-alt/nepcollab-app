-- ============================================================
-- NepCollab Non-Cash Collaboration Protection System
-- NO wallets, payouts, escrow, or cash balances.
-- ============================================================

-- Campaign: structured non-cash benefit
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS benefit_type TEXT,
  ADD COLUMN IF NOT EXISTS benefit_title TEXT,
  ADD COLUMN IF NOT EXISTS benefit_description TEXT,
  ADD COLUMN IF NOT EXISTS benefit_quantity TEXT,
  ADD COLUMN IF NOT EXISTS benefit_terms TEXT,
  ADD COLUMN IF NOT EXISTS benefit_value_display TEXT,
  ADD COLUMN IF NOT EXISTS redemption_method TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS content_deadline_days INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS review_window_days INTEGER DEFAULT 7;

COMMENT ON COLUMN public.campaigns.benefit_value_display IS
  'Informational only (e.g. estimated value). NOT a payment balance.';

-- Collaboration protection fields
ALTER TABLE public.collaborations
  ADD COLUMN IF NOT EXISTS benefit_type TEXT,
  ADD COLUMN IF NOT EXISTS benefit_title TEXT,
  ADD COLUMN IF NOT EXISTS benefit_description TEXT,
  ADD COLUMN IF NOT EXISTS benefit_quantity TEXT,
  ADD COLUMN IF NOT EXISTS benefit_terms TEXT,
  ADD COLUMN IF NOT EXISTS benefit_value_display TEXT,
  ADD COLUMN IF NOT EXISTS redemption_method TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS redemption_code TEXT,
  ADD COLUMN IF NOT EXISTS redemption_instructions TEXT,
  ADD COLUMN IF NOT EXISTS benefit_expiry TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS benefit_commitment_status TEXT DEFAULT 'pending'
    CHECK (benefit_commitment_status IS NULL OR benefit_commitment_status IN (
      'pending','committed','available','redeemed','fulfilled','cancelled','disputed'
    )),
  ADD COLUMN IF NOT EXISTS benefit_committed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS benefit_committed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS benefit_available_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS benefit_redeemed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS benefit_redeemed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS benefit_confirmed_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_confirmed_by_brand_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_confirmed_by_creator_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deliverable_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revision_limit INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS protection_status TEXT DEFAULT 'pending_agreement'
    CHECK (protection_status IS NULL OR protection_status IN (
      'pending_agreement','agreement_active','benefit_committed','benefit_available',
      'benefit_redeemed','in_progress','submitted','revision_requested','completed',
      'failed','cancelled','disputed'
    ));

-- Immutable agreement versions
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
CREATE INDEX IF NOT EXISTS idx_collab_agreements_collab ON public.collaboration_agreements(collaboration_id);

ALTER TABLE public.collaboration_agreements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS collab_agreements_select ON public.collaboration_agreements;
CREATE POLICY collab_agreements_select ON public.collaboration_agreements
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.collaborations c
      WHERE c.id = collaboration_id AND (c.brand_id = auth.uid() OR c.creator_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS collab_agreements_insert ON public.collaboration_agreements;
CREATE POLICY collab_agreements_insert ON public.collaboration_agreements
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.collaborations c
      WHERE c.id = collaboration_id AND (c.brand_id = auth.uid() OR c.creator_id = auth.uid())
    )
  );
GRANT SELECT, INSERT ON public.collaboration_agreements TO authenticated;
GRANT ALL ON public.collaboration_agreements TO service_role;

-- Collaboration event audit log
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
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.collaborations c
      WHERE c.id = collaboration_id AND (c.brand_id = auth.uid() OR c.creator_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS collab_events_insert ON public.collaboration_events;
CREATE POLICY collab_events_insert ON public.collaboration_events
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    OR public.is_admin()
  );
GRANT SELECT, INSERT ON public.collaboration_events TO authenticated;
GRANT ALL ON public.collaboration_events TO service_role;

-- Reliability counters (informational trust signals — not payment scores)
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS reliability_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS completed_collabs INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS missed_deadlines INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_collabs INTEGER DEFAULT 0;

ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS reliability_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS benefit_fulfillment_rate NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS completed_collabs INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancelled_after_commit INTEGER DEFAULT 0;

-- Disputes table (create if missing)
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES public.collaborations(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  against_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  evidence JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN (
      'open','creator_response_required','brand_response_required',
      'under_review','resolved','escalated','closed'
    )),
  admin_resolution TEXT,
  resolution_outcome TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_disputes_collab ON public.disputes(collaboration_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS disputes_select ON public.disputes;
CREATE POLICY disputes_select ON public.disputes
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR opened_by = auth.uid()
    OR against_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.collaborations c
      WHERE c.id = collaboration_id AND (c.brand_id = auth.uid() OR c.creator_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS disputes_insert ON public.disputes;
CREATE POLICY disputes_insert ON public.disputes
  FOR INSERT TO authenticated
  WITH CHECK (opened_by = auth.uid());
DROP POLICY IF EXISTS disputes_update ON public.disputes;
CREATE POLICY disputes_update ON public.disputes
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR opened_by = auth.uid() OR against_id = auth.uid());
GRANT SELECT, INSERT, UPDATE ON public.disputes TO authenticated;
GRANT ALL ON public.disputes TO service_role;

-- Helper: log collaboration event
CREATE OR REPLACE FUNCTION public.log_collab_event(
  p_collaboration_id UUID,
  p_event_type TEXT,
  p_old_status TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.collaboration_events (
    collaboration_id, actor_id, actor_role, event_type, old_status, new_status, metadata
  ) VALUES (
    p_collaboration_id, auth.uid(), v_role, p_event_type, p_old_status, p_new_status, p_metadata
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.log_collab_event TO authenticated;

COMMENT ON TABLE public.collaboration_agreements IS
  'Immutable agreement snapshots. Never overwrite — create a new version.';
COMMENT ON TABLE public.collaboration_events IS
  'Audit trail for non-cash collaboration protection lifecycle.';
