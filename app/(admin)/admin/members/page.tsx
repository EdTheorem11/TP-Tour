import Link from "next/link";
import { getAllMembersAdmin } from "@/lib/data/admin";
import { inputClass } from "@/components/admin/form";
import { formatHandicap, tbc } from "@/lib/format";

const statusStyles: Record<string, string> = {
  pending: "text-tp-gold",
  approved: "text-tp-green-light",
  suspended: "text-red-400",
  rejected: "text-red-400",
};

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const members = await getAllMembersAdmin(params.q);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Members</h1>

      <form action="/admin/members" method="get" className="mt-6 max-w-sm">
        <input name="q" defaultValue={params.q} placeholder="Search members" className={inputClass} />
      </form>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/40">
              <th className="py-3 pr-4">Member</th>
              <th className="py-3 pr-4">Company</th>
              <th className="py-3 pr-4">Industry</th>
              <th className="py-3 pr-4">Hcp</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="py-3 pr-4">
                  <Link href={`/admin/members/${m.id}`} className="font-semibold text-tp-offwhite hover:text-tp-gold">
                    {m.first_name} {m.last_name}
                  </Link>
                  <p className="text-xs text-tp-offwhite/40">{m.email}</p>
                </td>
                <td className="py-3 pr-4 text-tp-offwhite/60">{tbc(m.company)}</td>
                <td className="py-3 pr-4 text-tp-offwhite/60">{tbc(m.industry)}</td>
                <td className="py-3 pr-4 text-tp-offwhite/60">{formatHandicap(m.current_handicap)}</td>
                <td className={`py-3 pr-4 text-xs font-semibold uppercase tracking-[0.08em] ${statusStyles[m.status]}`}>
                  {m.status}
                </td>
                <td className="py-3 pr-4 text-tp-offwhite/40">{new Date(m.created_at).toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && <p className="py-8 text-tp-offwhite/50">No members found.</p>}
      </div>
    </div>
  );
}
