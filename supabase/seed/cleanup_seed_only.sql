-- Emergency cleanup of seed UUIDs only (no inserts)
BEGIN;
CREATE TEMP TABLE seed_ids (id uuid PRIMARY KEY);
INSERT INTO seed_ids VALUES
  ('a1000001-0000-4000-8000-000000000001'),('a1000002-0000-4000-8000-000000000002'),
  ('a1000003-0000-4000-8000-000000000003'),('a1000004-0000-4000-8000-000000000004'),
  ('a1000005-0000-4000-8000-000000000005'),('b2000001-0000-4000-8000-000000000001'),
  ('b2000002-0000-4000-8000-000000000002'),('b2000003-0000-4000-8000-000000000003'),
  ('b2000004-0000-4000-8000-000000000004'),('b2000005-0000-4000-8000-000000000005');
CREATE TEMP TABLE seed_campaigns (id uuid PRIMARY KEY);
INSERT INTO seed_campaigns VALUES
  ('c3000001-0000-4000-8000-000000000001'),('c3000002-0000-4000-8000-000000000002'),
  ('c3000003-0000-4000-8000-000000000003'),('c3000004-0000-4000-8000-000000000004'),
  ('c3000005-0000-4000-8000-000000000005');

DELETE FROM public.messages WHERE sender_id IN (SELECT id FROM seed_ids)
  OR conversation_id IN (SELECT id FROM public.conversations WHERE brand_id IN (SELECT id FROM seed_ids) OR creator_id IN (SELECT id FROM seed_ids));
DELETE FROM public.conversations WHERE brand_id IN (SELECT id FROM seed_ids) OR creator_id IN (SELECT id FROM seed_ids);
DELETE FROM public.reviews WHERE reviewer_id IN (SELECT id FROM seed_ids) OR reviewee_id IN (SELECT id FROM seed_ids);
DELETE FROM public.notifications WHERE user_id IN (SELECT id FROM seed_ids);
DELETE FROM public.collaborations WHERE brand_id IN (SELECT id FROM seed_ids) OR creator_id IN (SELECT id FROM seed_ids) OR campaign_id IN (SELECT id FROM seed_campaigns);
DELETE FROM public.applications WHERE creator_id IN (SELECT id FROM seed_ids) OR campaign_id IN (SELECT id FROM seed_campaigns);
DELETE FROM public.saved_campaigns WHERE user_id IN (SELECT id FROM seed_ids) OR campaign_id IN (SELECT id FROM seed_campaigns);
DELETE FROM public.portfolio_items WHERE creator_id IN (SELECT id FROM seed_ids);
DELETE FROM public.campaigns WHERE id IN (SELECT id FROM seed_campaigns) OR brand_id IN (SELECT id FROM seed_ids);
DELETE FROM public.brand_profiles WHERE user_id IN (SELECT id FROM seed_ids);
DELETE FROM public.creator_profiles WHERE user_id IN (SELECT id FROM seed_ids);
DELETE FROM public.profiles WHERE id IN (SELECT id FROM seed_ids);
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM seed_ids);
DELETE FROM auth.users WHERE id IN (SELECT id FROM seed_ids);
COMMIT;
SELECT 'cleanup done' AS status;
