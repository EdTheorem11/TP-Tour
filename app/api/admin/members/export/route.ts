import { requireAdminApi } from "@/lib/admin-guard";
import { toCsv, csvResponse } from "@/lib/csv";
import type { MemberProfile } from "@/lib/types";

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { data } = await guard.supabase
    .from("member_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const members = (data as MemberProfile[]) ?? [];

  const csv = toCsv(members, [
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "mobile", label: "Mobile" },
    { key: "company", label: "Company" },
    { key: "job_title", label: "Job Title" },
    { key: "industry", label: "Industry" },
    { key: "current_handicap", label: "Handicap" },
    { key: "home_golf_club", label: "Home Golf Club" },
    { key: "status", label: "Status" },
    { key: "role", label: "Role" },
    { key: "created_at", label: "Joined" },
  ]);

  return csvResponse(csv, `tp-tour-members-${new Date().toISOString().slice(0, 10)}.csv`);
}
