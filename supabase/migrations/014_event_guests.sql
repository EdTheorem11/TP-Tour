-- Let a member bring guests to an event. Guest rows reuse the host's
-- member_id (so "Guest of X" can be derived via the existing join) but are
-- flagged is_guest = true with their own name/handicap. The old unique
-- constraint only allowed one entries row per member per event at all —
-- relax it to a partial index so a host can still only have one real entry,
-- while having any number of guest entries alongside it.
alter table event_entries drop constraint event_entries_event_id_member_id_key;
create unique index event_entries_member_unique on event_entries (event_id, member_id) where not is_guest;

-- Expose the guest's own entered handicap (playing_handicap), not the
-- host's, on the public entry list view.
drop view event_entry_list;
create view event_entry_list as
select
  ee.id,
  ee.event_id,
  ee.member_id,
  mp.first_name,
  mp.last_name,
  mp.avatar_url,
  mp.current_handicap,
  ee.is_guest,
  ee.guest_name,
  ee.playing_handicap,
  ee.entry_date
from event_entries ee
join member_profiles mp on mp.id = ee.member_id
where ee.status = 'confirmed';

grant select on event_entry_list to authenticated;
