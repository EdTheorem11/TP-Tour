-- Published results as members see them. Querying event_results with embedded
-- member_profiles / event_scores directly returns blank names and no scores
-- for regular members: member_profiles only exposes a member's own row and
-- event_scores is admin-only. A plain view runs with its owner's privileges
-- (the same mechanism event_entry_list uses), so it can safely expose just
-- the published fields. Rows at position 0 are score entries with no result
-- (no stableford/nett score) and are left out.
create view published_event_results as
select
  er.id,
  er.event_id,
  er.member_id,
  er.position,
  er.position_display,
  er.oom_points,
  er.published,
  er.created_at,
  mp.first_name,
  mp.last_name,
  mp.avatar_url,
  es.playing_handicap,
  es.gross_score,
  es.nett_score,
  es.stableford_points,
  e.name as event_name,
  e.slug as event_slug,
  e.event_date,
  e.format as event_format
from event_results er
join events e on e.id = er.event_id
left join member_profiles mp on mp.id = er.member_id
left join event_scores es on es.id = er.score_id
where er.published = true
  and er.position > 0;

grant select on published_event_results to authenticated;
