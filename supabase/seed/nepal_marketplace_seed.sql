-- ============================================================
-- NepCollab staging seed (idempotent, handles partial runs)
-- Run in Supabase SQL Editor
-- ============================================================

BEGIN;

-- Fixed seed identity set
CREATE TEMP TABLE seed_ids (id uuid PRIMARY KEY);
INSERT INTO seed_ids (id) VALUES
  ('a1000001-0000-4000-8000-000000000001'),
  ('a1000002-0000-4000-8000-000000000002'),
  ('a1000003-0000-4000-8000-000000000003'),
  ('a1000004-0000-4000-8000-000000000004'),
  ('a1000005-0000-4000-8000-000000000005'),
  ('b2000001-0000-4000-8000-000000000001'),
  ('b2000002-0000-4000-8000-000000000002'),
  ('b2000003-0000-4000-8000-000000000003'),
  ('b2000004-0000-4000-8000-000000000004'),
  ('b2000005-0000-4000-8000-000000000005');

CREATE TEMP TABLE seed_campaigns (id uuid PRIMARY KEY);
INSERT INTO seed_campaigns (id) VALUES
  ('c3000001-0000-4000-8000-000000000001'),
  ('c3000002-0000-4000-8000-000000000002'),
  ('c3000003-0000-4000-8000-000000000003'),
  ('c3000004-0000-4000-8000-000000000004'),
  ('c3000005-0000-4000-8000-000000000005');

-- ========== FULL CLEANUP (children first) ==========
DELETE FROM public.messages
WHERE conversation_id IN (
  SELECT id FROM public.conversations
  WHERE brand_id IN (SELECT id FROM seed_ids)
     OR creator_id IN (SELECT id FROM seed_ids)
)
OR sender_id IN (SELECT id FROM seed_ids);

DELETE FROM public.conversations
WHERE brand_id IN (SELECT id FROM seed_ids)
   OR creator_id IN (SELECT id FROM seed_ids)
   OR campaign_id IN (SELECT id FROM seed_campaigns);

DELETE FROM public.reviews
WHERE reviewer_id IN (SELECT id FROM seed_ids)
   OR reviewee_id IN (SELECT id FROM seed_ids)
   OR collaboration_id IN (
     SELECT id FROM public.collaborations
     WHERE brand_id IN (SELECT id FROM seed_ids)
        OR creator_id IN (SELECT id FROM seed_ids)
   );

DELETE FROM public.notifications WHERE user_id IN (SELECT id FROM seed_ids);

DELETE FROM public.collaborations
WHERE brand_id IN (SELECT id FROM seed_ids)
   OR creator_id IN (SELECT id FROM seed_ids)
   OR campaign_id IN (SELECT id FROM seed_campaigns)
   OR id IN (
     'e5000001-0000-4000-8000-000000000001'::uuid,
     'e5000002-0000-4000-8000-000000000002'::uuid,
     'e5000003-0000-4000-8000-000000000003'::uuid,
     'e5000004-0000-4000-8000-000000000004'::uuid,
     'e5000005-0000-4000-8000-000000000005'::uuid
   );

DELETE FROM public.applications
WHERE creator_id IN (SELECT id FROM seed_ids)
   OR campaign_id IN (SELECT id FROM seed_campaigns);

DELETE FROM public.saved_campaigns
WHERE user_id IN (SELECT id FROM seed_ids)
   OR campaign_id IN (SELECT id FROM seed_campaigns);

DELETE FROM public.portfolio_items WHERE creator_id IN (SELECT id FROM seed_ids);

DELETE FROM public.campaigns
WHERE brand_id IN (SELECT id FROM seed_ids)
   OR id IN (SELECT id FROM seed_campaigns);

DELETE FROM public.brand_profiles WHERE user_id IN (SELECT id FROM seed_ids);
DELETE FROM public.creator_profiles WHERE user_id IN (SELECT id FROM seed_ids);

-- profiles last among public tables
DELETE FROM public.profiles WHERE id IN (SELECT id FROM seed_ids);

-- auth
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM seed_ids);
DELETE FROM auth.users WHERE id IN (SELECT id FROM seed_ids);

-- ========== AUTH USERS ==========
-- Note: handle_new_user trigger may auto-create profiles; we UPDATE those rows below.


INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  s.id,
  'authenticated',
  'authenticated',
  s.email,
  crypt('NepCollabSeed!2026', gen_salt('bf')),
  now() - (s.months || ' months')::interval,
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', s.full_name, 'role', s.role),
  now() - (s.months || ' months')::interval,
  now() - (s.months || ' months')::interval,
  '', '', '', ''
FROM (VALUES
  ('a1000001-0000-4000-8000-000000000001'::uuid, 'ncell.marketing@seed.nepcollab.internal', 'Ncell Marketing Team', 'brand', 11),
  ('a1000002-0000-4000-8000-000000000002'::uuid, 'daraz.marketing@seed.nepcollab.internal', 'Daraz Marketing Team', 'brand', 10),
  ('a1000003-0000-4000-8000-000000000003'::uuid, 'esewa.marketing@seed.nepcollab.internal', 'eSewa Marketing Team', 'brand', 9),
  ('a1000004-0000-4000-8000-000000000004'::uuid, 'khalti.marketing@seed.nepcollab.internal', 'Khalti Marketing Team', 'brand', 8),
  ('a1000005-0000-4000-8000-000000000005'::uuid, 'himalayanjava.marketing@seed.nepcollab.internal', 'Himalayan Java Marketing Team', 'brand', 7),
  ('b2000001-0000-4000-8000-000000000001'::uuid, 'ananya.karki@seed.nepcollab.internal', 'Ananya Karki', 'creator', 10),
  ('b2000002-0000-4000-8000-000000000002'::uuid, 'rajan.gurung@seed.nepcollab.internal', 'Rajan Gurung', 'creator', 9),
  ('b2000003-0000-4000-8000-000000000003'::uuid, 'sujata.shrestha@seed.nepcollab.internal', 'Sujata Shrestha', 'creator', 8),
  ('b2000004-0000-4000-8000-000000000004'::uuid, 'pratik.adhikari@seed.nepcollab.internal', 'Pratik Adhikari', 'creator', 7),
  ('b2000005-0000-4000-8000-000000000005'::uuid, 'nisha.basnet@seed.nepcollab.internal', 'Nisha Basnet', 'creator', 11)
) AS s(id, email, full_name, role, months)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT id, id,
  jsonb_build_object('sub', id::text, 'email', u.email),
  'email', id::text,
  now() - interval '3 days',
  coalesce(u.created_at, now()), coalesce(u.updated_at, now())
