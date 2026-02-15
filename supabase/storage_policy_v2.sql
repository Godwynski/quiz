-- NOTE: If you get "must be owner of table" errors, it usually means RLS is already enabled 
-- or you don't have permission to change the table definition. 
-- You can skip the 'ALTER TABLE' command in that case.

-- 1. Create the avatars bucket (if not exists)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Drop existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Users can update own avatars" on storage.objects;
drop policy if exists "Users can delete own avatars" on storage.objects;

-- 3. Create Policies

-- Allow public read access to avatars
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
create policy "Authenticated users can upload avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated'
);

-- Allow users to update their own avatars
create policy "Users can update own avatars"
on storage.objects for update
using (
  bucket_id = 'avatars' and
  auth.uid() = owner
);

-- Allow users to delete their own avatars
create policy "Users can delete own avatars"
on storage.objects for delete
using (
  bucket_id = 'avatars' and
  auth.uid() = owner
);
