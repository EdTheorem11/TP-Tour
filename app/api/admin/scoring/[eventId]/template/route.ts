import { requireAdminApi } from "@/lib/admin-guard";
import { toCsv, csvResponse } from "@/lib/csv";

interface TemplateRow {
  email: string;
  first_name: string;
  last_name: string;
  playing_handicap: number | null;
  gross_score: number | null;
  nett_score: number | null;
  stableford_points: number | null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  const { eventId } = await params;

  const [{ data: event }, { data: entries }, { data: scores }] = await Promise.all([
    guard.supabase.from("events").select("slug, format").eq("id", eventId).single(),
    guard.supabase
      .from("event_entries")
      .select("member_id, playing_handicap, member_profiles(first_name, last_name, email, current_handicap)")
      .eq("event_id", eventId)
      .eq("status", "confirmed"),
    guard.supabase.from("event_scores").select("*").eq("event_id", eventId),
  ]);

  const scoreByMember = new Map(
    ((scores ?? []) as Array<{ member_id: string; gross_score: number | null; nett_score: number | null; stableford_points: number | null }>).map(
      (s) => [s.member_id, s],
    ),
  );

  const rows: TemplateRow[] = ((entries ?? []) as unknown as Array<{
    member_id: string;
    playing_handicap: number | null;
    member_profiles: { first_name: string; last_name: string; email: string; current_handicap: number | null } | null;
  }>).map((e) => {
    const existing = scoreByMember.get(e.member_id);
    return {
      email: e.member_profiles?.email ?? "",
      first_name: e.member_profiles?.first_name ?? "",
      last_name: e.member_profiles?.last_name ?? "",
      playing_handicap: e.playing_handicap ?? e.member_profiles?.current_handicap ?? null,
      gross_score: existing?.gross_score ?? null,
      nett_score: existing?.nett_score ?? null,
      stableford_points: existing?.stableford_points ?? null,
    };
  });

  const isStrokeplay = event?.format === "strokeplay";
  const columns = isStrokeplay
    ? [
        { key: "email" as const, label: "Email" },
        { key: "first_name" as const, label: "First Name" },
        { key: "last_name" as const, label: "Last Name" },
        { key: "playing_handicap" as const, label: "Playing Handicap" },
        { key: "gross_score" as const, label: "Gross" },
        { key: "nett_score" as const, label: "Nett" },
      ]
    : [
        { key: "email" as const, label: "Email" },
        { key: "first_name" as const, label: "First Name" },
        { key: "last_name" as const, label: "Last Name" },
        { key: "playing_handicap" as const, label: "Playing Handicap" },
        { key: "stableford_points" as const, label: "Stableford" },
      ];

  const csv = toCsv(rows, columns);
  return csvResponse(csv, `${event?.slug ?? "event"}-scoring-template.csv`);
}
