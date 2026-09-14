-- Tracks whether a member has been shown the first-login welcome modal
-- (nudging them toward the next upcoming event), so it only ever shows once.
alter table member_profiles add column welcomed_at timestamptz;
