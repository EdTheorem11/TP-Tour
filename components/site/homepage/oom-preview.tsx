import Link from "next/link";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import type { OrderOfMeritPoint } from "@/lib/types";
import { formatHandicap, movementIndicator } from "@/lib/format";
import { clsx } from "clsx";

export function OomPreview({ standings, isLoggedIn }: { standings: OrderOfMeritPoint[]; isLoggedIn: boolean }) {
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
          {isLoggedIn && (
            <LinkButton href="/order-of-merit" variant="outline" size="sm">
              View Full Standings
            </LinkButton>
          )}
        </div>

        {!isLoggedIn ? (
          <div className="border border-white/10 bg-tp-black p-10 text-center">
            <p className="text-tp-offwhite/60">Standings are visible to TP Tour members.</p>
            <div className="mt-5 flex justify-center gap-3">
              <LinkButton href="/login" variant="outline" size="sm">
                Login
              </LinkButton>
              <LinkButton href="/register" variant="gold" size="sm">
                Join TP Tour
              </LinkButton>
            </div>
          </div>
        ) : standings.length === 0 ? (
          <p className="text-tp-offwhite/50">Standings will appear once the season is underway.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">
                  <th className="py-3 pr-4">Pos</th>
                  <th className="py-3 pr-4">Player</th>
                  <th className="py-3 pr-4">Hcp</th>
                  <th className="py-3 pr-4">Events</th>
                  <th className="py-3 pr-4">Wins</th>
                  <th className="py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => {
                  const move = movementIndicator(row.rank, row.previous_rank);
                  const top3 = (row.rank ?? 99) <= 3;
                  return (
                    <tr
                      key={row.id}
                      className={clsx(
                        "border-b border-white/5 transition-colors hover:bg-white/[0.03]",
                        top3 && "bg-tp-gold/[0.05]",
                      )}
                    >
                      <td className="py-4 pr-4">
                        <span className={clsx("font-heading text-lg font-bold", top3 && "text-tp-gold")}>
                          {row.rank ?? "—"}
                        </span>
                        {row.previous_rank !== null && (
                          <span
                            className={clsx(
                              "ml-2 text-xs",
                              move.direction === "up" && "text-tp-green-light",
                              move.direction === "down" && "text-red-400",
                              move.direction === "same" && "text-tp-offwhite/30",
                            )}
                          >
                            {move.symbol}
                          </span>
                        )}
                      </td>
                      <td className="py-4 pr-4">
                        <Link href={`/players/${row.member_id}`} className="font-semibold text-tp-offwhite hover:text-tp-gold">
                          {row.member_profiles?.first_name} {row.member_profiles?.last_name}
                        </Link>
                      </td>
                      <td className="py-4 pr-4 text-tp-offwhite/60">
                        {formatHandicap(row.member_profiles?.current_handicap)}
                      </td>
                      <td className="py-4 pr-4 text-tp-offwhite/60">{row.events_played}</td>
                      <td className="py-4 pr-4 text-tp-offwhite/60">{row.wins}</td>
                      <td className="py-4 text-right font-heading text-lg font-bold text-tp-offwhite">
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
