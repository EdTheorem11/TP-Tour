"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function enterEvent(eventSlug: string, eventId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please login to enter this event." };

  const { data: profile } = await supabase
    .from("member_profiles")
    .select("status, current_handicap")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "approved") {
    return { error: "Your membership must be approved before entering events." };
  }

  const { data: event } = await supabase
    .from("events")
    .select("member_price")
    .eq("id", eventId)
    .single();

  const { error } = await supabase.from("event_entries").insert({
    event_id: eventId,
    member_id: user.id,
    playing_handicap: profile.current_handicap,
    status: "confirmed",
    agreed_to_rules: true,
    payment_required: !!event?.member_price,
    payment_amount: event?.member_price ?? null,
    payment_status: event?.member_price ? "pending" : "not_required",
  });

  if (error) return { error: error.code === "23505" ? "You're already entered in this event." : error.message };

  revalidatePath(`/events/${eventSlug}`);
  revalidatePath("/my-tp-tour");
  return { success: true };
}

export async function joinEventWaitingList(eventSlug: string, eventId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please login to join the waiting list." };

  const { error } = await supabase.from("waiting_list").insert({
    event_id: eventId,
    member_id: user.id,
  });

  if (error) return { error: error.code === "23505" ? "You're already on the waiting list." : error.message };

  revalidatePath(`/events/${eventSlug}`);
  revalidatePath("/my-tp-tour");
  return { success: true };
}

export async function withdrawFromEvent(eventSlug: string, entryId: string, reason?: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please login." };

  const { error } = await supabase
    .from("event_entries")
    .update({ status: "withdrawn", withdrawn_at: new Date().toISOString(), withdrawal_reason: reason ?? null })
    .eq("id", entryId)
    .eq("member_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/events/${eventSlug}`);
  revalidatePath("/my-tp-tour");
  return { success: true };
}
