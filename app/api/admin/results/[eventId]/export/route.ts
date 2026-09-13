import { requireAdminApi } from "@/lib/admin-guard";
import { toCsv, csvResponse } from "@/lib/csv";

interface ExportRow {
  position_display: string;
  first_name: string;
  last_name: string;
  gross_score: number | null;
  nett_score: number | null;
  stableford_points: number | null;
  oom_points: number;
}

export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  const { eventId } = await params;

  const [{ data: event }, { data: results }] = await Promise.all([
    guard.supabase.from("events").select("slug").eq("id", eventId).single(),
    guard.supabase
      .from("event_results")
      .select("*, member_profiles(first_name, last_name), event_scores(gross_score, nett_score, stableford_points)")
      .eq("event_id", eventId)
      .order("position", { ascending: true }),
  ]);

  const rows: ExportRow[] = ((results ?? []) as Array<{
    position_display: string;
    oom_points: number;
    member_profiles: { first_name: string; last_name: string } | null;
    event_scores: { gross_score: number | null; nett_score: number | null; stableford_points: number | null } | null;
  }>).map((r) => ({
    position_display: r.position_display,
    first_name: r.member_profiles?.first_name ?? "",
    last_name: r.member_profiles?.last_name ?? "",
    gross_score: r.event_scores?.gross_score ?? null,
    nett_score: r.event_scores?.nett_score ?? null,
    stableford_points: r.event_scores?.stableford_points ?? null,
    oom_points: r.oom_points,
  }));

  const csv = toCsv(rows, [
    { key: "position_display", label: "Position" },
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "gross_score", label: "Gross" },
    { key: "nett_score", label: "Nett" },
    { key: "stableford_points", label: "Stableford" },
    { key: "oom_points", label: "OOM Points" },
  ]);

  const filename = `${event?.slug ?? "event"}-results.csv`;
  return csvResponse(csv, filename);
}
