import { redirect } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getCurrentProfile } from "@/lib/data/current-user";
import { getPlayerSeasonResults } from "@/lib/data/site";
import { formatEventDateLong, formatHandicap, tbc } from "@/lib/format";

interface ResultRow {
  id: string;
  position_display: string;
  oom_points: number;
  events: { name: string; slug: string; event_date: string } | null;
  event_scores: { stableford_points: number | null; nett_score: number | null; playing_handicap: number | null } | null;
}

export default async function MyResultsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/my-tp-tour/results");

  const results = (await getPlayerSeasonResults(profile.id)) as ResultRow[];

  return (
    <section className="py-16 lg:py-20">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">My TP Tour</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite sm:text-5xl">My Results</h1>

        {results.length === 0 ? (
          <p className="mt-12 text-tp-offwhite/50">You don&rsquo;t have any published results yet.</p>
        ) : (
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Event</th>
                  <th className="py-3 pr-4">Hcp</th>
                  <th className="py-3 pr-4">Score</th>
                  <th className="py-3 pr-4">Position</th>
                  <th className="py-3 text-right">OOM Points</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="py-4 pr-4 text-tp-offwhite/60">
                      {r.events ? formatEventDateLong(r.events.event_date) : "—"}
                    </td>
                    <td className="py-4 pr-4">
                      {r.events ? (
                        <Link href={`/events/${r.events.slug}`} className="font-semibold text-tp-offwhite hover:text-tp-gold">
                          {r.events.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-4 pr-4 text-tp-offwhite/60">{formatHandicap(r.event_scores?.playing_handicap)}</td>
                    <td className="py-4 pr-4 text-tp-offwhite/60">
                      {tbc(r.event_scores?.stableford_points ? `${r.event_scores.stableford_points} pts` : r.event_scores?.nett_score)}
                    </td>
                    <td className="py-4 pr-4 text-tp-offwhite">{r.position_display}</td>
                    <td className="py-4 text-right font-heading font-bold text-tp-gold">{r.oom_points}</td>
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
