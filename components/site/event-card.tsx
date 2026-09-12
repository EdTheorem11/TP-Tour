import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "@/components/ui/status-badge";
import type { TourEvent, EventCapacity } from "@/lib/types";
import { FORMAT_LABELS } from "@/lib/types";
import { formatEventDateLong, formatPrice, tbc } from "@/lib/format";

export function EventCard({ event, capacity }: { event: TourEvent; capacity?: EventCapacity | null }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden border border-white/10 bg-tp-dark transition-colors hover:border-tp-gold/50"
    >
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-tp-green/25 to-tp-black">
        {event.hero_image_url ? (
          <Image
            src={event.hero_image_url}
            alt={event.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-heading text-2xl font-bold uppercase tracking-widest text-tp-offwhite/15">
            TP Tour
          </div>
        )}
        <div className="absolute left-4 top-4">
          <StatusBadge status={event.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-tp-gold">
          {formatEventDateLong(event.event_date)}
        </p>
        <h3 className="mt-2 font-heading text-xl font-bold uppercase text-tp-offwhite">{event.name}</h3>
        <p className="mt-1 text-sm text-tp-offwhite/50">{tbc(event.location)}</p>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-tp-offwhite/50">
          <span>{event.format ? FORMAT_LABELS[event.format] : "Format TBC"}</span>
          <span>{formatPrice(event.member_price)}</span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-5 text-xs text-tp-offwhite/50">
          <span>
            {capacity?.max_players
              ? `${capacity.players_entered}/${capacity.max_players} entered`
              : capacity
                ? `${capacity.players_entered} entered`
                : ""}
          </span>
          <span className="font-semibold uppercase tracking-[0.1em] text-tp-offwhite group-hover:text-tp-gold">
            Details &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
