-- TP TOUR — remove unused Order of Merit bonus fields
-- These were never wired into the points calculation (publish_event_results /
-- recalculate_order_of_merit only ever use oom_points_table, oom_default_points
-- and oom_major_multiplier) — just dead config in the admin form.

alter table seasons
  drop column if exists oom_nearest_pin_bonus,
  drop column if exists oom_longest_drive_bonus,
  drop column if exists oom_other_bonus_label,
  drop column if exists oom_other_bonus_points;
