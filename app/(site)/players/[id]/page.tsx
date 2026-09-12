import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { getPlayerByIdPublic, getPlayerSeasonResults, getPlayerOomRow, getCurrentSeason } from "@/lib/data/site";
import { formatHandicap, formatEventDateLong, tbc } from "@/lib/format";
import type { Metadata } from "next";

interface ResultRow {
  id: string;
  position: number;
  position_display: string;
  oom_points: number;
  events: { name: string; slug: string; event_date: string; format: string | null } | null;
  event_scores: { stableford_points: number | null; nett_score: number | null; playing_handicap: number | null } | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const player = await getPlayerByIdPublic(id);
  return player ? { title: `${player.first_name} ${player.last_name}` } : {};
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await getPlayerByIdPublic(id);
  if (!player) notFound();

  const season = await getCurrentSeason();
  const [results, oom] = await Promise.all([
    getPlayerSeasonResults(id) as Promise<ResultRow[]>,
    season ? getPlayerOomRow(season.id, id) : Promise.resolve(null),
  ]);

  const stablefordScores = results.map((r) => r.event_scores?.stableford_points).filter((v): v is number => v != null);
  const bestFinish = results.length ? Math.min(...results.map((r) => r.position)) : null;
  const avgStableford = stablefordScores.length
    ? (stablefordScores.reduce((a, b) => a + b, 0) / stablefordScores.length).toFixed(1)
    : "—";
  const highestStableford = stablefordScores.length ? Math.max(...stablefordScores) : "—";

  const stats = [
    { label: "Events Played", value: oom?.events_played ?? results.length },
    { label: "Wins", value: oom?.wins ?? 0 },
    { label: "Runner-Up Finishes", value: oom?.runner_ups ?? 0 },
    { label: "Top 3s", value: oom?.top3 ?? 0 },
    { label: "Top 10s", value: oom?.top10 ?? 0 },
    { label: "Best Finish", value: bestFinish ?? "—" },
    { label: "Average Stableford", value: avgStableford },
    { label: "Highest Stableford", value: highestStableford },
    { label: "OOM Points", value: oom?.counting_points ?? 0 },
  ];

  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className="flex flex-wrap items-center gap-6">
          <span
            className="flex h-24 w-24 items-center justify-center rounded-full bg-tp-green/25 bg-cover bg-center font-heading text-2xl font-bold text-tp-green-light"
            style={player.avatar_url ? { backgroundImage: `url(${player.avatar_url})` } : undefined}
          >
            {!player.avatar_url && `${player.first_name[0]}${player.last_name[0]}`}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">
              {oom?.rank ? `TP Tour Rank #${oom.rank}` : "TP Tour Member"}
            </p>
            <h1 className="mt-2 font-heading text-4xl font-bold uppercase text-tp-offwhite sm:text-5xl">
              {player.first_name} {player.last_name}
            </h1>
            <p className="mt-2 text-tp-offwhite/60">
              Handicap {formatHandicap(player.current_handicap)}
              {player.company && ` · ${player.company}`}
              {player.industry && ` · ${player.industry}`}
            </p>
            {(player.mobile || player.email) && (
              <div className="mt-3 flex flex-wrap gap-5">
                {player.mobile && (
                  <a href={`tel:${player.mobile}`} className="flex items-center gap-1.5 text-sm text-tp-offwhite/70 hover:text-tp-gold">
                    <Phone size={15} /> {player.mobile}
                  </a>
                )}
                {player.email && (
                  <a href={`mailto:${player.email}`} className="flex items-center gap-1.5 text-sm text-tp-offwhite/70 hover:text-tp-gold">
                    <Mail size={15} /> {player.email}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-tp-dark px-6 py-6 text-center">
              <p className="font-heading text-3xl font-bold text-tp-gold">{s.value}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/50">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 font-heading text-2xl font-bold uppercase text-tp-offwhite">Season Results</h2>
        {results.length === 0 ? (
          <p className="mt-4 text-tp-offwhite/50">No results yet this season.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
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
