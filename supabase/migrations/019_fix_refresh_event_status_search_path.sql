-- refresh_event_status() (trigger on event_entries) declares a variable of
-- type event_status without schema-qualifying it. That resolves fine for
-- ordinary app requests, whose session search_path includes public, but not
-- when Supabase's Auth service cascades a member deletion through to their
-- event_entries rows — that role's search_path doesn't include public, so
-- the type lookup fails with "type event_status does not exist" and aborts
-- the whole delete. handle_new_auth_user() already sets search_path = public
-- for the same reason; this just extends that fix to refresh_event_status().
alter function refresh_event_status() set search_path = public;
