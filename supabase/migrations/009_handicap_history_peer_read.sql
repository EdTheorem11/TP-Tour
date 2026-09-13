-- TP TOUR — let approved members view each other's handicap trend
-- Current handicap is already public on the player_directory view; this
-- extends that to the approved history behind it (never pending changes,
-- which stay visible only to the member themselves and admins).

create policy "approved members read approved handicap history"
on handicap_history for select
using (status = 'approved' and is_approved_member());
