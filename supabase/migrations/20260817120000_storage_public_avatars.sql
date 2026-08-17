-- Run in Supabase SQL editor if avatar uploads fail.
-- Allows authenticated users to upload to avatars/; public read.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('campaign-assets', 'campaign-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars auth upload" on storage.objects;
create policy "avatars auth upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "avatars auth update" on storage.objects;
create policy "avatars auth update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars');

drop policy if exists "campaign assets public read" on storage.objects;
create policy "campaign assets public read" on storage.objects
  for select using (bucket_id = 'campaign-assets');

drop policy if exists "campaign assets auth upload" on storage.objects;
create policy "campaign assets auth upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'campaign-assets');
