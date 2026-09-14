-- 017 guessed Postgres's auto-generated constraint names (the
-- "<table>_<column>_fkey" default) — if that guess was wrong for even one
-- column, the whole migration would have errored out and applied nothing.
-- This version looks up each constraint's real name instead of guessing,
-- so it works regardless of what 017 actually did (safe to run even if
-- 017 partially or fully succeeded already).
do $$
declare
  r record;
  existing_name text;
begin
  for r in select * from (values
    ('member_profiles', 'approved_by'),
    ('handicap_history', 'changed_by'),
    ('handicap_history', 'approved_by'),
    ('golf_clubs', 'created_by'),
    ('seasons', 'created_by'),
    ('events', 'created_by'),
    ('event_scores', 'entered_by'),
    ('order_of_merit_adjustments', 'admin_id'),
    ('site_content', 'updated_by'),
    ('admin_audit_log', 'admin_id')
  ) as t(tbl, col)
  loop
    select tc.constraint_name into existing_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
     and tc.table_schema = kcu.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_schema = 'public'
      and tc.table_name = r.tbl
      and kcu.column_name = r.col
    limit 1;

    if existing_name is not null then
      execute format('alter table %I drop constraint %I', r.tbl, existing_name);
    end if;

    execute format(
      'alter table %I add constraint %I foreign key (%I) references member_profiles(id) on delete set null',
      r.tbl, r.tbl || '_' || r.col || '_fkey', r.col
    );
  end loop;
end $$;
