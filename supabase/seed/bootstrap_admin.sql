-- Run once in Supabase SQL Editor after admin migration.
-- Replaces YOUR_USER_ID with your profiles.id (Auth → Users).

-- Example for nepxbett@gmail.com (update if different):
SELECT public.bootstrap_first_admin('b3e55aba-303b-479e-b610-daf307d73a14'::uuid);

-- Verify:
SELECT id, full_name, role FROM public.profiles WHERE role = 'admin';
