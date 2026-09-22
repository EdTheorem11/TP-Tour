import Link from "next/link";
import { clsx } from "clsx";
import { Container } from "@/components/ui/container";
import { MemberGate } from "@/components/site/member-gate";
import { getAllSeasons, getCurrentSeason, getSeasonByName, getOrderOfMerit, getSeasonChampions } from "@/lib/data/site";
import { getCurrentProfile } from "@/lib/data/current-user";
import { formatHandicap, movementIndicator } from "@/lib/format";
import type { Metadata } from "next";

const rankBadgeStyles: Record<number, string> = {
  1: "bg-tp-gold text-tp-black",
  2: "bg-[#C7CDD6] text-tp-black",
  3: "bg-[#C89B6E] text-tp-black",
};

function MovementArrow({ direction }: { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 10 8" className={clsx("h-2 w-2.5", direction === "up" ? "fill-tp-green-light" : "fill-red-400")}>
      {direction === "up" ? <polygon points="5,0 10,8 0,8" /> : <polygon points="0,0 10,0 5,8" />}
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Order of Merit",
  description: "The TP Tour Order of Merit — the race to become TP Tour Champion.",
};

export default async function OrderOfMeritPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return <MemberGate title="Order of Merit" next="/order-of-merit" />;

  const seasons = await getAllSeasons();
  const season = params.season ? await getSeasonByName(params.season) : await getCurrentSeason();
  const [standings, pastChampions] = await Promise.all([
    season ? getOrderOfMerit(season.id) : Promise.resolve([]),
    getSeasonChampions(),
  ]);

  const rankCounts = new Map<number, number>();
  for (const row of standings) {
    if (row.rank !== null) rankCounts.set(row.rank, (rankCounts.get(row.rank) ?? 0) + 1);
  }

  const champions = season && !season.is_current ? standings.filter((s) => s.rank === 1) : [];

  return (
    <section className="py-20 lg:py-28">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">TP Tour</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite sm:text-5xl">
          Order of Merit
        </h1>
        <p className="mt-3 text-tp-offwhite/60">The Race to Become TP Tour Champion</p>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-6">
          {seasons.map((s) => (
            <Link
              key={s.id}
              href={`/order-of-merit?season=${encodeURIComponent(s.name)}`}
              className={clsx(
                "px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em]",
                s.name === (season?.name ?? "") ? "bg-tp-gold text-tp-black" : "border border-white/15 text-tp-offwhite/70 hover:border-tp-gold",
              )}
            >
              {s.name}
            </Link>
          ))}
        </div>

        {champions.length > 0 && (
          <div className="mt-10 border border-tp-gold/40 bg-tp-gold/10 p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">
              {champions.length > 1 ? "TP Tour Co-Champions" : "TP Tour Champion"}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold uppercase text-tp-offwhite sm:text-4xl">
              {champions.map((c) => `${c.member_profiles?.first_name} ${c.member_profiles?.last_name}`).join(" & ")}
            </h2>
            <p className="mt-2 text-tp-offwhite/60">{season?.name} Season</p>
            <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10">
              <div className="bg-tp-black px-4 py-4">
                <p className="font-heading text-2xl font-bold text-tp-gold">{champions[0].counting_points}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/50">Points</p>
              </div>
              <div className="bg-tp-black px-4 py-4">
                <p className="font-heading text-2xl font-bold text-tp-gold">{champions[0].wins}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/50">Wins</p>
              </div>
              <div className="bg-tp-black px-4 py-4">
                <p className="font-heading text-2xl font-bold text-tp-gold">{champions[0].events_played}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/50">Events</p>
              </div>
            </div>
          </div>
        )}

        {standings.length === 0 ? (
          <p className="mt-16 text-center text-tp-offwhite/50">Standings will appear once the season is underway.</p>
        ) : (
          <div className="mt-10 overflow-x-auto border border-white/10 bg-tp-dark">
            <table className="w-full min-w-[720px] table-fixed border-collapse text-left tabular-nums">
              <colgroup>
                <col className="w-16" />
                <col />
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-24" />
              </colgroup>
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">
                  <th className="px-4 py-2.5">Pos</th>
                  <th className="px-4 py-2.5">Player</th>
                  <th className="px-4 py-2.5">Hcp</th>
                  <th className="px-4 py-2.5">Evts</th>
                  <th className="px-4 py-2.5">Wins</th>
                  <th className="px-4 py-2.5">Top 3</th>
                  <th className="px-4 py-2.5 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => {
                  const move = movementIndicator(row.rank, row.previous_rank);
                  const top3 = (row.rank ?? 99) <= 3;
                  const isTied = row.rank !== null && (rankCounts.get(row.rank) ?? 0) > 1;
                  const badge = row.rank !== null && !isTied ? rankBadgeStyles[row.rank] : undefined;
                  return (
                    <tr
                      key={row.id}
                      className={clsx(
                        "border-b border-white/5 text-sm transition-colors last:border-b-0 hover:bg-white/[0.04]",
                        top3 ? "bg-tp-gold/[0.05]" : i % 2 === 1 && "bg-white/[0.012]",
                      )}
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={clsx(
                              "font-heading text-sm font-bold",
                              badge
                                ? `flex h-6 w-6 items-center justify-center rounded-full ${badge}`
                                : top3
                                  ? "text-tp-gold"
                                  : "text-tp-offwhite",
                            )}
                          >
                            {row.rank === null ? "—" : isTied ? `T${row.rank}` : row.rank}
                          </span>
                          {row.previous_rank !== null && move.direction !== "same" && (
                            <span className="flex items-center gap-0.5">
                              <MovementArrow direction={move.direction as "up" | "down"} />
                              <span className={clsx("text-[10px] font-semibold", move.direction === "up" ? "text-tp-green-light" : "text-red-400")}>
                                {move.symbol.replace(/^[▲▼]\s*/, "")}
                              </span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="truncate px-4 py-2">
                        <Link href={`/players/${row.member_id}`} className="font-semibold text-tp-offwhite hover:text-tp-gold">
                          {row.member_profiles?.first_name} {row.member_profiles?.last_name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-tp-offwhite/60">{formatHandicap(row.member_profiles?.current_handicap)}</td>
                      <td className="px-4 py-2 text-tp-offwhite/60">{row.events_played}</td>
                      <td className="px-4 py-2 text-tp-offwhite/60">
                        {row.wins > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <span aria-hidden className="text-tp-gold">🏆</span>
                            {row.wins}
                          </span>
                        ) : (
                          row.wins
                        )}
                      </td>
                      <td className="px-4 py-2 text-tp-offwhite/60">{row.top3}</td>
                      <td className="px-4 py-2 text-right font-heading text-base font-bold text-tp-offwhite">{row.counting_points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pastChampions.length > 0 && (
          <div className="mt-14 border-t border-white/10 pt-8">
            <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Hall of Fame</h2>
            <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
              {pastChampions.map(({ season: s, champions: c }) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <Link
                    href={`/order-of-merit?season=${encodeURIComponent(s.name)}`}
                    className="font-semibold text-tp-offwhite hover:text-tp-gold"
                  >
                    {s.name}
                  </Link>
                  <span className="text-tp-offwhite/70">
                    {c.map((champ) => `${champ.member_profiles?.first_name} ${champ.member_profiles?.last_name}`).join(" & ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}
