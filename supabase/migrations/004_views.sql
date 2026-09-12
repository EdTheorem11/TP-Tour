-- TP TOUR — Views (owned by the migration role, so they read the base tables
-- without being subject to member_profiles RLS — this is what gives us safe,
-- privacy-respecting column masking for public-facing data).

-- ============================================================================
-- Player directory — masks company/job title per each member's own preference.
-- Only approved members are listed. Restricted to signed-in members.
-- ============================================================================

create view player_directory as
select
  mp.id,
  mp.first_name,
  mp.last_name,
  mp.avatar_url,
  mp.current_handicap,
  mp.industry,
  case when mp.show_company_publicly then mp.company else null end as company,
  case when mp.show_job_title_publicly then mp.job_title else null end as job_title,
  mp.home_golf_club,
  s.id as current_season_id,
  oom.rank as tour_rank,
  oom.counting_points as oom_points
from member_profiles mp
left join seasons s on s.is_current = true
left join order_of_merit_points oom on oom.season_id = s.id and oom.member_id = mp.id
where mp.status = 'approved';

grant select on player_directory to authenticated;

-- ============================================================================
-- Event capacity — safe aggregate counts, no member identities.
-- ============================================================================

create view event_capacity as
select
  e.id as event_id,
  e.max_players,
  count(ee.id) filter (where ee.status = 'confirmed') as players_entered,
  case when e.max_players is null then null
       else greatest(e.max_players - count(ee.id) filter (where ee.status = 'confirmed'), 0)
  end as spaces_remaining,
  count(wl.id) filter (where wl.status = 'waiting') as waiting_list_count
from events e
left join event_entries ee on ee.event_id = e.id
left join waiting_list wl on wl.event_id = e.id
group by e.id, e.max_players;

grant select on event_capacity to anon, authenticated;

-- ============================================================================
-- Public entry list per event (names only, no payment/contact data). Signed-in members only.
-- ============================================================================

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
  ee.entry_date
from event_entries ee
join member_profiles mp on mp.id = ee.member_id
where ee.status = 'confirmed';

grant select on event_entry_list to authenticated;

-- ============================================================================
-- Next event — first upcoming, entries-open-or-later event, computed not hardcoded.
-- ============================================================================

create view next_event as
select e.*
from events e
where e.status in ('coming_soon', 'entries_open', 'limited_spaces', 'sold_out')
  and e.event_date >= current_date
order by e.event_date asc
limit 1;

grant select on next_event to anon, authenticated;

-- ============================================================================
-- Latest completed event with published results.
-- ============================================================================

create view latest_completed_event as
select e.*
from events e
where e.status = 'completed' and e.results_published = true
order by e.event_date desc
limit 1;

grant select on latest_completed_event to anon, authenticated;

-- Grants on base tables/enums for the roles Supabase uses.
-- (Supabase applies ALTER DEFAULT PRIVILEGES for new objects created via the SQL editor
--  as the postgres role, but we grant explicitly here so this script is self-contained.)
grant usage on schema public to anon, authenticated;
grant select on member_profiles, handicap_history, golf_clubs, courses, seasons, events,
  event_entries, waiting_list, event_results, order_of_merit_points, order_of_merit_adjustments,
  partners, event_partners, notifications, site_content, admin_audit_log
  to anon, authenticated;
grant insert, update, delete on member_profiles, handicap_history, golf_clubs, courses, seasons,
  events, event_entries, waiting_list, event_scores, event_results, order_of_merit_points,
  order_of_merit_adjustments, partners, event_partners, notifications, site_content, admin_audit_log
  to authenticated;
grant select on event_scores to authenticated;
