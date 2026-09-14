-- events.sponsor_id was a single-sponsor field that was never actually
-- read anywhere on the site — the public event page's "Sponsor" section
-- is driven entirely by the event_partners join table (assign/remove per
-- event in the admin Event Partners section), which is the one working
-- mechanism. Drop the dead column to remove the confusing duplicate.
alter table events drop constraint if exists fk_events_sponsor;
alter table events drop column if exists sponsor_id;
