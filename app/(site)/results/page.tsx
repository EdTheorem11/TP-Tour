import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getCurrentSeason, getCompletedEvents } from "@/lib/data/site";
import { formatEventDateLong, tbc } from "@/lib/format";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results",
  description: "TP Tour results from every completed event.",
};

export default async function ResultsPage() {
  const season = await getCurrentSeason();
  const events = await getCompletedEvents(season?.id);

  return (
    <section className="py-20 lg:py-28">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">TP Tour</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite sm:text-5xl">
          Tour Results
        </h1>

        {events.length === 0 ? (
          <p className="mt-16 text-center text-tp-offwhite/50">Results will appear here once the first event is completed.</p>
        ) : (
          <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/results/${event.slug}`}
                className="flex flex-wrap items-center justify-between gap-3 py-6 transition-colors hover:bg-white/[0.03]"
              >
                <div>
                  <p className="font-heading text-xl font-bold uppercase text-tp-offwhite">{event.name}</p>
                  <p className="mt-1 text-sm text-tp-offwhite/50">
                    {tbc(event.location)} &middot; {formatEventDateLong(event.event_date)}
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-tp-gold">
                  View Results &rarr;
                </span>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
