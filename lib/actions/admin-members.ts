"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MemberStatus, UserRole } from "@/lib/types";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, adminId: user.id };
}

export async function setMemberStatus(memberId: string, status: MemberStatus, reason?: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase
    .from("member_profiles")
    .update({
      status,
      approved_at: status === "approved" ? new Date().toISOString() : null,
      approved_by: status === "approved" ? adminId : null,
      rejected_reason: status === "rejected" ? (reason ?? null) : null,
    })
    .eq("id", memberId);
  if (error) throw new Error(error.message);

  await supabase.from("notifications").insert({
    member_id: memberId,
    type: status === "approved" ? "membership_approved" : status === "rejected" ? "membership_rejected" : "membership_pending",
    title: status === "approved" ? "Your TP Tour membership has been approved" : "Membership status updated",
    body: status === "approved" ? "Welcome to TP Tour — you can now enter events." : reason ?? null,
  });

  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action: `set_status_${status}`, entity_type: "member_profiles", entity_id: memberId });

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${memberId}`);
}

export async function approveMember(memberId: string) {
  return setMemberStatus(memberId, "approved");
}

export async function suspendMember(memberId: string) {
  return setMemberStatus(memberId, "suspended");
}

export async function rejectMember(memberId: string) {
  return setMemberStatus(memberId, "rejected");
}

export async function updateMemberRole(memberId: string, role: UserRole) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("member_profiles").update({ role }).eq("id", memberId);
  if (error) throw new Error(error.message);
  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action: "update_role", entity_type: "member_profiles", entity_id: memberId, after: { role } });
  revalidatePath(`/admin/members/${memberId}`);
}

export async function adminAdjustHandicap(memberId: string, newHandicap: number, reason: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.rpc("submit_handicap_change", {
    p_member_id: memberId,
    p_new_handicap: newHandicap,
    p_reason: reason,
    p_source: "admin_adjustment",
    p_changed_by: adminId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/members/${memberId}`);
}

export async function approveHandicapChange(memberId: string, historyId: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.rpc("approve_handicap_change", { p_history_id: historyId, p_admin_id: adminId });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/members/${memberId}`);
}

export async function updateMemberDetailsAdmin(memberId: string, formData: FormData) {
  const { supabase, adminId } = await requireAdmin();
  const val = (k: string) => {
    const v = formData.get(k);
    return v && String(v).trim() !== "" ? String(v).trim() : null;
  };
  const { error } = await supabase
    .from("member_profiles")
    .update({
      first_name: val("first_name"),
      last_name: val("last_name"),
      mobile: val("mobile"),
      nationality: val("nationality"),
      company: val("company"),
      job_title: val("job_title"),
      industry: val("industry"),
      home_golf_club: val("home_golf_club"),
      home_course: val("home_course"),
      egf_whs_number: val("egf_whs_number"),
    })
    .eq("id", memberId);
  if (error) throw new Error(error.message);
  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action: "edit_member", entity_type: "member_profiles", entity_id: memberId });
  revalidatePath(`/admin/members/${memberId}`);
}
