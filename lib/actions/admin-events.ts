"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEventEntryConfirmedEmail, sendWaitingListPromotedEmail } from "@/lib/email";
import { formatEventDateLong } from "@/lib/format";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return v && String(v).trim() !== "" ? String(v).trim() : null;
}

function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  return v === null ? null : Number(v);
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, adminId: user.id };
}

export async function createEvent(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();

  const name = str(formData, "name")!;
  const eventDate = str(formData, "event_date")!;
  const slug = `${slugify(name)}-${eventDate.slice(0, 7)}`;

  const { data, error } = await supabase
    .from("events")
    .insert({
      season_id: str(formData, "season_id"),
      name,
      slug,
      golf_club_id: str(formData, "golf_club_id"),
      course_id: str(formData, "course_id"),
      location: str(formData, "location"),
      hero_image_url: str(formData, "hero_image_url"),
      event_date: eventDate,
      registration_opens_at: str(formData, "registration_opens_at"),
      registration_deadline: str(formData, "registration_deadline"),
      arrival_time: str(formData, "arrival_time"),
      first_tee_time: str(formData, "first_tee_time"),
      shotgun_time: str(formData, "shotgun_time"),
      format: str(formData, "format"),
      max_players: num(formData, "max_players"),
      description: str(formData, "description"),
      competition_rules: str(formData, "competition_rules"),
      prizes: str(formData, "prizes"),
      dress_code: str(formData, "dress_code"),
      course_information: str(formData, "course_information"),
      handicap_allowance: str(formData, "handicap_allowance"),
      oom_eligible: formData.get("oom_eligible") === "on",
      is_major: formData.get("is_major") === "on",
      sponsor_id: str(formData, "sponsor_id"),
      status: str(formData, "status") ?? "draft",
      created_by: adminId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action: "create_event", entity_type: "events", entity_id: data.id });

  revalidatePath("/admin/events");
  revalidatePath("/tour-schedule");
  redirect(`/admin/events/${data.id}?saved=1`);
}

export async function updateEvent(eventId: string, formData: FormData) {
  const { supabase, adminId } = await requireAdmin();

  const { data: before } = await supabase.from("events").select("*").eq("id", eventId).single();

  const update = {
    season_id: str(formData, "season_id"),
    name: str(formData, "name"),
    golf_club_id: str(formData, "golf_club_id"),
    course_id: str(formData, "course_id"),
    location: str(formData, "location"),
    hero_image_url: str(formData, "hero_image_url"),
    event_date: str(formData, "event_date"),
    registration_opens_at: str(formData, "registration_opens_at"),
    registration_deadline: str(formData, "registration_deadline"),
    arrival_time: str(formData, "arrival_time"),
    first_tee_time: str(formData, "first_tee_time"),
    shotgun_time: str(formData, "shotgun_time"),
    format: str(formData, "format"),
    max_players: num(formData, "max_players"),
    description: str(formData, "description"),
    competition_rules: str(formData, "competition_rules"),
    prizes: str(formData, "prizes"),
    dress_code: str(formData, "dress_code"),
    course_information: str(formData, "course_information"),
    handicap_allowance: str(formData, "handicap_allowance"),
    oom_eligible: formData.get("oom_eligible") === "on",
    is_major: formData.get("is_major") === "on",
    sponsor_id: str(formData, "sponsor_id"),
    status: str(formData, "status"),
  };

  const { error } = await supabase.from("events").update(update).eq("id", eventId);
  if (error) throw new Error(error.message);

  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action: "update_event",
    entity_type: "events",
    entity_id: eventId,
    before,
    after: update,
  });

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/tour-schedule");
  redirect(`/admin/events/${eventId}?saved=1`);
}

export async function deleteEvent(eventId: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);
  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action: "delete_event", entity_type: "events", entity_id: eventId });
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

// ---------------------------------------------------------------------------
// Entries
// ---------------------------------------------------------------------------

export async function addEntryByEmail(eventId: string, formData: FormData) {
  const { supabase, adminId } = await requireAdmin();
  const email = str(formData, "email");
  if (!email) throw new Error("Email is required");

  const { data: member } = await supabase.from("member_profiles").select("id, email, first_name, current_handicap").eq("email", email).single();
  if (!member) redirect(`/admin/entries/${eventId}?error=${encodeURIComponent("No member found with that email.")}`);

  const { error } = await supabase.from("event_entries").insert({
    event_id: eventId,
    member_id: member.id,
    playing_handicap: member.current_handicap,
    status: "confirmed",
    agreed_to_rules: true,
  });
  if (error) {
    const message = error.code === "23505" ? "That member is already entered." : error.message;
    redirect(`/admin/entries/${eventId}?error=${encodeURIComponent(message)}`);
  }

  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action: "add_entry", entity_type: "event_entries", entity_id: eventId });

  const { data: event } = await supabase.from("events").select("name, event_date, slug").eq("id", eventId).single();
  if (event) {
    await sendEventEntryConfirmedEmail(member.email, member.first_name, event.name, formatEventDateLong(event.event_date), event.slug);
  }

  revalidatePath(`/admin/entries/${eventId}`);
  redirect(`/admin/entries/${eventId}?added=1`);
}

