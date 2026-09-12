import Link from "next/link";
import { getAllEventsAdmin } from "@/lib/data/admin";
import { formatEventDateLong, tbc } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function AdminScoringIndexPage() {
  const events = await getAllEventsAdmin();

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Scoring</h1>
      <p className="mt-2 text-sm text-tp-offwhite/50">Select an event to enter scores and publish results.</p>

      <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
        {events.map((e) => (
          <Link key={e.id} href={`/admin/scoring/${e.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-white/[0.03]">
            <div>
              <p className="font-semibold text-tp-offwhite">{e.name}</p>
              <p className="text-xs text-tp-offwhite/50">{formatEventDateLong(e.event_date)} &middot; {tbc(e.location)}</p>
            </div>
            <div className="flex items-center gap-3">
              {e.results_published && <span className="text-xs text-tp-green-light">Published</span>}
              <StatusBadge status={e.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
