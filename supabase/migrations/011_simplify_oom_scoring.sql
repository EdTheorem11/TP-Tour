-- TP TOUR — simplify Order of Merit to raw Stableford scores
-- No position-based points table, no major multiplier, no participation/
-- nearest-pin/longest-drive bonuses. OOM points for a result are simply
-- that player's Stableford score for the round. recalculate_order_of_merit
-- already sums the best N (oom_best_results_count) of a member's oom_points
-- per season, so setting oom_points = stableford_points gives "best 4 of 7
-- Stableford scores" with no other change needed there.

create or replace function publish_event_results(p_event_id uuid, p_admin_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_season_id uuid;
  v_oom_eligible boolean;
  r record;
  v_points numeric;
begin
  select season_id, oom_eligible into v_season_id, v_oom_eligible from events where id = p_event_id;

  -- seed/update event_results rows for every score row
  insert into event_results (event_id, member_id, score_id, position, position_display, oom_points)
  select s.event_id, s.member_id, s.id, 0, '', 0
  from event_scores s
  where s.event_id = p_event_id
  on conflict (event_id, member_id) do update set score_id = excluded.score_id;

  perform compute_event_positions(p_event_id);

  for r in
    select er.id, er.manually_overridden, er.oom_points as existing_points, es.stableford_points
    from event_results er
    join event_scores es on es.id = er.score_id
    where er.event_id = p_event_id
  loop
    v_points := case when v_oom_eligible then coalesce(r.stableford_points, 0) else 0 end;

    update event_results
    set oom_points = case when r.manually_overridden then r.existing_points else v_points end,
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

-- Best-4-of-7 is now the standard rule for every season, not per-season
-- configurable trivia — default new seasons to 4, and set it on existing
-- ones too.
alter table seasons alter column oom_best_results_count set default 4;
update seasons set oom_best_results_count = 4;

-- Drop the now-unused points-system config.
alter table seasons
  drop column if exists oom_points_table,
  drop column if exists oom_default_points,
  drop column if exists oom_major_multiplier,
  drop column if exists oom_attendance_points;

alter table events
  drop column if exists oom_multiplier;