export async function removeEntry(eventId: string, entryId: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("event_entries").delete().eq("id", entryId);
  if (error) throw new Error(error.message);
  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action: "remove_entry", entity_type: "event_entries", entity_id: entryId });
  revalidatePath(`/admin/entries/${eventId}`);
}

export async function updateEntryPayment(eventId: string, entryId: string, status: "pending" | "paid" | "refunded" | "complimentary" | "not_required") {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase
    .from("event_entries")
    .update({ payment_status: status, payment_date: status === "paid" ? new Date().toISOString() : null })
    .eq("id", entryId);
  if (error) throw new Error(error.message);
  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action: "update_payment", entity_type: "event_entries", entity_id: entryId, after: { status } });
  revalidatePath(`/admin/entries/${eventId}`);
}

export async function promoteWaitingListEntry(eventId: string, waitingListId: string) {
  const { supabase, adminId } = await requireAdmin();

  const { data: waiting } = await supabase.from("waiting_list").select("member_id").eq("id", waitingListId).single();

  const { error } = await supabase.rpc("promote_from_waiting_list", { p_waiting_list_id: waitingListId, p_admin_id: adminId });
  if (error) throw new Error(error.message);

  if (waiting) {
    const [{ data: member }, { data: event }] = await Promise.all([
      supabase.from("member_profiles").select("email, first_name").eq("id", waiting.member_id).single(),
      supabase.from("events").select("name, slug").eq("id", eventId).single(),
    ]);
    if (member && event) await sendWaitingListPromotedEmail(member.email, member.first_name, event.name, event.slug);
  }

  revalidatePath(`/admin/entries/${eventId}`);
}

export async function removeFromWaitingList(eventId: string, waitingListId: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("waiting_list").update({ status: "removed", removed_at: new Date().toISOString() }).eq("id", waitingListId);
  if (error) throw new Error(error.message);
  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action: "remove_waiting_list", entity_type: "waiting_list", entity_id: waitingListId });
  revalidatePath(`/admin/entries/${eventId}`);
}

// ---------------------------------------------------------------------------
// Golf clubs / courses / partners assignment
// ---------------------------------------------------------------------------

export async function createGolfClub(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();
  const { data, error } = await supabase
    .from("golf_clubs")
    .insert({
      name: str(formData, "name"),
      location: str(formData, "location"),
      emirate: str(formData, "emirate"),
      website: str(formData, "website"),
      logo_url: str(formData, "logo_url"),
      hero_image_url: str(formData, "hero_image_url"),
      description: str(formData, "description"),
      created_by: adminId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const courseName = str(formData, "course_name");
  if (courseName) {
    await supabase.from("courses").insert({
      golf_club_id: data.id,
      name: courseName,
      par: num(formData, "par"),
      course_rating: num(formData, "course_rating"),
      slope_rating: num(formData, "slope_rating"),
    });
  }

  revalidatePath("/admin/golf-clubs");
}

export async function addCourseToClub(golfClubId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("courses").insert({
    golf_club_id: golfClubId,
    name: str(formData, "name"),
    par: num(formData, "par"),
    course_rating: num(formData, "course_rating"),
    slope_rating: num(formData, "slope_rating"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/golf-clubs");
}

// ---------------------------------------------------------------------------
// Event photo gallery
// ---------------------------------------------------------------------------

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export async function uploadEventPhotos(eventId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  const { data: event } = await supabase.from("events").select("slug").eq("id", eventId).single();
  const { count } = await supabase
    .from("event_photos")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);
  let sortOrder = count ?? 0;

  for (const file of files) {
    if (!file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES) continue;
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${eventId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("event-photos")
      .upload(path, file, { contentType: file.type });
    if (uploadError) continue;
    await supabase.from("event_photos").insert({ event_id: eventId, storage_path: path, sort_order: sortOrder });
    sortOrder += 1;
  }

  revalidatePath(`/admin/events/${eventId}`);
  if (event) revalidatePath(`/events/${event.slug}`);
  redirect(`/admin/events/${eventId}?saved=1`);
}

export async function deleteEventPhoto(eventId: string, photoId: string, storagePath: string) {
  const { supabase } = await requireAdmin();
  await supabase.storage.from("event-photos").remove([storagePath]);
  const { error } = await supabase.from("event_photos").delete().eq("id", photoId);
  if (error) throw new Error(error.message);

  const { data: event } = await supabase.from("events").select("slug").eq("id", eventId).single();
  revalidatePath(`/admin/events/${eventId}`);
  if (event) revalidatePath(`/events/${event.slug}`);
}

export async function assignEventPartner(eventId: string, partnerId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("event_partners").insert({ event_id: eventId, partner_id: partnerId });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function removeEventPartner(eventId: string, partnerId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("event_partners").delete().eq("event_id", eventId).eq("partner_id", partnerId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/events/${eventId}`);
}
