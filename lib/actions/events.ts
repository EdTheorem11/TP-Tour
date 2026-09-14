"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEventEntryConfirmedEmail, sendWaitingListConfirmedEmail } from "@/lib/email";
import { formatEventDateLong } from "@/lib/format";

export async function enterEvent(eventSlug: string, eventId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please login to enter this event." };

  const { data: profile } = await supabase
    .from("member_profiles")
    .select("email, first_name, status, current_handicap")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "approved") {
    return { error: "Your membership must be approved before entering events." };
  }

  const { data: event } = await supabase
    .from("events")
    .select("name, event_date, member_price")
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

  if (event) {
    await sendEventEntryConfirmedEmail(profile.email, profile.first_name, event.name, formatEventDateLong(event.event_date), eventSlug);
  }

  revalidatePath(`/events/${eventSlug}`);
  revalidatePath("/my-tp-tour");
  return { success: true };
}

export async function addGuest(
  eventSlug: string,
  eventId: string,
  guestName: string,
  playingHandicap: number | null,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please login to add a guest." };
  if (!guestName.trim()) return { error: "Guest name is required." };

  const { data: hostEntry } = await supabase
    .from("event_entries")
    .select("id")
    .eq("event_id", eventId)
    .eq("member_id", user.id)
    .eq("is_guest", false)
    .eq("status", "confirmed")
    .maybeSingle();

  if (!hostEntry) return { error: "You must be entered into this event before adding a guest." };

  const { error } = await supabase.from("event_entries").insert({
    event_id: eventId,
    member_id: user.id,
    is_guest: true,
    guest_name: guestName.trim(),
    playing_handicap: playingHandicap,
    status: "confirmed",
    agreed_to_rules: true,
  });

  if (error) return { error: error.message };

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

  const [{ data: profile }, { data: event }] = await Promise.all([
    supabase.from("member_profiles").select("email, first_name").eq("id", user.id).single(),
    supabase.from("events").select("name").eq("id", eventId).single(),
  ]);
  if (profile && event) await sendWaitingListConfirmedEmail(profile.email, profile.first_name, event.name, eventSlug);

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
