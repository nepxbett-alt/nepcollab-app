-- Bright Data enrichment columns + sync log (safe to re-run)
ALTER TABLE public.social_accounts
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS following_count integer,
  ADD COLUMN IF NOT EXISTS subscriber_count integer,
  ADD COLUMN IF NOT EXISTS post_count integer,
  ADD COLUMN IF NOT EXISTS video_count integer,
  ADD COLUMN IF NOT EXISTS view_count bigint,
  ADD COLUMN IF NOT EXISTS like_count bigint,
  ADD COLUMN IF NOT EXISTS stats_source text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sync_error text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS social_accounts_user_platform_uidx
  ON public.social_accounts (user_id, platform);

CREATE TABLE IF NOT EXISTS public.social_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  action text NOT NULL DEFAULT 'lookup',
  success boolean NOT NULL DEFAULT false,
  error_category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_sync_log_user_created_idx
  ON public.social_sync_log (user_id, created_at DESC);

ALTER TABLE public.social_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own sync log" ON public.social_sync_log;
CREATE POLICY "users read own sync log"
  ON public.social_sync_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users insert own sync log" ON public.social_sync_log;
CREATE POLICY "users insert own sync log"
  ON public.social_sync_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMENT ON COLUMN public.social_accounts.stats_source IS 'self_reported | brightdata | public | verified';
COMMENT ON COLUMN public.social_accounts.sync_status IS 'pending | ok | error | unavailable';
