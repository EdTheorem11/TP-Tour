"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEventEntryConfirmedEmail, sendWaitingListPromotedEmail, sendEventThankYouEmail } from "@/lib/email";

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

  const { data: member } = await supabase.from("member_profiles").select("id, email, first_name, last_name, current_handicap").eq("email", email).single();
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

  const { data: event } = await supabase
    .from("events")
    .select("id, slug, name, event_date, location, arrival_time, first_tee_time, shotgun_time, format, golf_clubs(name)")
    .eq("id", eventId)
    .single();
  if (event) {
    await sendEventEntryConfirmedEmail(member.email, member.first_name, `${member.first_name} ${member.last_name}`, {
      ...event,
      golf_club_name: (event.golf_clubs as unknown as { name: string | null } | null)?.name ?? null,
    });
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
      supabase.from("member_profiles").select("email, first_name, last_name").eq("id", waiting.member_id).single(),
      supabase
        .from("events")
        .select("id, slug, name, event_date, location, arrival_time, first_tee_time, shotgun_time, format, golf_clubs(name)")
        .eq("id", eventId)
        .single(),
    ]);
    if (member && event) {
      await sendWaitingListPromotedEmail(member.email, member.first_name, `${member.first_name} ${member.last_name}`, {
        ...event,
        golf_club_name: (event.golf_clubs as unknown as { name: string | null } | null)?.name ?? null,
      });
    }
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

// Manual trigger for the "thanks for playing" email — sends to every
// confirmed, non-guest entrant (guests have no email on file to reach).
// Marks the event as sent so it can't be double-fired by accident, though
// an admin can deliberately resend by calling this again.
export async function sendEventThankYouEmails(eventId: string): Promise<{ error?: string; sent?: number }> {
  const { supabase, adminId } = await requireAdmin();

  const { data: event } = await supabase.from("events").select("id, slug, name").eq("id", eventId).single();
  if (!event) return { error: "Event not found." };

  const { data: entrants } = await supabase
    .from("event_entries")
    .select("member_profiles(email, first_name)")
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .eq("is_guest", false);

  const recipients = ((entrants ?? []) as unknown as Array<{ member_profiles: { email: string; first_name: string } | null }>)
    .map((e) => e.member_profiles)
    .filter((m): m is { email: string; first_name: string } => m !== null);

  if (recipients.length === 0) return { error: "No confirmed members entered this event." };

  const { data: nextEventRows } = await supabase.from("next_event").select("name, slug, event_date").limit(1);
  const nextEvent = nextEventRows?.[0] ?? null;

  let sent = 0;
  for (const r of recipients) {
    const { error } = await sendEventThankYouEmail(r.email, event, nextEvent);
    if (!error) sent++;
  }

  await supabase.from("events").update({ attendee_thank_you_sent_at: new Date().toISOString() }).eq("id", eventId);
  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action: "send_thank_you_emails",
    entity_type: "events",
    entity_id: eventId,
    after: { sent, attempted: recipients.length },
  });

  revalidatePath(`/admin/entries/${eventId}`);
  return { sent };
}

// Splits confirmed entrants evenly across the requested number of tee times
// (in entry order), starting at start_time and spaced gap_minutes apart.
// Re-running this for the same event overwrites any previous assignment.
export async function generateTeeSheet(eventId: string, formData: FormData) {
  const { supabase, adminId } = await requireAdmin();

  const startTime = str(formData, "start_time");
  const gapMinutes = num(formData, "gap_minutes");
  const teeTimeCount = num(formData, "tee_time_count");

  if (!startTime || !/^\d{1,2}:\d{2}$/.test(startTime) || !gapMinutes || gapMinutes <= 0 || !teeTimeCount || teeTimeCount <= 0) {
    redirect(`/admin/events/${eventId}/day-sheet?error=${encodeURIComponent("Enter a start time, a gap greater than 0, and at least 1 tee time.")}`);
  }

  const { data: entries } = await supabase
    .from("event_entries")
    .select("id")
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .order("entry_date", { ascending: true });

  if (!entries || entries.length === 0) {
    redirect(`/admin/events/${eventId}/day-sheet?error=${encodeURIComponent("No confirmed entries to assign tee times to.")}`);
  }

  const total = entries.length;
  const base = Math.floor(total / teeTimeCount);
  const remainder = total % teeTimeCount;
  const [startHour, startMin] = startTime.split(":").map(Number);
  const startTotalMinutes = startHour * 60 + startMin;

  const updates: { id: string; tee_time: string; group_number: number }[] = [];
  let entryIndex = 0;
  for (let g = 0; g < teeTimeCount && entryIndex < total; g++) {
    const groupSize = base + (g < remainder ? 1 : 0);
    if (groupSize === 0) continue;
    const minutes = (startTotalMinutes + g * gapMinutes) % 1440;
    const teeTimeLabel = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    for (let p = 0; p < groupSize; p++) {
      updates.push({ id: entries[entryIndex].id, tee_time: teeTimeLabel, group_number: g + 1 });
      entryIndex++;
    }
  }

  const { error } = await Promise.all(
    updates.map((u) => supabase.from("event_entries").update({ tee_time: u.tee_time, group_number: u.group_number }).eq("id", u.id)),
  ).then((results) => {
    const failed = results.find((r) => r.error);
    return { error: failed?.error ?? null };
  });
  if (error) redirect(`/admin/events/${eventId}/day-sheet?error=${encodeURIComponent(error.message)}`);

  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action: "generate_tee_sheet",
    entity_type: "events",
    entity_id: eventId,
    after: { start_time: startTime, gap_minutes: gapMinutes, tee_time_count: teeTimeCount, players: total },
  });

  revalidatePath(`/admin/events/${eventId}/day-sheet`);
  redirect(`/admin/events/${eventId}/day-sheet?generated=1`);
}

