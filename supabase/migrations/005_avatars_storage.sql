-- TP TOUR — Avatar uploads
-- Creates a public storage bucket for member profile pictures, with RLS so
-- each member can only manage files under their own user-id folder.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- storage.objects is owned by Supabase's internal supabase_storage_admin
-- role and already has RLS enabled by default — project owners can't (and
-- don't need to) toggle it themselves, only add policies to it.

create policy "Public read avatars"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users upload own avatar"
on storage.objects for insert
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users update own avatar"
on storage.objects for update
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users delete own avatar"
on storage.objects for delete
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