FROM auth.users u WHERE u.id IN (SELECT id FROM seed_ids)
ON CONFLICT DO NOTHING;

-- ========== PROFILES ==========
-- Profiles: trigger may already create rows on auth.users insert — UPDATE first, then fill gaps
UPDATE public.profiles p SET
  role = v.role,
  full_name = v.full_name,
  username = v.username,
  bio = v.bio,
  location = v.location,
  onboarded = true,
  verified = v.verified,
  rating = v.rating,
  response_rate = v.response_rate,
  updated_at = v.updated_at
FROM (VALUES
  ('a1000001-0000-4000-8000-000000000001'::uuid, 'brand', 'Ncell Marketing Team', 'ncell_brand',
   'Internal brand account for Ncell campaign operations on NepCollab staging.', 'Baluwatar, Kathmandu', true, 4.6, 92, now() - interval '2 days'),
  ('a1000002-0000-4000-8000-000000000002'::uuid, 'brand', 'Daraz Marketing Team', 'daraz_brand',
   'Internal brand account for Daraz lifestyle & tech collaborations (staging).', 'Thapathali, Kathmandu', true, 4.4, 88, now() - interval '5 days'),
  ('a1000003-0000-4000-8000-000000000003'::uuid, 'brand', 'eSewa Marketing Team', 'esewa_brand',
   'Internal brand account for eSewa everyday-payments storytelling (staging).', 'Lalitpur', true, 4.7, 95, now() - interval '1 day'),
  ('a1000004-0000-4000-8000-000000000004'::uuid, 'brand', 'Khalti Marketing Team', 'khalti_brand',
   'Internal brand account for Khalti youth lifestyle campaigns (staging).', 'Kathmandu', true, 4.3, 85, now() - interval '4 days'),
  ('a1000005-0000-4000-8000-000000000005'::uuid, 'brand', 'Himalayan Java Marketing Team', 'himalayanjava_brand',
   'Internal brand account for Himalayan Java hospitality experiences (staging).', 'Jhamsikhel, Lalitpur', true, 4.8, 90, now() - interval '3 days'),
  ('b2000001-0000-4000-8000-000000000001'::uuid, 'creator', 'Ananya Karki', 'ananyakarki',
   'Kathmandu fashion & lifestyle. Day-to-day looks from Lazimpat to Thamel — thrift finds, local labels, and the odd monsoon outfit crisis.', 'Lazimpat, Kathmandu', true, 4.5, 90, now() - interval '6 hours'),
  ('b2000002-0000-4000-8000-000000000002'::uuid, 'creator', 'Rajan Gurung', 'rajangurung',
   'Pokhara-based travel & hospitality. Lakeside mornings, Sarangkot sunrises, and honest hotel stays across the Annapurna foothills.', 'Lakeside, Pokhara', true, 4.8, 96, now() - interval '12 hours'),
  ('b2000003-0000-4000-8000-000000000003'::uuid, 'creator', 'Sujata Shrestha', 'sujatashrestha',
   'Lalitpur tech & productivity. Desk setups from Kupondole, app workflows, and gear that actually survives Kathmandu power cuts.', 'Kupondole, Lalitpur', false, 4.2, 82, now() - interval '1 day'),
  ('b2000004-0000-4000-8000-000000000004'::uuid, 'creator', 'Pratik Adhikari', 'pratikeats',
   'Chitwan food & lifestyle. Thakali sets in Bharatpur, Sauraha evenings, and street snacks worth the drive from Kathmandu.', 'Bharatpur, Chitwan', true, 4.6, 88, now() - interval '8 hours'),
  ('b2000005-0000-4000-8000-000000000005'::uuid, 'creator', 'Nisha Basnet', 'nishabasnet',
   'Kathmandu fitness & outdoor. Trail runs around Kirtipur, gym routines in Baneshwor, and weekend hikes that start before traffic does.', 'Baneshwor, Kathmandu', true, 4.7, 93, now() - interval '3 hours')
) AS v(id, role, full_name, username, bio, location, verified, rating, response_rate, updated_at)
WHERE p.id = v.id;

INSERT INTO public.profiles (id, role, full_name, username, bio, location, onboarded, verified, rating, response_rate, created_at, updated_at)
SELECT v.id, v.role, v.full_name, v.username, v.bio, v.location, true, v.verified, v.rating, v.response_rate,
       now() - interval '8 months', v.updated_at
FROM (VALUES
  ('a1000001-0000-4000-8000-000000000001'::uuid, 'brand', 'Ncell Marketing Team', 'ncell_brand',
   'Internal brand account for Ncell campaign operations on NepCollab staging.', 'Baluwatar, Kathmandu', true, 4.6, 92, now() - interval '2 days'),
  ('a1000002-0000-4000-8000-000000000002'::uuid, 'brand', 'Daraz Marketing Team', 'daraz_brand',
   'Internal brand account for Daraz lifestyle & tech collaborations (staging).', 'Thapathali, Kathmandu', true, 4.4, 88, now() - interval '5 days'),
  ('a1000003-0000-4000-8000-000000000003'::uuid, 'brand', 'eSewa Marketing Team', 'esewa_brand',
   'Internal brand account for eSewa everyday-payments storytelling (staging).', 'Lalitpur', true, 4.7, 95, now() - interval '1 day'),
  ('a1000004-0000-4000-8000-000000000004'::uuid, 'brand', 'Khalti Marketing Team', 'khalti_brand',
   'Internal brand account for Khalti youth lifestyle campaigns (staging).', 'Kathmandu', true, 4.3, 85, now() - interval '4 days'),
  ('a1000005-0000-4000-8000-000000000005'::uuid, 'brand', 'Himalayan Java Marketing Team', 'himalayanjava_brand',
   'Internal brand account for Himalayan Java hospitality experiences (staging).', 'Jhamsikhel, Lalitpur', true, 4.8, 90, now() - interval '3 days'),
  ('b2000001-0000-4000-8000-000000000001'::uuid, 'creator', 'Ananya Karki', 'ananyakarki',
   'Kathmandu fashion & lifestyle. Day-to-day looks from Lazimpat to Thamel.', 'Lazimpat, Kathmandu', true, 4.5, 90, now() - interval '6 hours'),
  ('b2000002-0000-4000-8000-000000000002'::uuid, 'creator', 'Rajan Gurung', 'rajangurung',
   'Pokhara-based travel & hospitality.', 'Lakeside, Pokhara', true, 4.8, 96, now() - interval '12 hours'),
  ('b2000003-0000-4000-8000-000000000003'::uuid, 'creator', 'Sujata Shrestha', 'sujatashrestha',
   'Lalitpur tech & productivity.', 'Kupondole, Lalitpur', false, 4.2, 82, now() - interval '1 day'),
  ('b2000004-0000-4000-8000-000000000004'::uuid, 'creator', 'Pratik Adhikari', 'pratikeats',
   'Chitwan food & lifestyle.', 'Bharatpur, Chitwan', true, 4.6, 88, now() - interval '8 hours'),
  ('b2000005-0000-4000-8000-000000000005'::uuid, 'creator', 'Nisha Basnet', 'nishabasnet',
   'Kathmandu fitness & outdoor.', 'Baneshwor, Kathmandu', true, 4.7, 93, now() - interval '3 hours')
) AS v(id, role, full_name, username, bio, location, verified, rating, response_rate, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v.id);

