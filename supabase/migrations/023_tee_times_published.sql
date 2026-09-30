-- Lets admins publish the day sheet's tee times/groups to the public event
-- page, replacing the plain entry list there with tee times and pairings
-- once the admin is happy with them.
alter table events add column if not exists tee_times_published boolean not null default false;
alter table events add column if not exists tee_times_published_at timestamptz;
