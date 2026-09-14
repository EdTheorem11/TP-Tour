"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllAuthActivity } from "@/lib/data/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MemberStatus, UserRole } from "@/lib/types";
import { sendMembershipApprovedEmail, sendMembershipRejectedEmail, sendHandicapUpdatedEmail } from "@/lib/email";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, adminId: user.id };
}

async function requireSuperAdmin() {
  const { supabase, adminId } = await requireAdmin();
  const { data: admin } = await supabase.from("member_profiles").select("role").eq("id", adminId).single();
  if (admin?.role !== "super_admin") throw new Error("Only a super admin can do this.");
  return { supabase, adminId };
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

  if (status === "approved" || status === "rejected") {
    const { data: member } = await supabase.from("member_profiles").select("email, first_name").eq("id", memberId).single();
    if (member) {
      if (status === "approved") await sendMembershipApprovedEmail(member.email, member.first_name);
      else await sendMembershipRejectedEmail(member.email, member.first_name, reason);
    }
  }

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

  const { data: member } = await supabase.from("member_profiles").select("email, first_name").eq("id", memberId).single();
  if (member) await sendHandicapUpdatedEmail(member.email, member.first_name, newHandicap);

  revalidatePath(`/admin/members/${memberId}`);
}

export async function approveHandicapChange(memberId: string, historyId: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.rpc("approve_handicap_change", { p_history_id: historyId, p_admin_id: adminId });
  if (error) throw new Error(error.message);

  const [{ data: member }, { data: history }] = await Promise.all([
    supabase.from("member_profiles").select("email, first_name").eq("id", memberId).single(),
    supabase.from("handicap_history").select("new_handicap").eq("id", historyId).single(),
  ]);
  if (member && history) await sendHandicapUpdatedEmail(member.email, member.first_name, history.new_handicap);

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

export async function resendConfirmationEmailAdmin(memberId: string) {
  const { supabase, adminId } = await requireAdmin();
  const { data: member } = await supabase.from("member_profiles").select("email").eq("id", memberId).single();
  if (!member) throw new Error("Member not found.");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: member.email,
    options: { emailRedirectTo: `${siteUrl}/confirm-email` },
  });
  if (error) throw new Error(error.message);

  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action: "resend_confirmation_email", entity_type: "member_profiles", entity_id: memberId });
  revalidatePath(`/admin/members/${memberId}`);
}

export async function resendConfirmationEmailBulk() {
  const { supabase, adminId } = await requireAdmin();

  const [{ data: members }, authActivity] = await Promise.all([
    supabase.from("member_profiles").select("id, email"),
    getAllAuthActivity(),
  ]);
  const unconfirmedEmails = (members ?? [])
    .filter((m) => !authActivity.get(m.id)?.email_confirmed_at)
    .map((m) => m.email);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  let sent = 0;
  let failed = 0;
  for (const email of unconfirmedEmails) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${siteUrl}/confirm-email` },
    });
    if (error) failed++;
    else sent++;
  }

  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action: "resend_confirmation_bulk",
    entity_type: "member_profiles",
    after: { sent, failed, total: unconfirmedEmails.length },
  });

  revalidatePath("/admin/members");
  redirect(`/admin/members?resent=${sent}&resendFailed=${failed}`);
}

export async function deleteMember(memberId: string) {
  const { supabase, adminId } = await requireSuperAdmin();
  const admin = createAdminClient();
  if (!admin) throw new Error("Server is missing SUPABASE_SERVICE_ROLE_KEY — cannot delete a member.");

  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action: "delete_member", entity_type: "member_profiles", entity_id: memberId });

  // Deleting the auth user cascades to member_profiles and every table that
  // references it (event_entries, event_scores, handicap_history, etc.) —
  // member_profiles.id is a foreign key to auth.users(id) on delete cascade.
  const { error } = await admin.auth.admin.deleteUser(memberId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/members");
  redirect("/admin/members");
}
