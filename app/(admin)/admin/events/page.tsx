import Link from "next/link";
import { getAllEventsAdmin } from "@/lib/data/admin";
import { getEventCapacities } from "@/lib/data/site";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEventDateLong, tbc } from "@/lib/format";

export default async function AdminEventsPage() {
  const events = await getAllEventsAdmin();
  const capacities = await getEventCapacities(events.map((e) => e.id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Events</h1>
        <LinkButton href="/admin/events/new" variant="gold" size="sm">Create Event</LinkButton>
      </div>

      <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
        {events.length === 0 ? (
          <p className="py-8 text-tp-offwhite/50">No events yet.</p>
        ) : (
          events.map((e) => {
            const capacity = capacities[e.id];
            return (
              <Link
                key={e.id}
                href={`/admin/events/${e.id}`}
                className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-white/[0.03]"
              >
                <div>
                  <p className="font-semibold text-tp-offwhite">{e.name}</p>
                  <p className="text-xs text-tp-offwhite/50">
                    {formatEventDateLong(e.event_date)} &middot; {tbc(e.location)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {capacity && (
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-tp-offwhite/50">
                      {capacity.max_players !== null
                        ? `${capacity.players_entered}/${capacity.max_players} Entered`
                        : `${capacity.players_entered} Entered`}
                    </span>
                  )}
                  <StatusBadge status={e.status} />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
