-- TP TOUR — Functions & triggers

-- ============================================================================
-- updated_at maintenance
-- ============================================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_member_profiles_updated_at before update on member_profiles for each row execute function set_updated_at();
create trigger trg_golf_clubs_updated_at before update on golf_clubs for each row execute function set_updated_at();
create trigger trg_courses_updated_at before update on courses for each row execute function set_updated_at();
create trigger trg_seasons_updated_at before update on seasons for each row execute function set_updated_at();
create trigger trg_events_updated_at before update on events for each row execute function set_updated_at();
create trigger trg_event_entries_updated_at before update on event_entries for each row execute function set_updated_at();
create trigger trg_event_scores_updated_at before update on event_scores for each row execute function set_updated_at();
create trigger trg_event_results_updated_at before update on event_results for each row execute function set_updated_at();
create trigger trg_partners_updated_at before update on partners for each row execute function set_updated_at();

-- ============================================================================
-- New auth user -> member_profiles row
-- Expects first_name/last_name/... passed via raw_user_meta_data at signUp.
-- ============================================================================

create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into member_profiles (
    id, email, first_name, last_name, mobile, nationality, company, job_title,
    industry, home_golf_club, home_course, current_handicap, egf_whs_number,
    linkedin_url, terms_accepted_at, privacy_accepted_at
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'mobile',
    new.raw_user_meta_data->>'nationality',
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'job_title',
    new.raw_user_meta_data->>'industry',
    new.raw_user_meta_data->>'home_golf_club',
    new.raw_user_meta_data->>'home_course',
    nullif(new.raw_user_meta_data->>'current_handicap', '')::numeric,
    new.raw_user_meta_data->>'egf_whs_number',
    new.raw_user_meta_data->>'linkedin_url',
    case when (new.raw_user_meta_data->>'terms_accepted')::boolean then now() end,
    case when (new.raw_user_meta_data->>'privacy_accepted')::boolean then now() end
  );

  if (new.raw_user_meta_data->>'current_handicap') is not null and (new.raw_user_meta_data->>'current_handicap') <> '' then
    insert into handicap_history (member_id, old_handicap, new_handicap, source, status, reason)
    values (new.id, null, (new.raw_user_meta_data->>'current_handicap')::numeric, 'initial', 'approved', 'Initial handicap at registration');
  end if;

  return new;
end;
$$;

create trigger trg_handle_new_auth_user
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ============================================================================
-- Event capacity + auto status
-- ============================================================================

create or replace function event_spaces_remaining(p_event_id uuid)
returns int language sql stable as $$
  select case
    when e.max_players is null then null
    else greatest(e.max_players - (
      select count(*) from event_entries ee where ee.event_id = e.id and ee.status = 'confirmed'
    ), 0)
  end
  from events e where e.id = p_event_id;
$$;

create or replace function refresh_event_status()
returns trigger language plpgsql as $$
declare
  v_event_id uuid;
  v_max int;
  v_entered int;
  v_status event_status;
begin
  v_event_id := coalesce(new.event_id, old.event_id);

  select max_players, status into v_max, v_status from events where id = v_event_id;

  -- only auto-manage the "live" statuses; leave draft/coming_soon/completed/cancelled alone
  if v_status in ('entries_open', 'limited_spaces', 'sold_out') then
    select count(*) into v_entered from event_entries where event_id = v_event_id and status = 'confirmed';

    if v_max is not null and v_entered >= v_max then
      update events set status = 'sold_out' where id = v_event_id and status <> 'sold_out';
    elsif v_max is not null and (v_max - v_entered) <= 4 then
      update events set status = 'limited_spaces' where id = v_event_id and status <> 'limited_spaces';
    else
      update events set status = 'entries_open' where id = v_event_id and status <> 'entries_open';
    end if;
  end if;

  return null;
end;
$$;

create trigger trg_refresh_event_status
  after insert or update or delete on event_entries
  for each row execute function refresh_event_status();

-- ============================================================================
-- Waiting list: auto-assign position, auto-renumber on removal
-- ============================================================================

create or replace function assign_waiting_list_position()
returns trigger language plpgsql as $$
begin
  if new.position is null then
    select coalesce(max(position), 0) + 1 into new.position
    from waiting_list where event_id = new.event_id and status = 'waiting';
  end if;
  return new;
end;
$$;

create trigger trg_assign_waiting_list_position
  before insert on waiting_list
  for each row execute function assign_waiting_list_position();

