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

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return v && String(v).trim() !== "" ? String(v).trim() : null;
}
function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  return v === null ? null : Number(v);
}

export async function updateSiteContentValue(key: string, value: Record<string, unknown>) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase
    .from("site_content")
    .upsert({ key, value, updated_by: adminId, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
  revalidatePath("/");
  revalidatePath("/about");
}

export async function createSeason(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("seasons").insert({
    name: str(formData, "name"),
    start_date: str(formData, "start_date"),
    end_date: str(formData, "end_date"),
    is_current: formData.get("is_current") === "on",
    created_by: adminId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/order-of-merit");
  revalidatePath("/tour-schedule");
}

export async function updateSeasonOomConfig(seasonId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("seasons")
    .update({
      oom_best_results_count: num(formData, "oom_best_results_count"),
    })
    .eq("id", seasonId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/order-of-merit");
}

export async function addOomAdjustment(seasonId: string, formData: FormData) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("order_of_merit_adjustments").insert({
    season_id: seasonId,
    member_id: str(formData, "member_id"),
    event_id: str(formData, "event_id"),
    points_adjustment: num(formData, "points_adjustment"),
    reason: str(formData, "reason"),
    admin_id: adminId,
  });
  if (error) throw new Error(error.message);
  await supabase.rpc("recalculate_order_of_merit", { p_season_id: seasonId });
  revalidatePath("/admin/order-of-merit");
  revalidatePath("/order-of-merit");
}

export async function recalcOrderOfMerit(seasonId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("recalculate_order_of_merit", { p_season_id: seasonId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/order-of-merit");
  revalidatePath("/order-of-merit");
  revalidatePath("/");
}

export async function createPartner(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();
  const { count } = await supabase.from("partners").select("id", { count: "exact", head: true });
  const { error } = await supabase.from("partners").insert({
    name: str(formData, "name"),
    logo_url: str(formData, "logo_url"),
    website: str(formData, "website"),
    description: str(formData, "description"),
    display_order: count ?? 0,
  });
  if (error) throw new Error(error.message);
  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action: "create_partner", entity_type: "partners" });
  revalidatePath("/admin/partners");
  revalidatePath("/partners");
}

export async function updatePartner(partnerId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("partners")
    .update({
      name: str(formData, "name"),
      logo_url: str(formData, "logo_url"),
      website: str(formData, "website"),
      description: str(formData, "description"),
      active: formData.get("active") === "on",
    })
    .eq("id", partnerId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/partners");
  revalidatePath("/partners");
}

export async function reorderPartners(orderedIds: string[]) {
  const { supabase } = await requireAdmin();
  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from("partners").update({ display_order: index }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  revalidatePath("/admin/partners");
  revalidatePath("/partners");
  revalidatePath("/");
}

export async function updateSettings(key: string, value: Record<string, unknown>) {
  return updateSiteContentValue(key, value);
}