// Manual counterpart to generateTeeSheet — sets each confirmed entry's group
// number individually from a `group_<entryId>` field per player, so specific
// pairing requests can be honoured instead of an even auto-split. Also saves
// each player's order within their group from a `position_<entryId>` field,
// so pairs within a 4-ball can be manually reordered. Leaves tee_time
// untouched; pair with applyTeeTimesToGroups to fill those in.
export async function updateEntryGroups(eventId: string, formData: FormData) {
  const { supabase, adminId } = await requireAdmin();

  const { data: entries } = await supabase
    .from("event_entries")
    .select("id")
    .eq("event_id", eventId)
    .eq("status", "confirmed");

  if (!entries) redirect(`/admin/events/${eventId}/day-sheet?error=${encodeURIComponent("Couldn't load entries.")}`);

  const updates = entries.map((e) => ({
    id: e.id,
    group: num(formData, `group_${e.id}`),
    position: num(formData, `position_${e.id}`),
  }));

  const grouped = updates.filter((u) => u.group !== null && u.group > 0);

  await Promise.all(
    grouped.map((u) => supabase.from("event_entries").update({ group_number: u.group, group_position: u.position }).eq("id", u.id)),
  );

  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action: "update_tee_groups",
    entity_type: "events",
    entity_id: eventId,
    after: { assigned: grouped.length },
  });

  revalidatePath(`/admin/events/${eventId}/day-sheet`);
  redirect(`/admin/events/${eventId}/day-sheet?groupsSaved=1`);
}

// Manual counterpart to grouping — sets which hole each group starts from,
// from a `hole_<groupNumber>` field per distinct group. For a normal single
// tee start, leave every group on the same hole (or blank); for a split tee
// start, groups on different holes get their own independent time sequence
// in applyTeeTimesToGroups, both starting at the same clock time.
export async function updateGroupStartingHoles(eventId: string, formData: FormData) {
  const { supabase, adminId } = await requireAdmin();

  const { data: entries } = await supabase
    .from("event_entries")
    .select("id, group_number")
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .not("group_number", "is", null);

  if (!entries) redirect(`/admin/events/${eventId}/day-sheet?error=${encodeURIComponent("Couldn't load entries.")}`);

  const groupNumbers = [...new Set(entries.map((e) => e.group_number as number))];
  const holeByGroup = new Map(groupNumbers.map((g) => [g, num(formData, `hole_${g}`)]));

  await Promise.all(
    entries.map((e) => {
      const hole = holeByGroup.get(e.group_number as number) ?? null;
      return supabase.from("event_entries").update({ starting_hole: hole }).eq("id", e.id);
    }),
  );

  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action: "update_group_starting_holes",
    entity_type: "events",
    entity_id: eventId,
    after: { groups: groupNumbers.length },
  });

  revalidatePath(`/admin/events/${eventId}/day-sheet`);
  redirect(`/admin/events/${eventId}/day-sheet?groupsSaved=1`);
}

