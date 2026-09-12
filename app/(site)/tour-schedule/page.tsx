import Link from "next/link";
import { clsx } from "clsx";
import { Container } from "@/components/ui/container";
import { EventCard } from "@/components/site/event-card";
import { getAllSeasons, getCurrentSeason, getSeasonByName, getSeasonEvents, getEventCapacities } from "@/lib/data/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tour Schedule",
  description: "The full TP Tour schedule of golf events across Dubai and Abu Dhabi.",
};

const filters = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

export default async function TourSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const seasons = await getAllSeasons();
  const season = params.season ? await getSeasonByName(params.season) : await getCurrentSeason();
  const activeFilter = params.filter ?? "all";

  const allEvents = season ? await getSeasonEvents(season.id) : [];
  const capacities = await getEventCapacities(allEvents.map((e) => e.id));

  const events = allEvents.filter((e) => {
    if (activeFilter === "upcoming") return e.status !== "completed" && e.status !== "cancelled";
    if (activeFilter === "completed") return e.status === "completed";
    return true;
  });

  return (
    <section className="py-20 lg:py-28">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">Tour Schedule</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite sm:text-5xl">
          {season?.name ?? ""} Tour Schedule
        </h1>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div className="flex gap-2">
            {seasons.map((s) => (
              <Link
                key={s.id}
                href={`/tour-schedule?season=${encodeURIComponent(s.name)}`}
                className={clsx(
                  "px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em]",
                  s.name === (season?.name ?? "")
                    ? "bg-tp-gold text-tp-black"
                    : "border border-white/15 text-tp-offwhite/70 hover:border-tp-gold",
                )}
              >
                {s.name}
              </Link>
            ))}
          </div>

          <div className="flex gap-2">
            {filters.map((f) => (
              <Link
                key={f.key}
                href={`/tour-schedule?${season ? `season=${encodeURIComponent(season.name)}&` : ""}filter=${f.key}`}
                className={clsx(
                  "px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em]",
                  activeFilter === f.key ? "text-tp-gold" : "text-tp-offwhite/50 hover:text-tp-offwhite",
                )}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {events.length === 0 ? (
          <p className="mt-16 text-center text-tp-offwhite/50">No events to show for this filter.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} capacity={capacities[event.id]} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
