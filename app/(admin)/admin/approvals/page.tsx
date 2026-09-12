import Link from "next/link";
import { getPendingMembers, getPendingHandicapChanges } from "@/lib/data/admin";
import { getCurrentProfile } from "@/lib/data/current-user";
import { approveMember, rejectMember, approveHandicapChange } from "@/lib/actions/admin-members";
import { Button } from "@/components/ui/button";
import { formatHandicap, tbc } from "@/lib/format";

export default async function AdminApprovalsPage() {
  const [pendingMembers, pendingHandicaps, currentAdmin] = await Promise.all([
    getPendingMembers(),
    getPendingHandicapChanges(),
    getCurrentProfile(),
  ]);
  const isSuperAdmin = currentAdmin?.role === "super_admin";

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Approvals</h1>
      <p className="mt-2 text-sm text-tp-offwhite/50">
        Everything waiting on a decision, in one place — act directly here without opening each profile.
      </p>

      <div className="mt-10">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">
          Pending Membership Applications {pendingMembers.length > 0 && `(${pendingMembers.length})`}
        </h2>
        {pendingMembers.length === 0 ? (
          <p className="mt-4 text-sm text-tp-offwhite/50">No pending applications.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
            {pendingMembers.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <Link href={`/admin/members/${m.id}`} className="font-semibold text-tp-offwhite hover:text-tp-gold">
                    {m.first_name} {m.last_name}
                  </Link>
                  <span className="ml-2 text-tp-offwhite/50">
                    {m.email} {m.company ? `· ${tbc(m.company)}` : ""}
                  </span>
                </span>
                <div className="flex gap-2">
                  <form action={approveMember.bind(null, m.id)}>
                    <Button type="submit" variant="gold" size="sm">Approve</Button>
                  </form>
                  <form action={rejectMember.bind(null, m.id)}>
                    <Button type="submit" variant="outline" size="sm">Reject</Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-12">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">
          Pending Handicap Changes {pendingHandicaps.length > 0 && `(${pendingHandicaps.length})`}
        </h2>
        {pendingHandicaps.length === 0 ? (
          <p className="mt-4 text-sm text-tp-offwhite/50">No pending handicap changes.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
            {pendingHandicaps.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <Link href={`/admin/members/${h.member_id}`} className="font-semibold text-tp-offwhite hover:text-tp-gold">
                    {h.member_profiles?.first_name} {h.member_profiles?.last_name}
                  </Link>
                  <span className="ml-2 text-tp-offwhite/50">
                    {formatHandicap(h.old_handicap)} &rarr; {formatHandicap(h.new_handicap)}
                    {h.reason ? ` · ${h.reason}` : ""}
                  </span>
                </span>
                {isSuperAdmin ? (
                  <form action={approveHandicapChange.bind(null, h.member_id, h.id)}>
                    <Button type="submit" variant="gold" size="sm">Approve</Button>
                  </form>
                ) : (
                  <span className="text-xs uppercase tracking-[0.1em] text-tp-offwhite/30">Super admin only</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
