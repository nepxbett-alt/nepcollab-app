-- NepCollab V1: public business requests (admin-managed)
CREATE TABLE IF NOT EXISTS public.business_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL CHECK (char_length(btrim(business_name)) BETWEEN 2 AND 120),
  contact_name TEXT NOT NULL CHECK (char_length(btrim(contact_name)) BETWEEN 2 AND 80),
  phone TEXT NOT NULL CHECK (char_length(btrim(phone)) BETWEEN 7 AND 30),
  email TEXT NOT NULL CHECK (char_length(btrim(email)) BETWEEN 5 AND 120),
  category TEXT,
  location TEXT,
  request_details TEXT NOT NULL CHECK (char_length(btrim(request_details)) BETWEEN 10 AND 4000),
  budget TEXT,
  timeline TEXT,
  preferred_niche TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','in_progress','matched','completed','closed')),
  admin_notes TEXT,
  next_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_requests_status ON public.business_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_requests_created ON public.business_requests(created_at DESC);

ALTER TABLE public.business_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS business_requests_public_insert ON public.business_requests;
CREATE POLICY business_requests_public_insert
  ON public.business_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS business_requests_admin_select ON public.business_requests;
CREATE POLICY business_requests_admin_select
  ON public.business_requests FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS business_requests_admin_update ON public.business_requests;
CREATE POLICY business_requests_admin_update
  ON public.business_requests FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS business_requests_admin_delete ON public.business_requests;
CREATE POLICY business_requests_admin_delete
  ON public.business_requests FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT INSERT ON public.business_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.business_requests TO authenticated;
GRANT ALL ON public.business_requests TO service_role;

CREATE OR REPLACE FUNCTION public.set_business_requests_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_business_requests_updated ON public.business_requests;
CREATE TRIGGER trg_business_requests_updated
  BEFORE UPDATE ON public.business_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_business_requests_updated_at();
