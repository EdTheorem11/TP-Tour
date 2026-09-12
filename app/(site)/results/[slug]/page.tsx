import Link from "next/link";
import { notFound } from "next/navigation";
import { clsx } from "clsx";
import { Container } from "@/components/ui/container";
import { getEventBySlug, getEventResults } from "@/lib/data/site";
import { formatEventDateLong, formatHandicap, tbc } from "@/lib/format";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return event ? { title: `${event.name} — Results` } : {};
}

export default async function EventResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const results = await getEventResults(event.id);
  const isStrokeplay = event.format === "strokeplay";

  return (
    <section className="py-20 lg:py-28">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">Tour Results</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite sm:text-5xl">
          {event.name}
        </h1>
        <p className="mt-2 text-tp-offwhite/60">
          {tbc(event.location)} &middot; {formatEventDateLong(event.event_date)}
        </p>

        {results.length === 0 ? (
          <p className="mt-16 text-center text-tp-offwhite/50">Results have not been published yet.</p>
        ) : (
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">
                  <th className="py-3 pr-4">Pos</th>
                  <th className="py-3 pr-4">Player</th>
                  <th className="py-3 pr-4">Playing Hcp</th>
                  {isStrokeplay ? (
                    <>
                      <th className="py-3 pr-4">Gross</th>
                      <th className="py-3 pr-4">Nett</th>
                    </>
                  ) : (
                    <th className="py-3 pr-4">Stableford</th>
                  )}
                  <th className="py-3 text-right">OOM Points</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.id}
                    className={clsx(
                      "border-b border-white/5",
                      r.position === 1 && "bg-tp-gold/[0.06]",
                    )}
                  >
                    <td className="py-4 pr-4 font-heading text-lg font-bold text-tp-offwhite">
                      {r.position_display}
                    </td>
                    <td className="py-4 pr-4">
                      <Link href={`/players/${r.member_id}`} className="font-semibold text-tp-offwhite hover:text-tp-gold">
                        {r.member_profiles?.first_name} {r.member_profiles?.last_name}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 text-tp-offwhite/60">{formatHandicap(r.event_scores?.playing_handicap)}</td>
                    {isStrokeplay ? (
                      <>
                        <td className="py-4 pr-4 text-tp-offwhite/60">{tbc(r.event_scores?.gross_score)}</td>
                        <td className="py-4 pr-4 text-tp-offwhite/60">{tbc(r.event_scores?.nett_score)}</td>
                      </>
                    ) : (
                      <td className="py-4 pr-4 text-tp-offwhite/60">{tbc(r.event_scores?.stableford_points)} pts</td>
                    )}
                    <td className="py-4 text-right font-heading text-lg font-bold text-tp-gold">{r.oom_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </section>
  );
}
