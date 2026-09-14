-- events.sponsor_id was a single-sponsor field that was never actually
-- read anywhere on the site — the public event page's "Sponsor" section
-- is driven entirely by the event_partners join table (assign/remove per
-- event in the admin Event Partners section), which is the one working
-- mechanism. Drop the dead column to remove the confusing duplicate.
--
-- next_event and latest_completed_event both do `select e.*` from events,
-- so they depend on every column including sponsor_id — drop and recreate
-- them around the column drop rather than cascading (which would delete
-- them outright).
drop view next_event;
drop view latest_completed_event;

alter table events drop constraint if exists fk_events_sponsor;
alter table events drop column if exists sponsor_id;

create view next_event as
select e.*
from events e
where e.status in ('coming_soon', 'entries_open', 'limited_spaces', 'sold_out')
  and e.event_date >= current_date
order by e.event_date asc
limit 1;

grant select on next_event to anon, authenticated;

create view latest_completed_event as
select e.*
from events e
where e.status = 'completed' and e.results_published = true
order by e.event_date desc
limit 1;

grant select on latest_completed_event to anon, authenticated;
