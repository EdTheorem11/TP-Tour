-- Lets admins manually order players within a tee-sheet group (4-ball),
-- independent of which group they're in. Used by the day sheet's
-- "Assign Players to Groups" table.
alter table event_entries add column if not exists group_position integer;
