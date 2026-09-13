"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { sendAnnouncementEmail } from "@/lib/email";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, adminId: user.id };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textToHtml(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export async function sendAnnouncement(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();

  const audience = String(formData.get("audience") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!audience || !subject || !message) {
    redirect(`/admin/announcements?error=${encodeURIComponent("Audience, subject and message are all required.")}`);
  }

  let recipients: Array<{ email: string; first_name: string }> = [];

  if (audience === "all_approved") {
    const { data } = await supabase.from("member_profiles").select("email, first_name").eq("status", "approved");
    recipients = data ?? [];
  } else {
    const { data } = await supabase
      .from("event_entries")
      .select("member_profiles(email, first_name)")
      .eq("event_id", audience)
      .eq("status", "confirmed");
    recipients = ((data ?? []) as unknown as Array<{ member_profiles: { email: string; first_name: string } | null }>)
      .map((r) => r.member_profiles)
      .filter((m): m is { email: string; first_name: string } => m !== null);
  }

  if (recipients.length === 0) {
    redirect(`/admin/announcements?error=${encodeURIComponent("No recipients found for that audience.")}`);
  }

  const messageHtml = textToHtml(message);
  const results = await Promise.all(
    recipients.map((r) => sendAnnouncementEmail(r.email, r.first_name, subject, messageHtml)),
  );
  const failedCount = results.filter((r) => r.error).length;

  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action: "send_announcement",
    entity_type: "announcements",
    entity_id: audience === "all_approved" ? null : audience,
    after: { subject, audience, recipientCount: recipients.length, failedCount },
  });

  redirect(`/admin/announcements?sent=${recipients.length}&failed=${failedCount}`);
}
