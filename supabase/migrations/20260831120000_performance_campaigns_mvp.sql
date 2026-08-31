-- NepCollab MVP: performance-based campaign payouts (no wallet)
-- Extends campaigns + adds submissions / performance / payout records.

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS payment_model TEXT NOT NULL DEFAULT 'fixed'
    CHECK (payment_model IN ('fixed', 'performance')),
  ADD COLUMN IF NOT EXISTS fixed_amount NUMERIC(12,2) CHECK (fixed_amount IS NULL OR fixed_amount >= 0),
  ADD COLUMN IF NOT EXISTS rate_per_1000_views NUMERIC(12,2) CHECK (rate_per_1000_views IS NULL OR rate_per_1000_views >= 0),
  ADD COLUMN IF NOT EXISTS maximum_payout NUMERIC(12,2) CHECK (maximum_payout IS NULL OR maximum_payout >= 0),
  ADD COLUMN IF NOT EXISTS performance_metric TEXT NOT NULL DEFAULT 'views'
    CHECK (performance_metric IN ('views', 'engagement')),
  ADD COLUMN IF NOT EXISTS milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS required_hashtags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS required_mentions TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_instructions TEXT;

COMMENT ON COLUMN public.campaigns.payment_model IS 'fixed | performance — payout obligation model (no internal wallet)';
COMMENT ON COLUMN public.campaigns.milestones IS '[{ "views": 10000, "amount": 500 }, ...] for milestone performance payouts';

-- Content URL submissions (one active row per collab preferred; history allowed)
CREATE TABLE IF NOT EXISTS public.content_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collaboration_id UUID REFERENCES public.collaborations(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  content_url TEXT NOT NULL,
  caption TEXT,
  posted_at DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','tracking','completed','disputed')),
  fraud_flag BOOLEAN NOT NULL DEFAULT false,
  fraud_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, creator_id, content_url)
);

CREATE INDEX IF NOT EXISTS idx_content_submissions_campaign ON public.content_submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_submissions_creator ON public.content_submissions(creator_id);

ALTER TABLE public.content_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_submissions_creator_rw ON public.content_submissions
  FOR ALL TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY content_submissions_brand_read ON public.content_submissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.brand_id = auth.uid()
    )
  );

CREATE POLICY content_submissions_brand_update ON public.content_submissions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.brand_id = auth.uid()
    )
  );

-- Performance snapshots (immutable history via inserts; latest row is current)
CREATE TABLE IF NOT EXISTS public.content_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.content_submissions(id) ON DELETE CASCADE,
  reported_views BIGINT CHECK (reported_views IS NULL OR reported_views >= 0),
  verified_views BIGINT CHECK (verified_views IS NULL OR verified_views >= 0),
  likes BIGINT CHECK (likes IS NULL OR likes >= 0),
  comments BIGINT CHECK (comments IS NULL OR comments >= 0),
  shares BIGINT CHECK (shares IS NULL OR shares >= 0),
  engagement_rate NUMERIC(8,4),
  performance_source TEXT NOT NULL DEFAULT 'creator_reported'
    CHECK (performance_source IN ('api','manual','creator_reported','admin_verified')),
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_performance_submission ON public.content_performance(submission_id);

ALTER TABLE public.content_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_performance_read ON public.content_performance
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.content_submissions s
      WHERE s.id = submission_id
        AND (
          s.creator_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = s.campaign_id AND c.brand_id = auth.uid())
        )
    )
  );

-- Only brand/admin should insert verified rows — enforce brand ownership in WITH CHECK
CREATE POLICY content_performance_brand_insert ON public.content_performance
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.content_submissions s
      JOIN public.campaigns c ON c.id = s.campaign_id
      WHERE s.id = submission_id AND c.brand_id = auth.uid()
    )
  );

CREATE POLICY content_performance_creator_report ON public.content_performance
  FOR INSERT TO authenticated
  WITH CHECK (
    performance_source = 'creator_reported'
    AND EXISTS (
      SELECT 1 FROM public.content_submissions s
      WHERE s.id = submission_id AND s.creator_id = auth.uid()
    )
  );

-- Payout obligations (not a wallet)
CREATE TABLE IF NOT EXISTS public.content_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.content_submissions(id) ON DELETE SET NULL,
  payment_model TEXT NOT NULL,
  calculated_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (calculated_amount >= 0),
  approved_amount NUMERIC(12,2) CHECK (approved_amount IS NULL OR approved_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','calculated','brand_approved','ready_for_payment','paid','disputed','cancelled')),
  calculation_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_content_payouts_campaign ON public.content_payouts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_payouts_creator ON public.content_payouts(creator_id);

ALTER TABLE public.content_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_payouts_creator_read ON public.content_payouts
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY content_payouts_brand_all ON public.content_payouts
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.brand_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.brand_id = auth.uid())
  );

GRANT SELECT, INSERT, UPDATE ON public.content_submissions TO authenticated;
GRANT SELECT, INSERT ON public.content_performance TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.content_payouts TO authenticated;
GRANT ALL ON public.content_submissions TO service_role;
GRANT ALL ON public.content_performance TO service_role;
GRANT ALL ON public.content_payouts TO service_role;