-- promote a waiting-list member into a confirmed entry
create or replace function promote_from_waiting_list(p_waiting_list_id uuid, p_admin_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_event_id uuid;
  v_member_id uuid;
  v_entry_id uuid;
begin
  select event_id, member_id into v_event_id, v_member_id from waiting_list where id = p_waiting_list_id and status = 'waiting';
  if v_member_id is null then
    raise exception 'Waiting list entry not found or already resolved';
  end if;

  insert into event_entries (event_id, member_id, status, agreed_to_rules)
  values (v_event_id, v_member_id, 'confirmed', true)
  on conflict (event_id, member_id) do update set status = 'confirmed', withdrawn_at = null
  returning id into v_entry_id;

  update waiting_list set status = 'promoted', promoted_at = now() where id = p_waiting_list_id;

  insert into notifications (member_id, type, title, body, event_id)
  values (v_member_id, 'waiting_list_promoted', 'You''re on the tee sheet', 'A space became available and you have been moved from the waiting list into the event.', v_event_id);

  insert into admin_audit_log (admin_id, action, entity_type, entity_id, after)
  values (p_admin_id, 'promote_waiting_list', 'event_entries', v_entry_id, jsonb_build_object('event_id', v_event_id, 'member_id', v_member_id));

  return v_entry_id;
end;
$$;

-- ============================================================================
-- Handicap change submission (respects a global auto-approve setting held in site_content)
-- ============================================================================

create or replace function submit_handicap_change(
  p_member_id uuid, p_new_handicap numeric, p_reason text, p_source handicap_source, p_changed_by uuid
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_old numeric;
  v_auto_approve boolean;
  v_status handicap_change_status;
  v_id uuid;
begin
  select current_handicap into v_old from member_profiles where id = p_member_id;

  select coalesce((value->>'auto_approve')::boolean, false) into v_auto_approve
  from site_content where key = 'handicap_settings';

  if p_source = 'admin_adjustment' or p_source = 'initial' or v_auto_approve then
    v_status := 'approved';
  else
    v_status := 'pending';
  end if;

  insert into handicap_history (member_id, old_handicap, new_handicap, changed_by, reason, source, status, approved_by, approved_at)
  values (p_member_id, v_old, p_new_handicap, p_changed_by, p_reason, p_source, v_status,
          case when v_status = 'approved' then p_changed_by end,
          case when v_status = 'approved' then now() end)
  returning id into v_id;

  if v_status = 'approved' then
    update member_profiles set current_handicap = p_new_handicap where id = p_member_id;
    insert into notifications (member_id, type, title, body)
    values (p_member_id, 'handicap_updated', 'Your handicap has been updated', format('Your handicap is now %s.', p_new_handicap));
  end if;

  return v_id;
end;
$$;

create or replace function approve_handicap_change(p_history_id uuid, p_admin_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_member_id uuid;
  v_new numeric;
begin
  select member_id, new_handicap into v_member_id, v_new from handicap_history where id = p_history_id and status = 'pending';
  if v_member_id is null then
    raise exception 'Handicap change not found or already resolved';
  end if;

  update handicap_history set status = 'approved', approved_by = p_admin_id, approved_at = now() where id = p_history_id;
  update member_profiles set current_handicap = v_new where id = v_member_id;

  insert into notifications (member_id, type, title, body)
  values (v_member_id, 'handicap_updated', 'Your handicap has been updated', format('Your handicap is now %s.', v_new));
end;
$$;

-- ============================================================================
-- Positions from scores (stableford desc / strokeplay nett asc), preserving manual overrides
-- ============================================================================

create or replace function compute_event_positions(p_event_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_format competition_format;
begin
  select format into v_format from events where id = p_event_id;

  if v_format = 'strokeplay' then
    with ranked as (
      select member_id, nett_score,
             rank() over (order by nett_score asc) as pos
      from event_scores where event_id = p_event_id and nett_score is not null
    )
    update event_results r
    set position = ranked.pos,
        position_display = ranked.pos::text
    from ranked
    where r.event_id = p_event_id and r.member_id = ranked.member_id and not r.manually_overridden;
  else
    with ranked as (
      select member_id, stableford_points,
             rank() over (order by stableford_points desc) as pos
      from event_scores where event_id = p_event_id and stableford_points is not null
    )
    update event_results r
    set position = ranked.pos,
        position_display = ranked.pos::text
    from ranked
    where r.event_id = p_event_id and r.member_id = ranked.member_id and not r.manually_overridden;
  end if;

  -- mark ties with a "T" prefix, unless manually overridden
  with dupes as (
    select position, count(*) c from event_results where event_id = p_event_id and not manually_overridden group by position having count(*) > 1
  )
  update event_results r set position_display = 'T' || r.position::text
  from dupes where r.event_id = p_event_id and r.position = dupes.position and not r.manually_overridden;
end;
$$;

-- ============================================================================
-- Publish results: build event_results from event_scores, compute OOM points, recalc standings
-- ============================================================================

create or replace function publish_event_results(p_event_id uuid, p_admin_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_season_id uuid;
  v_points_table jsonb;
  v_default_points numeric;
  v_multiplier numeric;
  r record;
  v_points numeric;
begin
  select season_id, oom_multiplier into v_season_id, v_multiplier from events where id = p_event_id;
  select oom_points_table, oom_default_points into v_points_table, v_default_points from seasons where id = v_season_id;

  -- seed/update event_results rows for every score row
  insert into event_results (event_id, member_id, score_id, position, position_display, oom_points)
  select s.event_id, s.member_id, s.id, 0, '', 0
  from event_scores s
  where s.event_id = p_event_id
  on conflict (event_id, member_id) do update set score_id = excluded.score_id;

  perform compute_event_positions(p_event_id);

  for r in select * from event_results where event_id = p_event_id loop
    if (select oom_eligible from events where id = p_event_id) then
      v_points := coalesce((v_points_table->>r.position::text)::numeric, v_default_points);
      v_points := v_points * v_multiplier;
    else
      v_points := 0;
    end if;

    update event_results
    set oom_points = case when manually_overridden then oom_points else v_points end,
        published = true,
        published_at = now()
    where id = r.id;
  end loop;

  update events set status = 'completed', results_published = true, results_published_at = now() where id = p_event_id;

  insert into admin_audit_log (admin_id, action, entity_type, entity_id)
  values (p_admin_id, 'publish_results', 'events', p_event_id);

  perform recalculate_order_of_merit(v_season_id);

  insert into notifications (member_id, type, title, body, event_id)
  select member_id, 'results_published', 'Results are in', 'Results have been published and the Order of Merit has been updated.', p_event_id
  from event_results where event_id = p_event_id;
end;
$$;

-- ============================================================================
-- Recalculate Order of Merit standings for a season
-- Applies "best N results count" drop logic and manual adjustments.
-- ============================================================================

create or replace function recalculate_order_of_merit(p_season_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_best_count int;
  m record;
begin
  select oom_best_results_count into v_best_count from seasons where id = p_season_id;

  -- snapshot current ranks as "previous" before recompute
  update order_of_merit_points set previous_rank = rank where season_id = p_season_id;

  -- ensure a row exists for every member with at least one published result or adjustment this season
  insert into order_of_merit_points (season_id, member_id)
  select distinct p_season_id, er.member_id
  from event_results er
  join events e on e.id = er.event_id
  where e.season_id = p_season_id and er.published
  on conflict (season_id, member_id) do nothing;

  insert into order_of_merit_points (season_id, member_id)
  select distinct p_season_id, a.member_id
  from order_of_merit_adjustments a
  where a.season_id = p_season_id
  on conflict (season_id, member_id) do nothing;

  for m in select member_id from order_of_merit_points where season_id = p_season_id loop
    declare
      v_scores numeric[];
      v_total numeric := 0;
      v_counting numeric := 0;
      v_dropped numeric := 0;
      v_adjustment numeric := 0;
      v_events_played int := 0;
      v_wins int := 0;
      v_runner_ups int := 0;
      v_top3 int := 0;
      v_top10 int := 0;
    begin
      select array_agg(er.oom_points order by er.oom_points desc)
      into v_scores
      from event_results er
      join events e on e.id = er.event_id
      where e.season_id = p_season_id and er.member_id = m.member_id and er.published;

      select count(*), count(*) filter (where position = 1), count(*) filter (where position = 2),
             count(*) filter (where position <= 3), count(*) filter (where position <= 10)
      into v_events_played, v_wins, v_runner_ups, v_top3, v_top10
      from event_results er
      join events e on e.id = er.event_id
      where e.season_id = p_season_id and er.member_id = m.member_id and er.published;

      v_total := coalesce((select sum(x) from unnest(v_scores) x), 0);

      if v_best_count is not null and v_scores is not null and array_length(v_scores, 1) > v_best_count then
        v_counting := coalesce((select sum(x) from unnest(v_scores[1:v_best_count]) x), 0);
        v_dropped := v_total - v_counting;
      else
        v_counting := v_total;
        v_dropped := 0;
      end if;

      select coalesce(sum(points_adjustment), 0) into v_adjustment
      from order_of_merit_adjustments where season_id = p_season_id and member_id = m.member_id;

      update order_of_merit_points set
        total_points = v_total + v_adjustment,
        counting_points = v_counting + v_adjustment,
        dropped_points = v_dropped,
        adjustment_points = v_adjustment,
        events_played = v_events_played,
        wins = v_wins,
        runner_ups = v_runner_ups,
        top3 = v_top3,
        top10 = v_top10,
        updated_at = now()
      where season_id = p_season_id and member_id = m.member_id;
    end;
  end loop;

  -- rank by counting_points desc
  with ranked as (
    select id, rank() over (order by counting_points desc) as r
    from order_of_merit_points where season_id = p_season_id
  )
  update order_of_merit_points o set rank = ranked.r
  from ranked where o.id = ranked.id;
end;
$$;
