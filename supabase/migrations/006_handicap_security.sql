-- TP TOUR — Harden handicap-change functions
--
-- submit_handicap_change() and approve_handicap_change() are SECURITY DEFINER
-- (they bypass RLS on handicap_history so they can operate regardless of the
-- caller's row-level access). The original versions trusted their p_source /
-- p_changed_by / p_admin_id parameters at face value, which meant any
-- authenticated member could call the RPC directly (not just through the
-- app's UI) and adjust or approve anyone's handicap. These versions verify
-- the actual caller (auth.uid()) against their real privileges instead.

create or replace function submit_handicap_change(
  p_member_id uuid, p_new_handicap numeric, p_reason text, p_source handicap_source, p_changed_by uuid
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_old numeric;
  v_auto_approve boolean;
  v_status handicap_change_status;
  v_id uuid;
  v_actor uuid := auth.uid();
begin
  if p_source = 'admin_adjustment' then
    if not is_super_admin() then
      raise exception 'Only a super admin can directly adjust a member''s handicap';
    end if;
  elsif p_source = 'member_submitted' then
    if v_actor is distinct from p_member_id then
      raise exception 'You can only submit a handicap change for your own profile';
    end if;
  else
    raise exception 'Invalid handicap change source for this operation';
  end if;

  select current_handicap into v_old from member_profiles where id = p_member_id;

  select coalesce((value->>'auto_approve')::boolean, false) into v_auto_approve
  from site_content where key = 'handicap_settings';

  if p_source = 'admin_adjustment' or v_auto_approve then
    v_status := 'approved';
  else
    v_status := 'pending';
  end if;

  insert into handicap_history (member_id, old_handicap, new_handicap, changed_by, reason, source, status, approved_by, approved_at)
  values (p_member_id, v_old, p_new_handicap, v_actor, p_reason, p_source, v_status,
          case when v_status = 'approved' then v_actor end,
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
  v_actor uuid := auth.uid();
begin
  if not is_super_admin() then
    raise exception 'Only a super admin can approve a handicap change';
  end if;

  select member_id, new_handicap into v_member_id, v_new from handicap_history where id = p_history_id and status = 'pending';
  if v_member_id is null then
    raise exception 'Handicap change not found or already resolved';
  end if;

  update handicap_history set status = 'approved', approved_by = v_actor, approved_at = now() where id = p_history_id;
  update member_profiles set current_handicap = v_new where id = v_member_id;

  insert into notifications (member_id, type, title, body)
  values (v_member_id, 'handicap_updated', 'Your handicap has been updated', format('Your handicap is now %s.', v_new));
end;
$$;