// Times up whatever groups are currently set on confirmed entries (however
// they got there — manual or auto-split) using each group's own number as
// its order: group 1 tees off at start_time, group 2 at start_time +
// gap_minutes, and so on. Entries with no group number are left alone.
// Groups on different starting holes (a split tee start) each get their own
// independent sequence, all starting from the same start_time — e.g. the
// first group off the 1st and the first group off the 18th both tee off at
// start_time, the second group on each hole at start_time + gap, and so on.
export async function applyTeeTimesToGroups(eventId: string, formData: FormData) {
  const { supabase, adminId } = await requireAdmin();

  const startTime = str(formData, "start_time");
  const gapMinutes = num(formData, "gap_minutes");
  if (!startTime || !/^\d{1,2}:\d{2}$/.test(startTime) || !gapMinutes || gapMinutes <= 0) {
    redirect(`/admin/events/${eventId}/day-sheet?error=${encodeURIComponent("Enter a start time and a gap greater than 0.")}`);
  }

  const { data: entries } = await supabase
    .from("event_entries")
    .select("id, group_number, starting_hole")
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .not("group_number", "is", null);

  if (!entries || entries.length === 0) {
    redirect(`/admin/events/${eventId}/day-sheet?error=${encodeURIComponent("No groups assigned yet — assign players to groups first.")}`);
  }

  // One representative starting_hole per group (all players in a group share it).
  const holeByGroup = new Map<number, number | null>();
  for (const e of entries) {
    const g = e.group_number as number;
    if (!holeByGroup.has(g)) holeByGroup.set(g, e.starting_hole);
  }

  // Bucket groups by starting hole (null = the default, unsplit bucket), and
  // give each bucket its own independent start_time-based sequence.
  const groupsByHole = new Map<number | null, number[]>();
  for (const [g, hole] of holeByGroup) {
    const list = groupsByHole.get(hole) ?? [];
    list.push(g);
    groupsByHole.set(hole, list);
  }

  const [startHour, startMin] = startTime.split(":").map(Number);
  const startTotalMinutes = startHour * 60 + startMin;
  const timeByGroup = new Map<number, string>();
  for (const groupsOnThisHole of groupsByHole.values()) {
    groupsOnThisHole.sort((a, b) => a - b);
    groupsOnThisHole.forEach((g, i) => {
      const minutes = (startTotalMinutes + i * gapMinutes) % 1440;
      timeByGroup.set(g, `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
    });
  }

  await Promise.all(
    entries.map((e) => supabase.from("event_entries").update({ tee_time: timeByGroup.get(e.group_number as number) }).eq("id", e.id)),
  );

  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action: "apply_tee_times_to_groups",
    entity_type: "events",
    entity_id: eventId,
    after: { start_time: startTime, gap_minutes: gapMinutes, groups: holeByGroup.size, holes: groupsByHole.size },
  });

  revalidatePath(`/admin/events/${eventId}/day-sheet`);
  redirect(`/admin/events/${eventId}/day-sheet?generated=1`);
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

// Modern phone cameras routinely produce 10-15MB photos — the old 8MB cap
// silently dropped those (and any storage error was swallowed too), so an
// admin uploading a full album of event-day photos could see "Changes
// saved" while nothing actually made it in.
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

export async function uploadEventPhotos(eventId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  const { data: event } = await supabase.from("events").select("slug").eq("id", eventId).single();
  const { count } = await supabase
    .from("event_photos")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);
  let sortOrder = count ?? 0;

  let uploaded = 0;
  let failed = 0;
  let firstError: string | null = null;

  for (const file of files) {
    if (!file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES) {
      failed++;
      firstError ??= `${file.name}: too large or not a recognised image type`;
      continue;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${eventId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("event-photos")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      failed++;
      firstError ??= `${file.name}: ${uploadError.message}`;
      continue;
    }
    const { error: insertError } = await supabase
      .from("event_photos")
      .insert({ event_id: eventId, storage_path: path, sort_order: sortOrder });
    if (insertError) {
      // The file made it to storage but the DB row failed — don't leave an
      // orphaned, undeleteable-from-the-UI file behind.
      await supabase.storage.from("event-photos").remove([path]);
      failed++;
      firstError ??= `${file.name}: ${insertError.message}`;
      continue;
    }
    sortOrder += 1;
    uploaded++;
  }

  revalidatePath(`/admin/events/${eventId}`);
  if (event) revalidatePath(`/events/${event.slug}`);
  const errorParam = firstError ? `&photosError=${encodeURIComponent(firstError)}` : "";
  redirect(`/admin/events/${eventId}?photosUploaded=${uploaded}&photosFailed=${failed}${errorParam}`);
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
