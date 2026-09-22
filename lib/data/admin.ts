import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { MemberProfile, TourEvent, GolfClub, Course, Partner, Season } from "@/lib/types";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export interface AuthActivity {
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

// Email confirmation and last-login are tracked by Supabase Auth itself on
// every account (not something our own schema needs to track), so this
// works retroactively for members who signed up before this existed too.
export async function getAllAuthActivity(): Promise<Map<string, AuthActivity>> {
  const activity = new Map<string, AuthActivity>();
  const admin = createAdminClient();
  if (!admin) return activity;

  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data) break;
    for (const u of data.users) {
      activity.set(u.id, { email_confirmed_at: u.email_confirmed_at ?? null, last_sign_in_at: u.last_sign_in_at ?? null });
    }
    if (data.users.length < perPage) break;
    page++;
  }
  return activity;
}

export async function getAuthActivity(memberId: string): Promise<AuthActivity | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.auth.admin.getUserById(memberId);
  if (error || !data.user) return null;
  return { email_confirmed_at: data.user.email_confirmed_at ?? null, last_sign_in_at: data.user.last_sign_in_at ?? null };
}

export async function getDashboardStats() {
  return safe(async () => {
    const supabase = await createClient();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [
      { count: totalMembers },
      { count: approvedMembers },
      { count: pendingMembers },
      { count: pendingHandicapChanges },
      { count: entriesThisWeek },
      { data: nextEvent },
    ] = await Promise.all([
      supabase.from("member_profiles").select("*", { count: "exact", head: true }),
      supabase.from("member_profiles").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("member_profiles").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("handicap_history").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("event_entries")
        .select("*", { count: "exact", head: true })
        .eq("status", "confirmed")
        .gte("entry_date", weekAgo),
      supabase
        .from("events")
        .select("*")
        .in("status", ["coming_soon", "entries_open", "limited_spaces", "sold_out"])
        .gte("event_date", new Date().toISOString().slice(0, 10))
        .order("event_date", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    let nextEventEntries = 0;
    let nextEventSpaces: number | null = null;
    let nextEventMaxPlayers: number | null = null;
    let nextEventWaitingList = 0;
    if (nextEvent) {
      const { data: capacity } = await supabase.from("event_capacity").select("*").eq("event_id", nextEvent.id).single();
      nextEventEntries = capacity?.players_entered ?? 0;
      nextEventSpaces = capacity?.spaces_remaining ?? null;
      nextEventMaxPlayers = capacity?.max_players ?? null;
      nextEventWaitingList = capacity?.waiting_list_count ?? 0;
    }

    const { count: upcomingEvents } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .neq("status", "completed")
      .neq("status", "cancelled");

    return {
      totalMembers: totalMembers ?? 0,
      approvedMembers: approvedMembers ?? 0,
      pendingMembers: pendingMembers ?? 0,
      pendingApprovals: (pendingMembers ?? 0) + (pendingHandicapChanges ?? 0),
      entriesThisWeek: entriesThisWeek ?? 0,
      upcomingEvents: upcomingEvents ?? 0,
      nextEvent: nextEvent as TourEvent | null,
      nextEventEntries,
      nextEventSpaces,
      nextEventMaxPlayers,
      nextEventWaitingList,
    };
  }, {
    totalMembers: 0,
    approvedMembers: 0,
    pendingMembers: 0,
    pendingApprovals: 0,
    entriesThisWeek: 0,
    upcomingEvents: 0,
    nextEvent: null as TourEvent | null,
    nextEventEntries: 0,
    nextEventSpaces: null as number | null,
    nextEventMaxPlayers: null as number | null,
    nextEventWaitingList: 0,
  });
}

export async function getRecentRegistrations(limit = 8): Promise<MemberProfile[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("member_profiles").select("*").order("created_at", { ascending: false }).limit(limit);
    return (data as MemberProfile[]) ?? [];
  }, []);
}

export async function getAllEventsAdmin(): Promise<TourEvent[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("*, golf_clubs(*), courses(*), seasons(name)")
      .order("event_date", { ascending: false });
    return (data as TourEvent[]) ?? [];
  }, []);
}

export async function getAllMembersAdmin(search?: string): Promise<MemberProfile[]> {
  return safe(async () => {
    const supabase = await createClient();
    let query = supabase.from("member_profiles").select("*").order("created_at", { ascending: false });
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }
    const { data } = await query;
    return (data as MemberProfile[]) ?? [];
  }, []);
}

export async function getMemberAdmin(id: string): Promise<MemberProfile | null> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("member_profiles").select("*").eq("id", id).single();
    return (data as MemberProfile) ?? null;
  }, null);
}

export async function getPendingMembers(): Promise<MemberProfile[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("member_profiles")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    return (data as MemberProfile[]) ?? [];
  }, []);
}

export async function getPendingHandicapChanges() {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("handicap_history")
      .select("*, member_profiles!member_id(first_name, last_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    return data ?? [];
  }, [] as Array<{
    id: string;
    member_id: string;
    old_handicap: number | null;
    new_handicap: number;
    reason: string | null;
    created_at: string;
    member_profiles: { first_name: string; last_name: string } | null;
  }>);
}

export async function getMemberHandicapHistory(memberId: string) {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("handicap_history")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });
    return data ?? [];
  }, []);
}

export async function getAllGolfClubs(): Promise<(GolfClub & { courses: Course[] })[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("golf_clubs").select("*, courses(*)").order("name", { ascending: true });
    return (data as (GolfClub & { courses: Course[] })[]) ?? [];
  }, []);
}

export async function getAllPartnersAdmin(): Promise<Partner[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("partners").select("*").order("display_order", { ascending: true });
    return (data as Partner[]) ?? [];
  }, []);
}

export async function getEventEntriesAdmin(eventId: string) {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("event_entries")
      .select("*, member_profiles(first_name, last_name, company, current_handicap)")
      .eq("event_id", eventId)
      .order("entry_date", { ascending: true });
    return data ?? [];
  }, []);
}

export async function getEventWaitingListAdmin(eventId: string) {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("waiting_list")
      .select("*, member_profiles(first_name, last_name, current_handicap)")
      .eq("event_id", eventId)
      .eq("status", "waiting")
      .order("position", { ascending: true });
    return data ?? [];
  }, []);
}

export async function getEventScoresAdmin(eventId: string) {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("event_scores")
      .select("*, member_profiles!member_id(first_name, last_name)")
      .eq("event_id", eventId);
    return data ?? [];
  }, []);
}

export async function getEventResultsAdmin(eventId: string) {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("event_results")
      .select("*, member_profiles(first_name, last_name)")
      .eq("event_id", eventId)
      .order("position", { ascending: true });
    return data ?? [];
  }, []);
}

export async function getAllSeasonsAdmin(): Promise<Season[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("seasons").select("*").order("start_date", { ascending: false });
    return (data as Season[]) ?? [];
  }, []);
}

export async function getOomAdjustmentsAdmin(seasonId: string) {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("order_of_merit_adjustments")
      .select("*, member_profiles!member_id(first_name, last_name)")
      .eq("season_id", seasonId)
      .order("created_at", { ascending: false });
    return data ?? [];
  }, []);
}

export async function getAllSiteContent() {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("site_content").select("*");
    const map: Record<string, unknown> = {};
    (data ?? []).forEach((row: { key: string; value: unknown }) => {
      map[row.key] = row.value;
    });
    return map;
  }, {} as Record<string, unknown>);
}
