"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

export async function publishEventResults(eventId: string) {
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
