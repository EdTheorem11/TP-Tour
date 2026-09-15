-- refresh_event_status() runs as whatever role fires the trigger on
-- event_entries. That's fine for ordinary app sessions, but when Supabase's
-- Auth service cascades a member deletion through to their event_entries
-- rows, it runs as a role with no write access to public.events (and/or is
-- blocked by RLS), causing "permission denied for table events" and
-- aborting the whole delete. Every other function here that writes across
-- tables on behalf of a lower-privileged caller (handle_new_auth_user,
-- promote_from_waiting_list, submit_handicap_change, etc.) is already
-- security definer for the same reason.
alter function refresh_event_status() security definer;
