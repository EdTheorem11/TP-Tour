-- TP TOUR — Row Level Security

-- ============================================================================
-- Helper functions
-- ============================================================================

create or replace function auth_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from member_profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin', 'super_admin') from member_profiles where id = auth.uid()), false);
$$;

create or replace function is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'super_admin' from member_profiles where id = auth.uid()), false);
$$;

create or replace function is_approved_member()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select status = 'approved' from member_profiles where id = auth.uid()), false);
$$;

-- Prevent a plain admin from granting admin/super_admin privileges to anyone (only super_admin can)
create or replace function prevent_privilege_escalation()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and new.role in ('admin', 'super_admin') and not is_super_admin() then
    raise exception 'Only a super admin can grant admin privileges';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_privilege_escalation
  before update on member_profiles
  for each row execute function prevent_privilege_escalation();

-- ============================================================================
-- Enable RLS everywhere
-- ============================================================================

alter table member_profiles enable row level security;
alter table handicap_history enable row level security;
alter table golf_clubs enable row level security;
alter table courses enable row level security;
alter table seasons enable row level security;
alter table events enable row level security;
alter table event_entries enable row level security;
alter table waiting_list enable row level security;
alter table event_scores enable row level security;
alter table event_results enable row level security;
alter table order_of_merit_points enable row level security;
alter table order_of_merit_adjustments enable row level security;
alter table partners enable row level security;
alter table event_partners enable row level security;
alter table notifications enable row level security;
alter table site_content enable row level security;
alter table admin_audit_log enable row level security;

-- ============================================================================
-- member_profiles
-- ============================================================================

create policy "own profile select" on member_profiles for select using (auth.uid() = id);
create policy "admin select all profiles" on member_profiles for select using (is_admin());
create policy "own profile update" on member_profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "admin update profiles" on member_profiles for update using (is_admin());
create policy "admin delete profiles" on member_profiles for delete using (is_super_admin());
-- inserts happen via the handle_new_auth_user trigger (security definer) only

-- ============================================================================
-- handicap_history
-- ============================================================================

create policy "own handicap history" on handicap_history for select using (auth.uid() = member_id);
create policy "admin handicap history" on handicap_history for select using (is_admin());
create policy "admin insert handicap history" on handicap_history for insert with check (is_admin());
create policy "admin update handicap history" on handicap_history for update using (is_admin());
-- member submissions go through submit_handicap_change() (security definer)

-- ============================================================================
-- golf_clubs / courses / seasons / events / partners / event_partners — public read, admin write
-- ============================================================================

create policy "public read golf_clubs" on golf_clubs for select using (true);
create policy "admin write golf_clubs" on golf_clubs for insert with check (is_admin());
create policy "admin update golf_clubs" on golf_clubs for update using (is_admin());
create policy "admin delete golf_clubs" on golf_clubs for delete using (is_admin());

create policy "public read courses" on courses for select using (true);
create policy "admin write courses" on courses for insert with check (is_admin());
create policy "admin update courses" on courses for update using (is_admin());
create policy "admin delete courses" on courses for delete using (is_admin());

create policy "public read seasons" on seasons for select using (true);
create policy "admin write seasons" on seasons for insert with check (is_admin());
create policy "admin update seasons" on seasons for update using (is_admin());
create policy "super admin delete seasons" on seasons for delete using (is_super_admin());

create policy "public read events" on events for select using (true);
create policy "admin write events" on events for insert with check (is_admin());
create policy "admin update events" on events for update using (is_admin());
create policy "admin delete events" on events for delete using (is_admin());

create policy "public read partners" on partners for select using (true);
create policy "admin write partners" on partners for insert with check (is_admin());
create policy "admin update partners" on partners for update using (is_admin());
create policy "admin delete partners" on partners for delete using (is_admin());

create policy "public read event_partners" on event_partners for select using (true);
create policy "admin write event_partners" on event_partners for insert with check (is_admin());
create policy "admin delete event_partners" on event_partners for delete using (is_admin());

-- ============================================================================
-- event_entries — member sees/manages own; admin sees/manages all
-- ============================================================================

create policy "own entries select" on event_entries for select using (auth.uid() = member_id);
create policy "admin entries select" on event_entries for select using (is_admin());
create policy "own entries insert" on event_entries for insert with check (auth.uid() = member_id and is_approved_member());
create policy "own entries update (withdraw)" on event_entries for update using (auth.uid() = member_id) with check (auth.uid() = member_id);
create policy "admin entries insert" on event_entries for insert with check (is_admin());
create policy "admin entries update" on event_entries for update using (is_admin());
create policy "admin entries delete" on event_entries for delete using (is_admin());

-- ============================================================================
-- waiting_list
-- ============================================================================

create policy "own waiting list select" on waiting_list for select using (auth.uid() = member_id);
create policy "admin waiting list select" on waiting_list for select using (is_admin());
create policy "own waiting list insert" on waiting_list for insert with check (auth.uid() = member_id and is_approved_member());
create policy "own waiting list update" on waiting_list for update using (auth.uid() = member_id) with check (auth.uid() = member_id);
create policy "admin waiting list update" on waiting_list for update using (is_admin());
create policy "admin waiting list delete" on waiting_list for delete using (is_admin());

-- ============================================================================
-- event_scores — admin only (members see published event_results instead)
-- ============================================================================

create policy "admin scores select" on event_scores for select using (is_admin());
create policy "admin scores insert" on event_scores for insert with check (is_admin());
create policy "admin scores update" on event_scores for update using (is_admin());
create policy "admin scores delete" on event_scores for delete using (is_admin());

-- ============================================================================
-- event_results — public once published; admin sees drafts too
-- ============================================================================

create policy "public read published results" on event_results for select using (published = true);
create policy "admin read all results" on event_results for select using (is_admin());
create policy "admin write results" on event_results for insert with check (is_admin());
create policy "admin update results" on event_results for update using (is_admin());
create policy "admin delete results" on event_results for delete using (is_admin());

-- ============================================================================
-- order_of_merit_points — public leaderboard
-- ============================================================================

create policy "public read oom" on order_of_merit_points for select using (true);
create policy "admin write oom" on order_of_merit_points for insert with check (is_admin());
create policy "admin update oom" on order_of_merit_points for update using (is_admin());

create policy "admin read oom adjustments" on order_of_merit_adjustments for select using (is_admin());
create policy "admin write oom adjustments" on order_of_merit_adjustments for insert with check (is_admin());
create policy "admin update oom adjustments" on order_of_merit_adjustments for update using (is_admin());
create policy "admin delete oom adjustments" on order_of_merit_adjustments for delete using (is_admin());

-- ============================================================================
-- notifications — own only
-- ============================================================================

create policy "own notifications select" on notifications for select using (auth.uid() = member_id);
create policy "own notifications update" on notifications for update using (auth.uid() = member_id) with check (auth.uid() = member_id);
create policy "admin notifications select" on notifications for select using (is_admin());
create policy "admin notifications insert" on notifications for insert with check (is_admin());

-- ============================================================================
-- site_content — public read, admin write
-- ============================================================================

create policy "public read site_content" on site_content for select using (true);
create policy "admin write site_content" on site_content for insert with check (is_admin());
create policy "admin update site_content" on site_content for update using (is_admin());

-- ============================================================================
-- admin_audit_log — admin only
-- ============================================================================

create policy "admin read audit log" on admin_audit_log for select using (is_admin());
create policy "admin write audit log" on admin_audit_log for insert with check (is_admin());
