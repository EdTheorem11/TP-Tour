import Link from "next/link";
import { getAllEventsAdmin } from "@/lib/data/admin";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEventDateLong, tbc } from "@/lib/format";

export default async function AdminEventsPage() {
  const events = await getAllEventsAdmin();

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
          events.map((e) => (
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
              <StatusBadge status={e.status} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
