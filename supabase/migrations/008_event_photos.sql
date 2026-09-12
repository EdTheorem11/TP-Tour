-- TP TOUR — Event photo galleries
-- Admin-curated photos per event, shown publicly on the event page.

create table event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  storage_path text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table event_photos enable row level security;

create policy "Public read event photos"
on event_photos for select
using (true);

create policy "Admins manage event photos"
on event_photos for all
using (is_admin())
with check (is_admin());

insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', true)
on conflict (id) do nothing;

create policy "Public read event photo files"
on storage.objects for select
using (bucket_id = 'event-photos');

create policy "Admins upload event photo files"
on storage.objects for insert
with check (bucket_id = 'event-photos' and is_admin());

create policy "Admins update event photo files"
on storage.objects for update
using (bucket_id = 'event-photos' and is_admin());

create policy "Admins delete event photo files"
on storage.objects for delete
using (bucket_id = 'event-photos' and is_admin());
