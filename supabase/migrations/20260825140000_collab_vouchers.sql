-- NepCollab collaboration completion vouchers / gift coupons
CREATE TABLE IF NOT EXISTS public.collab_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES public.collaborations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  brand_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT 'NepCollab Collaboration Voucher',
  description TEXT,
  reward_label TEXT,
  amount_npr NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'NPR',
  status TEXT NOT NULL DEFAULT 'pending_admin'
    CHECK (status IN ('pending_admin', 'issued', 'redeemed', 'void')),
  brand_name TEXT,
  creator_name TEXT,
  campaign_title TEXT,
  brand_note TEXT,
  admin_note TEXT,
  issued_at TIMESTAMPTZ,
  issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (collaboration_id)
);

CREATE INDEX IF NOT EXISTS idx_collab_vouchers_status ON public.collab_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_collab_vouchers_creator ON public.collab_vouchers(creator_id);
CREATE INDEX IF NOT EXISTS idx_collab_vouchers_brand ON public.collab_vouchers(brand_id);

ALTER TABLE public.collab_vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS collab_vouchers_select ON public.collab_vouchers;
CREATE POLICY collab_vouchers_select ON public.collab_vouchers
  FOR SELECT TO authenticated
  USING (
    brand_id = auth.uid()
    OR creator_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS collab_vouchers_brand_insert ON public.collab_vouchers;
CREATE POLICY collab_vouchers_brand_insert ON public.collab_vouchers
  FOR INSERT TO authenticated
  WITH CHECK (
    brand_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.collaborations c
      WHERE c.id = collaboration_id
        AND c.brand_id = auth.uid()
        AND c.creator_id = collab_vouchers.creator_id
        AND c.status IN ('completed', 'submitted')
    )
  );

DROP POLICY IF EXISTS collab_vouchers_brand_update ON public.collab_vouchers;
CREATE POLICY collab_vouchers_brand_update ON public.collab_vouchers
  FOR UPDATE TO authenticated
  USING (brand_id = auth.uid() AND status = 'pending_admin')
  WITH CHECK (brand_id = auth.uid());

DROP POLICY IF EXISTS collab_vouchers_creator_redeem ON public.collab_vouchers;
CREATE POLICY collab_vouchers_creator_redeem ON public.collab_vouchers
  FOR UPDATE TO authenticated
  USING (creator_id = auth.uid() AND status = 'issued')
  WITH CHECK (creator_id = auth.uid() AND status IN ('issued', 'redeemed'));

DROP POLICY IF EXISTS collab_vouchers_admin_all ON public.collab_vouchers;
CREATE POLICY collab_vouchers_admin_all ON public.collab_vouchers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE ON public.collab_vouchers TO authenticated;
GRANT ALL ON public.collab_vouchers TO service_role;

COMMENT ON TABLE public.collab_vouchers IS
  'Brand-issued completion vouchers; admin releases to creator for redemption/share.';
