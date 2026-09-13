import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SPONSOR_LEVEL_LABELS } from "@/lib/types";
import type {
  TourEvent,
  Season,
  OrderOfMeritPoint,
  EventResult,
  Partner,
  EventCapacity,
  EventPhoto,
} from "@/lib/types";

const SPONSOR_TIER_ORDER = Object.keys(SPONSOR_LEVEL_LABELS);

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getCurrentSeason(): Promise<Season | null> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("seasons").select("*").eq("is_current", true).single();
    return (data as Season) ?? null;
  }, null);
}

export async function getSeasonByName(name: string): Promise<Season | null> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("seasons").select("*").eq("name", name).single();
    return (data as Season) ?? null;
  }, null);
}

export async function getAllSeasons(): Promise<Season[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("seasons").select("*").order("start_date", { ascending: false });
    return (data as Season[]) ?? [];
  }, []);
}

export async function getSeasonChampions(): Promise<Array<{ season: Season; champions: OrderOfMeritPoint[] }>> {
  return safe(async () => {
    const seasons = await getAllSeasons();
    const pastSeasons = seasons.filter((s) => !s.is_current);
    const results = await Promise.all(
      pastSeasons.map(async (season) => {
        const standings = await getOrderOfMerit(season.id);
        return { season, champions: standings.filter((s) => s.rank === 1) };
      }),
    );
    return results.filter((r) => r.champions.length > 0);
  }, []);
}

export async function getNextEvent(): Promise<TourEvent | null> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("next_event")
      .select("*, golf_clubs(*), courses(*)")
      .single();
    return (data as TourEvent) ?? null;
  }, null);
}

export async function getEventCapacity(eventId: string): Promise<EventCapacity | null> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("event_capacity").select("*").eq("event_id", eventId).single();
    return (data as EventCapacity) ?? null;
  }, null);
}

export async function getEventCapacities(eventIds: string[]): Promise<Record<string, EventCapacity>> {
  return safe(async () => {
    if (eventIds.length === 0) return {};
    const supabase = await createClient();
    const { data } = await supabase.from("event_capacity").select("*").in("event_id", eventIds);
    const map: Record<string, EventCapacity> = {};
    ((data as EventCapacity[]) ?? []).forEach((c) => {
      map[c.event_id] = c;
    });
    return map;
  }, {});
}

export async function getSeasonEvents(seasonId: string): Promise<TourEvent[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("*, golf_clubs(*), courses(*)")
      .eq("season_id", seasonId)
      .order("event_date", { ascending: true });
    return (data as TourEvent[]) ?? [];
  }, []);
}

export async function getEventBySlug(slug: string): Promise<TourEvent | null> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("*, golf_clubs(*), courses(*)")
      .eq("slug", slug)
      .single();
    return (data as TourEvent) ?? null;
  }, null);
}

export async function getEventPhotos(eventId: string): Promise<EventPhoto[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("event_photos")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true });
    if (!data) return [];
    return data.map((photo) => ({
      ...photo,
      url: supabase.storage.from("event-photos").getPublicUrl(photo.storage_path).data.publicUrl,
    })) as EventPhoto[];
  }, []);
}

export async function getOrderOfMerit(seasonId: string, limit?: number): Promise<OrderOfMeritPoint[]> {
  return safe(async () => {
    const supabase = await createClient();
    let query = supabase
      .from("order_of_merit_points")
      .select("*, member_profiles(first_name, last_name, avatar_url, current_handicap)")
      .eq("season_id", seasonId)
      .order("rank", { ascending: true, nullsFirst: false });
    if (limit) query = query.limit(limit);
    const { data } = await query;
    return (data as OrderOfMeritPoint[]) ?? [];
  }, []);
}

export async function getLatestCompletedEvent(): Promise<TourEvent | null> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("latest_completed_event")
      .select("*, golf_clubs(*), courses(*)")
      .single();
    return (data as TourEvent) ?? null;
  }, null);
}

export async function getEventResults(eventId: string): Promise<EventResult[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("event_results")
      .select("*, member_profiles(first_name, last_name, avatar_url), event_scores(playing_handicap, gross_score, nett_score, stableford_points)")
      .eq("event_id", eventId)
      .eq("published", true)
      .order("position", { ascending: true });
    return (data as EventResult[]) ?? [];
  }, []);
}

export async function getCompletedEvents(seasonId?: string): Promise<TourEvent[]> {
  return safe(async () => {
    const supabase = await createClient();
    let query = supabase
      .from("events")
      .select("*, golf_clubs(*), courses(*)")
      .eq("status", "completed")
      .eq("results_published", true)
      .order("event_date", { ascending: false });
    if (seasonId) query = query.eq("season_id", seasonId);
    const { data } = await query;
    return (data as TourEvent[]) ?? [];
  }, []);
}

export async function getPartners(): Promise<Partner[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("partners")
      .select("*")
      .eq("active", true)
      // sponsor_level is a Postgres enum declared title_partner first, so
      // ordering by it directly ranks by tier, not alphabetically.
      .order("sponsor_level", { ascending: true })
      .order("display_order", { ascending: true });
    return (data as Partner[]) ?? [];
  }, []);
}

