import Link from "next/link";
import { getDashboardStats, getRecentRegistrations } from "@/lib/data/admin";
import { LinkButton } from "@/components/ui/button";
import { formatEventDateLong, tbc } from "@/lib/format";

export default async function AdminDashboardPage() {
  const [stats, recentMembers] = await Promise.all([getDashboardStats(), getRecentRegistrations(6)]);

  const cards = [
    { label: "Total Members", value: stats.totalMembers },
    { label: "Approved Members", value: stats.approvedMembers },
    { label: "Pending Approvals", value: stats.pendingApprovals, highlight: stats.pendingApprovals > 0 },
    { label: "Entries This Week", value: stats.entriesThisWeek },
    { label: "Upcoming Events", value: stats.upcomingEvents },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Dashboard</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => {
          const content = (
            <>
              <p className="font-heading text-2xl font-bold text-tp-gold">{c.value}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/50">{c.label}</p>
            </>
          );
          const className = `border p-5 transition-colors ${
            c.highlight
              ? "border-tp-gold/50 bg-tp-gold/10 hover:border-tp-gold"
              : "border-white/10 bg-tp-dark"
          }`;
          return c.highlight ? (
            <Link key={c.label} href="/admin/approvals" className={className}>
              {content}
            </Link>
          ) : (
            <div key={c.label} className={className}>
              {content}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href="/admin/events/new" variant="gold" size="sm">Create Event</LinkButton>
        <LinkButton href="/admin/approvals" variant="outline" size="sm">Pending Approvals</LinkButton>
        <LinkButton href="/admin/scoring" variant="outline" size="sm">Enter Scores</LinkButton>
        <LinkButton href="/admin/results" variant="outline" size="sm">Publish Results</LinkButton>
      </div>

      {stats.nextEvent && (
        <div className="mt-10 border border-white/10 bg-tp-dark p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">Next Event</p>
          <p className="mt-2 font-heading text-xl font-bold uppercase text-tp-offwhite">{stats.nextEvent.name}</p>
          <p className="mt-1 text-sm text-tp-offwhite/50">
            {formatEventDateLong(stats.nextEvent.event_date)} &middot; {tbc(stats.nextEvent.location)}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-4">
            <div className="bg-tp-black px-4 py-3">
              <p className="font-heading text-xl font-bold text-tp-offwhite">
                {stats.nextEventEntries}
                {stats.nextEventMaxPlayers !== null && (
                  <span className="text-sm font-normal text-tp-offwhite/40"> / {stats.nextEventMaxPlayers}</span>
                )}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/50">Signed Up</p>
            </div>
            <div className="bg-tp-black px-4 py-3">
              <p
                className={`font-heading text-xl font-bold ${
                  stats.nextEventSpaces === 0 ? "text-red-400" : "text-tp-green-light"
                }`}
              >
                {stats.nextEventSpaces === 0 ? "Full" : tbc(stats.nextEventSpaces)}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/50">Spaces Remaining</p>
            </div>
            <div className="bg-tp-black px-4 py-3">
              <p className="font-heading text-xl font-bold text-tp-gold">{stats.nextEventWaitingList}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/50">Waiting List</p>
            </div>
            <div className="bg-tp-black px-4 py-3">
              <p className="font-heading text-xl font-bold text-tp-offwhite">{tbc(stats.nextEventMaxPlayers)}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/50">Max Players</p>
            </div>
          </div>

          <Link href={`/admin/entries/${stats.nextEvent.id}`} className="mt-5 inline-block text-sm text-tp-gold hover:underline">
            Manage Entries &rarr;
          </Link>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Recent Registrations</h2>
        <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
          {recentMembers.length === 0 ? (
            <p className="py-6 text-sm text-tp-offwhite/50">No registrations yet.</p>
          ) : (
            recentMembers.map((m) => (
              <Link
                key={m.id}
                href={`/admin/members/${m.id}`}
                className="flex items-center justify-between py-3 text-sm hover:bg-white/[0.03]"
              >
                <span>{m.first_name} {m.last_name} <span className="text-tp-offwhite/40">({m.email})</span></span>
                <span className="text-xs uppercase tracking-[0.1em] text-tp-offwhite/50">{m.status}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
