import { createClient } from "@/lib/supabase/server";
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

export async function getDashboardStats() {
  return safe(async () => {
    const supabase = await createClient();
    const [{ count: totalMembers }, { count: approvedMembers }, { count: pendingMembers }, { data: nextEvent }] =
      await Promise.all([
        supabase.from("member_profiles").select("*", { count: "exact", head: true }),
        supabase.from("member_profiles").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("member_profiles").select("*", { count: "exact", head: true }).eq("status", "pending"),
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
    if (nextEvent) {
      const { data: capacity } = await supabase.from("event_capacity").select("*").eq("event_id", nextEvent.id).single();
      nextEventEntries = capacity?.players_entered ?? 0;
      nextEventSpaces = capacity?.spaces_remaining ?? null;
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
      upcomingEvents: upcomingEvents ?? 0,
      nextEvent: nextEvent as TourEvent | null,
      nextEventEntries,
      nextEventSpaces,
    };
  }, {
    totalMembers: 0,
    approvedMembers: 0,
    pendingMembers: 0,
    upcomingEvents: 0,
    nextEvent: null as TourEvent | null,
    nextEventEntries: 0,
    nextEventSpaces: null as number | null,
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
      .select("*, member_profiles(first_name, last_name)")
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
      .select("*, member_profiles(first_name, last_name)")
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