INSERT INTO public.brand_profiles (user_id, business_name, website, category, updated_at)
VALUES
('a1000001-0000-4000-8000-000000000001', 'Ncell', 'https://www.ncell.axiata.com', 'Telecom', now() - interval '2 days'),
('a1000002-0000-4000-8000-000000000002', 'Daraz', 'https://www.daraz.com.np', 'E-commerce', now() - interval '5 days'),
('a1000003-0000-4000-8000-000000000003', 'eSewa', 'https://www.esewa.com.np', 'Fintech', now() - interval '1 day'),
('a1000004-0000-4000-8000-000000000004', 'Khalti', 'https://khalti.com', 'Fintech', now() - interval '4 days'),
('a1000005-0000-4000-8000-000000000005', 'Himalayan Java', 'https://www.himalayanjava.com', 'Hospitality', now() - interval '3 days')
ON CONFLICT (user_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  website = EXCLUDED.website,
  category = EXCLUDED.category,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.creator_profiles (user_id, niches, languages, platforms, engagement_rate, updated_at)
VALUES
('b2000001-0000-4000-8000-000000000001', ARRAY['Fashion','Lifestyle','Local brands'], ARRAY['Nepali','English'], ARRAY['Instagram','TikTok','YouTube'], 4.10, now() - interval '6 hours'),
('b2000002-0000-4000-8000-000000000002', ARRAY['Travel','Hospitality','Outdoor'], ARRAY['Nepali','English','Gurung'], ARRAY['Instagram','TikTok','YouTube'], 5.80, now() - interval '12 hours'),
('b2000003-0000-4000-8000-000000000003', ARRAY['Tech','Productivity','Gadgets'], ARRAY['Nepali','English'], ARRAY['Instagram','YouTube'], 3.40, now() - interval '1 day'),
('b2000004-0000-4000-8000-000000000004', ARRAY['Food','Lifestyle','Street food'], ARRAY['Nepali','English','Hindi'], ARRAY['Instagram','TikTok'], 6.20, now() - interval '8 hours'),
('b2000005-0000-4000-8000-000000000005', ARRAY['Fitness','Outdoor','Wellness'], ARRAY['Nepali','English'], ARRAY['Instagram','TikTok','YouTube'], 3.70, now() - interval '3 hours')
ON CONFLICT (user_id) DO UPDATE SET
  niches = EXCLUDED.niches,
  languages = EXCLUDED.languages,
  platforms = EXCLUDED.platforms,
  engagement_rate = EXCLUDED.engagement_rate,
  updated_at = EXCLUDED.updated_at;

-- ---------- campaigns (5) ----------
-- statuses: active, closed, completed, draft (upcoming)
INSERT INTO public.campaigns (
  id, brand_id, title, description, category, location, remote,
  budget, currency, perks, platforms, deliverables, requirements,
  min_followers, spots, deadline, campaign_start, campaign_end,
  status, image_url, content_types, brief, creator_reward, views,
  created_at, updated_at
) VALUES
-- 1 Ncell active
('c3000001-0000-4000-8000-000000000001',
 'a1000001-0000-4000-8000-000000000001',
 'Connected Kathmandu',
 'Show how reliable mobile connectivity fits into everyday urban Nepali life — commuting, campus, café work, and evenings in the Valley — without turning the reel into an ad read.',
 'Telecom', 'Kathmandu Valley', true,
 105000, 'NPR',
 ARRAY['NPR 35,000 per selected creator','Data package for shoot week','Creative freedom on story format'],
 ARRAY['Instagram','TikTok'],
 ARRAY['2 Instagram/TikTok Reels','4 Stories with poll or Q&A sticker'],
 '{"minFollowers":15000,"niches":["Lifestyle","Fashion","Youth"],"languages":["Nepali","English"],"experience":"Prior lifestyle brand work preferred"}',
 15000, 3,
 CURRENT_DATE + 18, CURRENT_DATE - 5, CURRENT_DATE + 25,
 'active', NULL,
 ARRAY['Reel','Story'],
 E'Objective: Make Ncell feel native to Kathmandu routines.\nTarget: 18–34, Kathmandu Valley, students & young professionals.\nCreative direction: Day-in-the-life, not hard sell. Product appears in context (maps, payments, calls home).\nKey message: Staying connected should feel effortless.\nUsage: Organic social 90 days. No exclusivity beyond category telecom for 30 days after first post.\nApproval: First draft within 5 days of selection; one revision round standard.',
 35000, 1284,
 now() - interval '12 days', now() - interval '1 day'),

-- 2 Daraz active
('c3000002-0000-4000-8000-000000000002',
 'a1000002-0000-4000-8000-000000000002',
 'Daraz Finds — My Week in Five Products',
 'Creators pick five Daraz products that genuinely fit their niche and film a week-in-the-life narrative — unboxing is fine, forced reviews are not.',
 'Lifestyle', 'Nepal (nationwide shipping stories OK)', true,
 120000, 'NPR',
 ARRAY['Product selection support','NPR 25,000–45,000 depending on deliverables','Feature opportunity on Daraz social'],
 ARRAY['Instagram','TikTok','YouTube'],
 ARRAY['1 Reel (45–60s)','1 carousel (5–7 frames)','3 Stories'],
 '{"minFollowers":10000,"niches":["Lifestyle","Tech","Fashion","Food"],"languages":["Nepali","English"]}',
 10000, 3,
 CURRENT_DATE + 22, CURRENT_DATE - 3, CURRENT_DATE + 30,
 'active', NULL,
 ARRAY['Reel','Carousel','Story'],
 E'Objective: Authentic product discovery.\nCreator chooses products relevant to niche.\nBudget band NPR 25k–45k based on audience & platforms.\nUsage: Organic + paid boost optional for 60 days.\nApproval: Concept outline before shoot; final cut review once.',
 35000, 956,
 now() - interval '9 days', now() - interval '6 hours'),

-- 3 eSewa closing soon
('c3000003-0000-4000-8000-000000000003',
 'a1000003-0000-4000-8000-000000000003',
 'Everyday Digital Nepal',
 'Real payment moments: coffee at Himalayan Java, Foodmandu orders, online shopping, NEA bill, and bus or movie tickets — filmed where Nepalis actually pay.',
 'Fintech', 'Kathmandu & Lalitpur', false,
 90000, 'NPR',
 ARRAY['NPR 30,000 flat','eSewa merchant demo support if needed'],
 ARRAY['Instagram','TikTok'],
 ARRAY['1 Reel','3 Stories'],
 '{"minFollowers":12000,"niches":["Lifestyle","Food","Tech"],"languages":["Nepali"]}',
 12000, 3,
 CURRENT_DATE + 4, CURRENT_DATE - 20, CURRENT_DATE + 10,
 'active', NULL,
 ARRAY['Reel','Story'],
 E'Objective: Normalize digital payments in ordinary routines.\nAvoid lecture tone; show muscle memory of paying.\nDeadline soon — applications close in a few days.\nUsage: Organic 60 days.',
 30000, 2103,
 now() - interval '28 days', now() - interval '2 days'),

-- 4 Khalti completed
('c3000004-0000-4000-8000-000000000004',
 'a1000004-0000-4000-8000-000000000004',
 'You Do More When Payments Are Simple',
 'Youth lifestyle campaign completed Q1 — short vertical videos around campus, side hustles, and nights out where Khalti is the quiet utility.',
 'Fintech', 'Kathmandu', true,
 100000, 'NPR',
 ARRAY['NPR 25,000–35,000','Creative workshop (optional)'],
 ARRAY['Instagram','TikTok'],
 ARRAY['2 short videos','4 Stories'],
 '{"minFollowers":10000,"niches":["Lifestyle","Youth"]}',
 10000, 4,
 CURRENT_DATE - 40, CURRENT_DATE - 95, CURRENT_DATE - 50,
 'completed', NULL,
 ARRAY['Reel','Story'],
 E'Completed campaign. Used for historical portfolio on both brand and creator sides.',
 30000, 3421,
 now() - interval '4 months', now() - interval '45 days'),

-- 5 Himalayan Java upcoming/draft
('c3000005-0000-4000-8000-000000000005',
 'a1000005-0000-4000-8000-000000000005',
 'Weekend Reset',
 'Cinematic café & slow-travel weekend — Kathmandu brunch, optional Pokhara or Nagarkot day trip energy. Food, light, conversation; not a menu recitation.',
 'Hospitality', 'Kathmandu / Pokhara / Nagarkot', false,
 150000, 'NPR',
 ARRAY['Hosted café experience','NPR 30,000–60,000','Travel stipend case-by-case for Pokhara'],
 ARRAY['Instagram','YouTube'],
 ARRAY['1 cinematic Reel','1 photo carousel','5 Stories'],
 '{"minFollowers":15000,"niches":["Travel","Food","Lifestyle","Hospitality"]}',
 15000, 3,
 CURRENT_DATE + 35, CURRENT_DATE + 10, CURRENT_DATE + 40,
 'draft', NULL,
 ARRAY['Reel','Carousel','Story'],
 E'Upcoming. Applications not fully open; listed for brand pipeline.\nObjective: Weekend ritual association with Himalayan Java.\nUsage: Organic + in-store screens 90 days.',
 45000, 412,
 now() - interval '5 days', now() - interval '5 days');

-- ---------- applications (realistic matching) ----------
INSERT INTO public.applications (
  id, campaign_id, creator_id, message, pitch, content_idea, availability, brand_remarks, note, status, applied_at, created_at, updated_at
) VALUES
-- Ncell applications
('d4000001-0000-4000-8000-000000000001', 'c3000001-0000-4000-8000-000000000001', 'b2000001-0000-4000-8000-000000000001',
 'I''ve been creating Kathmandu lifestyle content with a young professional audience, and Connected Kathmandu fits how my followers already watch my day — Lazimpat mornings, Thamel shoots, late Baneshwor edits. I''d treat this as a day-in-the-life story rather than a traditional product placement, with connectivity showing up when I''m navigating traffic, confirming a shoot location, or sending selects to a client.',
 'Day-in-the-life Kathmandu, soft product presence',
 'Reel 1: morning to café work session. Reel 2: evening shoot logistics. Stories: polls on "worst Valley traffic hack".',
 'Can shoot weekdays after 2pm; weekends flexible in Valley only.',
 NULL, NULL, 'shortlisted',
 now() - interval '8 days', now() - interval '8 days', now() - interval '3 days'),

('d4000002-0000-4000-8000-000000000002', 'c3000001-0000-4000-8000-000000000001', 'b2000005-0000-4000-8000-000000000001',
 'Fitness audience in Kathmandu is constantly moving between gym, trails, and client sessions. I can show connectivity as the quiet backbone — sharing route maps before a Kirtipur run, checking form videos in Baneshwor, coordinating a group hike. Happy to keep the tone energetic without shouting about plans or data packs.',
 'Movement-led Valley day with natural phone use',
 'One reel on pre-dawn run logistics; one on gym + commute; stories with stickers on training days.',
 'Early mornings preferred; available next 3 weeks except Tue/Thu 6–8am classes.',
 NULL, NULL, 'pending',
 now() - interval '6 days', now() - interval '6 days', now() - interval '6 days'),

('d4000003-0000-4000-8000-000000000003', 'c3000001-0000-4000-8000-000000000001', 'b2000003-0000-4000-8000-000000000003',
 'My audience is more tech-productivity than fashion, but Connected Kathmandu still maps — remote standups from Kupondole, uploading builds when the power is stable, hopping between Patan cafés. I''d lean into practical urban workflow rather than lifestyle glam.',
 'Productivity commute + café workflow',
 'Reel focused on a real workday stack; stories on apps I actually use with mobile data.',
 'Weekday afternoons; need 5 days lead time for scripted pieces.',
 'Strong concept but audience slightly off-brief for this flight.', NULL, 'rejected',
 now() - interval '7 days', now() - interval '7 days', now() - interval '4 days'),

-- Daraz
('d4000004-0000-4000-8000-000000000004', 'c3000002-0000-4000-8000-000000000002', 'b2000001-0000-4000-8000-000000000001',
 'For Daraz Finds I''d curate five pieces I''d actually wear this season — two local-label adjacent basics, one monsoon-friendly layer, one accessory, one home desk item for content days. Carousel would be flat-lays from my Lazimpat apartment; reel would be a week montage, not five separate ads.',
 'Five genuine wardrobe/desk finds',
 'Reel: week montage. Carousel: product details + where I wore them in Kathmandu.',
 'Can receive products in Lazimpat; shoot within 10 days of delivery.',
 NULL, NULL, 'pending',
 now() - interval '5 days', now() - interval '5 days', now() - interval '5 days'),

('d4000005-0000-4000-8000-000000000005', 'c3000002-0000-4000-8000-000000000002', 'b2000003-0000-4000-8000-000000000003',
 'Tech niche fit is strong: wireless earbuds under 10k, a power bank that survives load-shedding culture, a laptop stand, cable management, and one lighting tweak for night shoots. I already have similar portfolio pieces so the story won''t feel like a first-time unboxing channel.',
 'Desk & commute gadgets week',
 'Carousel specs-focused; reel on a real edit-day workflow in Kupondole.',
 'Available immediately; prefer products shipped to Lalitpur.',
 NULL, NULL, 'shortlisted',
 now() - interval '4 days', now() - interval '4 days', now() - interval '2 days'),

('d4000006-0000-4000-8000-000000000006', 'c3000002-0000-4000-8000-000000000002', 'b2000004-0000-4000-8000-000000000004',
 'Food angle: cookware, a spice set, storage for leftovers, a thermos for long Bharatpur shoots, and one café-at-home gadget. I''d keep it Chitwan-honest — not a Kathmandu apartment aesthetic unless we stage one day in the Valley.',
 'Kitchen week from Bharatpur',
 'Reel cooking + delivery day; stories taste tests.',
 'Can travel to Kathmandu once for product pickup if needed.',
 NULL, NULL, 'pending',
 now() - interval '3 days', now() - interval '3 days', now() - interval '3 days'),

-- eSewa
('d4000007-0000-4000-8000-000000000007', 'c3000003-0000-4000-8000-000000000003', 'b2000001-0000-4000-8000-000000000001',
 'I already pay for shoots, props, and café tables on digital wallets — this can be a clean sequence: morning coffee, prop order, client invoice reminder, evening taxi. Happy to film in Nepali primary with English subtitles.',
 'Creator workday payments',
 'Single reel, three payment beats; stories for bill split and QR moments.',
 'This week or next; Valley only.',
 NULL, NULL, 'accepted',
 now() - interval '18 days', now() - interval '18 days', now() - interval '14 days'),

('d4000008-0000-4000-8000-000000000008', 'c3000003-0000-4000-8000-000000000003', 'b2000004-0000-4000-8000-000000000004',
 'Food content and payments are already linked in my videos — Foodmandu nights, local restaurants in Sauraha, and splitting bills after group dinners. I can keep eSewa visible without a scripted tutorial voice.',
 'Food run + pay flow',
 'Reel from order to table; stories on tips and splits.',
 'Available weekends; weekday evenings after service shoots.',
 NULL, NULL, 'shortlisted',
 now() - interval '15 days', now() - interval '15 days', now() - interval '10 days'),

('d4000009-0000-4000-8000-000000000009', 'c3000003-0000-4000-8000-000000000003', 'b2000002-0000-4000-8000-000000000002',
 'Travel payments — hotel booking confirmation, local taxi in Pokhara, café on Lakeside — map cleanly to Everyday Digital Nepal. I can shoot primarily in Pokhara with one Kathmandu connecting scene if useful.',
 'Travel payment moments',
 'Reel Lakeside day; stories on booking and QR menus.',
 'Pokhara-based; Kathmandu day possible with 4 days notice.',
 NULL, NULL, 'pending',
 now() - interval '12 days', now() - interval '12 days', now() - interval '12 days'),

-- Khalti historical
('d4000010-0000-4000-8000-000000000010', 'c3000004-0000-4000-8000-000000000004', 'b2000005-0000-4000-8000-000000000005',
 'Completed youth lifestyle flight — training fees, smoothie runs, and weekend hike transport all paid simply. Deliverables approved after one revision on the opening hook.',
 'Fitness youth payment lifestyle',
 'Two shorts + story set (delivered).',
 'Completed.',
 'Great energy; opening revised once then approved.', NULL, 'accepted',
 now() - interval '3 months', now() - interval '3 months', now() - interval '2 months'),

('d4000011-0000-4000-8000-000000000011', 'c3000004-0000-4000-8000-000000000004', 'b2000001-0000-4000-8000-000000000001',
 'Historical application — fashion week-in-the-life with simple checkout moments. Selected and completed.',
 'Fashion + simple pay',
 'Delivered.',
 'Completed.',
 NULL, NULL, 'accepted',
 now() - interval '3 months' + interval '2 days', now() - interval '3 months' + interval '2 days', now() - interval '2 months'),

('d4000012-0000-4000-8000-000000000012', 'c3000004-0000-4000-8000-000000000004', 'b2000003-0000-4000-8000-000000000003',
 'Applied with a productivity angle; not shortlisted that flight.',
 'Campus productivity',
 'N/A',
 'N/A',
 'Audience fit was weaker for this youth lifestyle cut.', NULL, 'rejected',
 now() - interval '3 months' + interval '5 days', now() - interval '3 months' + interval '5 days', now() - interval '2 months' - interval '10 days'),

-- more applications for volume
('d4000013-0000-4000-8000-000000000013', 'c3000001-0000-4000-8000-000000000001', 'b2000002-0000-4000-8000-000000000002',
 'I know Connected Kathmandu is Valley-first, but I can contribute a "visitor in Kathmandu for meetings" angle — landing, SIM/data reality, moving between Baluwatar meetings and Patan. Only if you want a non-resident perspective.',
 'Visitor connectivity day',
 'One reel on a Kathmandu work trip.',
 'In Kathmandu 2–3 days per month.',
 NULL, NULL, 'pending',
 now() - interval '2 days', now() - interval '2 days', now() - interval '2 days'),

('d4000014-0000-4000-8000-000000000014', 'c3000002-0000-4000-8000-000000000002', 'b2000005-0000-4000-8000-000000000005',
 'Five products: training shoes, resistance bands, a water bottle, recovery cream, and wireless earbuds for treadmill sessions. Carousel would be gym-bag unpack in Baneshwor; reel a training week.',
 'Fitness bag finds',
 'Reel + carousel + stories.',
 'Can shoot early mornings at the gym.',
 NULL, NULL, 'pending',
 now() - interval '1 day', now() - interval '1 day', now() - interval '1 day');

-- ---------- collaborations ----------
INSERT INTO public.collaborations (id, campaign_id, creator_id, brand_id, application_id, status, created_at, updated_at)
VALUES
-- active eSewa x Ananya
('e5000001-0000-4000-8000-000000000001', 'c3000003-0000-4000-8000-000000000003', 'b2000001-0000-4000-8000-000000000001', 'a1000003-0000-4000-8000-000000000003', 'd4000007-0000-4000-8000-000000000007',
 'active', now() - interval '14 days', now() - interval '1 day'),
-- work_submitted eSewa x Pratik (if status allows - else active)
('e5000002-0000-4000-8000-000000000002', 'c3000003-0000-4000-8000-000000000003', 'b2000004-0000-4000-8000-000000000004', 'a1000003-0000-4000-8000-000000000003', 'd4000008-0000-4000-8000-000000000008',
 'work_submitted', now() - interval '10 days', now() - interval '2 days'),
-- completed Khalti x Nisha
('e5000003-0000-4000-8000-000000000003', 'c3000004-0000-4000-8000-000000000004', 'b2000005-0000-4000-8000-000000000005', 'a1000004-0000-4000-8000-000000000004', 'd4000010-0000-4000-8000-000000000010',
 'completed', now() - interval '2 months' - interval '20 days', now() - interval '45 days'),
-- completed Khalti x Ananya
('e5000004-0000-4000-8000-000000000004', 'c3000004-0000-4000-8000-000000000004', 'b2000001-0000-4000-8000-000000000001', 'a1000004-0000-4000-8000-000000000004', 'd4000011-0000-4000-8000-000000000011',
 'completed', now() - interval '2 months' - interval '18 days', now() - interval '50 days'),
-- revision_requested Daraz x Sujata
('e5000005-0000-4000-8000-000000000005', 'c3000002-0000-4000-8000-000000000002', 'b2000003-0000-4000-8000-000000000003', 'a1000002-0000-4000-8000-000000000002', 'd4000005-0000-4000-8000-000000000005',
 'revision_requested', now() - interval '2 days', now() - interval '12 hours');

-- ---------- conversations + messages ----------
INSERT INTO public.conversations (id, campaign_id, brand_id, creator_id, created_at)
VALUES
('f6000001-0000-4000-8000-000000000001', 'c3000003-0000-4000-8000-000000000003', 'a1000003-0000-4000-8000-000000000003', 'b2000001-0000-4000-8000-000000000001', now() - interval '14 days'),
('f6000002-0000-4000-8000-000000000002', 'c3000003-0000-4000-8000-000000000003', 'a1000003-0000-4000-8000-000000000003', 'b2000004-0000-4000-8000-000000000004', now() - interval '10 days'),
('f6000003-0000-4000-8000-000000000003', 'c3000004-0000-4000-8000-000000000004', 'a1000004-0000-4000-8000-000000000004', 'b2000005-0000-4000-8000-000000000005', now() - interval '2 months' - interval '20 days'),
('f6000004-0000-4000-8000-000000000004', 'c3000002-0000-4000-8000-000000000002', 'a1000002-0000-4000-8000-000000000002', 'b2000003-0000-4000-8000-000000000003', now() - interval '2 days');

INSERT INTO public.messages (id, conversation_id, sender_id, body, read_at, created_at)
VALUES
-- eSewa x Ananya thread
('g7000001-0000-4000-8000-000000000001', 'f6000001-0000-4000-8000-000000000001', 'a1000003-0000-4000-8000-000000000003',
 'Hi Ananya — excited to move forward on Everyday Digital Nepal. Could you share a rough shot list for the reel by Thursday? We''re flexible on cafés as long as one payment is clearly visible on screen.',
 now() - interval '13 days', now() - interval '13 days'),
('g7000002-0000-4000-8000-000000000002', 'f6000001-0000-4000-8000-000000000001', 'b2000001-0000-4000-8000-000000000001',
 'Thanks — planning three beats: morning coffee QR in Jhamsikhel, a midday prop order confirmation, and an evening split after a fitting in Thamel. I''ll keep dialogue in Nepali with English captions. Draft cut by early next week work for you?',
 now() - interval '12 days', now() - interval '12 days'),
('g7000003-0000-4000-8000-000000000003', 'f6000001-0000-4000-8000-000000000001', 'a1000003-0000-4000-8000-000000000003',
 'That structure is perfect. Please avoid comparing wallets on camera. One clean eSewa flow per beat is enough. Looking forward to the draft.',
 now() - interval '12 days', now() - interval '11 days'),
('g7000004-0000-4000-8000-000000000004', 'f6000001-0000-4000-8000-000000000001', 'b2000001-0000-4000-8000-000000000001',
 'Draft is nearly ready — had to reshoot the café beat because of noise. I''ll upload tomorrow evening.',
 now() - interval '2 days', now() - interval '2 days'),

-- eSewa x Pratik
('g7000005-0000-4000-8000-000000000005', 'f6000002-0000-4000-8000-000000000002', 'b2000004-0000-4000-8000-000000000004',
 'Submitted the first cut focused on a Foodmandu night in Bharatpur plus a local restaurant QR. Length is 38 seconds — can trim if you want more product time.',
 now() - interval '2 days', now() - interval '2 days'),
('g7000006-0000-4000-8000-000000000006', 'f6000002-0000-4000-8000-000000000002', 'a1000003-0000-4000-8000-000000000003',
 'Opening is strong. Please reduce the first three seconds and bring the payment benefit forward before the location shot. Otherwise the food mood is excellent.',
 now() - interval '1 day', now() - interval '1 day'),
('g7000007-0000-4000-8000-000000000007', 'f6000002-0000-4000-8000-000000000002', 'b2000004-0000-4000-8000-000000000004',
 'Updated version uploaded with the revised opening and a shorter location transition. Let me know if you want a second pass on captions.',
 now() - interval '12 hours', now() - interval '12 hours'),

-- Khalti completed thread (historical)
('g7000008-0000-4000-8000-000000000008', 'f6000003-0000-4000-8000-000000000003', 'a1000004-0000-4000-8000-000000000004',
 'Final cut approved. Thank you for the quick turnaround on the hook revision — we''ll share performance notes after the boost window.',
 now() - interval '46 days', now() - interval '46 days'),
('g7000009-0000-4000-8000-000000000009', 'f6000003-0000-4000-8000-000000000003', 'b2000005-0000-4000-8000-000000000005',
 'Appreciate the clear feedback throughout. Happy to support a follow-up flight if you run another youth fitness angle later this year.',
 now() - interval '45 days', now() - interval '45 days'),

-- Daraz revision thread
('g7000010-0000-4000-8000-000000000010', 'f6000004-0000-4000-8000-000000000004', 'a1000002-0000-4000-8000-000000000002',
 'Sujata — thanks for the desk-setup reel. Please reshoot the earbud close-up under natural light; the LED made the product look cooler than it is. Carousel frames 2 and 5 are great as-is.',
 now() - interval '12 hours', now() - interval '12 hours'),
('g7000011-0000-4000-8000-000000000011', 'f6000004-0000-4000-8000-000000000004', 'b2000003-0000-4000-8000-000000000003',
 'Understood — I''ll redo that insert tomorrow morning by the window in Kupondole and send a patched cut by evening.',
 NULL, now() - interval '10 hours');

-- ---------- notifications ----------
INSERT INTO public.notifications (id, user_id, type, title, body, read_at, created_at)
VALUES
('h8000001-0000-4000-8000-000000000001', 'b2000001-0000-4000-8000-000000000001', 'application', 'You were shortlisted', 'Ncell shortlisted you for Connected Kathmandu.', NULL, now() - interval '3 days'),
('h8000002-0000-4000-8000-000000000002', 'b2000001-0000-4000-8000-000000000001', 'collaboration', 'Collaboration active', 'eSewa Everyday Digital Nepal is now active. Check messages for the shot-list note.', now() - interval '13 days', now() - interval '14 days'),
('h8000003-0000-4000-8000-000000000003', 'b2000003-0000-4000-8000-000000000003', 'application', 'Revision requested', 'Daraz requested a revision on your earbud close-up for Daraz Finds.', NULL, now() - interval '12 hours'),
('h8000004-0000-4000-8000-000000000004', 'b2000005-0000-4000-8000-000000000005', 'review', 'New review received', 'Khalti left a review on your completed collaboration.', now() - interval '40 days', now() - interval '45 days'),
('h8000005-0000-4000-8000-000000000005', 'a1000001-0000-4000-8000-000000000001', 'application', 'New application', 'Ananya Karki applied to Connected Kathmandu.', now() - interval '7 days', now() - interval '8 days'),
('h8000006-0000-4000-8000-000000000006', 'a1000003-0000-4000-8000-000000000003', 'collaboration', 'Work submitted', 'Pratik Adhikari submitted work on Everyday Digital Nepal.', NULL, now() - interval '2 days'),
('h8000007-0000-4000-8000-000000000007', 'b2000004-0000-4000-8000-000000000004', 'message', 'New message', 'eSewa Marketing Team replied about your opening edit.', NULL, now() - interval '1 day'),
('h8000008-0000-4000-8000-000000000008', 'b2000002-0000-4000-8000-000000000002', 'application', 'Application received', 'Your application to Connected Kathmandu was received.', now() - interval '1 day', now() - interval '2 days');

-- ---------- reviews ----------
INSERT INTO public.reviews (id, collaboration_id, reviewer_id, reviewee_id, rating, comment, created_at)
VALUES
('i9000001-0000-4000-8000-000000000001', 'e5000003-0000-4000-8000-000000000003', 'a1000004-0000-4000-8000-000000000004', 'b2000005-0000-4000-8000-000000000005',
 5, 'Very responsive and delivered ahead of schedule. The first draft needed some direction on the hook, but the revised version was strong and performed well with our youth segment.',
 now() - interval '44 days'),
('i9000002-0000-4000-8000-000000000002', 'e5000003-0000-4000-8000-000000000003', 'b2000005-0000-4000-8000-000000000005', 'a1000004-0000-4000-8000-000000000004',
 5, 'Clear brief, fast feedback, and respectful of creative constraints. Would work with this team again.',
 now() - interval '43 days'),
('i9000003-0000-4000-8000-000000000003', 'e5000004-0000-4000-8000-000000000004', 'a1000004-0000-4000-8000-000000000004', 'b2000001-0000-4000-8000-000000000001',
 4, 'Excellent creative judgment and very little revision required. Stories were on-brand; one reel CTA could have been earlier.',
 now() - interval '48 days'),
('i9000004-0000-4000-8000-000000000004', 'e5000004-0000-4000-8000-000000000004', 'b2000001-0000-4000-8000-000000000001', 'a1000004-0000-4000-8000-000000000004',
 4, 'Good communication throughout. Payment and feedback windows were predictable.',
 now() - interval '47 days');

-- ---------- portfolio ----------
INSERT INTO public.portfolio_items (id, creator_id, title, sort_order, created_at)
VALUES
-- Ananya fashion
('j0100001-0000-4000-8000-000000000001', 'b2000001-0000-4000-8000-000000000001', 'Monsoon Layering in Lazimpat', 1, now() - interval '8 months'),
('j0100002-0000-4000-8000-000000000002', 'b2000001-0000-4000-8000-000000000001', 'Thrift Haul — New Road to Thamel', 2, now() - interval '6 months'),
('j0100003-0000-4000-8000-000000000003', 'b2000001-0000-4000-8000-000000000001', 'Local Label Lookbook (Patan studio)', 3, now() - interval '4 months'),
('j0100004-0000-4000-8000-000000000004', 'b2000001-0000-4000-8000-000000000001', 'Café Workday Outfits — Jhamsikhel', 4, now() - interval '2 months'),
('j0100005-0000-4000-8000-000000000005', 'b2000001-0000-4000-8000-000000000001', 'Festival Jewelry Styling', 5, now() - interval '1 month'),
-- Rajan travel
('j0100006-0000-4000-8000-000000000006', 'b2000002-0000-4000-8000-000000000002', 'Sarangkot Sunrise — Honest Hotel Stay', 1, now() - interval '7 months'),
('j0100007-0000-4000-8000-000000000007', 'b2000002-0000-4000-8000-000000000002', 'Bandipur Weekend Without the Checklist', 2, now() - interval '5 months'),
('j0100008-0000-4000-8000-000000000008', 'b2000002-0000-4000-8000-000000000002', 'Annapurna Viewpoint Day Hike', 3, now() - interval '3 months'),
('j0100009-0000-4000-8000-000000000009', 'b2000002-0000-4000-8000-000000000002', 'Lakeside Cafés Worth the Queue', 4, now() - interval '6 weeks'),
-- Sujata tech
('j0100010-0000-4000-8000-000000000010', 'b2000003-0000-4000-8000-000000000003', 'Pixel Camera Workflow for Reels', 1, now() - interval '6 months'),
('j0100011-0000-4000-8000-000000000011', 'b2000003-0000-4000-8000-000000000003', 'Wireless Earbuds Under NPR 10K', 2, now() - interval '4 months'),
('j0100012-0000-4000-8000-000000000012', 'b2000003-0000-4000-8000-000000000003', 'Kupondole Desk Setup (Power-cut Ready)', 3, now() - interval '3 months'),
('j0100013-0000-4000-8000-000000000013', 'b2000003-0000-4000-8000-000000000003', 'Productivity Apps I Still Use Weekly', 4, now() - interval '5 weeks'),
-- Pratik food
('j0100014-0000-4000-8000-000000000014', 'b2000004-0000-4000-8000-000000000004', 'Thakali Set — Bharatpur Favorites', 1, now() - interval '5 months'),
('j0100015-0000-4000-8000-000000000015', 'b2000004-0000-4000-8000-000000000004', 'Sauraha Evening Food Walk', 2, now() - interval '3 months'),
('j0100016-0000-4000-8000-000000000016', 'b2000004-0000-4000-8000-000000000004', 'Street Snacks Worth the Drive from KT', 3, now() - interval '2 months'),
('j0100017-0000-4000-8000-000000000017', 'b2000004-0000-4000-8000-000000000004', 'Home Thali — Sunday Reset', 4, now() - interval '3 weeks'),
-- Nisha fitness
('j0100018-0000-4000-8000-000000000018', 'b2000005-0000-4000-8000-000000000005', 'Kirtipur Trail Run — Beginner Loop', 1, now() - interval '9 months'),
('j0100019-0000-4000-8000-000000000019', 'b2000005-0000-4000-8000-000000000005', 'Baneshwor Gym Strength Block', 2, now() - interval '5 months'),
('j0100020-0000-4000-8000-000000000020', 'b2000005-0000-4000-8000-000000000005', 'Pre-Traffic Morning Mobility', 3, now() - interval '2 months'),
('j0100021-0000-4000-8000-000000000021', 'b2000005-0000-4000-8000-000000000005', 'Weekend Hike Fuel & Recovery', 4, now() - interval '1 month');

-- Fix typo in portfolio id for Rajan item 3 if wrong uuid used
UPDATE public.portfolio_items SET creator_id = 'b2000002-0000-4000-8000-000000000002'
WHERE id = 'j0100008-0000-4000-8000-000000000008';

-- ---------- saved campaigns ----------
INSERT INTO public.saved_campaigns (user_id, campaign_id, created_at)
VALUES
('b2000001-0000-4000-8000-000000000001', 'c3000002-0000-4000-8000-000000000002', now() - interval '4 days'),
('b2000002-0000-4000-8000-000000000002', 'c3000001-0000-4000-8000-000000000001', now() - interval '2 days'),
('b2000005-0000-4000-8000-000000000005', 'c3000001-0000-4000-8000-000000000001', now() - interval '6 days'),
('b2000003-0000-4000-8000-000000000003', 'c3000005-0000-4000-8000-000000000005', now() - interval '1 day');

-- ---------- verification (before commit) ----------
SELECT 'profiles' AS t, count(*) FROM public.profiles WHERE id IN (SELECT id FROM seed_ids)
UNION ALL SELECT 'campaigns', count(*) FROM public.campaigns WHERE brand_id IN (SELECT id FROM seed_ids)
UNION ALL SELECT 'applications', count(*) FROM public.applications WHERE creator_id IN (SELECT id FROM seed_ids)
UNION ALL SELECT 'collaborations', count(*) FROM public.collaborations WHERE brand_id IN (SELECT id FROM seed_ids)
UNION ALL SELECT 'messages', count(*) FROM public.messages WHERE sender_id IN (SELECT id FROM seed_ids)
UNION ALL SELECT 'notifications', count(*) FROM public.notifications WHERE user_id IN (SELECT id FROM seed_ids)
UNION ALL SELECT 'reviews', count(*) FROM public.reviews WHERE reviewer_id IN (SELECT id FROM seed_ids) OR reviewee_id IN (SELECT id FROM seed_ids)
UNION ALL SELECT 'portfolio', count(*) FROM public.portfolio_items WHERE creator_id IN (SELECT id FROM seed_ids);


-- verification
SELECT 'profiles' AS t, count(*)::int AS n FROM public.profiles WHERE id IN (SELECT id FROM seed_ids)
UNION ALL SELECT 'campaigns', count(*)::int FROM public.campaigns WHERE id IN (SELECT id FROM seed_campaigns)
UNION ALL SELECT 'applications', count(*)::int FROM public.applications WHERE campaign_id IN (SELECT id FROM seed_campaigns)
UNION ALL SELECT 'collaborations', count(*)::int FROM public.collaborations WHERE campaign_id IN (SELECT id FROM seed_campaigns)
UNION ALL SELECT 'messages', count(*)::int FROM public.messages WHERE sender_id IN (SELECT id FROM seed_ids)
UNION ALL SELECT 'notifications', count(*)::int FROM public.notifications WHERE user_id IN (SELECT id FROM seed_ids)
UNION ALL SELECT 'reviews', count(*)::int FROM public.reviews WHERE reviewer_id IN (SELECT id FROM seed_ids) OR reviewee_id IN (SELECT id FROM seed_ids)
UNION ALL SELECT 'portfolio', count(*)::int FROM public.portfolio_items WHERE creator_id IN (SELECT id FROM seed_ids);

COMMIT;
