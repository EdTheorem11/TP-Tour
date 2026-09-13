import { requireAdminApi } from "@/lib/admin-guard";
import { toCsv, csvResponse } from "@/lib/csv";

interface ExportRow {
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  handicap: number | null;
  is_guest: string;
  guest_name: string | null;
  entry_date: string;
  payment_status: string;
  payment_amount: number | null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  const { eventId } = await params;

  const [{ data: event }, { data: entries }] = await Promise.all([
    guard.supabase.from("events").select("name, slug").eq("id", eventId).single(),
    guard.supabase
      .from("event_entries")
      .select("*, member_profiles(first_name, last_name, email, company, current_handicap)")
      .eq("event_id", eventId)
      .eq("status", "confirmed")
      .order("entry_date", { ascending: true }),
  ]);

  const rows: ExportRow[] = ((entries ?? []) as Array<{
    member_profiles: { first_name: string; last_name: string; email: string; company: string | null; current_handicap: number | null } | null;
    playing_handicap: number | null;
    is_guest: boolean;
    guest_name: string | null;
    entry_date: string;
    payment_status: string;
    payment_amount: number | null;
  }>).map((e) => ({
    first_name: e.member_profiles?.first_name ?? "",
    last_name: e.member_profiles?.last_name ?? "",
    email: e.member_profiles?.email ?? "",
    company: e.member_profiles?.company ?? null,
    handicap: e.playing_handicap ?? e.member_profiles?.current_handicap ?? null,
    is_guest: e.is_guest ? "Yes" : "No",
    guest_name: e.guest_name,
    entry_date: e.entry_date,
    payment_status: e.payment_status,
    payment_amount: e.payment_amount,
  }));

  const csv = toCsv(rows, [
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "company", label: "Company" },
    { key: "handicap", label: "Handicap" },
    { key: "is_guest", label: "Guest" },
    { key: "guest_name", label: "Guest Name" },
    { key: "entry_date", label: "Entry Date" },
    { key: "payment_status", label: "Payment Status" },
    { key: "payment_amount", label: "Payment Amount" },
  ]);

  const filename = `${event?.slug ?? "event"}-entries.csv`;
  return csvResponse(csv, filename);
}
