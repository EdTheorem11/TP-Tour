import Link from "next/link";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { DraggableScrollRow } from "@/components/ui/draggable-scroll-row";
import type { TourEvent } from "@/lib/types";
import { formatEventDateShort, tbc } from "@/lib/format";
import { clsx } from "clsx";

export function ScheduleStrip({ events, seasonName }: { events: TourEvent[]; seasonName: string }) {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">Tour Schedule</p>
            <h2 className="mt-3 font-heading text-3xl font-bold uppercase text-tp-offwhite sm:text-4xl">
              {seasonName} Season
            </h2>
          </div>
          <LinkButton href="/tour-schedule" variant="outline" size="sm">
            Full Schedule
          </LinkButton>
        </div>
      </Container>

      <DraggableScrollRow className="no-scrollbar overflow-x-auto pl-6 lg:pl-10">
        <div className="flex w-max gap-4 pr-6 lg:pr-10">
          {events.map((event) => {
            const { day, month } = formatEventDateShort(event.event_date);
            const isNext = ["entries_open", "limited_spaces", "sold_out"].includes(event.status);
            const isCompleted = event.status === "completed";

            return (
              <Link
                href={`/events/${event.slug}`}
                key={event.id}
                className={clsx(
                  "group w-64 shrink-0 border p-6 transition-colors",
                  isNext
                    ? "border-tp-gold bg-tp-gold/[0.06]"
                    : isCompleted
                      ? "border-white/10 bg-white/[0.02] opacity-60"
                      : "border-white/10 bg-tp-dark hover:border-tp-green",
                )}
              >
                <p className="text-3xl font-heading font-bold text-tp-offwhite">
                  {day} <span className="text-lg text-tp-offwhite/50">{month}</span>
                </p>
                <p className="mt-4 truncate font-heading text-lg font-semibold uppercase text-tp-offwhite">
                  {event.name}
                </p>
                <p className="mt-1 text-sm text-tp-offwhite/50">{tbc(event.location)}</p>
                <p
                  className={clsx(
                    "mt-4 text-[11px] font-semibold uppercase tracking-[0.15em]",
                    isNext ? "text-tp-gold" : isCompleted ? "text-tp-offwhite/40" : "text-tp-green-light",
                  )}
                >
                  {isCompleted ? "Completed" : isNext ? "Next Event" : "Upcoming"}
                </p>
              </Link>
            );
          })}
        </div>
      </DraggableScrollRow>
    </section>
  );
}
