import Link from "next/link";
import { clsx } from "clsx";
import { Container } from "@/components/ui/container";
import { MemberGate } from "@/components/site/member-gate";
import { getAllSeasons, getCurrentSeason, getSeasonByName, getOrderOfMerit } from "@/lib/data/site";
import { getCurrentProfile } from "@/lib/data/current-user";
import { formatHandicap, movementIndicator } from "@/lib/format";
import type { Metadata } from "next";

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
  const standings = season ? await getOrderOfMerit(season.id) : [];

  const rankCounts = new Map<number, number>();
  for (const row of standings) {
    if (row.rank !== null) rankCounts.set(row.rank, (rankCounts.get(row.rank) ?? 0) + 1);
  }

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

        {standings.length === 0 ? (
          <p className="mt-16 text-center text-tp-offwhite/50">Standings will appear once the season is underway.</p>
        ) : (
          <div className="mt-10 overflow-x-auto border border-white/10 bg-tp-dark">
            <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-20" />
                <col />
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-28" />
              </colgroup>
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">
                  <th className="px-5 py-4">Pos</th>
                  <th className="px-5 py-4">Player</th>
                  <th className="px-5 py-4">Hcp</th>
                  <th className="px-5 py-4">Events</th>
                  <th className="px-5 py-4">Wins</th>
                  <th className="px-5 py-4">Top 3</th>
                  <th className="px-5 py-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => {
                  const move = movementIndicator(row.rank, row.previous_rank);
                  const top3 = (row.rank ?? 99) <= 3;
                  const isTied = row.rank !== null && (rankCounts.get(row.rank) ?? 0) > 1;
                  return (
                    <tr
                      key={row.id}
                      className={clsx(
                        "border-b border-white/5 transition-colors last:border-b-0 hover:bg-white/[0.03]",
                        top3 && "bg-tp-gold/[0.05]",
                      )}
                    >
                      <td className="px-5 py-4">
                        <span className={clsx("font-heading text-lg font-bold", top3 ? "text-tp-gold" : "text-tp-offwhite")}>
                          {row.rank === null ? "—" : isTied ? `T${row.rank}` : row.rank}
                        </span>
                        {row.previous_rank !== null && move.direction !== "same" && (
                          <span
                            className={clsx(
                              "ml-2 text-xs",
                              move.direction === "up" && "text-tp-green-light",
                              move.direction === "down" && "text-red-400",
                            )}
                          >
                            {move.symbol}
                          </span>
                        )}
                      </td>
                      <td className="truncate px-5 py-4">
                        <Link href={`/players/${row.member_id}`} className="font-semibold text-tp-offwhite hover:text-tp-gold">
                          {row.member_profiles?.first_name} {row.member_profiles?.last_name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-tp-offwhite/60">{formatHandicap(row.member_profiles?.current_handicap)}</td>
                      <td className="px-5 py-4 text-tp-offwhite/60">{row.events_played}</td>
                      <td className="px-5 py-4 text-tp-offwhite/60">{row.wins}</td>
                      <td className="px-5 py-4 text-tp-offwhite/60">{row.top3}</td>
                      <td className="px-5 py-4 text-right font-heading text-lg font-bold text-tp-offwhite">{row.counting_points}</td>
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
