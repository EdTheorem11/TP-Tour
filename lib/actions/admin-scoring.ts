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

  const { data: event } = await supabase.from("events").select("format").eq("id", eventId).single();
  const isStrokeplay = event?.format === "strokeplay";

  const file = formData.get("scores_csv");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/scoring/${eventId}?importError=${encodeURIComponent("No file selected.")}`);
  }

  const text = await file.text();
  const table = parseCsv(text);
  if (table.length < 2) {
    redirect(`/admin/scoring/${eventId}?importError=${encodeURIComponent("CSV has no data rows.")}`);
  }

  // Strip a UTF-8 BOM some spreadsheet apps prepend to the first header cell.
  const header = table[0].map((h) => h.replace(/^﻿/, "").trim().toLowerCase());
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

  // Require the score column this event's format actually uses, so a
  // mismatched or hand-edited CSV fails loudly instead of "succeeding"
  // with every score silently written as null.
  const missingScoreColumn = isStrokeplay
    ? idx.gross === -1 && idx.nett === -1
    : idx.stableford === -1;
  if (missingScoreColumn) {
    const expected = isStrokeplay ? '"Gross" and/or "Nett"' : '"Stableford"';
    redirect(
      `/admin/scoring/${eventId}?importError=${encodeURIComponent(
        `CSV must have a ${expected} column for this ${isStrokeplay ? "strokeplay" : "Stableford"} event. Use "Download Scoring Template" to get the right format.`,
      )}`,
    );
  }

  const dataRows = table.slice(1).filter((r) => r.some((c) => c.trim() !== ""));
  const emails = dataRows.map((r) => r[idx.email]?.trim().toLowerCase()).filter(Boolean);

  const { data: members } = await supabase.from("member_profiles").select("id, email").in("email", emails);
  const memberByEmail = new Map((members ?? []).map((m) => [m.email.toLowerCase(), m.id]));

  const num = (v: string | undefined) => {
    if (!v || v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const rows: Array<Record<string, string | number | null>> = [];
  const skipped: string[] = [];

  for (const r of dataRows) {
    const email = r[idx.email]?.trim().toLowerCase();
    const memberId = email ? memberByEmail.get(email) : undefined;
    if (!memberId) {
      if (email) skipped.push(email);
      continue;
    }
    // Only include columns actually present in the CSV, so re-uploading a
    // partial sheet (e.g. just email + score) doesn't null out fields
    // — like playing handicap — that a column omission shouldn't touch.
    const row: Record<string, string | number | null> = {
      event_id: eventId,
      member_id: memberId,
      entered_by: adminId,
    };
    if (idx.handicap > -1) row.playing_handicap = num(r[idx.handicap]);
    if (idx.gross > -1) row.gross_score = num(r[idx.gross]);
    if (idx.nett > -1) row.nett_score = num(r[idx.nett]);
    if (idx.stableford > -1) row.stableford_points = num(r[idx.stableford]);
    rows.push(row);
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

// Re-runs the same recompute the initial publish does, for after a score
// correction — without re-sending "results published" emails to everyone.
export async function recalculateEventResults(eventId: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.rpc("publish_event_results", { p_event_id: eventId, p_admin_id: adminId });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/scoring/${eventId}`);
  revalidatePath("/admin/results");
  revalidatePath("/admin/order-of-merit");
  revalidatePath("/results");
  revalidatePath("/order-of-merit");
  revalidatePath("/");
}

export async function publishEventResults(eventId: string, sendEmails: boolean) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.rpc("publish_event_results", { p_event_id: eventId, p_admin_id: adminId });
  if (error) throw new Error(error.message);

  if (sendEmails) {
    const { data: event } = await supabase.from("events").select("name, slug").eq("id", eventId).single();
    const { data: results } = await supabase
      .from("event_results")
      .select("member_profiles!member_id(email, first_name)")
      .eq("event_id", eventId)
      .eq("published", true);

    if (event && results) {
      await Promise.all(
        (results as unknown as Array<{ member_profiles: { email: string; first_name: string } | null }>).map((r) =>
          r.member_profiles ? sendResultsPublishedEmail(r.member_profiles.email, r.member_profiles.first_name, event.name, event.slug) : Promise.resolve(),
        ),
      );
    }
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
