import Link from "next/link";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import type { OrderOfMeritPoint } from "@/lib/types";
import { formatHandicap, movementIndicator } from "@/lib/format";
import { clsx } from "clsx";

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

export function OomPreview({ standings, isLoggedIn }: { standings: OrderOfMeritPoint[]; isLoggedIn: boolean }) {
  const rankCounts = new Map<number, number>();
  for (const row of standings) {
    if (row.rank !== null) rankCounts.set(row.rank, (rankCounts.get(row.rank) ?? 0) + 1);
  }

  if (!isLoggedIn) {
    return (
      <section className="border-y border-white/10 bg-tp-dark py-20 text-center lg:py-28">
        <Container className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">Order of Merit</p>
          <h2 className="mt-4 font-heading text-balance text-3xl font-bold uppercase leading-tight text-tp-offwhite sm:text-4xl">
            Got What It Takes to Win the Season Order of Merit?
          </h2>
          <p className="mt-5 text-balance text-tp-offwhite/60">
            Every event counts toward the standings. Join TP Tour to track the rankings, chase the points, and find
            out where you stand against the rest of the tour.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/register" variant="gold">
              Join TP Tour
            </LinkButton>
            <LinkButton href="/login" variant="outline">
              Login
            </LinkButton>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="border-y border-white/10 bg-tp-dark py-20 lg:py-28">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">Order of Merit</p>
            <h2 className="mt-3 font-heading text-3xl font-bold uppercase text-tp-offwhite sm:text-4xl">
              The Race to Become TP Tour Champion
            </h2>
          </div>
          <LinkButton href="/order-of-merit" variant="outline" size="sm">
            View Full Standings
          </LinkButton>
        </div>

        {standings.length === 0 ? (
          <p className="text-tp-offwhite/50">Standings will appear once the season is underway.</p>
        ) : (
          <div className="overflow-x-auto border border-white/10 bg-tp-black/40">
            <table className="w-full min-w-[640px] border-collapse text-left tabular-nums">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">
                  <th className="px-4 py-2.5">Pos</th>
                  <th className="px-4 py-2.5">Player</th>
                  <th className="px-4 py-2.5">Hcp</th>
                  <th className="px-4 py-2.5">Events</th>
                  <th className="px-4 py-2.5">Wins</th>
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
                      <td className="px-4 py-2">
                        <Link href={`/players/${row.member_id}`} className="font-semibold text-tp-offwhite hover:text-tp-gold">
                          {row.member_profiles?.first_name} {row.member_profiles?.last_name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-tp-offwhite/60">
                        {formatHandicap(row.member_profiles?.current_handicap)}
                      </td>
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
                      <td className="px-4 py-2 text-right font-heading text-base font-bold text-tp-offwhite">
                        {row.counting_points}
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
