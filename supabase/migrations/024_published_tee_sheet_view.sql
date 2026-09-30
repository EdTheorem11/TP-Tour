-- event_entries RLS only lets a member see their own row (or an admin see
-- everyone), so querying it directly for the public tee sheet meant regular
-- members only ever saw themselves. A plain view runs with its owner's
-- privileges, bypassing that RLS — the same mechanism event_entry_list
-- already relies on to show the entry list to everyone — so this view does
-- the same for the tee sheet, gated on the event's own publish flag.
create view published_tee_sheet as
select
  ee.id,
  ee.event_id,
  ee.is_guest,
  ee.guest_name,
  ee.tee_time,
  ee.group_number,
  ee.group_position,
  ee.starting_hole,
  ee.playing_handicap,
  mp.first_name,
  mp.last_name,
  mp.current_handicap
from event_entries ee
join events e on e.id = ee.event_id
left join member_profiles mp on mp.id = ee.member_id
where ee.status = 'confirmed'
  and ee.group_number is not null
  and e.tee_times_published = true;

grant select on published_tee_sheet to authenticated;
