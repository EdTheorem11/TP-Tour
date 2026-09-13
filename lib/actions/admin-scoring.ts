"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendResultsPublishedEmail } from "@/lib/email";
import { parseCsv } from "@/lib/csv";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, adminId: user.id };
}

export async function saveEventScores(eventId: string, formData: FormData) {
  const { supabase, adminId } = await requireAdmin();

  const memberIds = new Set<string>();
  for (const key of formData.keys()) {
    const match = key.match(/^member_/);
    if (match) memberIds.add(key.replace("member_", ""));
  }

  const rows = Array.from(memberIds).map((memberId) => {
    const handicap = formData.get(`handicap_${memberId}`);
    const stableford = formData.get(`stableford_${memberId}`);
    const gross = formData.get(`gross_${memberId}`);
    const nett = formData.get(`nett_${memberId}`);
    return {
      event_id: eventId,
      member_id: memberId,
      playing_handicap: handicap && String(handicap) !== "" ? Number(handicap) : null,
      stableford_points: stableford && String(stableford) !== "" ? Number(stableford) : null,
      gross_score: gross && String(gross) !== "" ? Number(gross) : null,
      nett_score: nett && String(nett) !== "" ? Number(nett) : null,
      entered_by: adminId,
    };
  });

  if (rows.length > 0) {
    const { error } = await supabase.from("event_scores").upsert(rows, { onConflict: "event_id,member_id" });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/admin/scoring/${eventId}`);
}

export async function bulkUploadScores(eventId: string, formData: FormData) {
  const { supabase, adminId } = await requireAdmin();

  const file = formData.get("scores_csv");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/scoring/${eventId}?importError=${encodeURIComponent("No file selected.")}`);
  }

  const text = await file.text();
  const table = parseCsv(text);
  if (table.length < 2) {
    redirect(`/admin/scoring/${eventId}?importError=${encodeURIComponent("CSV has no data rows.")}`);
  }

  const header = table[0].map((h) => h.trim().toLowerCase());
  const idx = {
    email: header.indexOf("email"),
    handicap: header.indexOf("playing handicap"),
    gross: header.indexOf("gross"),
    nett: header.indexOf("nett"),
    stableford: header.indexOf("stableford"),
  };
  if (idx.email === -1) {
    redirect(`/admin/scoring/${eventId}?importError=${encodeURIComponent('CSV must have an "Email" column.')}`);
  }

  const dataRows = table.slice(1).filter((r) => r.some((c) => c.trim() !== ""));
  const emails = dataRows.map((r) => r[idx.email]?.trim().toLowerCase()).filter(Boolean);

  const { data: members } = await supabase.from("member_profiles").select("id, email").in("email", emails);
  const memberByEmail = new Map((members ?? []).map((m) => [m.email.toLowerCase(), m.id]));

  const num = (v: string | undefined) => (v && v.trim() !== "" ? Number(v) : null);

  const rows: Array<{
    event_id: string;
    member_id: string;
    playing_handicap: number | null;
    gross_score: number | null;
    nett_score: number | null;
    stableford_points: number | null;
    entered_by: string;
  }> = [];
  const skipped: string[] = [];

  for (const r of dataRows) {
    const email = r[idx.email]?.trim().toLowerCase();
    const memberId = email ? memberByEmail.get(email) : undefined;
    if (!memberId) {
      if (email) skipped.push(email);
      continue;
    }
    rows.push({
      event_id: eventId,
      member_id: memberId,
      playing_handicap: idx.handicap > -1 ? num(r[idx.handicap]) : null,
      gross_score: idx.gross > -1 ? num(r[idx.gross]) : null,
      nett_score: idx.nett > -1 ? num(r[idx.nett]) : null,
      stableford_points: idx.stableford > -1 ? num(r[idx.stableford]) : null,
      entered_by: adminId,
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("event_scores").upsert(rows, { onConflict: "event_id,member_id" });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/admin/scoring/${eventId}`);

  const query = new URLSearchParams({ imported: String(rows.length) });
  if (skipped.length > 0) query.set("skipped", skipped.join(", "));
  redirect(`/admin/scoring/${eventId}?${query.toString()}`);
}

export async function publishEventResults(eventId: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.rpc("publish_event_results", { p_event_id: eventId, p_admin_id: adminId });
  if (error) throw new Error(error.message);

  const { data: event } = await supabase.from("events").select("name, slug").eq("id", eventId).single();
  const { data: results } = await supabase
    .from("event_results")
    .select("member_profiles(email, first_name)")
    .eq("event_id", eventId)
    .eq("published", true);

  if (event && results) {
    await Promise.all(
      (results as unknown as Array<{ member_profiles: { email: string; first_name: string } | null }>).map((r) =>
        r.member_profiles ? sendResultsPublishedEmail(r.member_profiles.email, r.member_profiles.first_name, event.name, event.slug) : Promise.resolve(),
      ),
    );
  }

  revalidatePath(`/admin/scoring/${eventId}`);
  revalidatePath("/admin/results");
  revalidatePath("/admin/order-of-merit");
  revalidatePath("/results");
  revalidatePath("/order-of-merit");
  revalidatePath("/");
}

export async function overrideResultPosition(eventId: string, resultId: string, position: number, positionDisplay: string, oomPoints: number, reason: string) {
  const { supabase, adminId } = await requireAdmin();
  const { data: before } = await supabase.from("event_results").select("*").eq("id", resultId).single();

  const { error } = await supabase
    .from("event_results")
    .update({
      position,
      position_display: positionDisplay,
      oom_points: oomPoints,
      manually_overridden: true,
      override_reason: reason,
    })
    .eq("id", resultId);
  if (error) throw new Error(error.message);

  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action: "override_result",
    entity_type: "event_results",
    entity_id: resultId,
    before,
    after: { position, position_display: positionDisplay, oom_points: oomPoints, reason },
  });

  const { data: event } = await supabase.from("events").select("season_id").eq("id", eventId).single();
  if (event) {
    await supabase.rpc("recalculate_order_of_merit", { p_season_id: event.season_id });
  }

  revalidatePath(`/admin/scoring/${eventId}`);
  revalidatePath("/admin/results");
  revalidatePath("/results");
  revalidatePath("/order-of-merit");
}
