import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { HandicapTrend } from "@/components/site/handicap-trend";
import { getPlayerByIdPublic, getPlayerSeasonResults, getPlayerOomRow, getCurrentSeason, getMyHandicapHistory, getSeasonEventCounts } from "@/lib/data/site";
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
  const [results, oom, handicapHistory, seasonEventCounts] = await Promise.all([
    getPlayerSeasonResults(id) as Promise<ResultRow[]>,
    season ? getPlayerOomRow(season.id, id) : Promise.resolve(null),
    getMyHandicapHistory(id),
    season ? getSeasonEventCounts(season.id) : Promise.resolve(null),
  ]);

  const badges: { emoji: string; label: string }[] = [];
  if (oom?.rank === 1) badges.push({ emoji: "\u{1F3C6}", label: "Leader" });
  if ((oom?.wins ?? 0) >= 1) badges.push({ emoji: "\u{1F947}", label: "Winner" });
  if ((oom?.top3 ?? 0) >= 3) badges.push({ emoji: "\u{1F396}\u{FE0F}", label: "Podium Regular" });
  if (seasonEventCounts && seasonEventCounts.played > 0 && (oom?.events_played ?? 0) >= seasonEventCounts.played) {
    badges.push({ emoji: "\u{1F4AA}", label: "Iron Man" });
  }

  const stablefordScores = results.map((r) => r.event_scores?.stableford_points).filter((v): v is number => v != null);
  const bestFinish = results.length ? Math.min(...results.map((r) => r.position)) : null;
  const avgStablefordNum = stablefordScores.length ? stablefordScores.reduce((a, b) => a + b, 0) / stablefordScores.length : null;
  const avgStableford = avgStablefordNum !== null ? avgStablefordNum.toFixed(1) : "—";
  const highestStableford = stablefordScores.length ? Math.max(...stablefordScores) : "—";

  const recentForm = [...results]
    .filter((r) => r.events?.event_date && r.event_scores?.stableford_points != null)
    .sort((a, b) => (b.events!.event_date > a.events!.event_date ? 1 : -1))
    .slice(0, 4);

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
            {badges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span
                    key={b.label}
                    className="flex items-center gap-1.5 border border-tp-gold/30 bg-tp-gold/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-tp-gold"
                  >
                    <span aria-hidden>{b.emoji}</span>
                    {b.label}
                  </span>
                ))}
              </div>
            )}
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
            {recentForm.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/40">Recent Form</span>
                <div className="flex gap-1.5">
                  {recentForm.map((r, i) => {
                    const score = r.event_scores!.stableford_points!;
                    const aboveAvg = avgStablefordNum !== null && score >= avgStablefordNum;
                    return (
                      <span
                        key={r.id}
                        title={r.events?.name}
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          aboveAvg ? "bg-tp-green-light text-tp-black" : "bg-white/10 text-tp-offwhite/70"
                        } ${i === 0 ? "ring-1 ring-tp-gold" : ""}`}
                      >
                        {score}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`bg-tp-dark px-6 py-6 text-center ${i === stats.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <p className="font-heading text-3xl font-bold text-tp-gold">{s.value}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/50">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {handicapHistory.filter((h) => h.status === "approved").length >= 2 && (
          <div className="mt-10 max-w-sm border border-white/10 bg-tp-dark p-6">
            <h2 className="font-heading text-sm font-bold uppercase text-tp-offwhite">Handicap Trend</h2>
            <HandicapTrend history={handicapHistory} />
          </div>
        )}

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
