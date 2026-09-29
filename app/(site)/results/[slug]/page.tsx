import Link from "next/link";
import { notFound } from "next/navigation";
import { clsx } from "clsx";
import { Container } from "@/components/ui/container";
import { MemberGate } from "@/components/site/member-gate";
import { getEventBySlug, getEventResults } from "@/lib/data/site";
import { getCurrentProfile } from "@/lib/data/current-user";
import { formatEventDateLong, formatHandicap, tbc } from "@/lib/format";
import type { Metadata } from "next";

const rankBadgeStyles: Record<number, string> = {
  1: "bg-tp-gold text-tp-black",
  2: "bg-[#C7CDD6] text-tp-black",
  3: "bg-[#C89B6E] text-tp-black",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return event ? { title: `${event.name} — Results` } : {};
}

export default async function EventResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return <MemberGate title="Tour Results" next={`/results/${slug}`} />;

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
          <div className="mt-10 overflow-x-auto border border-white/10 bg-tp-dark">
            <table className="w-full table-fixed border-collapse text-left tabular-nums sm:min-w-[640px]">
              <colgroup>
                <col className="w-14 sm:w-16" />
                <col />
                <col className="hidden w-24 sm:table-column" />
                {isStrokeplay && <col className="hidden w-20 sm:table-column" />}
                <col className="w-20 sm:w-28" />
              </colgroup>
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">
                  <th className="px-2 py-2.5 sm:px-4">Pos</th>
                  <th className="px-2 py-2.5 sm:px-4">Player</th>
                  <th className="hidden px-4 py-2.5 sm:table-cell">Playing Hcp</th>
                  {isStrokeplay && <th className="hidden px-4 py-2.5 sm:table-cell">Gross</th>}
                  <th className="px-2 py-2.5 text-right sm:px-4">{isStrokeplay ? "Nett" : "Stableford"}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const isTied = r.position_display.startsWith("T");
                  const badge = !isTied && r.position <= 3 ? rankBadgeStyles[r.position] : undefined;
                  return (
                    <tr
                      key={r.id}
                      className={clsx(
                        "border-b border-white/5 text-sm last:border-b-0",
                        r.position <= 3 ? "bg-tp-gold/[0.05]" : i % 2 === 1 && "bg-white/[0.012]",
                      )}
                    >
                      <td className="px-2 py-2 sm:px-4">
                        <span
                          className={clsx(
                            "font-heading text-sm font-bold",
                            badge ? `flex h-6 w-6 items-center justify-center rounded-full ${badge}` : "text-tp-offwhite",
                          )}
                        >
                          {r.position_display}
                        </span>
                      </td>
                      <td className="truncate px-2 py-2 sm:px-4">
                        <Link href={`/players/${r.member_id}`} className="font-semibold text-tp-offwhite hover:text-tp-gold">
                          {r.member_profiles?.first_name} {r.member_profiles?.last_name}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-2 text-tp-offwhite/60 sm:table-cell">{formatHandicap(r.event_scores?.playing_handicap)}</td>
                      {isStrokeplay && <td className="hidden px-4 py-2 text-tp-offwhite/60 sm:table-cell">{tbc(r.event_scores?.gross_score)}</td>}
                      <td className="px-2 py-2 text-right font-heading text-base font-bold text-tp-gold sm:px-4">
                        {isStrokeplay ? tbc(r.event_scores?.nett_score) : `${tbc(r.event_scores?.stableford_points)} pts`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </section>
  );
}
