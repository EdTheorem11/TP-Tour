-- Deleting a member fails with "Database error deleting user" whenever
-- that member has ever acted as an admin/approver/creator anywhere —
-- these "who did this" columns reference member_profiles(id) with no
-- ON DELETE behavior specified, which defaults to RESTRICT and blocks
-- the whole delete. Switch them to SET NULL so the historical record
-- (the event, the score, the audit log entry, etc.) survives, it just
-- no longer points at a specific member once that member is gone.
-- (Rows that represent the member's OWN data — event_entries, handicap
-- history, scores keyed by member_id, etc. — already cascade-delete
-- correctly and are untouched here.)

alter table member_profiles drop constraint member_profiles_approved_by_fkey;
alter table member_profiles add constraint member_profiles_approved_by_fkey
  foreign key (approved_by) references member_profiles(id) on delete set null;

alter table handicap_history drop constraint handicap_history_changed_by_fkey;
alter table handicap_history add constraint handicap_history_changed_by_fkey
  foreign key (changed_by) references member_profiles(id) on delete set null;

alter table handicap_history drop constraint handicap_history_approved_by_fkey;
alter table handicap_history add constraint handicap_history_approved_by_fkey
  foreign key (approved_by) references member_profiles(id) on delete set null;

alter table golf_clubs drop constraint golf_clubs_created_by_fkey;
alter table golf_clubs add constraint golf_clubs_created_by_fkey
  foreign key (created_by) references member_profiles(id) on delete set null;

alter table seasons drop constraint seasons_created_by_fkey;
alter table seasons add constraint seasons_created_by_fkey
  foreign key (created_by) references member_profiles(id) on delete set null;

alter table events drop constraint events_created_by_fkey;
alter table events add constraint events_created_by_fkey
  foreign key (created_by) references member_profiles(id) on delete set null;

alter table event_scores drop constraint event_scores_entered_by_fkey;
alter table event_scores add constraint event_scores_entered_by_fkey
  foreign key (entered_by) references member_profiles(id) on delete set null;

alter table order_of_merit_adjustments drop constraint order_of_merit_adjustments_admin_id_fkey;
alter table order_of_merit_adjustments add constraint order_of_merit_adjustments_admin_id_fkey
  foreign key (admin_id) references member_profiles(id) on delete set null;

alter table site_content drop constraint site_content_updated_by_fkey;
alter table site_content add constraint site_content_updated_by_fkey
  foreign key (updated_by) references member_profiles(id) on delete set null;

alter table admin_audit_log drop constraint admin_audit_log_admin_id_fkey;
alter table admin_audit_log add constraint admin_audit_log_admin_id_fkey
  foreign key (admin_id) references member_profiles(id) on delete set null;