export async function getEventEntryList(eventId: string) {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("event_entry_list")
      .select("*")
      .eq("event_id", eventId)
      .order("entry_date", { ascending: true });
    return data ?? [];
  }, [] as Array<{ id: string; member_id: string; first_name: string; last_name: string; avatar_url: string | null; current_handicap: number | null; is_guest: boolean; guest_name: string | null }>);
}

export async function getMyEventEntry(eventId: string, memberId: string) {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("event_entries")
      .select("*")
      .eq("event_id", eventId)
      .eq("member_id", memberId)
      .neq("status", "withdrawn")
      .maybeSingle();
    return data ?? null;
  }, null);
}

export async function getMyWaitingListEntry(eventId: string, memberId: string) {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("waiting_list")
      .select("*")
      .eq("event_id", eventId)
      .eq("member_id", memberId)
      .eq("status", "waiting")
      .maybeSingle();
    return data ?? null;
  }, null);
}

export async function getPartnersForEvent(eventId: string): Promise<Partner[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("event_partners")
      .select("partners(*)")
      .eq("event_id", eventId);
    const partners = ((data as unknown as Array<{ partners: Partner }>) ?? []).map((r) => r.partners);
    return partners.sort(
      (a, b) => SPONSOR_TIER_ORDER.indexOf(a.sponsor_level) - SPONSOR_TIER_ORDER.indexOf(b.sponsor_level),
    );
  }, []);
}

export async function getPlayerDirectory(search?: string, industry?: string) {
  return safe(async () => {
    const supabase = await createClient();
    let query = supabase.from("player_directory").select("*").order("first_name", { ascending: true });
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%,industry.ilike.%${search}%`,
      );
    }
    if (industry) {
      query = query.eq("industry", industry);
    }
    const { data } = await query;
    return data ?? [];
  }, [] as import("@/lib/types").PlayerDirectoryEntry[]);
}

export async function getPlayerIndustries(): Promise<string[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("player_directory").select("industry").not("industry", "is", null);
    const unique = Array.from(new Set((data ?? []).map((r) => r.industry as string))).filter(Boolean);
    return unique.sort((a, b) => a.localeCompare(b));
  }, []);
}

export async function getPlayerByIdPublic(id: string) {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("player_directory").select("*").eq("id", id).single();
    return data ?? null;
  }, null as import("@/lib/types").PlayerDirectoryEntry | null);
}

export async function getPlayerSeasonResults(memberId: string) {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("event_results")
      .select("*, events(name, slug, event_date, format), event_scores(playing_handicap, gross_score, nett_score, stableford_points)")
      .eq("member_id", memberId)
      .eq("published", true)
      .order("created_at", { ascending: false });
    return data ?? [];
  }, []);
}

export async function getPlayerOomRow(seasonId: string, memberId: string): Promise<OrderOfMeritPoint | null> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("order_of_merit_points")
      .select("*")
      .eq("season_id", seasonId)
      .eq("member_id", memberId)
      .maybeSingle();
    return (data as OrderOfMeritPoint) ?? null;
  }, null);
}

export interface MyHandicapHistoryEntry {
  id: string;
  old_handicap: number | null;
  new_handicap: number;
  changed_at: string;
  reason: string | null;
  status: string;
}

export async function getMyHandicapHistory(memberId: string): Promise<MyHandicapHistoryEntry[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("handicap_history")
      .select("id, old_handicap, new_handicap, changed_at, reason, status")
      .eq("member_id", memberId)
      .order("changed_at", { ascending: true });
    return data ?? [];
  }, []);
}

export async function getMyNextEntry(memberId: string) {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("event_entries")
      .select("*, events(id, name, slug, event_date, location, first_tee_time, shotgun_time, format, status)")
      .eq("member_id", memberId)
      .eq("status", "confirmed")
      .gte("events.event_date", new Date().toISOString().slice(0, 10))
      .order("events(event_date)", { ascending: true })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  }, null);
}

export async function getMySeasonEntries(memberId: string, seasonId: string) {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("event_entries")
      .select("*, events!inner(id, name, slug, event_date, season_id, status)")
      .eq("member_id", memberId)
      .eq("events.season_id", seasonId)
      .neq("status", "withdrawn");
    return data ?? [];
  }, []);
}

export async function getSeasonStats(seasonId: string): Promise<{ eventsCount: number; coursesCount: number }> {
  return safe(async () => {
    const supabase = await createClient();
    const { data, count } = await supabase
      .from("events")
      .select("golf_club_id", { count: "exact" })
      .eq("season_id", seasonId);
    const distinctClubs = new Set((data ?? []).map((e) => e.golf_club_id).filter(Boolean));
    return { eventsCount: count ?? 0, coursesCount: distinctClubs.size };
  }, { eventsCount: 0, coursesCount: 0 });
}

export async function getSiteContent<T = Record<string, unknown>>(key: string): Promise<T | null> {
  return safe(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("site_content").select("value").eq("key", key).single();
    return (data?.value as T) ?? null;
  }, null);
}
