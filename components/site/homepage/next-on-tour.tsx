import Image from "next/image";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { FORMAT_LABELS, type TourEvent, type EventCapacity } from "@/lib/types";
import { formatEventDateLong, tbc } from "@/lib/format";

export function NextOnTour({ event, capacity }: { event: TourEvent | null; capacity: EventCapacity | null }) {
  if (!event) {
    return (
      <section className="border-y border-white/10 bg-tp-dark py-16">
        <Container className="text-center text-tp-offwhite/50">
          The next tour event will be announced soon.
        </Container>
      </section>
    );
  }

  const facts = [
    { label: "Golf Club", value: tbc(event.golf_clubs?.name) },
    { label: "Location", value: tbc(event.location) },
    { label: "Date", value: formatEventDateLong(event.event_date) },
    { label: "Arrival Time", value: tbc(event.arrival_time) },
    { label: "Tee Time", value: tbc(event.first_tee_time ?? event.shotgun_time) },
    { label: "Format", value: event.format ? FORMAT_LABELS[event.format] : "TBC" },
  ];

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-tp-dark">
      {event.hero_image_url && (
        <>
          <Image
            src={event.hero_image_url}
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-tp-black/70" />
        </>
      )}
      <Container className="relative z-10 grid gap-10 py-16 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">Next on Tour</p>
          <h2 className="mt-4 font-heading text-4xl font-bold uppercase leading-tight text-tp-offwhite sm:text-5xl">
            {event.name}
          </h2>
          <p className="mt-2 text-lg text-tp-offwhite/60">
            {tbc(event.location)} &middot; {formatEventDateLong(event.event_date)}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <StatusBadge status={event.status} />
            <span className="text-sm text-tp-offwhite/50">
              {capacity?.max_players
                ? `${capacity.players_entered} / ${capacity.max_players} players entered`
                : `${capacity?.players_entered ?? 0} players entered`}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <LinkButton
              href={capacity?.spaces_remaining === 0 ? `/events/${event.slug}#waiting-list` : `/events/${event.slug}#enter`}
              variant="primary"
              size="lg"
            >
              {capacity?.spaces_remaining === 0 ? "Join Waiting List" : "Enter Event"}
            </LinkButton>
            <LinkButton href={`/events/${event.slug}`} variant="outline" size="lg">
              Event Details
            </LinkButton>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-tp-black px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">
                {fact.label}
              </p>
              <p className="mt-1.5 truncate text-lg font-semibold text-tp-offwhite">{fact.value}</p>
            </div>
          ))}
          <div className="bg-tp-black px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">
              Spaces Remaining
            </p>
            <p className="mt-1.5 text-lg font-semibold text-tp-gold">
              {capacity?.spaces_remaining ?? "TBC"}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
