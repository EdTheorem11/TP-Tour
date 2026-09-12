import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import type { TourEvent, EventResult } from "@/lib/types";
import { formatEventDateLong } from "@/lib/format";

const ORDINALS = ["1st", "2nd", "3rd"];

export function LatestResults({ event, results }: { event: TourEvent | null; results: EventResult[] }) {
  if (!event) {
    return (
      <section className="py-20 lg:py-28">
        <Container className="text-center text-tp-offwhite/50">
          Results from the first tour event will be published here soon.
        </Container>
      </section>
    );
  }

  return (
    <section className="py-20 lg:py-28">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">Latest Results</p>
        <h2 className="mt-3 font-heading text-3xl font-bold uppercase text-tp-offwhite sm:text-4xl">
          {event.name}
        </h2>
        <p className="mt-2 text-tp-offwhite/50">{formatEventDateLong(event.event_date)}</p>

        {results.length === 0 ? (
          <p className="mt-8 text-tp-offwhite/50">Results are being finalised.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {results.slice(0, 3).map((result, i) => (
              <div
                key={result.id}
                className="border border-white/10 bg-tp-dark p-6"
                style={i === 0 ? { borderColor: "var(--tp-gold)" } : undefined}
              >
                <p className="font-heading text-2xl font-bold text-tp-gold">{ORDINALS[i]}</p>
                <p className="mt-2 text-lg font-semibold text-tp-offwhite">
                  {result.member_profiles?.first_name} {result.member_profiles?.last_name}
                </p>
                <p className="mt-1 text-sm text-tp-offwhite/50">
                  {result.event_scores?.stableford_points ?? result.event_scores?.nett_score} pts
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <LinkButton href={`/results/${event.slug}`} variant="outline" size="sm">
            Full Results
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
