import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";

const VENUES = ["Yas Links", "The Els Club", "Dubai Hills", "Saadiyat", "The Montgomerie"];

export function PlayMoreGolf() {
  return (
    <section className="py-20 lg:py-28">
      <Container className="max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">The Tour</p>
        <h2 className="mt-4 font-heading text-balance text-4xl font-bold uppercase leading-tight text-tp-offwhite sm:text-5xl">
          Play More Golf.
        </h2>
        <p className="mt-3 text-lg font-semibold text-tp-offwhite/80">
          Some of the UAE&rsquo;s best courses. One Tour.
        </p>
        <p className="mx-auto mt-5 max-w-xl text-balance text-lg leading-relaxed text-tp-offwhite/70">
          From Dubai to Abu Dhabi, TP Tour gives members a reason to get out on the course more often. Compete at
          leading venues including {VENUES.join(", ")} throughout the season. One event at a time. One
          season-long competition.
        </p>
        <div className="mt-8">
          <LinkButton href="/tour-schedule" variant="gold" size="lg">
            View Tour Schedule
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
